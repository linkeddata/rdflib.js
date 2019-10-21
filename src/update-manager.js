/* @file Update Manager Class
**
** 2007-07-15 originall sparl update module by Joe Presbrey <presbrey@mit.edu>
** 2010-08-08 TimBL folded in Kenny's WEBDAV
** 2010-12-07 TimBL addred local file write code
*/
import IndexedFormula from './store'
import { docpart } from './uri'
import Fetcher from './fetcher'
import DataFactory from './data-factory'
import Namespace from './namespace'
import Serializer from './serializer'
import { join as uriJoin } from './uri'
import * as Util from './util'

/** Update Manager
*
* The update manager is a helper object for a store.
* Just as a Fetcher provides the store with the ability to read and write,
* the Update Manager provides functionality for making small patches in real time,
* and also looking out for concurrent updates from other agents
*/

export default class UpdateManager {
  /** @constructor
   * @param {IndexedFormula} store - the quadstore to store data and metadata. Created if not passed.f
  */
  constructor (store) {
    store = store || new IndexedFormula() // If none provided make a store
    this.store = store
    if (store.updater) {
      throw new Error("You can't have two UpdateManagers for the same store")
    }
    if (!store.fetcher) { // The store must also/already have a fetcher
      store.fetcher = new Fetcher(store)
    }
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

    this.patchControl = [] // index of objects fro coordinating incomng and outgoing patches
  }

  patchControlFor (doc) {
    if (!this.patchControl[doc.uri]) {
      this.patchControl[doc.uri] = []
    }
    return this.patchControl[doc.uri]
  }

  /**
   * Tests whether a file is editable.
   * Files have to have a specific annotation that they are machine written,
   *   for safety.
   * We don't actually check for write access on files.
   *
   * @param uri {string}
   * @param kb {IndexedFormula}
   *
   * @returns {string|boolean|undefined} The method string SPARQL or DAV or
   *   LOCALFILE or false if known, undefined if not known.
   */
  editable (uri, kb) {
    if (!uri) {
      return false // Eg subject is bnode, no known doc to write to
    }
    if (!kb) {
      kb = this.store
    }
    uri = uri.uri || uri // Allow Named Node to be passed

    if (uri.slice(0, 8) === 'file:///') {
      if (kb.holds(
            kb.sym(uri),
            DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DataFactory.namedNode('http://www.w3.org/2007/ont/link#MachineEditableDocument'))) {
        return 'LOCALFILE'
      }

      var sts = kb.statementsMatching(kb.sym(uri))

      console.log('UpdateManager.editable: Not MachineEditableDocument file ' +
        uri + '\n')
      console.log(sts.map((x) => { return x.toNT() }).join('\n'))

      return false
      // @@ Would be nifty of course to see whether we actually have write access first.
    }

    var request
    var definitive = false
    var requests = kb.each(undefined, this.ns.link('requestedURI'), docpart(uri))

    var method
    for (var r = 0; r < requests.length; r++) {
      request = requests[r]
      if (request !== undefined) {
        var response = kb.any(request, this.ns.link('response'))
        if (request !== undefined) {
          var wacAllow = kb.anyValue(response, this.ns.httph('wac-allow'))
          if (wacAllow) {
            for (var bit of wacAllow.split(',')) {
              var lr = bit.split('=')
              if (lr[0].includes('user') && !lr[1].includes('write') && !lr[1].includes('append') ) {
                console.log('    editable? excluded by WAC-Allow: ', wacAllow)
                return false
              }
            }
          }
          var acceptPatch = kb.each(response, this.ns.httph('accept-patch'))
          if (acceptPatch.length) {
            for (let i = 0; i < acceptPatch.length; i++) {
              method = acceptPatch[i].value.trim()
              if (method.indexOf('application/sparql-update') >= 0) return 'SPARQL'
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
          var status = kb.each(response, this.ns.http('status'))
          if (status.length) {
            for (let i = 0; i < status.length; i++) {
              if (status[i] === 200 || status[i] === 404) {
                definitive = true
                // return false // A definitive answer
              }
            }
          }
        } else {
          console.log('UpdateManager.editable: No response for ' + uri + '\n')
        }
      }
    }
    if (requests.length === 0) {
      console.log('UpdateManager.editable: No request for ' + uri + '\n')
    } else {
      if (definitive) {
        return false // We have got a request and it did NOT say editable => not editable
      }
    }
    console.log('UpdateManager.editable: inconclusive for ' + uri + '\n')
    return undefined // We don't know (yet) as we haven't had a response (yet)
  }

  anonymize (obj) {
    return (obj.toNT().substr(0, 2) === '_:' && this.mentioned(obj))
      ? '?' + obj.toNT().substr(2)
      : obj.toNT()
  }

  anonymizeNT (stmt) {
    return this.anonymize(stmt.subject) + ' ' +
      this.anonymize(stmt.predicate) + ' ' +
      this.anonymize(stmt.object) + ' .'
  }

  /**
   * Returns a list of all bnodes occurring in a statement
   * @private
   */
  statementBnodes (st) {
    return [st.subject, st.predicate, st.object].filter(function (x) {
      return x.isBlank
    })
  }

  /**
   * Returns a list of all bnodes occurring in a list of statements
   * @private
   */
  statementArrayBnodes (sts) {
    var bnodes = []
    for (let i = 0; i < sts.length; i++) {
      bnodes = bnodes.concat(this.statementBnodes(sts[i]))
    }
    bnodes.sort() // in place sort - result may have duplicates
    var bnodes2 = []
    for (let j = 0; j < bnodes.length; j++) {
      if (j === 0 || !bnodes[j].sameTerm(bnodes[j - 1])) {
        bnodes2.push(bnodes[j])
      }
    }
    return bnodes2
  }

  /**
   * Makes a cached list of [Inverse-]Functional properties
   * @private
   */
  cacheIfps () {
    this.ifps = {}
    var a = this.store.each(undefined, this.ns.rdf('type'),
      this.ns.owl('InverseFunctionalProperty'))
    for (let i = 0; i < a.length; i++) {
      this.ifps[a[i].uri] = true
    }
    this.fps = {}
    a = this.store.each(undefined, this.ns.rdf('type'), this.ns.owl('FunctionalProperty'))
    for (let i = 0; i < a.length; i++) {
      this.fps[a[i].uri] = true
    }
  }

  /**
   * Returns a context to bind a given node, up to a given depth
   * @private
   */
  bnodeContext2 (x, source, depth) {
    // Return a list of statements which indirectly identify a node
    //  Depth > 1 if try further indirection.
    //  Return array of statements (possibly empty), or null if failure
    var sts = this.store.statementsMatching(undefined, undefined, x, source) // incoming links
    var y
    var res
    for (let i = 0; i < sts.length; i++) {
      if (this.fps[sts[i].predicate.uri]) {
        y = sts[i].subject
        if (!y.isBlank) {
          return [ sts[i] ]
        }
        if (depth) {
          res = this.bnodeContext2(y, source, depth - 1)
          if (res) {
            return res.concat([ sts[i] ])
          }
        }
      }
    }
    // outgoing links
    sts = this.store.statementsMatching(x, undefined, undefined, source)
    for (let i = 0; i < sts.length; i++) {
      if (this.ifps[sts[i].predicate.uri]) {
        y = sts[i].object
        if (!y.isBlank) {
          return [ sts[i] ]
        }
        if (depth) {
          res = this.bnodeContext2(y, source, depth - 1)
          if (res) {
            return res.concat([ sts[i] ])
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
  bnodeContext1 (x, source) {
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
  mentioned (x) {
    return this.store.statementsMatching(x).length !== 0 || // Don't pin fresh bnodes
      this.store.statementsMatching(undefined, x).length !== 0 ||
      this.store.statementsMatching(undefined, undefined, x).length !== 0
  }

  /**
   * @private
   */
  bnodeContext (bnodes, doc) {
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
  statementContext (st) {
    var bnodes = this.statementBnodes(st)
    return this.bnodeContext(bnodes, st.why)
  }

  /**
   * @private
   */
  contextWhere (context) {
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
  fire (uri, query, callbackFunction) {
    return Promise.resolve()
      .then(() => {
        if (!uri) {
          throw new Error('No URI given for remote editing operation: ' + query)
        }
        console.log('UpdateManager: sending update to <' + uri + '>')

        let options = {
          noMeta: true,
          contentType: 'application/sparql-update',
          body: query
        }

        return this.store.fetcher.webOperation('PATCH', uri, options)
      })
      .then(response => {
        if (!response.ok) {
          let message = 'UpdateManager: update failed for <' + uri + '> status=' +
            response.status + ', ' + response.statusText +
            '\n   for query: ' + query
          console.log(message)
          throw new Error(message)
        }

        console.log('UpdateManager: update Ok for <' + uri + '>')

        callbackFunction(uri, response.ok, response.responseText, response)
      })
      .catch(err => {
        callbackFunction(uri, false, err.message, err)
      })
  }

// ARE THESE THEE FUNCTIONS USED? DEPROCATE?

  /** return a statemnet updating function
   *
   * This does NOT update the statement.
   * It returns an object which includes
   *  function which can be used to change the object of the statement.
   */
  update_statement (statement) {
    if (statement && !statement.why) {
      return
    }
    var updater = this
    var context = this.statementContext(statement)

    return {
      statement: statement ? [statement.subject, statement.predicate, statement.object, statement.why] : undefined,
      statementNT: statement ? this.anonymizeNT(statement) : undefined,
      where: updater.contextWhere(context),

      set_object: function (obj, callbackFunction) {
        var query = this.where
        query += 'DELETE DATA { ' + this.statementNT + ' } ;\n'
        query += 'INSERT DATA { ' +
          this.anonymize(this.statement[0]) + ' ' +
          this.anonymize(this.statement[1]) + ' ' +
          this.anonymize(obj) + ' ' + ' . }\n'

        updater.fire(this.statement[3].uri, query, callbackFunction)
      }
    }
  }

  insert_statement (st, callbackFunction) {
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

    this.fire(st0.why.uri, query, callbackFunction)
  }

  delete_statement (st, callbackFunction) {
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

    this.fire(st0.why.uri, query, callbackFunction)
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
  requestDownstreamAction (doc, action) {
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
  clearUpstreamCount (doc) {
    var control = this.patchControlFor(doc)
    control.upstreamCount = 0
  }

  getUpdatesVia (doc) {
    var linkHeaders = this.store.fetcher.getHeader(doc, 'updates-via')
    if (!linkHeaders || !linkHeaders.length) return null
    return linkHeaders[0].trim()
  }

  addDownstreamChangeListener (doc, listener) {
    var control = this.patchControlFor(doc)
    if (!control.downstreamChangeListeners) { control.downstreamChangeListeners = [] }
    control.downstreamChangeListeners.push(listener)
    this.setRefreshHandler(doc, (doc) => {
      this.reloadAndSync(doc)
    })
  }

  reloadAndSync (doc) {
    var control = this.patchControlFor(doc)
    var updater = this

    if (control.reloading) {
      console.log('   Already reloading - note this load may be out of date')
      control.outOfDate = true
      return // once only needed @@ Not true, has changed again
    }
    control.reloading = true
    var retryTimeout = 1000 // ms
    var tryReload = function () {
      console.log('try reload - timeout = ' + retryTimeout)
      updater.reload(updater.store, doc, function (ok, message, response) {
        if (ok) {
          if (control.downstreamChangeListeners) {
            for (let i = 0; i < control.downstreamChangeListeners.length; i++) {
              console.log('        Calling downstream listener ' + i)
              control.downstreamChangeListeners[i]()
            }
          }
          control.reloading = false
          if (control.outOfDate){
            console.log('   Extra reload because of extra update.')
            control.outOfDate = false
            tryReload()
          }
        } else {
          control.reloading = false
          if (response.status === 0) {
            console.log('Network error refreshing the data. Retrying in ' +
              retryTimeout / 1000)
            control.reloading = true
            retryTimeout = retryTimeout * 2
            setTimeout(tryReload, retryTimeout)
          } else {
            console.log('Error ' + response.status + 'refreshing the data:' +
              message + '. Stopped' + doc)
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
  setRefreshHandler (doc, handler) {
    var wssURI = this.getUpdatesVia(doc) // relative
    // var kb = this.store
    var theHandler = handler
    var self = this
    var updater = this
    var retryTimeout = 1500 // *2 will be 3 Seconds, 6, 12, etc
    var retries = 0

    if (!wssURI) {
      console.log('Server doies not support live updates thoughUpdates-Via :-(')
      return false
    }

    wssURI = uriJoin(wssURI, doc.uri)
    wssURI = wssURI.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
    console.log('Web socket URI ' + wssURI)

    var openWebsocket = function () {
      // From https://github.com/solid/solid-spec#live-updates
      var socket
      if (typeof WebSocket !== 'undefined') {
        socket = new WebSocket(wssURI)
      } else if (typeof Services !== 'undefined') { // Firefox add on http://stackoverflow.com/questions/24244886/is-websocket-supported-in-firefox-for-android-addons
        socket = (Services.wm.getMostRecentWindow('navigator:browser').WebSocket)(wssURI)
      } else if (typeof window !== 'undefined' && window.WebSocket) {
        socket = window.WebSocket(wssURI)
      } else {
        console.log('Live update disabled, as WebSocket not supported by platform :-(')
        return
      }
      socket.onopen = function () {
        console.log('    websocket open')
        retryTimeout = 1500 // reset timeout to fast on success
        this.send('sub ' + doc.uri)
        if (retries) {
          console.log('Web socket has been down, better check for any news.')
          updater.requestDownstreamAction(doc, theHandler)
        }
      }
      var control = self.patchControlFor(doc)
      control.upstreamCount = 0

      socket.onerror = function onerror (err) {
        console.log('Error on Websocket:', err)
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
      socket.onclose = function (event) {
        console.log('*** Websocket closed with code ' + event.code +
          ", reason '" + event.reason + "' clean = " + event.clean)
        retryTimeout *= 2
        retries += 1
        console.log('Retrying in ' + retryTimeout + 'ms') // (ask user?)
        setTimeout(function () {
          console.log('Trying websocket again')
          openWebsocket()
        }, retryTimeout)
      }
      socket.onmessage = function (msg) {
        if (msg.data && msg.data.slice(0, 3) === 'pub') {
          if ('upstreamCount' in control) {
            control.upstreamCount -= 1
            if (control.upstreamCount >= 0) {
              console.log('just an echo: ' + control.upstreamCount)
              return // Just an echo
            }
          }
          console.log('Assume a real downstream change: ' + control.upstreamCount + ' -> 0')
          control.upstreamCount = 0
          self.requestDownstreamAction(doc, theHandler)
        }
      }
    } // openWebsocket
    openWebsocket()

    return true
  }

  /** Update
   *
   * This high-level function updates the local store iff the web is changed
   * successfully.
   *
   * Deletions, insertions may be undefined or single statements or lists or formulae
   * (may contain bnodes which can be indirectly identified by a where clause).
   * The `why` property of each statement must be the same and give the web document to be updated
   *
   * @param deletions - Statement or statments to be deleted.
   * @param insertions - Statement or statements to be inserted
   *
   * @param callbackFunction {Function} called as callbackFunction(uri, success, errorbody)
   *              OR returns a promise
   *
   * @returns {*}
   */
  update (deletions, insertions, callbackFunction, secondTry) {
    if (!callbackFunction) {
      var thisUpdater = this
      return new Promise(function (resolve, reject) { // Promise version
        thisUpdater.update(deletions, insertions, function (uri, ok, errorBody) {
          if (!ok) {
            reject(new Error(errorBody))
          } else {
            resolve()
          }
        }) // callbackFunction
      }) // promise
    } // if

    try {
      var kb = this.store
      var ds = !deletions ? []
        : deletions instanceof IndexedFormula ? deletions.statements
          : deletions instanceof Array ? deletions : [ deletions ]
      var is = !insertions ? []
        : insertions instanceof IndexedFormula ? insertions.statements
          : insertions instanceof Array ? insertions : [ insertions ]
      if (!(ds instanceof Array)) {
        throw new Error('Type Error ' + (typeof ds) + ': ' + ds)
      }
      if (!(is instanceof Array)) {
        throw new Error('Type Error ' + (typeof is) + ': ' + is)
      }
      if (ds.length === 0 && is.length === 0) {
        return callbackFunction(null, true) // success -- nothing needed to be done.
      }
      var doc = ds.length ? ds[0].why : is[0].why
      if (!doc) {
        let message = 'Error patching: statement does not specify which document to patch:' + ds[0] + ', ' + is[0]
        console.log(message)
        throw new Error(message)
      }
      var control = this.patchControlFor(doc)
      var startTime = Date.now()

      var props = ['subject', 'predicate', 'object', 'why']
      var verbs = ['insert', 'delete']
      var clauses = { 'delete': ds, 'insert': is }
      verbs.map(function (verb) {
        clauses[verb].map(function (st) {
          if (!doc.sameTerm(st.why)) {
            throw new Error('update: destination ' + doc +
              ' inconsistent with delete quad ' + st.why)
          }
          props.map(function (prop) {
            if (typeof st[prop] === 'undefined') {
              throw new Error('update: undefined ' + prop + ' of statement.')
            }
          })
        })
      })

      var protocol = this.editable(doc.uri, kb)
      if (protocol === false) {
        throw new Error('Update: Can\'t make changes in uneditable ' + doc)
      }
      if (protocol === undefined) { // Not enough metadata
        if (secondTry) {
          throw new Error('Update: Loaded ' + doc + "but stil can't figure out what editing protcol it supports.")
        }
        console.log(`Update: have not loaded ${doc} before: loading now...`)
        this.store.fetcher.load(doc).then(response => {
          this.update(deletions, insertions, callbackFunction, true) // secondTry
        }, err => {
          throw new Error(`Update: Can't read ${doc} before patching: ${err}`)
        })
        return
      } else if (protocol.indexOf('SPARQL') >= 0) {
        var bnodes = []
        if (ds.length) bnodes = this.statementArrayBnodes(ds)
        if (is.length) bnodes = bnodes.concat(this.statementArrayBnodes(is))
        var context = this.bnodeContext(bnodes, doc)
        var whereClause = this.contextWhere(context)
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
              query += this.anonymizeNT(is[i]) + '\n'
            }
            query += ' }\n'
          }
        }
        // Track pending upstream patches until they have finished their callbackFunction
        control.pendingUpstream = control.pendingUpstream ? control.pendingUpstream + 1 : 1
        if ('upstreamCount' in control) {
          control.upstreamCount += 1 // count changes we originated ourselves
          console.log('upstream count up to : ' + control.upstreamCount)
        }

        this.fire(doc.uri, query, (uri, success, body, response) => {
          response.elapsedTimeMs = Date.now() - startTime
          console.log('    UpdateManager: Return ' +
            (success ? 'success ' : 'FAILURE ') + response.status +
            ' elapsed ' + response.elapsedTimeMs + 'ms')
          if (success) {
            try {
              kb.remove(ds)
            } catch (e) {
              success = false
              body = 'Remote Ok BUT error deleting ' + ds.length + ' from store!!! ' + e
            } // Add in any case -- help recover from weirdness??
            for (let i = 0; i < is.length; i++) {
              kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
            }
          }

          callbackFunction(uri, success, body, response)
          control.pendingUpstream -= 1
          // When upstream patches have been sent, reload state if downstream waiting
          if (control.pendingUpstream === 0 && control.downstreamAction) {
            var downstreamAction = control.downstreamAction
            delete control.downstreamAction
            console.log('delayed downstream action:')
            downstreamAction(doc)
          }
        })
      } else if (protocol.indexOf('DAV') >= 0) {
        this.updateDav(doc, ds, is, callbackFunction)
      } else {
        if (protocol.indexOf('LOCALFILE') >= 0) {
          try {
            this.updateLocalFile(doc, ds, is, callbackFunction)
          } catch (e) {
            callbackFunction(doc.uri, false,
              'Exception trying to write back file <' + doc.uri + '>\n'
              // + tabulator.Util.stackString(e))
            )
          }
        } else {
          throw new Error("Unhandled edit method: '" + protocol + "' for " + doc)
        }
      }
    } catch (e) {
      callbackFunction(undefined, false, 'Exception in update: ' + e + '\n' +
        Util.stackString(e))
    }
  }

  updateDav (doc, ds, is, callbackFunction) {
    let kb = this.store
    // The code below is derived from Kenny's UpdateCenter.js
    var request = kb.any(doc, this.ns.link('request'))
    if (!request) {
      throw new Error('No record of our HTTP GET request for document: ' +
        doc)
    } // should not happen
    var response = kb.any(request, this.ns.link('response'))
    if (!response) {
      return null // throw "No record HTTP GET response for document: "+doc
    }
    var contentType = kb.the(response, this.ns.httph('content-type')).value

    // prepare contents of revised document
    let newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // copy!
    for (let i = 0; i < ds.length; i++) {
      Util.RDFArrayRemove(newSts, ds[i])
    }
    for (let i = 0; i < is.length; i++) {
      newSts.push(is[i])
    }

    const documentString = this.serialize(doc.uri, newSts, contentType)

    // Write the new version back
    var candidateTarget = kb.the(response, this.ns.httph('content-location'))
    var targetURI
    if (candidateTarget) {
      targetURI = uriJoin(candidateTarget.value, targetURI)
    }

    let options = {
      contentType,
      noMeta: true,
      body: documentString
    }

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

        callbackFunction(doc.uri, response.ok, response.responseText, response)
      })
      .catch(err => {
        callbackFunction(doc.uri, false, err.message, err)
      })
  }

  /**
   * Likely deprecated, since this lib no longer deals with browser extension
   *
   * @param doc
   * @param ds
   * @param is
   * @param callbackFunction
   */
  updateLocalFile (doc, ds, is, callbackFunction) {
    const kb = this.store
    console.log('Writing back to local file\n')
    // See http://simon-jung.blogspot.com/2007/10/firefox-extension-file-io.html
    // prepare contents of revised document
    let newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // copy!

    for (let i = 0; i < ds.length; i++) {
      Util.RDFArrayRemove(newSts, ds[ i ])
    }
    for (let i = 0; i < is.length; i++) {
      newSts.push(is[ i ])
    }
    // serialize to the appropriate format
    var dot = doc.uri.lastIndexOf('.')
    if (dot < 1) {
      throw new Error('Rewriting file: No filename extension: ' + doc.uri)
    }
    var ext = doc.uri.slice(dot + 1)

    let contentType = Fetcher.CONTENT_TYPE_BY_EXT[ ext ]
    if (!contentType) {
      throw new Error('File extension .' + ext + ' not supported for data write')
    }

    const documentString = this.serialize(doc.uri, newSts, contentType)

    // Write the new version back
    // create component for file writing
    console.log('Writing back: <<<' + documentString + '>>>')
    var filename = doc.uri.slice(7) // chop off   file://  leaving /path
    // console.log("Writeback: Filename: "+filename+"\n")
    var file = Components.classes[ '@mozilla.org/file/local;1' ]
      .createInstance(Components.interfaces.nsILocalFile)
    file.initWithPath(filename)
    if (!file.exists()) {
      throw new Error('Rewriting file <' + doc.uri +
        '> but it does not exist!')
    }
    // {
    // file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420)
    // }
    // create file output stream and use write/create/truncate mode
    // 0x02 writing, 0x08 create file, 0x20 truncate length if exist
    var stream = Components.classes[ '@mozilla.org/network/file-output-stream;1' ]
      .createInstance(Components.interfaces.nsIFileOutputStream)

    // Various JS systems object to 0666 in struct mode as dangerous
    stream.init(file, 0x02 | 0x08 | 0x20, parseInt('0666', 8), 0)

    // write data to file then close output stream
    stream.write(documentString, documentString.length)
    stream.close()

    for (let i = 0; i < ds.length; i++) {
      kb.remove(ds[ i ])
    }
    for (let i = 0; i < is.length; i++) {
      kb.add(is[ i ].subject, is[ i ].predicate, is[ i ].object, doc)
    }
    callbackFunction(doc.uri, true, '') // success!
  }

  /**
   * @param uri {string}
   * @param data {string|Array<Statement>}
   * @param contentType {string}
   *
   * @throws {Error} On unsupported content type
   *
   * @returns {string}
   */
  serialize (uri, data, contentType) {
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
   * This is suitable for an initial creation of a document
   *
   * @param doc {Node}
   * @param data {string|Array<Statement>}
   * @param contentType {string}
   * @param callbackFunction {Function}  callbackFunction(uri, ok, message, response)
   *
   * @throws {Error} On unsupported content type (via serialize())
   *
   * @returns {Promise}
   */
  put (doc, data, contentType, callbackFunction) {
    const kb = this.store
    let documentString

    return Promise.resolve()
      .then(() => {
        documentString = this.serialize(doc.uri, data, contentType)

        return kb.fetcher
          .webOperation('PUT', doc.uri, { contentType, body: documentString })
      })
      .then(response => {
        if (!response.ok) {
          return callbackFunction(doc.uri, response.ok, response.error, response)
        }

        delete kb.fetcher.nonexistent[doc.uri]
        delete kb.fetcher.requested[doc.uri] // @@ could this mess with the requested state machine? if a fetch is in progress

        if (typeof data !== 'string') {
          data.map((st) => {
            kb.addStatement(st)
          })
        }

        callbackFunction(doc.uri, response.ok, '', response)
      })
      .catch(err => {
        callbackFunction(doc.uri, false, err.message)
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
   * @param doc {NamedNode}
   * @param callbackFunction
   */
  reload (kb, doc, callbackFunction) {
    var startTime = Date.now()
    // force sets no-cache and
    const options = { force: true, noMeta: true, clearPreviousData: true }

    kb.fetcher.nowOrWhenFetched(doc.uri, options, function (ok, body, response) {
      if (!ok) {
        console.log('    ERROR reloading data: ' + body)
        callbackFunction(false, 'Error reloading data: ' + body, response)
      } else if (response.onErrorWasCalled || response.status !== 200) {
        console.log('    Non-HTTP error reloading data! onErrorWasCalled=' +
          response.onErrorWasCalled + ' status: ' + response.status)
        callbackFunction(false, 'Non-HTTP error reloading data: ' + body, response)
      } else {
        var elapsedTimeMs = Date.now() - startTime

        if (!doc.reloadTimeTotal) doc.reloadTimeTotal = 0
        if (!doc.reloadTimeCount) doc.reloadTimeCount = 0

        doc.reloadTimeTotal += elapsedTimeMs
        doc.reloadTimeCount += 1

        console.log('    Fetch took ' + elapsedTimeMs + 'ms, av. of ' +
          doc.reloadTimeCount + ' = ' +
          (doc.reloadTimeTotal / doc.reloadTimeCount) + 'ms.')

        callbackFunction(true)
      }
    })
  }
}
