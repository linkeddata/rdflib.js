import { isNamedNode } from './utils/terms'

const log = require('./log')
const N3Parser = require('./n3parser')
const Namespace = require('./namespace')
const rdfParse = require('./parse')
const parseRDFaDOM = require('./rdfaparser').parseRDFaDOM
const RDFParser = require('./rdfxmlparser')
const Uri = require('./uri')
const Util = require('./util')

var ns = {} // Convenience namespaces needed in this module:
// These are deliberately not exported as the user application should
// make its own list and not rely on the prefixes used here,
// and not be tempted to add to them, and then clash with those of another
// application.
ns.link = Namespace('http://www.w3.org/2007/ont/link#')
ns.http = Namespace('http://www.w3.org/2007/ont/http#')
ns.httph = Namespace('http://www.w3.org/2007/ont/httph#')
ns.rdf = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
ns.rdfs = Namespace('http://www.w3.org/2000/01/rdf-schema#')
ns.dc = Namespace('http://purl.org/dc/elements/1.1/')

var Parsable = {
  'text/n3': true,
  'text/turtle': true,
  'application/rdf+xml': true,
  'application/xhtml+xml': true,
  'text/html': true,
  'application/ld+json': true
}

class RDFXMLHandler {
  constructor (fetcher, args) {
    this.fetcher = fetcher
    if (args) {
      this.dom = args[0]
    }
  }
  handlerFactory (xhr) {
    var fetcher = this.fetcher
    xhr.handle = function handle (callback) {
      // sf.addStatus(xhr.req, 'parsing soon as RDF/XML...')
      var kb = fetcher.store
      if (!this.dom) this.dom = Util.parseXML(xhr.responseText)
      var root = this.dom.documentElement
      // @@ Mozilla only See issue/issue110
      if (root.nodeName === 'parsererror') {
        // have to fail the request
        fetcher.failFetch(xhr, 'Badly formed XML in ' + xhr.resource.uri)
        // @@ Add details
        throw new Error('Badly formed XML in ' + xhr.resource.uri)
      }
      var parser = new RDFParser(kb)
      try {
        parser.parse(this.dom, xhr.original.uri, xhr.original)
      } catch (e) {
        fetcher.addStatus(xhr.req, 'Syntax error parsing RDF/XML! ' + e)
        console.log('Syntax error parsing RDF/XML! ' + e)
      }
      if (!xhr.options.noMeta) {
        kb.add(xhr.original, ns.rdf('type'), ns.link('RDFDocument'),
          fetcher.appNode)
      }
      callback()
    }
  }
  static toString () {
    return 'RDFXMLHandler'
  }
  static register (fetcher) {
    fetcher.mediatypes['application/rdf+xml'] = {}
  }
}
RDFXMLHandler.pattern = new RegExp('application/rdf\\+xml')

class XHTMLHandler {
  constructor (fetcher, args) {
    this.fetcher = fetcher
    if (args) {
      this.dom = args[0]
    }
  }
  handlerFactory (xhr) {
    var fetcher = this.fetcher
    xhr.handle = function handle (callback) {
      var relation, reverse
      if (!this.dom) {
        this.dom = Util.parseXML(xhr.responseText)
      }
      var kb = fetcher.store
      // dc:title
      var title = this.dom.getElementsByTagName('title')
      if (title.length > 0) {
        kb.add(xhr.resource, ns.dc('title'), kb.literal(title[0].textContent), xhr.resource)
      // log.info("Inferring title of " + xhr.resource)
      }
      // link rel
      var links = this.dom.getElementsByTagName('link')
      for (var x = links.length - 1; x >= 0; x--) { // @@ rev
        relation = links[x].getAttribute('rel')
        reverse = false
        if (!relation) {
          relation = links[x].getAttribute('rev')
          reverse = true
        }
        if (relation) {
          fetcher.linkData(xhr, relation,
            links[x].getAttribute('href'), xhr.resource, reverse)
        }
      }
      // Data Islands
      var scripts = this.dom.getElementsByTagName('script')
      for (var i = 0; i < scripts.length; i++) {
        var contentType = scripts[i].getAttribute('type')
        if (Parsable[contentType]) {
          rdfParse(scripts[i].textContent, kb, xhr.original.uri, contentType)
        }
      }
      if (!xhr.options.noMeta) {
        kb.add(xhr.resource, ns.rdf('type'), ns.link('WebPage'),
          fetcher.appNode)
      }
      if (!xhr.options.noRDFa && parseRDFaDOM) { // enable by default
        try {
          parseRDFaDOM(this.dom, kb, xhr.original.uri)
        } catch (e) {
          var msg = ('Error trying to parse ' + xhr.resource + ' as RDFa:\n' + e + ':\n' + e.stack)
          // dump(msg+"\n")
          fetcher.failFetch(xhr, msg)
          return
        }
      }
      callback() // Fire done callbacks
    }
  }
  static toString () {
    return 'XHTMLHandler'
  }
  static register (fetcher) {
    fetcher.mediatypes['application/xhtml+xml'] = {}
  }
}
XHTMLHandler.pattern = new RegExp('application/xhtml')

class XMLHandler {
  constructor (fetcher) {
    this.fetcher = fetcher
  }
  handlerFactory (xhr) {
    var fetcher = this.fetcher
    xhr.handle = function (callback) {
      var dom = Util.parseXML(xhr.responseText)
      // XML Semantics defined by root element namespace
      // figure out the root element
      for (var c = 0; c < dom.childNodes.length; c++) {
        // is this node an element?
        if (dom.childNodes[c].nodeType === 1) {
          // We've found the first element, it's the root
          var ns = dom.childNodes[c].namespaceURI
          // Is it RDF/XML?
          if (ns && ns === ns['rdf']) {
            fetcher.addStatus(xhr.req,
              'Has XML root element in the RDF namespace, so assume RDF/XML.')
            fetcher.switchHandler('RDFXMLHandler', xhr, callback, [dom])
            return
          }
          // it isn't RDF/XML or we can't tell
          // Are there any GRDDL transforms for this namespace?
          // @@ assumes ns documents have already been loaded
          /*
          var xforms = kb.each(kb.sym(ns), kb.sym("http://www.w3.org/2003/g/data-view#namespaceTransformation"))
          for (var i = 0; i < xforms.length; i++) {
              var xform = xforms[i]
              // log.info(xhr.resource.uri + " namespace " + ns + " has GRDDL ns transform" + xform.uri)
               Fetcher.doGRDDL(kb, xhr.resource, xform.uri, xhr.resource.uri)
          }
          */
          break
        }
      }
      // Or it could be XHTML?
      // Maybe it has an XHTML DOCTYPE?
      if (dom.doctype) {
        // log.info("We found a DOCTYPE in " + xhr.resource)
        if (dom.doctype.name === 'html' && dom.doctype.publicId.match(/^-\/\/W3C\/\/DTD XHTML/) && dom.doctype.systemId.match(/http:\/\/www.w3.org\/TR\/xhtml/)) {
          fetcher.addStatus(xhr.req,
            'Has XHTML DOCTYPE. Switching to XHTML Handler.\n')
          fetcher.switchHandler('XHTMLHandler', xhr, callback)
          return
        }
      }
      // Or what about an XHTML namespace?
      var html = dom.getElementsByTagName('html')[0]
      if (html) {
        var xmlns = html.getAttribute('xmlns')
        if (xmlns && xmlns.match(/^http:\/\/www.w3.org\/1999\/xhtml/)) {
          fetcher.addStatus(xhr.req,
            'Has a default namespace for XHTML. Switching to XHTMLHandler.\n')
          fetcher.switchHandler('XHTMLHandler', xhr, callback)
          return
        }
      }
      // At this point we should check the namespace document (cache it!) and
      // look for a GRDDL transform
      // @@  Get namespace document <n>, parse it, look for  <n> grddl:namespaceTransform ?y
      // Apply ?y to   dom
      // We give up. What dialect is this?
      fetcher.failFetch(xhr,
        'Unsupported dialect of XML: not RDF or XHTML namespace, etc.\n' +
        xhr.responseText.slice(0, 80))
    }
  }
  static register (fetcher) {
    fetcher.mediatypes['text/xml'] = {
      'q': 0.2
    }
    fetcher.mediatypes['application/xml'] = {
      'q': 0.2
    }
  }
  static toString () {
    return 'XMLHandler'
  }
}
XMLHandler.pattern = new RegExp('(text|application)/(.*)xml')

class HTMLHandler {
  constructor (fetcher) {
    this.fetcher = fetcher
  }
  handlerFactory (xhr) {
    var fetcher = this.fetcher
    xhr.handle = function (callback) {
      var rt = xhr.responseText
      // We only handle XHTML so we have to figure out if this is XML
      // log.info("Sniffing HTML " + xhr.resource + " for XHTML.")
      if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
        fetcher.addStatus(xhr.req, "Has an XML declaration. We'll assume " +
          "it's XHTML as the content-type was text/html.\n")
        fetcher.switchHandler('XHTMLHandler', xhr, callback)
        return
      }
      // DOCTYPE
      // There is probably a smarter way to do this
      if (rt.match(/.*<!DOCTYPE\s+html[^<]+-\/\/W3C\/\/DTD XHTML[^<]+http:\/\/www.w3.org\/TR\/xhtml[^<]+>/)) {
        fetcher.addStatus(xhr.req,
          'Has XHTML DOCTYPE. Switching to XHTMLHandler.\n')
        fetcher.switchHandler('XHTMLHandler', xhr, callback)
        return
      }
      // xmlns
      if (rt.match(/[^(<html)]*<html\s+[^<]*xmlns=['"]http:\/\/www.w3.org\/1999\/xhtml["'][^<]*>/)) {
        fetcher.addStatus(xhr.req,
          'Has default namespace for XHTML, so switching to XHTMLHandler.\n')
        fetcher.switchHandler('XHTMLHandler', xhr, callback)
        return
      }
      // dc:title	                       //no need to escape '/' here
      var titleMatch = (new RegExp('<title>([\\s\\S]+?)</title>', 'im')).exec(rt)
      if (titleMatch) {
        var kb = fetcher.store
        kb.add(
          xhr.resource,
          ns.dc('title'),
          kb.literal(titleMatch[1]),
          xhr.resource
        ) // think about xml:lang later
        kb.add(xhr.resource, ns.rdf('type'), ns.link('WebPage'),
          fetcher.appNode)
        callback() // doneFetch, not failed
        return
      }
      fetcher.addStatus(xhr.req, 'non-XML HTML document, not parsed for data.')
      fetcher.doneFetch(xhr)
      // sf.failFetch(xhr, "Sorry, can't yet parse non-XML HTML")
    }
  }
  static register (fetcher) {
    fetcher.mediatypes['text/html'] = {
      'q': 0.3
    }
  }
  static toString () {
    return 'HTMLHandler'
  }
}
HTMLHandler.pattern = new RegExp('text/html')

class TextHandler {
  constructor (fetcher) {
    this.fetcher = fetcher
  }
  handlerFactory (xhr) {
    var fetcher = this.fetcher
    xhr.handle = function (callback) {
      // We only speak dialects of XML right now. Is this XML?
      var rt = xhr.responseText
      // Look for an XML declaration
      if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
        fetcher.addStatus(xhr.req, 'Warning: ' + xhr.resource +
          " has an XML declaration. We'll assume " +
          "it's XML but its content-type wasn't XML.\n")
        fetcher.switchHandler('XMLHandler', xhr, callback)
        return
      }
      // Look for an XML declaration
      if (rt.slice(0, 500).match(/xmlns:/)) {
        fetcher.addStatus(xhr.req, "May have an XML namespace. We'll assume " +
          "it's XML but its content-type wasn't XML.\n")
        fetcher.switchHandler('XMLHandler', xhr, callback)
        return
      }
      // We give up finding semantics - this is not an error, just no data
      fetcher.addStatus(xhr.req, 'Plain text document, no known RDF semantics.')
      fetcher.doneFetch(xhr)
      //                sf.failFetch(xhr, "unparseable - text/plain not visibly XML")
      //                dump(xhr.resource + " unparseable - text/plain not visibly XML, starts:\n" + rt.slice(0, 500)+"\n")
    }
  }
  static register (fetcher) {
    fetcher.mediatypes['text/plain'] = {
      'q': 0.1
    }
  }
  static toString () {
    return 'TextHandler'
  }
}
TextHandler.pattern = new RegExp('text/plain')

class N3Handler {
  constructor (fetcher) {
    this.fetcher = fetcher
  }
  handlerFactory (xhr) {
    var fetcher = this.fetcher
    xhr.handle = function (callback) {
      var kb = fetcher.store
      // Parse the text of this non-XML file
      // console.log('web.js: Parsing as N3 ' + xhr.resource.uri + ' base: ' + xhr.original.uri) // @@@@ comment me out
      // sf.addStatus(xhr.req, "N3 not parsed yet...")
      var p = N3Parser(kb, kb, xhr.original.uri, xhr.original.uri, null, null,
        '')
      //                p.loadBuf(xhr.responseText)
      try {
        p.loadBuf(xhr.responseText)
      } catch (e) {
        var msg = ('Error trying to parse ' + xhr.resource + ' as Notation3:\n' + e + ':\n' + e.stack)
        // dump(msg+"\n")
        fetcher.failFetch(xhr, msg)
        return
      }
      fetcher.addStatus(xhr.req, 'N3 parsed: ' + p.statementCount +
        ' triples in ' + p.lines + ' lines.')
      fetcher.store.add(xhr.original, ns.rdf('type'), ns.link('RDFDocument'),
        fetcher.appNode)
      // var args = [xhr.original.uri] // Other args needed ever?
      fetcher.doneFetch(xhr)
    }
  }
  static register (fetcher) {
    fetcher.mediatypes['text/n3'] = {
      'q': '1.0'
    } // as per 2008 spec
    fetcher.mediatypes['application/x-turtle'] = {
      'q': 1.0
    } // pre 2008
    fetcher.mediatypes['text/turtle'] = {
      'q': 1.0
    } // pre 2008
  }
  static toString () {
    return 'N3Handler'
  }
}
N3Handler.pattern = new RegExp('(application|text)/(x-)?(rdf\\+)?(n3|turtle)')

class Fetcher {
  constructor (store, timeout, async) {
    this.store = store
    this.thisURI = 'http://dig.csail.mit.edu/2005/ajar/ajaw/rdf/sources.js' +
      '#SourceFetcher' // -- Kenny
    this.timeout = timeout || 30000
    this.async = async != null ? async : true
    this.appNode = this.store.bnode() // Denoting this session
    this.store.fetcher = this // Bi-linked
    this.requested = {}
    // this.requested[uri] states:
    //   undefined     no record of web access or records reset
    //   true          has been requested, XHR in progress
    //   'done'        received, Ok
    //   403           HTTP status unauthorized
    //   404           Ressource does not exist. Can be created etc.
    //   'redirected'  In attempt to counter CORS problems retried.
    //   other strings mean various other erros, such as parse errros.
    //
    this.redirectedTo = {} // When 'redireced'
    this.fetchCallbacks = {} // fetchCallbacks[uri].push(callback)
    this.nonexistant = {} // keep track of explict 404s -> we can overwrite etc
    this.lookedUp = {}
    this.mediatypes = {}
    this.mediatypes['image/*'] = {
      'q': 0.9
    }
    this.handlers = []
    var handlers = [
      RDFXMLHandler, XHTMLHandler, XMLHandler, HTMLHandler,
      TextHandler, N3Handler
    ]
    handlers.forEach((HandlerClass) => {
      // let handler = new HandlerClass(this)
      this.handlers.push(HandlerClass)
      HandlerClass.register(this)
    })
    Util.callbackify(this, ['request', 'recv', 'headers', 'load', 'fail',
      'refresh', 'retract', 'done'])
  }
  addHandler (handler) {

  }
  addStatus (req, status) {
    // <Debug about="parsePerformance">
    var now = new Date()
    status = '[' + now.getHours() + ':' + now.getMinutes() + ':' +
      now.getSeconds() + '.' + now.getMilliseconds() + '] ' + status
    // </Debug>
    var kb = this.store
    var s = kb.the(req, ns.link('status'))
    if (s && s.append) {
      s.append(kb.literal(status))
    } else {
      log.warn('web.js: No list to add to: ' + s + ',' + status) // @@@
    }
  }
  static crossSiteProxy (uri) {
    if (Fetcher.crossSiteProxyTemplate) {
      return Fetcher.crossSiteProxyTemplate.replace('{uri}',
        encodeURIComponent(uri))
    } else {
      return undefined
    }
  }
  doneFetch (xhr) {
    this.addStatus(xhr.req, 'Done.')
    this.requested[xhr.original.uri] = 'done' // Kenny
    while (this.fetchCallbacks[xhr.original.uri] && this.fetchCallbacks[xhr.original.uri].length) {
      this.fetchCallbacks[xhr.original.uri].shift()(true, undefined, xhr)
    }
    delete this.fetchCallbacks[xhr.original.uri]
    this.fireCallbacks('done', [xhr.original.uri])
  }
  /**
   * Record errors in the system on failure
   * Returns xhr so can just do return this.failfetch(...)
   */
  failFetch (xhr, status) {
    var kb = this.store
    this.addStatus(xhr.req, status)
    if (!xhr.options.noMeta) {
      kb.add(xhr.original, ns.link('error'), status)
    }
    if (!xhr.resource.equals(xhr.original)) {
      console.log('@@ Recording failure original ' + xhr.original +
        '( as ' + xhr.resource + ') : ' + xhr.status)
    } else {
      console.log('@@ Recording failure for ' + xhr.original + ': ' +
        xhr.status)
    }
    this.requested[Uri.docpart(xhr.original.uri)] = xhr.status // changed 2015 was false
    while (this.fetchCallbacks[xhr.original.uri] &&
           this.fetchCallbacks[xhr.original.uri].length) {
      this.fetchCallbacks[xhr.original.uri].shift()(false, 'Fetch of <' +
        xhr.original.uri + '> failed: ' + status, xhr)
    }
    delete this.fetchCallbacks[xhr.original.uri]
    this.fireCallbacks('fail', [xhr.original.uri, status])
    xhr.abort()
    return xhr
  }
  /**
   * Look up response header
   * Returns: a list of header values found in a stored HTTP response
   *   or [] if response was found but no header found or undefined if no
   *   response is available.
   */
  getHeader (doc, header) {
    var kb = this.store
    var requests = kb.each(undefined, ns.link('requestedURI'), doc.uri)
    for (var r = 0; r < requests.length; r++) {
      var request = requests[r]
      if (request !== undefined) {
        var response = kb.any(request, ns.link('response'))
        if (request !== undefined) {
          var results = kb.each(response, ns.httph(header.toLowerCase()))
          if (results.length) {
            return results.map(function (v) {
              return v.value
            })
          }
          return []
        }
      }
    }
    return undefined
  }
  getState (docuri) {
    if (typeof this.requested[docuri] === 'undefined') {
      return 'unrequested'
    } else if (this.requested[docuri] === true) {
      return 'requested'
    } else if (this.requested[docuri] === 'done') {
      return 'fetched'
    } else if (this.requested[docuri] === 'redirected') {
      return this.getState(this.redirectedTo[docuri])
    } else { // An non-200 HTTP error status
      return 'failed'
    }
  }
  /**
   * doing anyStatementMatching is wasting time
   */
  isPending (docuri) { // sources_pending
    // if it's not pending: false -> flailed 'done' -> done
    // 'redirected' -> redirected
    return this.requested[docuri] === true
  }
  /**
   * Promise-based load function
   * NamedNode -> Promise of xhr
   * uri string -> Promise of xhr
   * Array of the above -> Promise of array of xhr
   * @@ todo: If p1 is array then sequence or parallel fetch of all
   */
  load (uri, options) {
    var fetcher = this
    if (Array.isArray(uri)) {
      var ps = uri.map(function (x) {
        return fetcher.load(x)
      })
      return Promise.all(ps)
    }
    uri = uri.uri || uri // NamedNode or URI string
    return new Promise(function (resolve, reject) {
      fetcher.nowOrWhenFetched(uri, options, function (ok, message, xhr) {
        if (ok) {
          resolve(xhr)
        } else {
          reject(message)
        }
      })
    })
  }
  /**
   * Looks up something.
   * Looks up all the URIs a things has.
   * @param term canonical term for the thing whose URI is to be dereferenced
   * @param rterm the resource which refered to this (for tracking bad links)
   * @param options (old: force parameter) or dictionary of options
   * @param options.force Load the data even if loaded before
   * @param oneDone is called as callback(ok, errorbody, xhr) for each one
   * @param allDone is called as callback(ok, errorbody) for all of them
   * @return {Number} the number of URIs fetched
   */
  lookUpThing (term, rterm, options, oneDone, allDone) {
    var kb = this.store
    var fetcher = this
    var uris = kb.uris(term) // Get all URIs
    var success = true
    var errors = ''
    var outstanding = {}
    var force
    if (options === false || options === true) { // Old signature
      force = options
      options = { force: force }
    } else {
      if (options === undefined) options = {}
      force = !!options.force
    }
    if (typeof uris !== 'undefined') {
      for (var i = 0; i < uris.length; i++) {
        var u = uris[i]
        outstanding[u] = true
        this.lookedUp[u] = true
        var requestOne = function requestOne (u1) {
          fetcher.requestURI(Uri.docpart(u1), rterm, options,
            function (ok, body, xhr) {
              if (ok) {
                if (oneDone) oneDone(true, u1)
              } else {
                if (oneDone) oneDone(false, body)
                success = false
                errors += body + '\n'
              }
              delete outstanding[u]
              if (Object.keys(outstanding).length > 0) {
                return
              }
              if (allDone) {
                allDone(success, errors)
              }
            })
        }
        requestOne(u)
      }
    }
    return uris.length
  }
  /**
   * in the why part of the quad distinguish between HTML and HTTP header
   * Reverse is set iif the link was rev= as opposed to rel=
   */
  linkData (xhr, rel, uri, why, reverse) {
    if (!uri) return
    var kb = this.store
    var predicate
    // See http://www.w3.org/TR/powder-dr/#httplink for describedby 2008-12-10
    var obj = kb.sym(Uri.join(uri, xhr.original.uri))
    if (rel === 'alternate' || rel === 'seeAlso' || rel === 'meta' || rel === 'describedby') {
      if (obj.uri === xhr.original.uri) return
      predicate = ns.rdfs('seeAlso')
    } else if (rel === 'type') {
      predicate = kb.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    } else {
      // See https://www.iana.org/assignments/link-relations/link-relations.xml
      // Alas not yet in RDF yet for each predicate
      predicate = kb.sym(Uri.join(rel, 'http://www.iana.org/assignments/link-relations/'))
    }
    if (reverse) {
      kb.add(obj, predicate, xhr.original, why)
    } else {
      kb.add(xhr.original, predicate, obj, why)
    }
  }
  /**
   * Note two nodes are now smushed .If only one was flagged as looked up, then
   * the new node is looked up again, which will make sure all the URIs are
   * dereferenced
   */
  nowKnownAs (was, now) {
    if (this.lookedUp[was.uri]) {
      if (!this.lookedUp[now.uri]) this.lookUpThing(now, was) //  @@@@  Transfer userCallback
    } else if (this.lookedUp[now.uri]) {
      if (!this.lookedUp[was.uri]) this.lookUpThing(was, now)
    }
  }
  /**
   * Ask for a doc to be loaded if necessary then call back
   * Changed 2013-08-20:  Added (ok, errormessage) params to callback
   * Calling methods:
   *   nowOrWhenFetched (uri, userCallback)
   *   nowOrWhenFetched (uri, options, userCallback)
   *   nowOrWhenFetched (uri, referringTerm, userCallback, options)  <-- old
   *   nowOrWhenFetched (uri, referringTerm, userCallback) <-- old
   *  Options include:
   *   referringTerm    The document in which this link was found.
   *                    this is valuable when finding the source of bad URIs
   *   force            boolean.  Never mind whether you have tried before,
   *                    load this from scratch.
   *   forceContentType Override the incoming header to force the data to be
   *                    treaed as this content-type.
   */
  nowOrWhenFetched (uri, p2, userCallback, options) {
    uri = uri.uri || uri // allow symbol object or string to be passed
    if (typeof p2 === 'function') {
      options = {}
      userCallback = p2
    } else if (typeof p2 === 'undefined') { // original calling signature
      // referingTerm = undefined
    } else if (isNamedNode(p2)) {
      // referingTerm = p2
      options = {referingTerm: p2}
    } else {
      options = p2
    }
    this.requestURI(uri, p2, options || {}, userCallback)
  }
  objectRefresh (term) {
    var kb = this.store
    var uris = kb.uris(term) // Get all URIs
    if (typeof uris !== 'undefined') {
      for (var i = 0; i < uris.length; i++) {
        this.refresh(this.store.sym(Uri.docpart(uris[i])))
        // what about rterm?
      }
    }
  }
  parseLinkHeader (xhr, thisReq) {
    var link
    try {
      link = xhr.getResponseHeader('link') // May crash from CORS error
    } catch (e) {}
    if (link) {
      var linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g
      var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g
      var matches = link.match(linkexp)
      for (var i = 0; i < matches.length; i++) {
        var split = matches[i].split('>')
        var href = split[0].substring(1)
        var ps = split[1]
        var s = ps.match(paramexp)
        for (var j = 0; j < s.length; j++) {
          var p = s[j]
          var paramsplit = p.split('=')
          // var name = paramsplit[0]
          var rel = paramsplit[1].replace(/["']/g, '') // '"
          this.linkData(xhr, rel, href, thisReq)
        }
      }
    }
  }
  proxyIfNecessary (uri) {
    // Extension does not need proxy
    if (typeof tabulator !== 'undefined' && tabulator.isExtension) return uri
    // browser does 2014 on as https browser script not trusted
    // If the web app origin is https: then the mixed content rules
    // prevent it loading insecure http: stuff so we need proxy.
    if (Fetcher.crossSiteProxyTemplate &&
        (typeof document !== 'undefined') &&
        document.location &&
        ('' + document.location).slice(0, 6) === 'https:' && // origin is secure
        uri.slice(0, 5) === 'http:') { // requested data is not
      return Fetcher.crossSiteProxyTemplate.replace('{uri}',
        encodeURIComponent(uri))
    }
    return uri
  }
  refresh (term, userCallback) { // sources_refresh
    this.fireCallbacks('refresh', arguments)
    this.requestURI(term.uri, undefined,
      { force: true, clearPreviousData: true }, userCallback)
  }
  /**
   * Requests a document URI and arranges to load the document.
   * Parameters:
   *    term:  term for the thing whose URI is to be dereferenced
   *      rterm:  the resource which refered to this (for tracking bad links)
   *      options:
   *              force:  Load the data even if loaded before
   *              withCredentials:   flag for XHR/CORS etc
   *      userCallback:  Called with (true) or (false, errorbody, {status:
   *          400}) after load is done or failed
   * Return value:
   *	    The xhr object for the HTTP access
   *      null if the protocol is not a look-up protocol,
   *              or URI has already been loaded
   */
  requestURI (docuri, rterm, options, userCallback) {
    // Various calling conventions
    docuri = docuri.uri || docuri // NamedNode or string
    docuri = docuri.split('#')[0]
    if (typeof options === 'boolean') {
      options = { 'force': options } // Ols dignature
    }
    if (typeof options === 'undefined') options = {}
    var force = !!options.force
    var kb = this.store
    var args = arguments
    var baseURI = options.baseURI || docuri  // Preseve though proxying etc
    options.userCallback = userCallback
    var pcol = Uri.protocol(docuri)
    if (pcol === 'tel' || pcol === 'mailto' || pcol === 'urn') {
      // "No look-up operation on these, but they are not errors?"
      console.log('Unsupported protocol in: ' + docuri)
      return userCallback(false, 'Unsupported protocol', { 'status': 900 }) ||
        undefined
    }
    var docterm = kb.sym(docuri)
    var sta = this.getState(docuri)
    if (!force) {
      if (sta === 'fetched') {
        return userCallback ? userCallback(true) : undefined
      }
      if (sta === 'failed') {
        return userCallback
          ? userCallback(false, 'Previously failed. ' + this.requested[docuri],
              {'status': this.requested[docuri]})
          : undefined // An xhr standin
      }
    // if (sta === 'requested') return userCallback? userCallback(false, "Sorry already requested - pending already.", {'status': 999 }) : undefined
    } else {
      delete this.nonexistant[docuri]
    }
    // @@ Should allow concurrent requests
    // If it is 'failed', then should we try again?  I think so so an old error doens't get stuck
    // if (sta === 'unrequested')
    this.fireCallbacks('request', args) // Kenny: fire 'request' callbacks here
    // dump( "web.js: Requesting uri: " + docuri + "\n" )
    if (userCallback) {
      if (!this.fetchCallbacks[docuri]) {
        this.fetchCallbacks[docuri] = [ userCallback ]
      } else {
        this.fetchCallbacks[docuri].push(userCallback)
      }
    }
    if (this.requested[docuri] === true) {
      return // Don't ask again - wait for existing call
    } else {
      this.requested[docuri] = true
    }
    if (!options.noMeta && rterm && rterm.uri) {
      kb.add(docterm.uri, ns.link('requestedBy'), rterm.uri, this.appNode)
    }
    var xhr = Util.XMLHTTPFactory()
    var req = xhr.req = kb.bnode()
    xhr.original = kb.sym(baseURI)
    // console.log('XHR original: ' + xhr.original)
    xhr.options = options
    xhr.resource = docterm  // This might be proxified
    var sf = this
    var now = new Date()
    var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
    if (!options.noMeta) {
      kb.add(req, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + docuri), this.appNode)
      kb.add(req, ns.link('requestedURI'), kb.literal(docuri), this.appNode)
      kb.add(req, ns.link('status'), kb.collection(), this.appNode)
    }
    var checkCredentialsRetry = function () {
      if (!xhr.withCredentials) return false // not dealt with

      if (xhr.retriedWithCredentials) {
        return true
      }
      xhr.retriedWithCredentials = true // protect against called twice
      console.log('web: Retrying with no credentials for ' + xhr.resource)
      xhr.abort()
      delete sf.requested[docuri] // forget the original request happened
      var newopt = {}
      for (var opt in options) { // transfer baseURI etc
        if (options.hasOwnProperty(opt)) {
          newopt[opt] = options[opt]
        }
      }
      newopt.withCredentials = false
      sf.addStatus(xhr.req, 'Abort: Will retry with credentials SUPPRESSED to see if that helps')
      sf.requestURI(docuri, rterm, newopt, xhr.userCallback) // userCallback already registered (with where?)
      return true
    }
    var onerrorFactory = function (xhr) {
      return function (event) {
        xhr.onErrorWasCalled = true // debugging and may need it
        if (typeof document !== 'undefined') { // Mashup situation, not node etc
          if (Fetcher.crossSiteProxyTemplate && document.location && !xhr.proxyUsed) {
            var hostpart = Uri.hostpart
            var here = '' + document.location
            var uri = xhr.resource.uri
            if (hostpart(here) && hostpart(uri) && hostpart(here) !== hostpart(uri)) { // If cross-site
              if (xhr.status === 401 || xhr.status === 403 || xhr.status === 404) {
                onreadystatechangeFactory(xhr)()
              } else {
                // IT IS A PAIN THAT NO PROPER ERROR REPORTING
                if (checkCredentialsRetry(xhr)) { // If credentials flag set, retry without,
                  return
                }
                // If it wasn't, or we already tried that
                var newURI = Fetcher.crossSiteProxy(uri)
                console.log('web: Direct failed so trying proxy ' + newURI)
                sf.addStatus(xhr.req, 'BLOCKED -> Cross-site Proxy to <' + newURI + '>')
                if (xhr.aborted) return
                var kb = sf.store
                var oldreq = xhr.req
                if (!xhr.options.noMeta) {
                  kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), oldreq)
                }
                xhr.abort()
                xhr.aborted = true
                sf.addStatus(oldreq, 'redirected to new request') // why
                // the callback throws an exception when called from xhr.onerror (so removed)
                // sf.fireCallbacks('done', args) // Are these args right? @@@   Not done yet! done means success
                sf.requested[xhr.resource.uri] = 'redirected'
                sf.redirectedTo[xhr.resource.uri] = newURI
                if (sf.fetchCallbacks[xhr.resource.uri]) {
                  if (!sf.fetchCallbacks[newURI]) {
                    sf.fetchCallbacks[newURI] = []
                  }
                  sf.fetchCallbacks[newURI] === sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri])
                  delete sf.fetchCallbacks[xhr.resource.uri]
                }
                var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options, xhr.userCallback)
                if (xhr2) {
                  xhr2.proxyUsed = true // only try the proxy once
                  xhr2.original = xhr.original
                  console.log('Proxying but original still ' + xhr2.original)
                }
                if (xhr2 && xhr2.req) {
                  if (!xhr.options.noMeta) {
                    kb.add(xhr.req,
                      kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                      xhr2.req,
                      sf.appNode)
                  }
                  return
                }
              }
            }
            xhr.status = 999
          }
        } // mashu
      } // function of event
    } // onerrorFactory
    // Set up callbacks
    var onreadystatechangeFactory = function (xhr) {
      return function () {
        var handleResponse = function () {
          if (xhr.handleResponseDone) return
          xhr.handleResponseDone = true
          var handler = null
          var thisReq = xhr.req // Might have changes by redirect
          sf.fireCallbacks('recv', args)
          var kb = sf.store
          sf.saveResponseMetadata(xhr, kb)
          sf.fireCallbacks('headers', [{uri: docuri, headers: xhr.headers}])
          // Check for masked errors.
          // For "security reasons" theboraser hides errors such as CORS errors from
          // the calling code (2015). oneror() used to be called but is not now.
          if (xhr.status === 0) {
            console.log('Masked error - status 0 for ' + xhr.resource.uri)
            if (checkCredentialsRetry(xhr)) { // retry is could be credentials flag CORS issue
              return
            }
            xhr.status = 900 // unknown masked error
            return
          }
          if (xhr.status >= 400) { // For extra dignostics, keep the reply
            //  @@@ 401 should cause  a retry with credential son
            // @@@ cache the credentials flag by host ????
            if (xhr.status === 404) {
              kb.fetcher.nonexistant[xhr.resource.uri] = true
            }
            if (xhr.responseText.length > 10) {
              var response2 = kb.bnode()
              kb.add(response2, ns.http('content'), kb.literal(xhr.responseText), response2)
              if (xhr.statusText) {
                kb.add(response2, ns.http('statusText'), kb.literal(xhr.statusText), response2)
              }
            // dump("HTTP >= 400 responseText:\n"+xhr.responseText+"\n"); // @@@@
            }
            sf.failFetch(xhr, 'HTTP error for ' + xhr.resource + ': ' + xhr.status + ' ' + xhr.statusText)
            return
          }
          var loc = xhr.headers['content-location']
          // deduce some things from the HTTP transaction
          var addType = function (cla) { // add type to all redirected resources too
            var prev = thisReq
            if (loc) {
              var docURI = kb.any(prev, ns.link('requestedURI'))
              if (docURI !== loc) {
                kb.add(kb.sym(loc), ns.rdf('type'), cla, sf.appNode)
              }
            }
            for (;;) {
              var doc = kb.any(prev, ns.link('requestedURI'))
              if (doc && doc.value) {
                kb.add(kb.sym(doc.value), ns.rdf('type'), cla, sf.appNode)
              } // convert Literal
              prev = kb.any(undefined, kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'), prev)
              if (!prev) break
              var response = kb.any(prev, kb.sym('http://www.w3.org/2007/ont/link#response'))
              if (!response) break
              var redirection = kb.any(response, kb.sym('http://www.w3.org/2007/ont/http#status'))
              if (!redirection) break
              if (redirection !== '301' && redirection !== '302') break
            }
          }
          // This is a minimal set to allow the use of damaged servers if necessary
          var extensionToContentType = {
            'rdf': 'application/rdf+xml', 'owl': 'application/rdf+xml',
            'n3': 'text/n3', 'ttl': 'text/turtle', 'nt': 'text/n3', 'acl': 'text/n3',
            'html': 'text/html',
            'xml': 'text/xml'
          }
          var guess
          if (xhr.status === 200) {
            addType(ns.link('Document'))
            var ct = xhr.headers['content-type']
            if (options.forceContentType) {
              xhr.headers['content-type'] = options.forceContentType
            }
            if (!ct || ct.indexOf('application/octet-stream') >= 0) {
              guess = extensionToContentType[xhr.resource.uri.split('.').pop()]
              if (guess) {
                xhr.headers['content-type'] = guess
              }
            }
            if (ct) {
              if (ct.indexOf('image/') === 0 || ct.indexOf('application/pdf') === 0) addType(kb.sym('http://purl.org/dc/terms/Image'))
            }
            if (options.clearPreviousData) { // Before we parse new data clear old but only on 200
              kb.removeDocument(xhr.resource)
            }
          }
          // application/octet-stream; charset=utf-8
          if (Uri.protocol(xhr.resource.uri) === 'file' ||
              Uri.protocol(xhr.resource.uri) === 'chrome') {
            if (options.forceContentType) {
              xhr.headers['content-type'] = options.forceContentType
            } else {
              guess = extensionToContentType[xhr.resource.uri.split('.').pop()]
              if (guess) {
                xhr.headers['content-type'] = guess
              } else {
                xhr.headers['content-type'] = 'text/xml'
              }
            }
          }
          // If we have alread got the thing at this location, abort
          if (loc) {
            var udoc = Uri.join(xhr.resource.uri, loc)
            if (!force && udoc !== xhr.resource.uri &&
                sf.requested[udoc] && sf.requested[udoc] === 'done') { // we have already fetched this in fact.
              // should we smush too?
              // log.info("HTTP headers indicate we have already" + " retrieved " + xhr.resource + " as " + udoc + ". Aborting.")
              sf.doneFetch(xhr)
              xhr.abort()
              return
            }
            sf.requested[udoc] = true
          }
          for (var x = 0; x < sf.handlers.length; x++) {
            if (xhr.headers['content-type'] && xhr.headers['content-type'].match(sf.handlers[x].pattern)) {
              handler = new sf.handlers[x]()
              break
            }
          }
          sf.parseLinkHeader(xhr, thisReq)
          if (handler) {
            try {
              handler.handlerFactory(xhr)
            } catch (e) { // Try to avoid silent errors
              sf.failFetch(xhr, 'Exception handling content-type ' + xhr.headers['content-type'] + ' was: ' + e)
            }
          } else {
            sf.doneFetch(xhr) //  Not a problem, we just don't extract data.
            /*
            // sf.failFetch(xhr, "Unhandled content type: " + xhr.headers['content-type']+
            //        ", readyState = "+xhr.readyState)
            */
            return
          }
        }
        // DONE: 4
        // HEADERS_RECEIVED: 2
        // LOADING: 3
        // OPENED: 1
        // UNSENT: 0
        // log.debug("web.js: XHR " + xhr.resource.uri + '
        //   readyState='+xhr.readyState); // @@@@ comment me out
        switch (xhr.readyState) {
          case 0:
            var uri = xhr.resource.uri
            var newURI
            if (this.crossSiteProxyTemplate &&
                (typeof document !== 'undefined') &&
                document.location) { // In mashup situation
              var hostpart = Uri.hostpart
              var here = '' + document.location
              if (hostpart(here) && hostpart(uri) &&
                  hostpart(here) !== hostpart(uri)) {
                newURI = this.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri))
                sf.addStatus(xhr.req, 'BLOCKED -> Cross-site Proxy to <' + newURI + '>')
                if (xhr.aborted) return
                var kb = sf.store
                var oldreq = xhr.req
                kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), oldreq)
                // //////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req)
                var now = new Date()
                var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
                kb.add(newreq, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
                kb.add(newreq, ns.link('requestedURI'), kb.literal(newURI), this.appNode)
                var response = kb.bnode()
                kb.add(oldreq, ns.link('response'), response)
                // kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
                // if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)
                xhr.abort()
                xhr.aborted = true
                xhr.redirected = true
                sf.addStatus(oldreq, 'redirected XHR') // why
                if (sf.fetchCallbacks[xhr.resource.uri]) {
                  if (!sf.fetchCallbacks[newURI]) {
                    sf.fetchCallbacks[newURI] = []
                  }
                  sf.fetchCallbacks[newURI] === sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri])
                  delete sf.fetchCallbacks[xhr.resource.uri]
                }
                sf.fireCallbacks('redirected', args) // Are these args right? @@@
                sf.requested[xhr.resource.uri] = 'redirected'
                var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options || {}, xhr.userCallback)
                if (xhr2 && xhr2.req) {
                  kb.add(
                    xhr.req,
                    kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                    xhr2.req, sf.appNode
                  )
                  return
                }
              }
            }
            sf.failFetch(xhr,
              'HTTP Blocked. (ReadyState 0) Cross-site violation for <' +
              docuri + '>')
            break
          case 3:
            // Intermediate state -- 3 may OR MAY NOT be called, selon browser.
            // handleResponse();   // In general it you can't do it yet as the headers are in but not the data
            break
          case 4:
            // Final state for this XHR but may be redirected
            handleResponse()
            // Now handle
            if (xhr.handle && xhr.responseText !== undefined) { // can be validly zero length
              if (sf.requested[xhr.resource.uri] === 'redirected') {
                break
              }
              sf.fireCallbacks('load', args)
              xhr.handle(function () {
                sf.doneFetch(xhr)
              })
            } else {
              if (xhr.redirected) {
                sf.addStatus(xhr.req, 'Aborted and redirected to new request.')
              } else {
                sf.addStatus(xhr.req, 'Fetch over. No data handled. Aborted = ' + xhr.aborted)
              }
            // sf.failFetch(xhr, "HTTP failed unusually. (no handler set) (x-site violation? no net?) for <"+
            //    docuri+">")
            }
            break
        } // switch
      }
    }
    // Map the URI to a localhost proxy if we are running on localhost
    // This is used for working offline, e.g. on planes.
    // Is the script istelf is running in localhost, then access all data in a localhost mirror.
    // Do not remove without checking with TimBL
    var uri2 = docuri
    if (typeof tabulator !== 'undefined' && tabulator.preferences.get('offlineModeUsingLocalhost')) {
      if (uri2.slice(0, 7) === 'http://' && uri2.slice(7, 17) !== 'localhost/') {
        uri2 = 'http://localhost/' + uri2.slice(7)
        log.warn('Localhost kludge for offline use: actually getting <' + uri2 + '>')
      } else {
        // log.warn("Localhost kludge NOT USED <" + uri2 + ">")
      }
    } else {
      // log.warn("Localhost kludge OFF offline use: actually getting <" + uri2 + ">")
    }
    // 2014 probelm:
    // XMLHttpRequest cannot load http://www.w3.org/People/Berners-Lee/card.
    // A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin' header when the credentials flag is true.
    // @ Many ontology files under http: and need CORS wildcard -> can't have withCredentials
    var withCredentials = (uri2.slice(0, 6) === 'https:') // @@ Kludge -- need for webid which typically is served from https
    if (options.withCredentials !== undefined) {
      withCredentials = options.withCredentials
    }
    var actualProxyURI = this.proxyIfNecessary(uri2)
    // Setup the request
    // var xhr
    // xhr = Util.XMLHTTPFactory()
    xhr.onerror = onerrorFactory(xhr)
    xhr.onreadystatechange = onreadystatechangeFactory(xhr)
    xhr.timeout = sf.timeout
    xhr.withCredentials = withCredentials
    xhr.actualProxyURI = actualProxyURI
    xhr.req = req
    xhr.options = options
    xhr.options = options
    xhr.resource = docterm
    xhr.requestedURI = uri2
    xhr.ontimeout = function () {
      sf.failFetch(xhr, 'requestTimeout')
    }
    try {
      xhr.open('GET', actualProxyURI, this.async)
    } catch (er) {
      return this.failFetch(xhr, 'XHR open for GET failed for <' + uri2 + '>:\n\t' + er)
    }
    if (force) { // must happen after open
      xhr.setRequestHeader('Cache-control', 'no-cache')
    }
    // Set redirect callback and request headers -- alas Firefox Extension Only
    if (typeof tabulator !== 'undefined' &&
        tabulator.isExtension && xhr.channel &&
        (Uri.protocol(xhr.resource.uri) === 'http' ||
        Uri.protocol(xhr.resource.uri) === 'https')) {
      try {
        xhr.channel.notificationCallbacks = {
          getInterface: function (iid) {
            if (iid.equals(Components.interfaces.nsIChannelEventSink)) {
              return {
                onChannelRedirect: function (oldC, newC, flags) {
                  if (xhr.aborted) return
                  var kb = sf.store
                  var newURI = newC.URI.spec
                  var oldreq = xhr.req
                  if (!xhr.options.noMeta) {
                    sf.addStatus(xhr.req, 'Redirected: ' + xhr.status + ' to <' + newURI + '>')
                    kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req)
                    // //////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate code?
                    var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                    kb.add(oldreq, ns.http('redirectedRequest'), newreq, this.appNode)
                    var now = new Date()
                    var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
                    kb.add(newreq, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                    kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
                    kb.add(newreq, ns.link('requestedURI'), kb.literal(newURI), this.appNode)
                    // /////////////
                    // // log.info('@@ sources onChannelRedirect'+
                    //               "Redirected: "+
                    //               xhr.status + " to <" + newURI + ">"); //@@
                    var response = kb.bnode()
                    // kb.add(response, ns.http('location'), newURI, response); Not on this response
                    kb.add(oldreq, ns.link('response'), response)
                    kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
                    if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)
                  }
                  if (xhr.status - 0 !== 303) kb.HTTPRedirects[xhr.resource.uri] = newURI // same document as
                  if (xhr.status - 0 === 301 && rterm) { // 301 Moved
                    var badDoc = Uri.docpart(rterm.uri)
                    var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.'
                    if (rterm) {
                      msg += ' Link in <' + badDoc + ' >should be changed'
                      kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode)
                    }
                  // dump(msg+"\n")
                  }
                  xhr.abort()
                  xhr.aborted = true
                  if (sf.fetchCallbacks[xhr.resource.uri]) {
                    if (!sf.fetchCallbacks[newURI]) {
                      sf.fetchCallbacks[newURI] = []
                    }
                    sf.fetchCallbacks[newURI] === sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri])
                    delete sf.fetchCallbacks[xhr.resource.uri]
                  }
                  sf.addStatus(oldreq, 'redirected') // why
                  sf.fireCallbacks('redirected', args) // Are these args right? @@@
                  sf.requested[xhr.resource.uri] = 'redirected'
                  sf.redirectedTo[xhr.resource.uri] = newURI
                  var hash = newURI.indexOf('#')
                  if (hash >= 0) {
                    if (!xhr.options.noMeta) {
                      kb.add(xhr.resource, kb.sym('http://www.w3.org/2007/ont/link#warning'),
                      'Warning: ' + xhr.resource + ' HTTP redirects to' + newURI + ' which should not contain a "#" sign')
                    }
                    newURI = newURI.slice(0, hash)
                  }
                  var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options, xhr.userCallback)
                  if (xhr2 && xhr2.req && !options.noMeta) {
                    kb.add(
                      xhr.req,
                      kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                      xhr2.req,
                      sf.appNode
                    )
                  }
                // else dump("No xhr.req available for redirect from "+xhr.resource+" to "+newURI+"\n")
                },
                // See https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIChannelEventSink
                asyncOnChannelRedirect: function (oldC, newC, flags, callback) {
                  if (xhr.aborted) return
                  var kb = sf.store
                  var newURI = newC.URI.spec
                  var oldreq = xhr.req
                  sf.addStatus(xhr.req, 'Redirected: ' + xhr.status + ' to <' + newURI + '>')
                  kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req)
                  // //////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                  var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                  // xhr.resource = docterm
                  // xhr.requestedURI = args[0]
                  // kb.add(kb.sym(newURI), ns.link("request"), req, this.appNode)
                  kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req)
                  var now = new Date()
                  var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] '
                  kb.add(newreq, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                  kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
                  kb.add(newreq, ns.link('requestedURI'), kb.literal(newURI), this.appNode)
                  // /////////////
                  // // log.info('@@ sources onChannelRedirect'+
                  //               "Redirected: "+
                  //               xhr.status + " to <" + newURI + ">"); //@@
                  var response = kb.bnode()
                  // kb.add(response, ns.http('location'), newURI, response); Not on this response
                  kb.add(oldreq, ns.link('response'), response)
                  kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
                  if (xhr.statusText) {
                    kb.add(response, ns.http('statusText'),
                      kb.literal(xhr.statusText), response)
                  }
                  if (xhr.status - 0 !== 303) kb.HTTPRedirects[xhr.resource.uri] = newURI // same document as
                  if (xhr.status - 0 === 301 && rterm) { // 301 Moved
                    var badDoc = Uri.docpart(rterm.uri)
                    var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.'
                    if (rterm) {
                      msg += ' Link in <' + badDoc + ' >should be changed'
                      kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode)
                    }
                  // dump(msg+"\n")
                  }
                  xhr.abort()
                  xhr.aborted = true
                  var hash = newURI.indexOf('#')
                  if (hash >= 0) {
                    var msg2 = ('Warning: ' + xhr.resource + ' HTTP redirects to' + newURI + ' which do not normally contain a "#" sign')
                    // dump(msg+"\n")
                    kb.add(xhr.resource, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg2)
                    newURI = newURI.slice(0, hash)
                  }
                  /*
                  if (sf.fetchCallbacks[xhr.resource.uri]) {
                    if (!sf.fetchCallbacks[newURI]) {
                      sf.fetchCallbacks[newURI] = []
                    }
                    sf.fetchCallbacks[newURI] = sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri])
                    delete sf.fetchCallbacks[xhr.resource.uri]
                  }
                  */
                  sf.requested[xhr.resource.uri] = 'redirected'
                  sf.redirectedTo[xhr.resource.uri] = newURI

                  var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options, xhr.userCallback)
                  if (xhr2) { // may be no XHR is other URI already loaded
                    xhr2.original = xhr.original  // use this for finding base
                    if (xhr2.req) {
                      kb.add(
                        xhr.req,
                        kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                        xhr2.req,
                        sf.appNode
                      )
                    }
                  }
                // else dump("No xhr.req available for redirect from "+xhr.resource+" to "+newURI+"\n")
                } // asyncOnChannelRedirect
              }
            }
            return Components.results.NS_NOINTERFACE
          }
        }
      } catch (err) {
        return sf.failFetch(xhr,
          "@@ Couldn't set callback for redirects: " + err)
      } // try
    } // if Firefox extension
    try {
      var acceptstring = ''
      for (var type in this.mediatypes) {
        // var attrstring = ''
        if (acceptstring !== '') {
          acceptstring += ', '
        }
        acceptstring += type
        for (var attr in this.mediatypes[type]) {
          acceptstring += ';' + attr + '=' + this.mediatypes[type][attr]
        }
      }
      xhr.setRequestHeader('Accept', acceptstring)
      this.addStatus(xhr.req, 'Accept: ' + acceptstring)
    // if (requester) { xhr.setRequestHeader('Referer',requester) }
    } catch (err) {
      throw new Error("Can't set Accept header: " + err)
    }
    // Fire
    try {
      xhr.send(null)
    } catch (er) {
      return this.failFetch(xhr, 'XHR send failed:' + er)
    }
    setTimeout(function () {
      if (xhr.readyState !== 4 && sf.isPending(xhr.resource.uri)) {
        sf.failFetch(xhr, 'requestTimeout')
      }
    },
      this.timeout)
    this.addStatus(xhr.req, 'HTTP Request sent.')
    return xhr
  } // this.requestURI()

  retract (term) { // sources_retract
    this.store.removeMany(undefined, undefined, undefined, term)
    if (term.uri) {
      delete this.requested[Uri.docpart(term.uri)]
    }
    this.fireCallbacks('retract', arguments)
  }
  saveRequestMetadata (xhr, kb, docuri) {
    var request = kb.bnode()
    xhr.resource = kb.sym(docuri)
    xhr.req = request
    if (!xhr.options.noMeta) { // Store no triples but do mind the bnode for req
      var now = new Date()
      var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' +
        now.getSeconds() + '] '
      kb.add(request, ns.rdfs('label'), kb.literal(timeNow + ' Request for ' +
        docuri), this.appNode)
      kb.add(request, ns.link('requestedURI'), kb.literal(docuri), this.appNode)
      if (xhr.original && xhr.original.uri !== docuri) {
        kb.add(request, ns.link('orginalURI'), kb.literal(xhr.original.uri),
          this.appNode)
      }
      kb.add(request, ns.link('status'), kb.collection(), this.appNode)
    }
    return request
  }
  saveResponseMetadata (xhr, kb) {
    var response = kb.bnode()
    if (xhr.req) kb.add(xhr.req, ns.link('response'), response)
    kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
    kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText),
      response)
    xhr.headers = {}
    if (Uri.protocol(xhr.resource.uri) === 'http' ||
        Uri.protocol(xhr.resource.uri) === 'https') {
      xhr.headers = Util.getHTTPHeaders(xhr)
      for (var h in xhr.headers) { // trim below for Safari - adds a CR!
        kb.add(response, ns.httph(h.toLowerCase()), xhr.headers[h].trim(),
          response)
      }
    }
    return response
  }
  switchHandler (name, xhr, callback, args) {
    var Handler
    for (var i = 0; i < this.handlers.length; i++) {
      if ('' + this.handlers[i] === name) {
        Handler = this.handlers[i]
      }
    }
    if (!Handler) {
      throw new Error('web.js: switchHandler: name=' + name +
        ' , this.handlers =' + this.handlers + '\n' +
        'switchHandler: switching to ' + Handler + '; sf=' + this +
        '; typeof Fetcher=' + typeof Fetcher +
        ';\n\t HTMLHandler=' + HTMLHandler + '\n'
      )
    }
    (new Handler(this, args)).handlerFactory(xhr)
    xhr.handle(callback)
  }
  webCopy (here, there, contentType) {
    var fetcher = this
    here = here.uri || here
    return fetcher.webOperation('GET', here)
      .then(function (xhr) {
        return fetcher.webOperation('PUT', // @@@ change to binary from text
          there, { data: xhr.responseText, contentType: contentType })
      })
  }
  /**
   * Returns promise of XHR
   */
  webOperation (method, uri, options) {
    uri = uri.uri || uri
    options = options || {}
    var fetcher = this
    return new Promise(function (resolve, reject) {
      var xhr = Util.XMLHTTPFactory()
      xhr.options = options
      xhr.original = fetcher.store.sym(uri)
      if (!options.noMeta && typeof tabulator !== 'undefined') {
        fetcher.saveRequestMetadata(xhr, fetcher.store, uri)
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) { // NOte a 404 can be not afailure
          var ok = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
          if (!options.noMeta && typeof tabulator !== 'undefined') {
            fetcher.saveResponseMetadata(xhr, fetcher.store)
          }
          if (ok) {
            resolve(xhr)
          } else {
            reject(xhr.status + ' ' + xhr.statusText)
          }
        }
      }
      xhr.open(method, uri, true)
      if (options.contentType) {
        xhr.setRequestHeader('Content-type', options.contentType)
      }
      xhr.send(options.data ? options.data : undefined)
    })
  }
}
Fetcher.prototype.get = Fetcher.prototype.nowOrWhenFetched

module.exports = Fetcher
