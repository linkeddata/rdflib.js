/* @file Update Manager Class
**
** 2007-07-15 original SPARQL Update module by Joe Presbrey <presbrey@mit.edu>
** 2010-08-08 TimBL folded in Kenny's WEBDAV
** 2010-12-07 TimBL added local file write code
*/
import IndexedFormula from './store'
import { docpart, join as uriJoin } from './uri'
import Fetcher, { Options } from './fetcher'
import Namespace from './namespace'
import Serializer from './serializer'
import { isBlankNode, isStore } from './utils/terms'
import * as Util from './utils-js'
import Statement from './statement'
import RDFlibNamedNode from './named-node'
import { termValue } from './utils/termValue'
import { BlankNode, NamedNode, Quad, Quad_Graph, Quad_Object, Quad_Predicate, Quad_Subject, Term, } from './tf-types'

interface UpdateManagerFormula extends IndexedFormula {
  fetcher: Fetcher
}

type CallBackFunction = (uri: string, ok: boolean, message: string, response: Error | Response) => {} | void

/**
* The UpdateManager is a helper object for a store.
* Just as a Fetcher provides the store with the ability to read and write,
* the Update Manager provides functionality for making small patches in real time,
* and also looking out for concurrent updates from other agents
*/
export default class UpdateManager {

  store: UpdateManagerFormula

  ifps: {}

  fps: {}

  /** Index of objects for coordinating incoming and outgoing patches */
  patchControl: []

  /** Object of namespaces */
  ns: any

  /**
   * @param  store - The quadstore to store data and metadata. Created if not passed.
  */
  constructor(store?: IndexedFormula) {
    store = store || new IndexedFormula()
    if (store.updater) {
      throw new Error("You can't have two UpdateManagers for the same store")
    }
    if (!(store as UpdateManagerFormula).fetcher) {
      (store as UpdateManagerFormula).fetcher = new Fetcher(store)
    }
    this.store = store as UpdateManagerFormula
    store.updater = this
    this.ifps = {}
    this.fps = {}
    this.ns = {}
    this.ns.link = Namespace('http://www.w3.org/2007/ont/link#')
    this.ns.http = Namespace('http://www.w3.org/2007/ont/http#')
    this.ns.httph = Namespace('http://www.w3.org/2007/ont/httph#')
    this.ns.ldp = Namespace('http://www.w3.org/ns/ldp#')
    this.ns.rdf = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    this.ns.rdfs = Namespace('http://www.w3.org/2000/01/rdf-schema#')
    this.ns.rdf = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    this.ns.owl = Namespace('http://www.w3.org/2002/07/owl#')

    this.patchControl = []
  }

  patchControlFor(doc: NamedNode) {
    if (!this.patchControl[doc.value]) {
      this.patchControl[doc.value] = []
    }
    return this.patchControl[doc.value]
  }

  isHttpUri(uri: string) {
    return (uri.slice(0, 4) === 'http')
  }

  /** Remove from the store HTTP authorization metadata
  * The editable function below relies on copies we have in the store
  * of the results of previous HTTP transactions. However, when
  * the user logs in, then that data misrepresents what would happen
  * if the user tried again.
  */
  flagAuthorizationMetadata(kb?: IndexedFormula) {
    if (!kb) {
      kb = this.store
    }
    const meta = kb.fetcher?.appNode
    const requests = kb.statementsMatching(undefined, this.ns.link('requestedURI'), undefined, meta).map(st => st.subject)
    for (const request of requests) {
      const response = kb.any(request, this.ns.link('response'), null, meta) as Quad_Subject
      if (response != undefined) { // ts
        kb.add(response, this.ns.link('outOfDate'), true as any, meta) // @@ Boolean is fine - fix types
      }
    }
  }

  /**
   * Tests whether a file is editable.
   * If the file has a specific annotation that it is machine written,
   * for safety, it is editable (this doesn't actually check for write access)
   * If the file has wac-allow and accept patch headers, those are respected.
   * and local write access is determined by those headers.
   * This async version not only looks at past HTTP requests, it also makes new ones if necessary.
   *
   * @returns The method string N3PATCH or SPARQL or DAV or
   *   LOCALFILE or false if known, undefined if not known.
   */
  async checkEditable(uri: string | NamedNode, kb?: IndexedFormula): Promise<string | boolean | undefined> {
    if (!uri) {
      return false // Eg subject is bnode, no known doc to write to
    }
    if (!kb) {
      kb = this.store
    }

    const initial = this.editable(uri, kb)
    if (initial !== undefined) {
      return initial
    }
    await kb.fetcher?.load(uri)
    const final = this.editable(uri, kb)
    // console.log(`Loaded ${uri} just to check editable, result: ${final}.`)
    return final
  }
  /**
   * Tests whether a file is editable.
   * If the file has a specific annotation that it is machine written,
   * for safety, it is editable (this doesn't actually check for write access)
   * If the file has wac-allow and accept patch headers, those are respected.
   * and local write access is determined by those headers.
   * This synchronous version only looks at past HTTP requests, does not make new ones.
   *
   * @returns The method string SPARQL or DAV or
   *   LOCALFILE or false if known, undefined if not known.
   */
  editable(uri: string | NamedNode, kb?: IndexedFormula): string | boolean | undefined {
    if (!uri) {
      return false // Eg subject is bnode, no known doc to write to
    }
    if (!kb) {
      kb = this.store
    }
    uri = termValue(uri)

    if (!this.isHttpUri(uri as string)) {
      if (kb.holds(
        kb.rdfFactory.namedNode(uri),
        kb.rdfFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        kb.rdfFactory.namedNode('http://www.w3.org/2007/ont/link#MachineEditableDocument'))) {
        return 'LOCALFILE'
      }
    }

    var request
    var definitive = false
    const meta = kb.fetcher?.appNode
    // const kb = s

    // @ts-ignore passes a string to kb.each, which expects a term. Should this work?
    var requests = kb.each(undefined, this.ns.link('requestedURI'), docpart(uri), meta)
    var method: string
    for (var r = 0; r < requests.length; r++) {
      request = requests[r]
      if (request !== undefined) {
        const response = kb.any(request, this.ns.link('response'), null, meta) as Quad_Subject
        if (response !== undefined) { // ts

          const outOfDate = kb.anyJS(response, this.ns.link('outOfDate'), null, meta) as Quad_Subject
          if (outOfDate) continue

          var wacAllow = kb.anyValue(response, this.ns.httph('wac-allow'))
          if (wacAllow) {
            for (var bit of wacAllow.split(',')) {
              var lr = bit.split('=')
              if (lr[0].includes('user') && !lr[1].includes('write') && !lr[1].includes('append')) {
                // console.log('    editable? excluded by WAC-Allow: ', wacAllow)
                return false
              }
            }
          }
          var acceptPatch = kb.each(response, this.ns.httph('accept-patch'))
          if (acceptPatch.length) {
            for (let i = 0; i < acceptPatch.length; i++) {
              method = acceptPatch[i].value.trim()
              // 2025/02 temporarily priorize SPARQL until N3PATCH spec revised on inserts with blankNodes
              if (method.indexOf('application/sparql-update') >= 0) return 'SPARQL'
              if (method.indexOf('application/sparql-update-single-match') >= 0) return 'SPARQL'
              if (method.indexOf('text/n3') >= 0) return 'N3PATCH'
            }
          }
          var authorVia = kb.each(response, this.ns.httph('ms-author-via'))
          if (authorVia.length) {
            for (let i = 0; i < authorVia.length; i++) {
              method = authorVia[i].value.trim()
              if (method.indexOf('SPARQL') >= 0) {
                return 'SPARQL'
              }
              if (method.indexOf('DAV') >= 0) {
                return 'DAV'
              }
            }
          }

          if (!this.isHttpUri(uri as string)) {
            if (!wacAllow) return false;
            else return 'LOCALFILE';
          }

          var status = kb.each(response, this.ns.http('status'))
          if (status.length) {
            for (let i = 0; i < status.length; i++) {
              // @ts-ignore since statuses should be TFTerms, this should always be false
              if (status[i] === 200 || status[i] === 404) {
                definitive = true
                // return false // A definitive answer
              }
            }
          }
        } else {
          // console.log('UpdateManager.editable: No response for ' + uri + '\n')
        }
      }
    }
    if (requests.length === 0) {
      // console.log('UpdateManager.editable: No request for ' + uri + '\n')
    } else {
      if (definitive) {
        return false // We have got a request and it did NOT say editable => not editable
      }
    }
    // console.log('UpdateManager.editable: inconclusive for ' + uri + '\n')
    return undefined // We don't know (yet) as we haven't had a response (yet)
  }

  anonymize(obj) {
    let anonymized = (obj.toNT().substr(0, 2) === '_:' && this.mentioned(obj))
      ? '?' + obj.toNT().substr(2)
      : obj.toNT();

    return anonymized;
  }

  anonymizeNT(stmt: Quad) {
    return this.anonymize(stmt.subject) + ' ' +
      this.anonymize(stmt.predicate) + ' ' +
      this.anonymize(stmt.object) + ' .'
  }

  nTriples(stmt) {
    return `${stmt.subject.toNT()} ${stmt.predicate.toNT()} ${stmt.object.toNT()} .`
  }

  /**
   * Returns a list of all bnodes occurring in a statement
   * @private
   */
  statementBnodes(st: Quad): BlankNode[] {
    return [st.subject, st.predicate, st.object].filter(function (x) {
      return isBlankNode(x)
    }) as BlankNode[]
  }

  /**
   * Returns a list of all bnodes occurring in a list of statements
   * @private
   */
  statementArrayBnodes(sts: ReadonlyArray<Quad>) {
    var bnodes: BlankNode[] = []
    for (let i = 0; i < sts.length; i++) {
      bnodes = bnodes.concat(this.statementBnodes(sts[i]))
    }
    bnodes.sort() // in place sort - result may have duplicates
    var bnodes2: BlankNode[] = []
    for (let j = 0; j < bnodes.length; j++) {
      if (j === 0 || !bnodes[j].equals(bnodes[j - 1])) {
        bnodes2.push(bnodes[j])
      }
    }
    return bnodes2
  }

  /**
   * Makes a cached list of [Inverse-]Functional properties
   * @private
   */
  cacheIfps() {
    this.ifps = {}
    var a = this.store.each(undefined, this.ns.rdf('type'),
      this.ns.owl('InverseFunctionalProperty'))
    for (let i = 0; i < a.length; i++) {
      this.ifps[a[i].value] = true
    }
    this.fps = {}
    a = this.store.each(undefined, this.ns.rdf('type'), this.ns.owl('FunctionalProperty'))
    for (let i = 0; i < a.length; i++) {
      this.fps[a[i].value] = true
    }
  }

  /**
   * Returns a context to bind a given node, up to a given depth
   * @private
   */
  bnodeContext2(x, source, depth) {
    // Return a list of statements which indirectly identify a node
    //  Depth > 1 if try further indirection.
    //  Return array of statements (possibly empty), or null if failure
    var sts = this.store.statementsMatching(undefined, undefined, x, source) // incoming links
    var y
    var res
    for (let i = 0; i < sts.length; i++) {
      if (this.fps[sts[i].predicate.value]) {
        y = sts[i].subject
        if (!y.isBlank) {
          return [sts[i]]
        }
        if (depth) {
          res = this.bnodeContext2(y, source, depth - 1)
          if (res) {
            return res.concat([sts[i]])
          }
        }
      }
    }
    // outgoing links
    sts = this.store.statementsMatching(x, undefined, undefined, source)
    for (let i = 0; i < sts.length; i++) {
      if (this.ifps[sts[i].predicate.value]) {
        y = sts[i].object
        if (!y.isBlank) {
          return [sts[i]]
        }
        if (depth) {
          res = this.bnodeContext2(y, source, depth - 1)
          if (res) {
            return res.concat([sts[i]])
          }
        }
      }
    }
    return null // Failure
  }

  /**
   * Returns the smallest context to bind a given single bnode
   * @private
   */
  bnodeContext1(x, source) {
    // Return a list of statements which indirectly identify a node
    //   Breadth-first
    for (var depth = 0; depth < 3; depth++) { // Try simple first
      var con = this.bnodeContext2(x, source, depth)
      if (con !== null) return con
    }
    // If we can't guarantee unique with logic just send all info about node
    return this.store.connectedStatements(x, source) // was:
    // throw new Error('Unable to uniquely identify bnode: ' + x.toNT())
  }

  /**
   * @private
   */
  mentioned(x) {
    return this.store.statementsMatching(x, null, null, null).length !== 0 || // Don't pin fresh bnodes
      this.store.statementsMatching(null, x).length !== 0 ||
      this.store.statementsMatching(null, null, x).length !== 0
  }

  /**
   * @private
   */
  bnodeContext(bnodes, doc) {
    var context = []
    if (bnodes.length) {
      this.cacheIfps()
      for (let i = 0; i < bnodes.length; i++) { // Does this occur in old graph?
        var bnode = bnodes[i]
        if (!this.mentioned(bnode)) continue
        context = context.concat(this.bnodeContext1(bnode, doc))
      }
    }
    return context
  }

  /**
   * Returns the best context for a single statement
   * @private
   */
  statementContext(st: Quad) {
    var bnodes = this.statementBnodes(st)
    return this.bnodeContext(bnodes, st.graph)
  }

  /**
   * @private
   */
  contextWhere(context) {
    var updater = this
    return (!context || context.length === 0)
      ? ''
      : 'WHERE { ' +
      context.map(function (x) {
        return updater.anonymizeNT(x)
      }).join('\n') + ' }\n'
  }

  /**
   * @private
   */
  fire(
    uri: string,
    query: string,
    callbackFunction: CallBackFunction,
    options: Options = {}
  ): Promise<void> {
    return Promise.resolve()
      .then(() => {
        if (!uri) {
          throw new Error('No URI given for remote editing operation: ' + query)
        }
        // console.log('UpdateManager: sending update to <' + uri + '>')

        options.noMeta = true;
        options.contentType = options.contentType || 'application/sparql-update';
        options.body = query;

        return this.store.fetcher.webOperation('PATCH', uri, options)
      })
      .then(response => {
        if (!response.ok) {
          let message = 'UpdateManager: update failed for <' + uri + '> status=' +
            response.status + ', ' + response.statusText +
            '\n   for query: ' + query
          // console.log(message)
          throw new Error(message)
        }

        // console.log('UpdateManager: update Ok for <' + uri + '>')

        callbackFunction(uri, response.ok, response.responseText as string, response)
      })
      .catch(err => {
        callbackFunction(uri, false, err.message, err)
      })
  }

  // ARE THESE THREE FUNCTIONS USED? DEPRECATE?

  /** return a statemnet updating function
   *
   * This does NOT update the statement.
   * It returns an object which includes
   *  function which can be used to change the object of the statement.
   */
  update_statement(statement: Quad) {
    if (statement && !statement.graph) {
      return
    }
    var updater = this
    var context = this.statementContext(statement)

    return {
      statement: statement ? [statement.subject, statement.predicate, statement.object, statement.graph] : undefined,
      statementNT: statement ? this.anonymizeNT(statement) : undefined,
      where: updater.contextWhere(context),

      set_object: function (obj, callbackFunction) {
        var query = this.where
        query += 'DELETE DATA { ' + this.statementNT + ' } ;\n'
        query += 'INSERT DATA { ' +
          // @ts-ignore `this` might refer to the wrong scope. Does this work?
          this.anonymize(this.statement[0]) + ' ' +
          // @ts-ignore
          this.anonymize(this.statement[1]) + ' ' +
          // @ts-ignore
          this.anonymize(obj) + ' ' + ' . }\n'

        updater.fire((this.statement as [Quad_Subject, Quad_Predicate, Quad_Object, Quad_Graph])[3].value, query, callbackFunction)
      }
    }
  }

  insert_statement(st: Quad, callbackFunction: CallBackFunction): void {
    var st0 = st instanceof Array ? st[0] : st
    var query = this.contextWhere(this.statementContext(st0))

    if (st instanceof Array) {
      var stText = ''
      for (let i = 0; i < st.length; i++) stText += st[i] + '\n'
      query += 'INSERT DATA { ' + stText + ' }\n'
    } else {
      query += 'INSERT DATA { ' +
        this.anonymize(st.subject) + ' ' +
        this.anonymize(st.predicate) + ' ' +
        this.anonymize(st.object) + ' ' + ' . }\n'
    }

    this.fire(st0.graph.value, query, callbackFunction)
  }

  delete_statement(st: Quad | Quad[], callbackFunction: CallBackFunction): void {
    var st0 = st instanceof Array ? st[0] : st
    var query = this.contextWhere(this.statementContext(st0))

    if (st instanceof Array) {
      var stText = ''
      for (let i = 0; i < st.length; i++) stText += st[i] + '\n'
      query += 'DELETE DATA { ' + stText + ' }\n'
    } else {
      query += 'DELETE DATA { ' +
        this.anonymize(st.subject) + ' ' +
        this.anonymize(st.predicate) + ' ' +
        this.anonymize(st.object) + ' ' + ' . }\n'
    }

    this.fire(st0.graph.value, query, callbackFunction)
  }

  /// //////////////////////

  /**
   * Requests a now or future action to refresh changes coming downstream
   * This is designed to allow the system to re-request the server version,
   * when a websocket has pinged to say there are changes.
   * If the websocket, by contrast, has sent a patch, then this may not be necessary.
   *
   * @param doc
   * @param action
   */
  requestDownstreamAction(doc: NamedNode, action): void {
    var control = this.patchControlFor(doc)
    if (!control.pendingUpstream) {
      action(doc)
    } else {
      if (control.downstreamAction) {
        if ('' + control.downstreamAction !== '' + action) {  // Kludge compare
          throw new Error("Can't wait for > 1 different downstream actions")
        }
      } else {
        control.downstreamAction = action
      }
    }
  }

  /**
   * We want to start counting websocket notifications
   * to distinguish the ones from others from our own.
   */
  clearUpstreamCount(doc: NamedNode): void {
    var control = this.patchControlFor(doc)
    control.upstreamCount = 0
  }

  getUpdatesVia(doc: NamedNode): string | null {
    var linkHeaders = this.store.fetcher.getHeader(doc, 'updates-via')
    if (!linkHeaders || !linkHeaders.length) return null
    return linkHeaders[0].trim()
  }

  addDownstreamChangeListener(doc: NamedNode, listener): void {
    var control = this.patchControlFor(doc)
    if (!control.downstreamChangeListeners) { control.downstreamChangeListeners = [] }
    control.downstreamChangeListeners.push(listener)
    this.setRefreshHandler(doc, (doc: NamedNode) => {
      this.reloadAndSync(doc)
    })
  }

  reloadAndSync(doc: NamedNode): void {
    var control = this.patchControlFor(doc)
    var updater = this

    if (control.reloading) {
      // console.log('   Already reloading - note this load may be out of date')
      control.outOfDate = true
      return // once only needed @@ Not true, has changed again
    }
    control.reloading = true
    var retryTimeout = 1000 // ms
    var tryReload = function () {
      // console.log('try reload - timeout = ' + retryTimeout)
      updater.reload(updater.store, doc, function (ok, message, response) {
        if (ok) {
          if (control.downstreamChangeListeners) {
            for (let i = 0; i < control.downstreamChangeListeners.length; i++) {
              // console.log('        Calling downstream listener ' + i)
              control.downstreamChangeListeners[i]()
            }
          }
          control.reloading = false
          if (control.outOfDate) {
            // console.log('   Extra reload because of extra update.')
            control.outOfDate = false
            tryReload()
          }
        } else {
          control.reloading = false
          if (response && (response as Response).status === 0) {
            // console.log('Network error refreshing the data. Retrying in ' +
            // retryTimeout / 1000)
            control.reloading = true
            retryTimeout = retryTimeout * 2
            setTimeout(tryReload, retryTimeout)
          } else {
            // console.log('Error ' + (response as Response).status + 'refreshing the data:' +
            //  message + '. Stopped' + doc)
          }
        }
      })
    }
    tryReload()
  }

  /**
   * Sets up websocket to listen on
   *
   * There is coordination between upstream changes and downstream ones
   * so that a reload is not done in the middle of an upstream patch.
   * If you use this API then you get called when a change happens, and you
   * have to reload the file yourself, and then refresh the UI.
   * Alternative is addDownstreamChangeListener(), where you do not
   * have to do the reload yourself. Do mot mix them.
   *
   * kb contains the HTTP  metadata from previous operations
   *
   * @param doc
   * @param handler
   *
   * @returns {boolean}
   */
  setRefreshHandler(doc: NamedNode, handler): boolean {
    let wssURI = this.getUpdatesVia(doc) // relative
    // var kb = this.store
    var theHandler = handler
    var self = this
    var updater = this
    var retryTimeout = 1500 // *2 will be 3 Seconds, 6, 12, etc
    var retries = 0

    if (!wssURI) {
      // console.log('Server does not support live updates through Updates-Via :-(')
      return false
    }

    wssURI = uriJoin(wssURI, doc.value)
    const validWssURI = wssURI.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
    // console.log('Web socket URI ' + wssURI)

    var openWebsocket = function () {
      // From https://github.com/solid/solid-spec#live-updates
      var socket
      if (typeof WebSocket !== 'undefined') {
        socket = new WebSocket(validWssURI)
      } else if (typeof window !== 'undefined' && window.WebSocket) {
        socket = (window as any).WebSocket(validWssURI)
      } else {
        // console.log('Live update disabled, as WebSocket not supported by platform :-(')
        return
      }
      socket.onopen = function () {
        // console.log('    websocket open')
        retryTimeout = 1500 // reset timeout to fast on success
        this.send('sub ' + doc.value)
        if (retries) {
          // console.log('Web socket has been down, better check for any news.')
          updater.requestDownstreamAction(doc, theHandler)
        }
      }
      var control = self.patchControlFor(doc)
      control.upstreamCount = 0

      socket.onerror = function onerror(err: Error) {
        // console.log('Error on Websocket:', err)
      }

      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      //
      // 1000  CLOSE_NORMAL  Normal closure; the connection successfully completed whatever purpose for which it was created.
      // 1001  CLOSE_GOING_AWAY  The endpoint is going away, either
      //                                  because of a server failure or because the browser is navigating away from the page that opened the connection.
      // 1002  CLOSE_PROTOCOL_ERROR  The endpoint is terminating the connection due to a protocol error.
      // 1003  CLOSE_UNSUPPORTED  The connection is being terminated because the endpoint
      //                                  received data of a type it cannot accept (for example, a text-only endpoint received binary data).
      // 1004                             Reserved. A meaning might be defined in the future.
      // 1005  CLOSE_NO_STATUS  Reserved.  Indicates that no status code was provided even though one was expected.
      // 1006  CLOSE_ABNORMAL  Reserved. Used to indicate that a connection was closed abnormally (
      //
      //
      socket.onclose = function (event: CloseEvent) {
        // console.log('*** Websocket closed with code ' + event.code +
        //   ", reason '" + event.reason + "' clean = " + event.wasClean)
        retryTimeout *= 2
        retries += 1
        // console.log('Retrying in ' + retryTimeout + 'ms') // (ask user?)
        setTimeout(function () {
          // console.log('Trying websocket again')
          openWebsocket()
        }, retryTimeout)
      }
      socket.onmessage = function (msg: MessageEvent) {
        if (msg.data && msg.data.slice(0, 3) === 'pub') {
          if ('upstreamCount' in control) {
            control.upstreamCount -= 1
            if (control.upstreamCount >= 0) {
              // console.log('just an echo: ' + control.upstreamCount)
              return // Just an echo
            }
          }
          // console.log('Assume a real downstream change: ' + control.upstreamCount + ' -> 0')
          control.upstreamCount = 0
          self.requestDownstreamAction(doc, theHandler)
        }
      }
    } // openWebsocket
    openWebsocket()

    return true
  }

  /**
   * This high-level function updates the local store iff the web is changed successfully.
   * Deletions, insertions may be undefined or single statements or lists or formulae (may contain bnodes which can be indirectly identified by a where clause).
   * The `why` property of each statement must be the give the web document to be updated.
   * The statements to be deleted and inserted may span more than one web document.
   * @param deletions - Statement or statements to be deleted.
   * @param insertions - Statement or statements to be inserted.
   * @returns a promise
   */
  updateMany(
    deletions: ReadonlyArray<Statement>,
    insertions: ReadonlyArray<Statement> = []
  ): Promise<void[]> {
    const docs = deletions.concat(insertions).map(st => st.why)
    const thisUpdater = this
    const uniqueDocs: Array<NamedNode> = []
    docs.forEach(doc => {
      if (!uniqueDocs.find(uniqueDoc => uniqueDoc.equals(doc))) uniqueDocs.push(doc as NamedNode)
    })
    const updates = uniqueDocs.map(doc =>
      thisUpdater.update(deletions.filter(st => st.why.equals(doc)),
        insertions.filter(st => st.why.equals(doc))))
    if (updates.length > 1) {
      // console.log(`@@ updateMany to ${updates.length}: ${uniqueDocs}`)
    }
    return Promise.all(updates)
  }

  /**
   * @private
   * 
   * This helper function constructs SPARQL Update query from resolved arguments.
   * 
   * @param ds: deletions array.
   * @param is: insertions array.
   * @param bnodes_context: Additional context to uniquely identify any blank nodes.
   */
  constructSparqlUpdateQuery(
    ds: ReadonlyArray<Statement>,
    is: ReadonlyArray<Statement>,
    bnodes_context,
  ): string {
    var whereClause = this.contextWhere(bnodes_context)
    var query = ''
    if (whereClause.length) { // Is there a WHERE clause?
      if (ds.length) {
        query += 'DELETE { '
        for (let i = 0; i < ds.length; i++) {
          query += this.anonymizeNT(ds[i]) + '\n'
        }
        query += ' }\n'
      }
      if (is.length) {
        query += 'INSERT { '
        for (let i = 0; i < is.length; i++) {
          query += this.anonymizeNT(is[i]) + '\n'
        }
        query += ' }\n'
      }
      query += whereClause
    } else { // no where clause
      if (ds.length) {
        query += 'DELETE DATA { '
        for (let i = 0; i < ds.length; i++) {
          query += this.anonymizeNT(ds[i]) + '\n'
        }
        query += ' } \n'
      }
      if (is.length) {
        if (ds.length) query += ' ; '
        query += 'INSERT DATA { '
        for (let i = 0; i < is.length; i++) {
          query += this.nTriples(is[i]) + '\n'
        }
        query += ' }\n'
      }
    }
    return query;
  }

  /**
   * @private
   * 
   * This helper function constructs n3-patch query from resolved arguments.
   * 
   * @param ds: deletions array.
   * @param is: insertions array.
   * @param bnodes_context: Additional context to uniquely identify any blanknodes.
   */
  constructN3PatchQuery(
    ds: ReadonlyArray<Statement>,
    is: ReadonlyArray<Statement>,
    bnodes_context,
  ): string {
    var query = `
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix ex: <http://www.example.org/terms#>.

_:patch
`;
    // If bnode context is non trivial, express it as ?conditions formula.
    if (bnodes_context && bnodes_context.length > 0) {
      query += `
      solid:where {
        ${bnodes_context.map((x) => this.anonymizeNT(x)).join('\n        ')}
      };`
    }
    if (ds.length > 0) {
      query += `
      solid:deletes {
        ${ds.map((x) => this.anonymizeNT(x)).join('\n        ')}
      };`
    }
    if (is.length > 0) {
      query += `
      solid:inserts {
        ${is.map((x) => this.anonymizeNT(x)).join('\n        ')}
      };`
    }
    query += "   a solid:InsertDeletePatch .\n"

    return query;
  }

  /**
   * This high-level function updates the local store if the web is changed successfully.
   * Deletions, insertions may be undefined or single statements or lists or formulae (may contain bnodes which can be indirectly identified by a where clause).
   * The `why` property of each statement must be the same and give the web document to be updated.
   * @param deletions - Statement or statements to be deleted.
   * @param insertions - Statement or statements to be inserted.
   * @param callback - called as callbackFunction(uri, success, errorbody)
   *           OR returns a promise
   * @param options - Options for the fetch call
   */
  update(
    deletions: ReadonlyArray<Statement>,
    insertions: ReadonlyArray<Statement>,
    callback?: (
      uri: string | undefined | null,
      success: boolean,
      errorBody?: string,
      response?: Response | Error
    ) => void,
    secondTry?: boolean,
    options: Options = {}
  ): void | Promise<void> {
    if (!callback) {
      var thisUpdater = this
      return new Promise(function (resolve, reject) { // Promise version
        thisUpdater.update(deletions, insertions, function (uri, ok, errorBody) {
          if (!ok) {
            reject(new Error(errorBody))
          } else {
            resolve()
          }
        }, secondTry, options) // callbackFunction
      }) // promise
    } // if

    try {
      var kb = this.store
      var ds = !deletions ? []
        : isStore(deletions) ? deletions.statements
          : deletions instanceof Array ? deletions : [deletions]
      var is = !insertions ? []
        : isStore(insertions) ? insertions.statements
          : insertions instanceof Array ? insertions : [insertions]
      if (!(ds instanceof Array)) {
        throw new Error('Type Error ' + (typeof ds) + ': ' + ds)
      }
      if (!(is instanceof Array)) {
        throw new Error('Type Error ' + (typeof is) + ': ' + is)
      }
      if (ds.length === 0 && is.length === 0) {
        return callback(null, true) // success -- nothing needed to be done.
      }
      var doc = ds.length ? ds[0].graph : is[0].graph
      if (!doc) {
        let message = 'Error patching: statement does not specify which document to patch:' + ds[0] + ', ' + is[0]
        // console.log(message)
        throw new Error(message)
      }
      if (doc.termType !== 'NamedNode') {
        let message = 'Error patching: document not a NamedNode:' + ds[0] + ', ' + is[0]
        // console.log(message)
        throw new Error(message)
      }
      var control = this.patchControlFor(doc)

      var startTime = Date.now()

      var props = ['subject', 'predicate', 'object', 'why']
      var verbs = ['insert', 'delete']
      var clauses = { 'delete': ds, 'insert': is }
      verbs.map(function (verb) {
        clauses[verb].map(function (st: Quad) {
          if (!doc.equals(st.graph)) {
            throw new Error('update: destination ' + doc +
              ' inconsistent with delete quad ' + st.graph)
          }
          props.map(function (prop) {
            if (typeof st[prop] === 'undefined') {
              throw new Error('update: undefined ' + prop + ' of statement.')
            }
          })
        })
      })

      var protocol = this.editable(doc.value, kb);

      if (protocol === false) {
        throw new Error('Update: Can\'t make changes in uneditable ' + doc)
      }
      if (protocol === undefined) { // Not enough metadata
        if (secondTry) {
          throw new Error('Update: Loaded ' + doc + "but still can't figure out what editing protocol it supports.")
        }
        // console.log(`Update: have not loaded ${doc} before: loading now...`);
        (this.store.fetcher.load(doc as NamedNode) as Promise<Response>).then(response => {
          this.update(deletions, insertions, callback, true, options)
        }, err => {
          if (err.response.status === 404) { // nonexistent files are fine
            this.update(deletions, insertions, callback, true, options)
          } else {
            throw new Error(`Update: Can't get updatability status ${doc} before patching: ${err}`)
          }
        })
        return
      } else if ((protocol as string).indexOf('SPARQL') >= 0 || (protocol as string).indexOf('N3PATCH') >= 0) {
        var isSparql = (protocol as string).indexOf('SPARQL') >= 0

        var bnodes: BlankNode[] = []
        // change ReadOnly type to Mutable type
        type Mutable<Type> = {
          -readonly [Key in keyof Type]: Type[Key];
        }

        if (ds.length) bnodes = this.statementArrayBnodes(ds as Mutable<typeof ds>)
        if (is.length) bnodes = bnodes.concat(this.statementArrayBnodes(is as Mutable<typeof is>))
        var context = this.bnodeContext(bnodes, doc)

        var query = isSparql ? this.constructSparqlUpdateQuery(ds, is, context) : this.constructN3PatchQuery(ds, is, context);
        options.contentType = isSparql ? 'application/sparql-update' : 'text/n3' 
        
        // Track pending upstream patches until they have finished their callbackFunction
        control.pendingUpstream = control.pendingUpstream ? control.pendingUpstream + 1 : 1
        if ('upstreamCount' in control) {
          control.upstreamCount += 1 // count changes we originated ourselves
          // console.log('upstream count up to : ' + control.upstreamCount)
        }

        this.fire(doc.value, query, (uri, success, body, response) => {
          (response as any).elapsedTimeMs = Date.now() - startTime
          /* console.log('    UpdateManager: Return ' +
            (success ? 'success ' : 'FAILURE ') + (response as Response).status +
            ' elapsed ' + (response as any).elapsedTimeMs + 'ms')
            */
          if (success) {
            try {
              kb.remove(ds as Mutable<typeof ds>)
            } catch (e) {
              success = false
              body = 'Remote Ok BUT error deleting ' + ds.length + ' from store!!! ' + e
            } // Add in any case -- help recover from weirdness??
            for (let i = 0; i < is.length; i++) {
              kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
            }
          }

          callback(uri, success, body, response)
          control.pendingUpstream -= 1
          // When upstream patches have been sent, reload state if downstream waiting
          if (control.pendingUpstream === 0 && control.downstreamAction) {
            var downstreamAction = control.downstreamAction
            delete control.downstreamAction
            // console.log('delayed downstream action:')
            downstreamAction(doc)
          }
        }, options)
      } else if ((protocol as string).indexOf('DAV') >= 0) {
        this.updateDav(doc as NamedNode, ds, is, callback, options)
      } else {
        if ((protocol as string).indexOf('LOCALFILE') >= 0) {
          try {
            this.updateLocalFile(doc as NamedNode, ds, is, callback, options)
          } catch (e) {
            callback(doc.value, false,
              'Exception trying to write back file <' + doc.value + '>\n'
              // + tabulator.Util.stackString(e))
            )
          }
        } else {
          throw new Error("Unhandled edit method: '" + protocol + "' for " + doc)
        }
      }
    } catch (e) {
      callback(undefined, false, 'Exception in update: ' + e + '\n' +
        Util.stackString(e))
    }
  }

  updateDav(
    doc: Quad_Subject,
    ds,
    is,
    callbackFunction,
    options: Options = {}
  ): null | Promise<void> {
    let kb = this.store
    // The code below is derived from Kenny's UpdateCenter.js
    var request = kb.any(doc, this.ns.link('request'))
    if (!request) {
      throw new Error('No record of our HTTP GET request for document: ' +
        doc)
    } // should not happen
    var response = kb.any(request as NamedNode, this.ns.link('response')) as Quad_Subject
    if (!response) {
      return null // throw "No record HTTP GET response for document: "+doc
    }
    var contentType = (kb.the(response, this.ns.httph('content-type')) as Term).value

    // prepare contents of revised document
    let newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // copy!
    for (let i = 0; i < ds.length; i++) {
      Util.RDFArrayRemove(newSts, ds[i])
    }
    for (let i = 0; i < is.length; i++) {
      newSts.push(is[i])
    }

    const documentString = this.serialize(doc.value, newSts, contentType)

    // Write the new version back
    var candidateTarget = kb.the(response, this.ns.httph('content-location'))
    var targetURI
    if (candidateTarget) {
      targetURI = uriJoin(candidateTarget.value, targetURI)
    }

    options.contentType = contentType
    options.noMeta = true
    options.body = documentString

    return kb.fetcher.webOperation('PUT', targetURI, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.error)
        }

        for (let i = 0; i < ds.length; i++) {
          kb.remove(ds[i])
        }
        for (let i = 0; i < is.length; i++) {
          kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
        }

        callbackFunction(doc.value, response.ok, response.responseText, response)
      })
      .catch(err => {
        callbackFunction(doc.value, false, err.message, err)
      })
  }

  /**
   * Likely deprecated, since this lib no longer deals with browser extension
   *
   * @param doc
   * @param ds
   * @param is
   * @param callbackFunction
   * @param options
   */
  updateLocalFile(doc: NamedNode, ds, is, callbackFunction, options: Options = {}): void {
    const kb = this.store
    // console.log('Writing back to local file\n')

    // prepare contents of revised document
    let newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // copy!

    for (let i = 0; i < ds.length; i++) {
      Util.RDFArrayRemove(newSts, ds[i])
    }
    for (let i = 0; i < is.length; i++) {
      newSts.push(is[i])
    }
    // serialize to the appropriate format
    var dot = doc.value.lastIndexOf('.')
    if (dot < 1) {
      throw new Error('Rewriting file: No filename extension: ' + doc.value)
    }
    var ext = doc.value.slice(dot + 1)

    let contentType = Fetcher.CONTENT_TYPE_BY_EXT[ext]
    if (!contentType) {
      throw new Error('File extension .' + ext + ' not supported for data write')
    }

    options.body = this.serialize(doc.value, newSts, contentType);
    options.contentType = contentType;

    kb.fetcher.webOperation('PUT', doc.value, options).then((response) => {
      if (!response.ok) return callbackFunction(doc.value, false, response.error)
      for (let i = 0; i < ds.length; i++) {
        kb.remove(ds[i]);
      }
      for (let i = 0; i < is.length; i++) {
        kb.add(is[i].subject, is[i].predicate, is[i].object, doc);
      }
      callbackFunction(doc.value, true, '')  // success!
    })
  }

  /**
   * @throws {Error} On unsupported content type
   *
   * @returns {string}
   */
  serialize(uri: string, data: string | Quad[], contentType: string): string {
    const kb = this.store
    let documentString

    if (typeof data === 'string') {
      return data
    }

    // serialize to the appropriate format
    var sz = Serializer(kb)
    sz.suggestNamespaces(kb.namespaces)
    sz.setBase(uri)
    switch (contentType) {
      case 'text/xml':
      case 'application/rdf+xml':
        documentString = sz.statementsToXML(data)
        break
      case 'text/n3':
      case 'text/turtle':
      case 'application/x-turtle': // Legacy
      case 'application/n3': // Legacy
        documentString = sz.statementsToN3(data)
        break
      default:
        throw new Error('Content-type ' + contentType +
          ' not supported for data serialization')
    }

    return documentString
  }

  /**
   * This is suitable for an initial creation of a document.
   */
  put(
    doc: RDFlibNamedNode,
    data: string | Quad[],
    contentType: string,
    callback: (uri: string, ok: boolean, errorMessage?: string, response?: unknown) => void,
  ): Promise<void> {
    const kb = this.store
    let documentString: string

    return Promise.resolve()
      .then(() => {
        documentString = this.serialize(doc.value, data, contentType)

        return kb.fetcher
          .webOperation('PUT', doc.value, { contentType, body: documentString })
      })
      .then(response => {
        if (!response.ok) {
          return callback(doc.value, response.ok, response.error, response)
        }

        delete kb.fetcher.nonexistent[doc.value]
        delete kb.fetcher.requested[doc.value] // @@ could this mess with the requested state machine? if a fetch is in progress

        if (typeof data !== 'string') {
          data.map((st) => {
            kb.addStatement(st)
          })
        }

        callback(doc.value, response.ok, '', response)
      })
      .catch(err => {
        callback(doc.value, false, err.message)
      })
  }

  /**
   * Reloads a document.
   *
   * Fast and cheap, no metadata. Measure times for the document.
   * Load it provisionally.
   * Don't delete the statements before the load, or it will leave a broken
   * document in the meantime.
   *
   * @param kb
   * @param doc {RDFlibNamedNode}
   * @param callbackFunction
   */
  reload(
    kb: IndexedFormula,
    doc: docReloadType,
    callbackFunction: (ok: boolean, message?: string, response?: Error | Response) => {} | void
  ): void {
    var startTime = Date.now()
    // force sets no-cache and
    const options = {
      force: true,
      noMeta: true,
      clearPreviousData: true,
    };

    (kb as any).fetcher.nowOrWhenFetched(doc.value, options, function (ok: boolean, body: Body, response: Response) {
      if (!ok) {
        // console.log('    ERROR reloading data: ' + body)
        callbackFunction(false, 'Error reloading data: ' + body, response)
        //@ts-ignore Where does onErrorWasCalled come from?
      } else if (response.onErrorWasCalled || response.status !== 200) {
        // console.log('    Non-HTTP error reloading data! onErrorWasCalled=' +
        //@ts-ignore Where does onErrorWasCalled come from?
        // response.onErrorWasCalled + ' status: ' + response.status)
        callbackFunction(false, 'Non-HTTP error reloading data: ' + body, response)
      } else {
        var elapsedTimeMs = Date.now() - startTime

        if (!doc.reloadTimeTotal) doc.reloadTimeTotal = 0
        if (!doc.reloadTimeCount) doc.reloadTimeCount = 0

        doc.reloadTimeTotal += elapsedTimeMs
        doc.reloadTimeCount += 1

        // console.log('    Fetch took ' + elapsedTimeMs + 'ms, av. of ' +
        // doc.reloadTimeCount + ' = ' +
        // (doc.reloadTimeTotal / doc.reloadTimeCount) + 'ms.')

        callbackFunction(true)
      }
    })
  }
}

interface docReloadType extends NamedNode {
  reloadTimeCount?: number
  reloadTimeTotal?: number
}
