// Joe Presbrey <presbrey@mit.edu>
// 2007-07-15
// 2010-08-08 TimBL folded in Kenny's WEBDAV
// 2010-12-07 TimBL addred local file write code
const docpart = require('./uri').docpart
const fetcher = require('./fetcher')
const graph = require('./data-factory').graph
const IndexedFormula = require('./indexed-formula')
const namedNode = require('./data-factory').namedNode
const Namespace = require('./namespace')
const Serializer = require('./serializer')
const uriJoin = require('./uri').join
const Util = require('./util')

var UpdateManager = (function () {
  var sparql = function (store) {
    this.store = store
    if (store.updater) {
      throw new Error("You can't have two UpdateManagers for the same store")
    }
    if (!store.fetcher) { // The store must also/already have a fetcher
      fetcher(store)
    }
    if (store.updater) {
      throw new Error("You can't have two UpdateManagers for the same store")
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

  sparql.prototype.patchControlFor = function (doc) {
    if (!this.patchControl[doc.uri]) {
      this.patchControl[doc.uri] = []
    }
    return this.patchControl[doc.uri]
  }

  // Returns The method string SPARQL or DAV or LOCALFILE or false if known, undefined if not known.
  //
  // Files have to have a specific annotaton that they are machine written, for safety.
  // We don't actually check for write access on files.
  //
  sparql.prototype.editable = function (uri, kb) {
    if (!uri) {
      return false // Eg subject is bnode, no known doc to write to
    }
    if (!kb) {
      kb = this.store
    }

    if (uri.slice(0, 8) === 'file:///') {
      if (kb.holds(
          kb.sym(uri),
          namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          namedNode('http://www.w3.org/2007/ont/link#MachineEditableDocument')
        )) {
        return 'LOCALFILE'
      }

      var sts = kb.statementsMatching(kb.sym(uri), undefined, undefined)

      console.log('sparql.editable: Not MachineEditableDocument file ' +
        uri + '\n')
      console.log(sts.map(function (x) {
        return x.toNT()
      }).join('\n'))
      return false
    // @@ Would be nifty of course to see whether we actually have write acess first.
    }

    var request
    var definitive = false
    var requests = kb.each(undefined, this.ns.link('requestedURI'),
      docpart(uri))

    // Hack for the moment @@@@ 2016-02-12
    if (kb.holds(namedNode(uri), this.ns.rdf('type'), this.ns.ldp('Resource'))) {
      return 'SPARQL'
    }
    var i
    var method
    for (var r = 0; r < requests.length; r++) {
      request = requests[r]
      if (request !== undefined) {
        var response = kb.any(request, this.ns.link('response'))
        if (request !== undefined) {
          var acceptPatch = kb.each(response, this.ns.httph('accept-patch'))
          if (acceptPatch.length) {
            for (i = 0; i < acceptPatch.length; i++) {
              method = acceptPatch[i].value.trim()
              if (method.indexOf('application/sparql-update') >= 0) return 'SPARQL'
            }
          }
          var author_via = kb.each(response, this.ns.httph('ms-author-via'))
          if (author_via.length) {
            for (i = 0; i < author_via.length; i++) {
              method = author_via[i].value.trim()
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
            for (i = 0; i < status.length; i++) {
              if (status[i] === 200 || status[i] === 404) {
                definitive = true
              // return false // A definitive answer
              }
            }
          }
        } else {
          console.log('sparql.editable: No response for ' + uri + '\n')
        }
      }
    }
    if (requests.length === 0) {
      console.log('sparql.editable: No request for ' + uri + '\n')
    } else {
      if (definitive) {
        return false // We have got a request and it did NOT say editable => not editable
      }
    }
    console.log('sparql.editable: inconclusive for ' + uri + '\n')
    return undefined // We don't know (yet) as we haven't had a response (yet)
  }

  // /////////  The identification of bnodes

  sparql.prototype.anonymize = function (obj) {
    return (obj.toNT().substr(0, 2) === '_:' && this._mentioned(obj))
      ? '?' + obj.toNT().substr(2)
      : obj.toNT()
  }

  sparql.prototype.anonymizeNT = function (stmt) {
    return this.anonymize(stmt.subject) + ' ' +
    this.anonymize(stmt.predicate) + ' ' +
    this.anonymize(stmt.object) + ' .'
  }

  // A list of all bnodes occuring in a statement
  sparql.prototype._statement_bnodes = function (st) {
    return [st.subject, st.predicate, st.object].filter(function (x) {
      return x.isBlank
    })
  }

  // A list of all bnodes occuring in a list of statements
  sparql.prototype._statement_array_bnodes = function (sts) {
    var bnodes = []
    for (var i = 0; i < sts.length; i++) {
      bnodes = bnodes.concat(this._statement_bnodes(sts[i]))
    }
    bnodes.sort() // in place sort - result may have duplicates
    var bnodes2 = []
    for (var j = 0; j < bnodes.length; j++) {
      if (j === 0 || !bnodes[j].sameTerm(bnodes[j - 1])) {
        bnodes2.push(bnodes[j])
      }
    }
    return bnodes2
  }

  sparql.prototype._cache_ifps = function () {
    // Make a cached list of [Inverse-]Functional properties
    // Call this once before calling context_statements
    this.ifps = {}
    var a = this.store.each(undefined, this.ns.rdf('type'), this.ns.owl('InverseFunctionalProperty'))
    for (var i = 0; i < a.length; i++) {
      this.ifps[a[i].uri] = true
    }
    this.fps = {}
    a = this.store.each(undefined, this.ns.rdf('type'), this.ns.owl('FunctionalProperty'))
    for (i = 0; i < a.length; i++) {
      this.fps[a[i].uri] = true
    }
  }

  // Returns a context to bind a given node, up to a given depth
  sparql.prototype._bnode_context2 = function (x, source, depth) {
    // Return a list of statements which indirectly identify a node
    //  Depth > 1 if try further indirection.
    //  Return array of statements (possibly empty), or null if failure
    var sts = this.store.statementsMatching(undefined, undefined, x, source) // incoming links
    var y
    var res
    for (var i = 0; i < sts.length; i++) {
      if (this.fps[sts[i].predicate.uri]) {
        y = sts[i].subject
        if (!y.isBlank) {
          return [ sts[i] ]
        }
        if (depth) {
          res = this._bnode_context2(y, source, depth - 1)
          if (res) {
            return res.concat([ sts[i] ])
          }
        }
      }
    }
    // outgoing links
    sts = this.store.statementsMatching(x, undefined, undefined, source)
    for (i = 0; i < sts.length; i++) {
      if (this.ifps[sts[i].predicate.uri]) {
        y = sts[i].object
        if (!y.isBlank) {
          return [ sts[i] ]
        }
        if (depth) {
          res = this._bnode_context2(y, source, depth - 1)
          if (res) {
            return res.concat([ sts[i] ])
          }
        }
      }
    }
    return null // Failure
  }

  // Returns the smallest context to bind a given single bnode
  sparql.prototype._bnode_context_1 = function (x, source) {
    // Return a list of statements which indirectly identify a node
    //   Breadth-first
    for (var depth = 0; depth < 3; depth++) { // Try simple first
      var con = this._bnode_context2(x, source, depth)
      if (con !== null) return con
    }
    throw new Error('Unable to uniquely identify bnode: ' + x.toNT())
  }

  sparql.prototype._mentioned = function (x) {
    return (this.store.statementsMatching(x).length !== 0) || // Don't pin fresh bnodes
    (this.store.statementsMatching(undefined, x).length !== 0) ||
    (this.store.statementsMatching(undefined, undefined, x).length !== 0)
  }

  sparql.prototype._bnode_context = function (bnodes, doc) {
    var context = []
    if (bnodes.length) {
      this._cache_ifps()
      for (var i = 0; i < bnodes.length; i++) { // Does this occur in old graph?
        var bnode = bnodes[i]
        if (!this._mentioned(bnode)) continue
        context = context.concat(this._bnode_context_1(bnode, doc))
      }
    }
    return context
  }

  /*  Weird code does not make sense -- some code corruption along the line -- st undefined -- weird
      sparql.prototype._bnode_context = function(bnodes) {
          var context = []
          if (bnodes.length) {
              if (this.store.statementsMatching(st.subject.isBlank?undefined:st.subject,
                                        st.predicate.isBlank?undefined:st.predicate,
                                        st.object.isBlank?undefined:st.object,
                                        st.why).length <= 1) {
                  context = context.concat(st)
              } else {
                  this._cache_ifps()
                  for (x in bnodes) {
                      context = context.concat(this._bnode_context_1(bnodes[x], st.why))
                  }
              }
          }
          return context
      }
  */
  // Returns the best context for a single statement
  sparql.prototype._statement_context = function (st) {
    var bnodes = this._statement_bnodes(st)
    return this._bnode_context(bnodes, st.why)
  }

  sparql.prototype._context_where = function (context) {
    var sparql = this
    return (!context || context.length === 0)
      ? ''
      : 'WHERE { ' +
      context.map(function (x) {
        return sparql.anonymizeNT(x)
      }).join('\n') + ' }\n'
  }

  sparql.prototype._fire = function (uri, query, callback) {
    if (!uri) {
      throw new Error('No URI given for remote editing operation: ' + query)
    }
    console.log('sparql: sending update to <' + uri + '>')
    var xhr = Util.XMLHTTPFactory()
    xhr.options = {}

    xhr.onreadystatechange = function () {
      // dump("SPARQL update ready state for <"+uri+"> readyState="+xhr.readyState+"\n"+query+"\n")
      if (xhr.readyState === 4) {
        var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
        if (!success) {
          console.log('sparql: update failed for <' + uri + '> status=' +
            xhr.status + ', ' + xhr.statusText + ', body length=' + xhr.responseText.length + '\n   for query: ' + query)
        } else {
          console.log('sparql: update Ok for <' + uri + '>')
        }
        callback(uri, success, xhr.responseText, xhr)
      }
    }

    xhr.open('PATCH', uri, true) // async=true
    xhr.setRequestHeader('Content-type', 'application/sparql-update')
    xhr.send(query)
  }

  // This does NOT update the statement.
  // It returns an object whcih includes
  //  function which can be used to change the object of the statement.
  //
  sparql.prototype.update_statement = function (statement) {
    if (statement && !statement.why) {
      return
    }
    var sparql = this
    var context = this._statement_context(statement)

    return {
      statement: statement ? [statement.subject, statement.predicate, statement.object, statement.why] : undefined,
      statementNT: statement ? this.anonymizeNT(statement) : undefined,
      where: sparql._context_where(context),

      set_object: function (obj, callback) {
        var query = this.where
        query += 'DELETE DATA { ' + this.statementNT + ' } ;\n'
        query += 'INSERT DATA { ' +
          this.anonymize(this.statement[0]) + ' ' +
          this.anonymize(this.statement[1]) + ' ' +
          this.anonymize(obj) + ' ' + ' . }\n'

        sparql._fire(this.statement[3].uri, query, callback)
      }
    }
  }

  sparql.prototype.insert_statement = function (st, callback) {
    var st0 = st instanceof Array ? st[0] : st
    var query = this._context_where(this._statement_context(st0))

    if (st instanceof Array) {
      var stText = ''
      for (var i = 0; i < st.length; i++) stText += st[i] + '\n'
      query += 'INSERT DATA { ' + stText + ' }\n'
    } else {
      query += 'INSERT DATA { ' +
        this.anonymize(st.subject) + ' ' +
        this.anonymize(st.predicate) + ' ' +
        this.anonymize(st.object) + ' ' + ' . }\n'
    }

    this._fire(st0.why.uri, query, callback)
  }

  sparql.prototype.delete_statement = function (st, callback) {
    var st0 = st instanceof Array ? st[0] : st
    var query = this._context_where(this._statement_context(st0))

    if (st instanceof Array) {
      var stText = ''
      for (var i = 0; i < st.length; i++) stText += st[i] + '\n'
      query += 'DELETE DATA { ' + stText + ' }\n'
    } else {
      query += 'DELETE DATA { ' +
        this.anonymize(st.subject) + ' ' +
        this.anonymize(st.predicate) + ' ' +
        this.anonymize(st.object) + ' ' + ' . }\n'
    }

    this._fire(st0.why.uri, query, callback)
  }

  //  Request a now or future action to refresh changes coming downstream
  //
  // This is designed to allow the system to re-request the server version,
  // when a websocket has pinged to say there are changes.
  // If thewebsocket, by contrast, has sent a patch, then this may not be necessary.
  // This may be called out of context so *this* cannot be used.

  sparql.prototype.requestDownstreamAction = function (doc, action) {
    var control = this.patchControlFor(doc)
    if (!control.pendingUpstream) {
      action(doc)
    } else {
      if (control.downstreamAction) {
        if (control.downstreamAction === action) {
          return this
        } else {
          throw new Error("Can't wait for > 1 differnt downstream actions")
        }
      } else {
        control.downstreamAction = action
      }
    }
  }

  // We want to start counting websockt notifications
  // to distinguish the ones from others from our own.
  sparql.prototype.clearUpstreamCount = function (doc) {
    var control = this.patchControlFor(doc)
    control.upstreamCount = 0
  }

  sparql.prototype.getUpdatesVia = function (doc) {
    var linkHeaders = this.store.fetcher.getHeader(doc, 'updates-via')
    if (!linkHeaders || !linkHeaders.length) return null
    return linkHeaders[0].trim()
  }

  sparql.prototype.addDownstreamChangeListener = function (doc, listener) {
    var control = this.patchControlFor(doc)
    if (!control.downstreamChangeListeners) control.downstreamChangeListeners = []
    control.downstreamChangeListeners.push(listener)
    var self = this
    this.setRefreshHandler(doc, function(doc){ // a function not a method
      self.reloadAndSync(doc)
    })
  }

  sparql.prototype.reloadAndSync = function (doc) {
    var control = this.patchControlFor(doc)
    var updater = this

    if (control.reloading) {
      console.log('   Already reloading - stop')
      return // once only needed
    }
    control.reloading = true
    var retryTimeout = 1000 // ms
    var tryReload = function () {
      console.log('try reload - timeout = ' + retryTimeout)
      updater.reload(updater.store, doc, function (ok, message, xhr) {
        control.reloading = false
        if (ok) {
          if (control.downstreamChangeListeners) {
            for (var i = 0; i < control.downstreamChangeListeners.length; i++) {
              console.log('        Calling downstream listener ' + i)
              control.downstreamChangeListeners[i]()
            }
          }
        } else {
          if (xhr.status === 0) {
            console.log('Network error refreshing the data. Retrying in ' +
              retryTimeout / 1000)
            control.reloading = true
            retryTimeout = retryTimeout * 2
            setTimeout(tryReload, retryTimeout)
          } else {
            console.log('Error ' + xhr.status + 'refreshing the data:' +
              message + '. Stopped' + doc)
          }
        }
      })
    }
    tryReload()
  }

  // Set up websocket to listen on
  //
  // There is coordination between upstream changes and downstream ones
  // so that a reload is not done in the middle of an upsteeam patch.
  // If you usie this API then you get called when a change happens, and you
  // have to reload the file yourself, and then refresh the UI.
  // Alternative is addDownstreamChangeListener(), where you do not
  // have to do the reload yourslf. Do mot mix them.
  //
  //  kb contains the HTTP  metadata from prefvious operations
  //
  sparql.prototype.setRefreshHandler = function (doc, handler) {
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

      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      //
      // 1000	CLOSE_NORMAL	Normal closure; the connection successfully completed whatever purpose for which it was created.
      // 1001	CLOSE_GOING_AWAY	The endpoint is going away, either
      //                                  because of a server failure or because the browser is navigating away from the page that opened the connection.
      // 1002	CLOSE_PROTOCOL_ERROR	The endpoint is terminating the connection due to a protocol error.
      // 1003	CLOSE_UNSUPPORTED	The connection is being terminated because the endpoint
      //                                  received data of a type it cannot accept (for example, a text-only endpoint received binary data).
      // 1004                             Reserved. A meaning might be defined in the future.
      // 1005	CLOSE_NO_STATUS	Reserved.  Indicates that no status code was provided even though one was expected.
      // 1006	CLOSE_ABNORMAL	Reserved. Used to indicate that a connection was closed abnormally (
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
          if (control.upstreamCount) {
            control.upstreamCount -= 1
            if (control.upstreamCount >= 0) {
              console.log('just an echo')
              return // Just an echo
            }
          }
          control.upstreamCount = 0
          console.log('Assume a real downstream change')
          self.requestDownstreamAction(doc, theHandler)
        }
      }
    } // openWebsocket
    openWebsocket()

    return true
  }

  // This high-level function updates the local store iff the web is changed successfully.
  //
  //  - deletions, insertions may be undefined or single statements or lists or formulae.
  //
  //  - callback is called as callback(uri, success, errorbody)
  //
  sparql.prototype.update = function (deletions, insertions, callback) {
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
        return callback(null, true) // success -- nothing needed to be done.
      }
      var doc = ds.length ? ds[0].why : is[0].why
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
      if (!protocol) {
        throw new Error("Can't make changes in uneditable " + doc)
      }
      var i
      var newSts
      var documentString
      var sz
      if (protocol.indexOf('SPARQL') >= 0) {
        var bnodes = []
        if (ds.length) bnodes = this._statement_array_bnodes(ds)
        if (is.length) bnodes = bnodes.concat(this._statement_array_bnodes(is))
        var context = this._bnode_context(bnodes, doc)
        var whereClause = this._context_where(context)
        var query = ''
        if (whereClause.length) { // Is there a WHERE clause?
          if (ds.length) {
            query += 'DELETE { '
            for (i = 0; i < ds.length; i++) {
              query += this.anonymizeNT(ds[i]) + '\n'
            }
            query += ' }\n'
          }
          if (is.length) {
            query += 'INSERT { '
            for (i = 0; i < is.length; i++) {
              query += this.anonymizeNT(is[i]) + '\n'
            }
            query += ' }\n'
          }
          query += whereClause
        } else { // no where clause
          if (ds.length) {
            query += 'DELETE DATA { '
            for (i = 0; i < ds.length; i++) {
              query += this.anonymizeNT(ds[i]) + '\n'
            }
            query += ' } \n'
          }
          if (is.length) {
            if (ds.length) query += ' ; '
            query += 'INSERT DATA { '
            for (i = 0; i < is.length; i++) {
              query += this.anonymizeNT(is[i]) + '\n'
            }
            query += ' }\n'
          }
        }
        // Track pending upstream patches until they have fnished their callback
        control.pendingUpstream = control.pendingUpstream ? control.pendingUpstream + 1 : 1
        if (typeof control.upstreamCount !== 'undefined') {
          control.upstreamCount += 1 // count changes we originated ourselves
        }

        this._fire(doc.uri, query,
          function (uri, success, body, xhr) {
            xhr.elapsedTime_ms = Date.now() - startTime
            console.log('    sparql: Return ' + (success ? 'success' : 'FAILURE ' + xhr.status) +
              ' elapsed ' + xhr.elapsedTime_ms + 'ms')
            if (success) {
              try {
                kb.remove(ds)
              } catch (e) {
                success = false
                body = 'Remote Ok BUT error deleting ' + ds.length + ' from store!!! ' + e
              } // Add in any case -- help recover from weirdness??
              for (var i = 0; i < is.length; i++) {
                kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
              }
            }

            callback(uri, success, body, xhr)
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
        // The code below is derived from Kenny's UpdateCenter.js
        documentString
        var request = kb.any(doc, this.ns.link('request'))
        if (!request) {
          throw new Error('No record of our HTTP GET request for document: ' +
            doc)
        } // should not happen
        var response = kb.any(request, this.ns.link('response'))
        if (!response) {
          return null // throw "No record HTTP GET response for document: "+doc
        }
        var content_type = kb.the(response, this.ns.httph('content-type')).value

        // prepare contents of revised document
        newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // copy!
        for (i = 0; i < ds.length; i++) {
          Util.RDFArrayRemove(newSts, ds[i])
        }
        for (i = 0; i < is.length; i++) {
          newSts.push(is[i])
        }

        // serialize to te appropriate format
        sz = Serializer(kb)
        sz.suggestNamespaces(kb.namespaces)
        sz.setBase(doc.uri) // ?? beware of this - kenny (why? tim)
        switch (content_type) {
          case 'application/rdf+xml':
            documentString = sz.statementsToXML(newSts)
            break
          case 'text/n3':
          case 'text/turtle':
          case 'application/x-turtle': // Legacy
          case 'application/n3': // Legacy
            documentString = sz.statementsToN3(newSts)
            break
          default:
            throw new Error('Content-type ' + content_type + ' not supported for data write')
        }

        // Write the new version back

        var candidateTarget = kb.the(response, this.ns.httph('content-location'))
        var targetURI
        if (candidateTarget) {
          targetURI = uriJoin(candidateTarget.value, targetURI)
        }
        var xhr = Util.XMLHTTPFactory()
        xhr.options = {}
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            // formula from sparqlUpdate.js, what about redirects?
            var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
            if (success) {
              for (var i = 0; i < ds.length; i++) {
                kb.remove(ds[i])
              }
              for (i = 0; i < is.length; i++) {
                kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
              }
            }
            callback(doc.uri, success, xhr.responseText)
          }
        }
        xhr.open('PUT', targetURI, true)
        // assume the server does PUT content-negotiation.
        xhr.setRequestHeader('Content-type', content_type) // OK?
        xhr.send(documentString)
      } else {
        if (protocol.indexOf('LOCALFILE') >= 0) {
          try {
            console.log('Writing back to local file\n')
            // See http://simon-jung.blogspot.com/2007/10/firefox-extension-file-io.html
            // prepare contents of revised document
            newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // copy!
            for (i = 0; i < ds.length; i++) {
              Util.RDFArrayRemove(newSts, ds[i])
            }
            for (i = 0; i < is.length; i++) {
              newSts.push(is[i])
            }
            // serialize to the appropriate format
            documentString
            sz = Serializer(kb)
            sz.suggestNamespaces(kb.namespaces)
            sz.setBase(doc.uri) // ?? beware of this - kenny (why? tim)
            var dot = doc.uri.lastIndexOf('.')
            if (dot < 1) {
              throw new Error('Rewriting file: No filename extension: ' + doc.uri)
            }
            var ext = doc.uri.slice(dot + 1)
            switch (ext) {
              case 'rdf':
              case 'owl': // Just my experence   ...@@ we should keep the format in which it was parsed
              case 'xml':
                documentString = sz.statementsToXML(newSts)
                break
              case 'n3':
              case 'nt':
              case 'ttl':
                documentString = sz.statementsToN3(newSts)
                break
              default:
                throw new Error('File extension .' + ext + ' not supported for data write')
            }
            // Write the new version back
            // create component for file writing
            console.log('Writing back: <<<' + documentString + '>>>')
            var filename = doc.uri.slice(7) // chop off   file://  leaving /path
            // console.log("Writeback: Filename: "+filename+"\n")
            var file = Components.classes['@mozilla.org/file/local;1']
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
            var stream = Components.classes['@mozilla.org/network/file-output-stream;1']
              .createInstance(Components.interfaces.nsIFileOutputStream)

            // Various JS systems object to 0666 in struct mode as dangerous
            stream.init(file, 0x02 | 0x08 | 0x20, parseInt('0666', 8), 0)

            // write data to file then close output stream
            stream.write(documentString, documentString.length)
            stream.close()

            for (i = 0; i < ds.length; i++) {
              kb.remove(ds[i])
            }
            for (i = 0; i < is.length; i++) {
              kb.add(is[i].subject, is[i].predicate, is[i].object, doc)
            }
            callback(doc.uri, true, '') // success!
          } catch (e) {
            callback(doc.uri, false,
              'Exception trying to write back file <' + doc.uri + '>\n'
            // + tabulator.Util.stackString(e))
            )
          }
        } else {
          throw new Error("Unhandled edit method: '" + protocol + "' for " + doc)
        }
      }
    } catch (e) {
      callback(undefined, false, 'Exception in update: ' + e)
    }
  } // wnd update

  // This suitable for an inital creation of a document
  //
  // data:    string, or array of statements
  //
  sparql.prototype.put = function (doc, data, content_type, callback) {
    var documentString
    var kb = this.store

    if (typeof data === typeof '') {
      documentString = data
    } else {
      // serialize to te appropriate format
      var sz = Serializer(kb)
      sz.suggestNamespaces(kb.namespaces)
      sz.setBase(doc.uri)
      switch (content_type) {
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
          throw new Error('Content-type ' + content_type +
            ' not supported for data PUT')
      }
    }
    var xhr = Util.XMLHTTPFactory()
    xhr.options = {}
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        // formula from sparqlUpdate.js, what about redirects?
        var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
        if (success && typeof data !== 'string') {
          data.map(function (st) {
            kb.addStatement(st)
          })
        // kb.fetcher.requested[doc.uri] = true // as though fetched
        }
        if (success) {
          delete kb.fetcher.nonexistant[doc.uri]
          delete kb.fetcher.requested[doc.uri]
        // @@ later we can fake it has been requestd if put gives us the header sand we save them.
        }
        callback(doc.uri, success, xhr.responseText, xhr)
      }
    }
    xhr.open('PUT', doc.uri, true)
    xhr.setRequestHeader('Content-type', content_type)
    xhr.send(documentString)
  }

  // Reload a document.
  //
  // Fast and cheap, no metaata
  // Measure times for the document
  // Load it provisionally
  // Don't delete the statemenst before the load, or it will leave a broken document
  // in the meantime.

  sparql.prototype.reload = function (kb, doc, callback) {
    var startTime = Date.now()
    // force sets no-cache and
    kb.fetcher.nowOrWhenFetched(doc.uri, {force: true, noMeta: true, clearPreviousData: true}, function (ok, body, xhr) {
      if (!ok) {
        console.log('    ERROR reloading data: ' + body)
        callback(false, 'Error reloading data: ' + body, xhr)
      } else if (xhr.onErrorWasCalled || xhr.status !== 200) {
        console.log('    Non-HTTP error reloading data! onErrorWasCalled=' +
          xhr.onErrorWasCalled + ' status: ' + xhr.status)
        callback(false, 'Non-HTTP error reloading data: ' + body, xhr)
      } else {
        var elapsedTime_ms = Date.now() - startTime
        if (!doc.reloadTime_total) doc.reloadTime_total = 0
        if (!doc.reloadTime_count) doc.reloadTime_count = 0
        doc.reloadTime_total += elapsedTime_ms
        doc.reloadTime_count += 1
        console.log('    Fetch took ' + elapsedTime_ms + 'ms, av. of ' +
          doc.reloadTime_count + ' = ' +
          (doc.reloadTime_total / doc.reloadTime_count) + 'ms.')
        callback(true)
      }
    })
  }

  sparql.prototype.oldReload = function (kb, doc, callback) {
    var g2 = graph() // A separate store to hold the data as we load it
    var f2 = fetcher(g2)
    var startTime = Date.now()
    // force sets no-cache and
    f2.nowOrWhenFetched(doc.uri, {force: true, noMeta: true, clearPreviousData: true}, function (ok, body, xhr) {
      if (!ok) {
        console.log('    ERROR reloading data: ' + body)
        callback(false, 'Error reloading data: ' + body, xhr)
      } else if (xhr.onErrorWasCalled || xhr.status !== 200) {
        console.log('    Non-HTTP error reloading data! onErrorWasCalled=' +
          xhr.onErrorWasCalled + ' status: ' + xhr.status)
        callback(false, 'Non-HTTP error reloading data: ' + body, xhr)
      } else {
        var sts1 = kb.statementsMatching(undefined, undefined, undefined, doc).slice() // Take a copy!!
        var sts2 = g2.statementsMatching(undefined, undefined, undefined, doc).slice()
        console.log('    replacing ' + sts1.length + ' with ' + sts2.length +
          ' out of total statements ' + kb.statements.length)
        kb.remove(sts1)
        kb.add(sts2)
        var elapsedTime_ms = Date.now() - startTime
        if (sts2.length === 0) {
          console.log('????????????????? 0000000')
        }
        if (!doc.reloadTime_total) doc.reloadTime_total = 0
        if (!doc.reloadTime_count) doc.reloadTime_count = 0
        doc.reloadTime_total += elapsedTime_ms
        doc.reloadTime_count += 1
        console.log('    fetch took ' + elapsedTime_ms + 'ms, av. of ' + doc.reloadTime_count + ' = ' +
          (doc.reloadTime_total / doc.reloadTime_count) + 'ms.')
        callback(true)
      }
    })
  }
  return sparql
})()

module.exports = UpdateManager
