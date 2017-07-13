/* global $SolidTestEnvironment */
/**
 *
 * Project: rdflib.js
 *
 * File: fetcher.js
 *
 * Description: contains functions for requesting/fetching/retracting
 *  This implements quite a lot of the web architecture.
 * A fetcher is bound to a specific knowledge base graph, into which
 * it loads stuff and into which it writes its metadata
 * @@ The metadata should be optionally a separate graph
 *
 * - implements semantics of HTTP headers, Internet Content Types
 * - selects parsers for rdf/xml, n3, rdfa, grddl
 */

/**
 * Things to test: callbacks on request, refresh, retract
 *   loading from HTTP, HTTPS, FTP, FILE, others?
 * To do:
 * Firing up a mail client for mid:  (message:) URLs
 */
const log = require('./log')
const N3Parser = require('./n3parser')
const NamedNode = require('./named-node')
const Namespace = require('./namespace')
const rdfParse = require('./parse')
const parseRDFaDOM = require('./rdfaparser').parseRDFaDOM
const RDFParser = require('./rdfxmlparser')
const Uri = require('./uri')
const Util = require('./util')
const serialize = require('./serialize')

const Parsable = {
  'text/n3': true,
  'text/turtle': true,
  'application/rdf+xml': true,
  'application/xhtml+xml': true,
  'text/html': true,
  'application/ld+json': true
}

// This is a minimal set to allow the use of damaged servers if necessary
const CONTENT_TYPE_BY_EXT = {
  'rdf': 'application/rdf+xml',
  'owl': 'application/rdf+xml',
  'n3': 'text/n3',
  'ttl': 'text/turtle',
  'nt': 'text/n3',
  'acl': 'text/n3',
  'html': 'text/html',
  'xml': 'text/xml'
}

// Convenience namespaces needed in this module.
// These are deliberately not exported as the user application should
// make its own list and not rely on the prefixes used here,
// and not be tempted to add to them, and them clash with those of another
// application.
const ns = {
  link: Namespace('http://www.w3.org/2007/ont/link#'),
  http: Namespace('http://www.w3.org/2007/ont/http#'),
  httph: Namespace('http://www.w3.org/2007/ont/httph#'),  // headers
  rdf: Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: Namespace('http://www.w3.org/2000/01/rdf-schema#'),
  dc: Namespace('http://purl.org/dc/elements/1.1/')
}

class Handler {
  constructor (response, dom) {
    this.response = response
    this.dom = dom
  }
}

class RDFXMLHandler extends Handler {
  static toString () {
    return 'RDFXMLHandler'
  }

  static register (fetcher) {
    fetcher.mediatypes['application/rdf+xml'] = {
      'q': 0.9
    }
  }

  parse (fetcher, responseText, options) {
    let kb = fetcher.store
    if (!this.dom) {
      this.dom = Util.parseXML(responseText)
    }
    let root = this.dom.documentElement
    if (root.nodeName === 'parsererror') { // Mozilla only See issue/issue110
      // have to fail the request
      return fetcher.failFetch(options, 'Badly formed XML in ' +
        options.resource.uri, 'parse_error')
    }
    let parser = new RDFParser(kb)
    try {
      parser.parse(this.dom, options.original.uri, options.original)
    } catch (err) {
      return fetcher.failFetch(options, 'Syntax error parsing RDF/XML! ' + err,
        'parse_error')
    }
    if (!options.noMeta) {
      kb.add(options.original, ns.rdf('type'), ns.link('RDFDocument'), fetcher.appNode)
    }

    return fetcher.doneFetch(options, this.response)
  }
}
RDFXMLHandler.pattern = new RegExp('application/rdf\\+xml')

class XHTMLHandler extends Handler {
  static toString () {
    return 'XHTMLHandler'
  }

  static register (fetcher) {
    fetcher.mediatypes['application/xhtml+xml'] = {}
  }

  parse (fetcher, responseText, options) {
    let relation, reverse
    if (!this.dom) {
      this.dom = Util.parseXML(responseText)
    }
    let kb = fetcher.store

    // dc:title
    let title = this.dom.getElementsByTagName('title')
    if (title.length > 0) {
      kb.add(options.resource, ns.dc('title'), kb.literal(title[0].textContent),
        options.resource)
      // log.info("Inferring title of " + xhr.resource)
    }

    // link rel
    let links = this.dom.getElementsByTagName('link')
    for (let x = links.length - 1; x >= 0; x--) { // @@ rev
      relation = links[x].getAttribute('rel')
      reverse = false
      if (!relation) {
        relation = links[x].getAttribute('rev')
        reverse = true
      }
      if (relation) {
        fetcher.linkData(options.original, relation,
          links[x].getAttribute('href'), options.resource, reverse)
      }
    }

    // Data Islands
    let scripts = this.dom.getElementsByTagName('script')
    for (let i = 0; i < scripts.length; i++) {
      let contentType = scripts[i].getAttribute('type')
      if (Parsable[contentType]) {
        rdfParse(scripts[i].textContent, kb, options.original.uri, contentType)
      }
    }

    if (!options.noMeta) {
      kb.add(options.resource, ns.rdf('type'), ns.link('WebPage'), fetcher.appNode)
    }

    if (!options.noRDFa && parseRDFaDOM) { // enable by default
      try {
        parseRDFaDOM(this.dom, kb, options.original.uri)
      } catch (err) {
        let msg = 'Error trying to parse ' + options.resource + ' as RDFa:\n' +
          err + ':\n' + err.stack
        return fetcher.failFetch(options, msg, 'parse_error')
      }
    }

    return fetcher.doneFetch(options, this.response)
  }
}
XHTMLHandler.pattern = new RegExp('application/xhtml')

class XMLHandler extends Handler {
  static toString () {
    return 'XMLHandler'
  }

  static register (fetcher) {
    fetcher.mediatypes['text/xml'] = { 'q': 0.5 }
    fetcher.mediatypes['application/xml'] = { 'q': 0.5 }
  }

  parse (fetcher, responseText, options) {
    let dom = Util.parseXML(responseText)

    // XML Semantics defined by root element namespace
    // figure out the root element
    for (let c = 0; c < dom.childNodes.length; c++) {
      // is this node an element?
      if (dom.childNodes[c].nodeType === 1) {
        // We've found the first element, it's the root
        let ns = dom.childNodes[c].namespaceURI

        // Is it RDF/XML?
        if (ns && ns === ns['rdf']) {
          fetcher.addStatus(options.req,
            'Has XML root element in the RDF namespace, so assume RDF/XML.')

          let rdfHandler = new RDFXMLHandler(this.response, dom)
          return rdfHandler.parse(fetcher, responseText, options)
        }

        break
      }
    }

    // Or it could be XHTML?
    // Maybe it has an XHTML DOCTYPE?
    if (dom.doctype) {
      // log.info("We found a DOCTYPE in " + xhr.resource)
      if (dom.doctype.name === 'html' &&
          dom.doctype.publicId.match(/^-\/\/W3C\/\/DTD XHTML/) &&
          dom.doctype.systemId.match(/http:\/\/www.w3.org\/TR\/xhtml/)) {
        fetcher.addStatus(options.req,
          'Has XHTML DOCTYPE. Switching to XHTML Handler.\n')

        let xhtmlHandler = new XHTMLHandler(this.response, dom)
        return xhtmlHandler.parse(fetcher, responseText, options)
      }
    }

    // Or what about an XHTML namespace?
    let html = dom.getElementsByTagName('html')[0]
    if (html) {
      let xmlns = html.getAttribute('xmlns')
      if (xmlns && xmlns.match(/^http:\/\/www.w3.org\/1999\/xhtml/)) {
        fetcher.addStatus(options.req,
          'Has a default namespace for ' + 'XHTML. Switching to XHTMLHandler.\n')

        let xhtmlHandler = new XHTMLHandler(this.response, dom)
        return xhtmlHandler.parse(fetcher, responseText, options)
      }
    }

    // At this point we should check the namespace document (cache it!) and
    // look for a GRDDL transform
    // @@  Get namespace document <n>, parse it, look for  <n> grddl:namespaceTransform ?y
    // Apply ?y to   dom
    // We give up. What dialect is this?
    return fetcher.failFetch(options,
      'Unsupported dialect of XML: not RDF or XHTML namespace, etc.\n' +
      responseText.slice(0, 80))
  }
}
XMLHandler.pattern = new RegExp('(text|application)/(.*)xml')

class HTMLHandler extends Handler {
  static toString () {
    return 'HTMLHandler'
  }

  static register (fetcher) {
    fetcher.mediatypes['text/html'] = {
      'q': 0.9
    }
  }

  parse (fetcher, responseText, options) {
    let kb = fetcher.store

    // We only handle XHTML so we have to figure out if this is XML
    // log.info("Sniffing HTML " + xhr.resource + " for XHTML.")

    if (responseText.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
      fetcher.addStatus(options.req, "Has an XML declaration. We'll assume " +
        "it's XHTML as the content-type was text/html.\n")

      let xhtmlHandler = new XHTMLHandler(this.response)
      return xhtmlHandler.parse(fetcher, responseText, options)
    }

    // DOCTYPE
    // There is probably a smarter way to do this
    if (responseText.match(/.*<!DOCTYPE\s+html[^<]+-\/\/W3C\/\/DTD XHTML[^<]+http:\/\/www.w3.org\/TR\/xhtml[^<]+>/)) {
      fetcher.addStatus(options.req,
        'Has XHTML DOCTYPE. Switching to XHTMLHandler.\n')

      let xhtmlHandler = new XHTMLHandler(this.response)
      return xhtmlHandler.parse(fetcher, responseText, options)
    }

    // xmlns
    if (responseText.match(/[^(<html)]*<html\s+[^<]*xmlns=['"]http:\/\/www.w3.org\/1999\/xhtml["'][^<]*>/)) {
      fetcher.addStatus(options.req,
        'Has default namespace for XHTML, so switching to XHTMLHandler.\n')

      let xhtmlHandler = new XHTMLHandler(this.response)
      return xhtmlHandler.parse(fetcher, responseText, options)
    }

    // dc:title
    // no need to escape '/' here
    let titleMatch = (new RegExp('<title>([\\s\\S]+?)</title>', 'im')).exec(responseText)
    if (titleMatch) {
      kb.add(options.resource, ns.dc('title'), kb.literal(titleMatch[1]),
        options.resource) // think about xml:lang later
    }
    kb.add(options.resource, ns.rdf('type'), ns.link('WebPage'), fetcher.appNode)
    fetcher.addStatus(options.req, 'non-XML HTML document, not parsed for data.')

    return fetcher.doneFetch(options, this.response)
    // sf.failFetch(xhr, "Sorry, can't yet parse non-XML HTML")
  }
}
HTMLHandler.pattern = new RegExp('text/html')

class TextHandler extends Handler {
  static toString () {
    return 'TextHandler'
  }

  static register (fetcher) {
    fetcher.mediatypes['text/plain'] = {
      'q': 0.5
    }
  }

  parse (fetcher, responseText, options) {
    // We only speak dialects of XML right now. Is this XML?

    // Look for an XML declaration
    if (responseText.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
      fetcher.addStatus(options.req, 'Warning: ' + options.resource +
        " has an XML declaration. We'll assume " +
        "it's XML but its content-type wasn't XML.\n")

      let xmlHandler = new XMLHandler(this.response)
      return xmlHandler.parse(fetcher, responseText, options)
    }

    // Look for an XML declaration
    if (responseText.slice(0, 500).match(/xmlns:/)) {
      fetcher.addStatus(options.req, "May have an XML namespace. We'll assume " +
        "it's XML but its content-type wasn't XML.\n")

      let xmlHandler = new XMLHandler(this.response)
      return xmlHandler.parse(fetcher, responseText, options)
    }

    // We give up finding semantics - this is not an error, just no data
    fetcher.addStatus(options.req, 'Plain text document, no known RDF semantics.')

    return fetcher.doneFetch(options, this.response)
    // fetcher.failFetch(xhr, "unparseable - text/plain not visibly XML")
    // dump(xhr.resource + " unparseable - text/plain not visibly XML,
    //   starts:\n" + rt.slice(0, 500)+"\n")
  }
}
TextHandler.pattern = new RegExp('text/plain')

class N3Handler extends Handler {
  static toString () {
    return 'N3Handler'
  }

  static register (fetcher) {
    fetcher.mediatypes['text/n3'] = {
      'q': '1.0'
    } // as per 2008 spec
    /*
     fetcher.mediatypes['application/x-turtle'] = {
     'q': 1.0
     } // pre 2008
     */
    fetcher.mediatypes['text/turtle'] = {
      'q': 1.0
    } // post 2008
  }

  parse (fetcher, responseText, options) {
    // Parse the text of this non-XML file
    let kb = fetcher.store
    // console.log('web.js: Parsing as N3 ' + xhr.resource.uri + ' base: ' +
    // xhr.original.uri) // @@@@ comment me out
    // fetcher.addStatus(xhr.req, "N3 not parsed yet...")
    let p = N3Parser(kb, kb, options.original.uri, options.original.uri,
      null, null, '', null)
    //                p.loadBuf(xhr.responseText)
    try {
      p.loadBuf(responseText)
    } catch (err) {
      let msg = 'Error trying to parse ' + options.resource +
        ' as Notation3:\n' + err + ':\n' + err.stack
      // dump(msg+"\n")
      return fetcher.failFetch(options, msg, 'parse_error')
    }

    fetcher.addStatus(options.req, 'N3 parsed: ' + p.statementCount + ' triples in ' + p.lines + ' lines.')
    fetcher.store.add(options.original, ns.rdf('type'), ns.link('RDFDocument'), fetcher.appNode)
    // var args = [xhr.original.uri] // Other args needed ever?

    return fetcher.doneFetch(options, this.response)
  }
}
N3Handler.pattern = new RegExp('(application|text)/(x-)?(rdf\\+)?(n3|turtle)')

const HANDLERS = {
  RDFXMLHandler, XHTMLHandler, XMLHandler, HTMLHandler, TextHandler, N3Handler
}

class Fetcher {
  constructor (store, options = {}) {
    this.store = store
    this.timeout = options.timeout || 30000
    this.fetch = options.fetch || require('node-fetch')
    this.appNode = this.store.bnode() // Denoting this session
    this.store.fetcher = this // Bi-linked
    this.requested = {}
    // this.requested[uri] states:
    //   undefined     no record of web access or records reset
    //   true          has been requested, fetch in progress
    //   'done'        received, Ok
    //   401           Not logged in
    //   403           HTTP status unauthorized
    //   404           Resource does not exist. Can be created etc.
    //   'redirected'  In attempt to counter CORS problems retried.
    //   'parse_error' Parse error
    //   'unsupported_protocol'  URI is not a protocol Fetcher can deal with
    //   other strings mean various other errors.
    //
    this.redirectedTo = {} // When 'redirected'
    this.fetchCallbacks = {} // fetchCallbacks[uri].push(callback)

    this.nonexistant = {} // keep track of explicit 404s -> we can overwrite etc
    this.lookedUp = {}
    this.handlers = []
    this.mediatypes = {
      'image/*': { 'q': 0.9 },
      '*/*': { 'q': 0.1 }  // Must allow access to random content
    }

    // Util.callbackify(this, ['request', 'recv', 'headers', 'load', 'fail',
    //   'refresh', 'retract', 'done'])
    // In switching to fetch(), 'recv', 'headers' and 'load' do not make sense
    Util.callbackify(this, ['request', 'fail', 'refresh', 'retract', 'done'])

    Object.keys(HANDLERS).map(key => this.addHandler(HANDLERS[key]))
  }

  static crossSiteProxy (uri) {
    if (Fetcher.crossSiteProxyTemplate) {
      return Fetcher.crossSiteProxyTemplate
        .replace('{uri}', encodeURIComponent(uri))
    } else {
      return undefined
    }
  }

  /**
   * @param uri {string}
   *
   * @returns {string}
   */
  static offlineOverride (uri) {
    // Map the URI to a localhost proxy if we are running on localhost
    // This is used for working offline, e.g. on planes.
    // Is the script itself is running in localhost, then access all
    //   data in a localhost mirror.
    // Do not remove without checking with TimBL
    let requestedURI = uri

    if (typeof tabulator !== 'undefined' &&
      tabulator.preferences.get('offlineModeUsingLocalhost')) {
      if (requestedURI.slice(0, 7) === 'http://' && requestedURI.slice(7, 17) !== 'localhost/') {
        requestedURI = 'http://localhost/' + requestedURI.slice(7)
        log.warn('Localhost kludge for offline use: actually getting <' +
          requestedURI + '>')
      } else {
        // log.warn("Localhost kludge NOT USED <" + requestedURI + ">")
      }
    } else {
      // log.warn("Localhost kludge OFF offline use: actually getting <" +
      //   requestedURI + ">")
    }

    return requestedURI
  }

  static proxyIfNecessary (uri) {
    if (typeof tabulator !== 'undefined' && tabulator.isExtension) {
      return uri
    } // Extension does not need proxy

    if (typeof $SolidTestEnvironment !== 'undefined' &&
      $SolidTestEnvironment.localSiteMap) {
      // nested dictionaries of URI parts from origin down
      let hostpath = uri.split('/').slice(2) // the bit after the //

      const lookup = (parts, index) => {
        let z = index[parts.shift()]

        if (!z) { return null }

        if (typeof z === 'string') {
          return z + parts.join('/')
        }

        if (!parts) { return null }

        return lookup(parts, z)
      }

      const y = lookup(hostpath, $SolidTestEnvironment.localSiteMap)

      if (y) {
        return y
      }
    }

    // browser does 2014 on as https browser script not trusted
    // If the web app origin is https: then the mixed content rules
    // prevent it loading insecure http: stuff so we need proxy.
    if (Fetcher.crossSiteProxyTemplate &&
        typeof document !== 'undefined' && document.location &&
        ('' + document.location).slice(0, 6) === 'https:' && // origin is secure
        uri.slice(0, 5) === 'http:') { // requested data is not
      return Fetcher.crossSiteProxyTemplate
        .replace('{uri}', encodeURIComponent(uri))
    }

    return uri
  }

  /**
   * Tests whether the uri's protocol is supported by the Fetcher.
   *
   * @param uri {string}
   *
   * @returns {boolean}
   */
  static unsupportedProtocol (uri) {
    let pcol = Uri.protocol(uri)

    return (pcol === 'tel' || pcol === 'mailto' || pcol === 'urn')
  }

  /**
   * @param requestedURI {string}
   * @param options {Object}
   *
   * @returns {boolean}
   */
  static withCredentials (requestedURI, options = {}) {
    // 2014 problem:
    // XMLHttpRequest cannot load http://www.w3.org/People/Berners-Lee/card.
    // A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin'
    //   header when the credentials flag is true.
    // @ Many ontology files under http: and need CORS wildcard ->
    //   can't have withCredentials

    // @@ Kludge -- need for webid which typically is served from https
    let withCredentials = requestedURI.startsWith('https:')

    if (options.withCredentials !== undefined) {
      withCredentials = options.withCredentials
    }

    return withCredentials
  }

  /**
   * Promise-based load function
   *
   * NamedNode -> Promise of xhr
   * uri string -> Promise of xhr
   * Array of the above -> Promise of array of xhr
   *
   * @@ todo: If p1 is array then sequence or parallel fetch of all
   *
   * @param uri {Array<Node>|Array<string>|Node|string}
   *
   * @param [options={}] {Object}
   *
   * @param [options.fetch] {Function}
   *
   * @param [options.referringTerm] {Node} Referring term, the resource which
   *   referred to this (for tracking bad links)
   *
   * @param [options.forceContentType] {string} Override the incoming header to
   *   force the data to be treated as this content-type
   *
   * @param [options.force] {boolean} Load the data even if loaded before.
   *   Also sets the `Cache-Control:` header to `no-cache`
   *
   * @param [options.baseURI=docuri] {Node|string} Original uri to preserve
   *   through proxying etc (`xhr.original`).
   *
   * @param [options.proxyUsed] {boolean} Whether this request is a retry via
   *   a proxy (generally done from an error handler)
   *
   * @param [options.withCredentials] {boolean} flag for XHR/CORS etc
   *
   * @param [options.clearPreviousData] {boolean} Before we parse new data,
   *   clear old, but only on status 200 responses
   *
   * @param [options.noMeta] {boolean} Prevents the addition of various metadata
   *   triples (about the fetch request) to the store
   *
   * @param [options.noRDFa] {boolean}
   *
   * @returns {Promise}
   */
  load (uri, options = {}) {
    if (uri instanceof Array) {
      return Promise.all(
        uri.map(x => { return this.load(x, options) })
      )
    }

    return Promise
      .race([
        this.setXHRTimeout(uri, this.timeout),
        this.fetchUri(uri, options)
      ])

    // return new Promise((resolve, reject) => {
    //   this.requestURI(uri, options.referringTerm, options, (ok, message, xhr) => {
    //     if (ok) {
    //       resolve(xhr)
    //     } else {
    //       reject(new Error(message))
    //     }
    //   })
    // })
  }

  /**
   * (The promise chain ends in either a `failFetch()` or a `doneFetch()`)
   *
   * @param uri {Node|string}
   * @param [options={}] {Object}
   *
   * @returns {Promise<Object>} fetch() result or an { error, status } object
   */
  fetchUri (uri, options = {}) {
    let docuri = uri.uri || uri
    docuri = docuri.split('#')[0]
    let kb = this.store

    if (Fetcher.unsupportedProtocol(docuri)) {
      return this.failFetch(options, 'Unsupported protocol', 'unsupported_protocol')
    }

    options.resource = kb.sym(docuri) // This might be proxified
    options.baseURI = options.baseURI || docuri // Preserve though proxying etc
    options.original = kb.sym(options.baseURI)
    options.headers = options.headers || {}
    options.req = kb.bnode()
    if (options.force) { options.cache = 'no-cache' }

    let acceptString = this.acceptString()
    options.headers['accept'] = acceptString
    this.addStatus(options.req, 'Accept: ' + acceptString)

    let state = this.getState(docuri)
    if (!options.force) {
      if (state === 'fetched') {  // URI already fetched and added to store
        return this.doneFetch(options, { status: 200, ok: true })
      }
      if (state === 'failed') {
        return this.failFetch(options, 'Previously failed: ' +
          this.requested[docuri], this.requested[docuri])
      }
    } else {
      delete this.nonexistant[docuri]
    }

    this.fireCallbacks('request', [docuri])

    // if (state === 'requested') {
    //   return // Don't ask again - wait for existing call
    // } else {
    //   this.requested[docuri] = true  // mark this uri as 'requested'
    // }
    this.requested[docuri] = true  // mark this uri as 'requested'

    let requestedURI = Fetcher.offlineOverride(docuri)
    options.requestedURI = requestedURI

    if (Fetcher.withCredentials(requestedURI, options)) {
      options.credentials = 'include'
    }

    let actualProxyURI = Fetcher.proxyIfNecessary(requestedURI)
    options.actualProxyURI = actualProxyURI

    if (!options.noMeta) {
      this.addRequestMeta(docuri, options)
    }

    return this.fetch(actualProxyURI, options)
      .then(response => this.handleResponse(response, docuri, options))
      .catch(error => this.retryOnError(error, docuri, options))
  }

  /**
   * Asks for a doc to be loaded if necessary then calls back
   *
   * Calling methods:
   *   nowOrWhenFetched (uri, userCallback)
   *   nowOrWhenFetched (uri, options, userCallback)
   *   nowOrWhenFetched (uri, referringTerm, userCallback, options)  <-- old
   *   nowOrWhenFetched (uri, referringTerm, userCallback) <-- old
   *
   *  Options include:
   *   referringTerm    The document in which this link was found.
   *                    this is valuable when finding the source of bad URIs
   *   force            boolean.  Never mind whether you have tried before,
   *                    load this from scratch.
   *   forceContentType Override the incoming header to force the data to be
   *                    treated as this content-type.
   */
  nowOrWhenFetched (uri, p2, userCallback, options = {}) {
    uri = uri.uri || uri // allow symbol object or string to be passed

    if (typeof p2 === 'function') {
      // nowOrWhenFetched (uri, userCallback)
      userCallback = p2
    } else if (typeof p2 === 'undefined') { // original calling signature
      // referringTerm = undefined
    } else if (p2 instanceof NamedNode) {
      // referringTerm = p2
      options.referringTerm = p2
    } else {
      // nowOrWhenFetched (uri, options, userCallback)
      options = p2
    }

    this.fetchUri(uri, options)
      .then(result => {
        if (userCallback) {
          userCallback(true, null, result)
        }
      })
      .catch(err => {
        console.log(err)
        userCallback(false, err.message)
      })

    // this.requestURI(uri, options.referringTerm, options, userCallback)
  }

  get (uri, p2, userCallback, options) {
    this.nowOrWhenFetched(uri, p2, userCallback, options)
  }

  /**
   * Records a status message (as a literal node) by appending it to the
   * request's metadata status collection.
   *
   * @param req {BlankNode}
   * @param statusMessage {string}
   */
  addStatus (req, statusMessage) {
    // <Debug about="parsePerformance">
    let now = new Date()
    statusMessage = '[' + now.getHours() + ':' + now.getMinutes() + ':' +
      now.getSeconds() + '.' + now.getMilliseconds() + '] ' + statusMessage
    // </Debug>
    let kb = this.store

    let statusNode = kb.the(req, ns.link('status'))
    if (statusNode && statusNode.append) {
      statusNode.append(kb.literal(statusMessage))
    } else {
      log.warn('web.js: No list to add to: ' + statusNode + ',' + statusMessage)
    }
  }

  /**
   * Records errors in the system on failure:
   *
   *  - Adds an entry to the request status collection
   *  - Adds an error triple with the fail message to the metadata
   *  - Fires the 'fail' callback
   *  - Returns an error result object
   *
   * @param options {Object}
   * @param errorMessage {string}
   * @param statusCode {number}
   *
   * @returns {Promise<Object>}
   */
  failFetch (options, errorMessage, statusCode) {
    this.addStatus(options.req, errorMessage)

    if (!options.noMeta) {
      this.store.add(options.original, ns.link('error'), errorMessage)
    }

    if (!options.resource.sameTerm(options.original)) {
      console.log('@@ Recording failure original ' + options.original +
        '( as ' + options.resource + ') : ' + statusCode)
    } else {
      console.log('@@ Recording failure for ' + options.original + ': ' + statusCode)
    }

    // changed 2015 was false
    this.requested[Uri.docpart(options.original.uri)] = statusCode

    this.fireCallbacks('fail', [options.original.uri, errorMessage])

    return Promise.resolve({
      error: errorMessage,
      status: statusCode
    })
  }

  // in the why part of the quad distinguish between HTML and HTTP header
  // Reverse is set iif the link was rev= as opposed to rel=
  linkData (originalUri, rel, uri, why, reverse) {
    if (!uri) return
    let kb = this.store
    let predicate
    // See http://www.w3.org/TR/powder-dr/#httplink for describedby 2008-12-10
    let obj = kb.sym(Uri.join(uri, originalUri.uri))

    if (rel === 'alternate' || rel === 'seeAlso' || rel === 'meta' ||
        rel === 'describedby') {
      if (obj.uri === originalUri.uri) { return }
      predicate = ns.rdfs('seeAlso')
    } else if (rel === 'type') {
      predicate = kb.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    } else {
      // See https://www.iana.org/assignments/link-relations/link-relations.xml
      // Alas not yet in RDF yet for each predicate
      /// encode space in e.g. rel="shortcut icon"
      predicate = kb.sym(
        Uri.join(encodeURIComponent(rel),
          'http://www.iana.org/assignments/link-relations/')
      )
    }
    if (reverse) {
      kb.add(obj, predicate, originalUri, why)
    } else {
      kb.add(originalUri, predicate, obj, why)
    }
  }

  parseLinkHeader (linkHeader, originalUri, reqNode) {
    if (!linkHeader) { return }

    const linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g
    const paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g

    const matches = linkHeader.match(linkexp)

    for (let i = 0; i < matches.length; i++) {
      let split = matches[i].split('>')
      let href = split[0].substring(1)
      let ps = split[1]
      let s = ps.match(paramexp)
      for (let j = 0; j < s.length; j++) {
        let p = s[j]
        let paramsplit = p.split('=')
        // var name = paramsplit[0]
        let rel = paramsplit[1].replace(/["']/g, '') // '"
        this.linkData(originalUri, rel, href, reqNode)
      }
    }
  }

  doneFetch (options, response) {
    this.addStatus(options.req, 'Done.')
    this.requested[options.original.uri] = 'done'

    this.fireCallbacks('done', [options.original.uri])

    return response
  }

  /**
   * Note two nodes are now smushed
   * If only one was flagged as looked up, then the new node is looked up again,
   * which will make sure all the URIs are dereferenced
   */
  nowKnownAs (was, now) {
    if (this.lookedUp[was.uri]) {
      // Transfer userCallback
      if (!this.lookedUp[now.uri]) {
        this.lookUpThing(now, was)
      }
    } else if (this.lookedUp[now.uri]) {
      if (!this.lookedUp[was.uri]) {
        this.lookUpThing(was, now)
      }
    }
  }

  /**
   * Returns promise of XHR
   * Writes back to the web what we have in the store for this uri
   *
   * @param uri {Node|string}
   * @param [options={}]
   *
   * @returns {Promise}
   */
  putBack (uri, options = {}) {
    uri = uri.uri || uri // Accept object or string
    let doc = new NamedNode(uri).doc() // strip off #
    options.data = serialize(doc, this.store, doc.uri,
      options.contentType || 'text/turtle')
    return this.webOperation('PUT', uri, options)
  }

  /**
   * Returns promise of XHR
   *
   * @param method
   * @param uri
   * @param options
   *
   * @returns {Promise<XMLHttpRequest>}
   */
  webOperation (method, uri, options = {}) {
    uri = uri.uri || uri
    uri = Fetcher.proxyIfNecessary(uri)
    let kb = this.store

    return new Promise((resolve, reject) => {
      let xhr = this.xhr()
      xhr.options = options
      xhr.original = kb.sym(uri)
      xhr.resource = kb.sym(uri)
      xhr.req = kb.bnode()

      if (!options.noMeta) {
        this.addRequestMeta(uri, xhr)
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) { // Note: a 404 can be not a failure
          let ok = (!xhr.status || (xhr.status >= 200 && xhr.status < 300))
          if (!options.noMeta && typeof tabulator !== 'undefined') {
            this.saveResponseMetadata(xhr)
          }
          if (ok) {
            resolve(xhr)
          } else {
            reject(new Error(xhr.status + ' ' + xhr.statusText))
          }
        }
      }
      xhr.open(method, uri, true)
      xhr.setRequestHeader('Content-type', options.contentType || 'text/turtle')
      xhr.send(options.data ? options.data : undefined)
    })
  }

  /**
   * Looks up something.
   * Looks up all the URIs a things has.
   *
   * @param term {Node} canonical term for the thing whose URI is
   *   to be dereferenced
   * @param rterm {Node} the resource which referred to this
   *   (for tracking bad links)
   * @param options {Object} (old: force parameter) or dictionary of options
   * @param options.force {boolean} Load the data even if loaded before
   *
   * @param oneDone {Function} is called as callback(ok, errorbody, xhr)
   *   for each one
   * @param allDone {Function} is called as callback(ok, errorbody)
   *   for all of them
   *
   * @returns {number} Number of URIs fetched
   */
  lookUpThing (term, rterm, options, oneDone, allDone) {
    let uris = this.store.uris(term) // Get all URIs
    let success = true
    let errors = ''
    let outstanding = {}
    let force

    if (options === false || options === true) { // Old signature
      force = options
      options = { force: force }
    } else {
      if (options === undefined) { options = {} }
      // force = !!options.force
    }

    if (uris) {
      for (let i = 0; i < uris.length; i++) {
        let u = uris[i]
        outstanding[u] = true
        this.lookedUp[u] = true

        this.requestURI(Uri.docpart(u), rterm, options, (ok, body, xhr) => {
          if (ok) {
            if (oneDone) { oneDone(true, u) }
          } else {
            if (oneDone) { oneDone(false, body) }
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
    }
    return uris.length
  }

  /**
   * Looks up response header.
   *
   * @param doc
   * @param header
   *
   * @returns {Array|undefined} a list of header values found in a stored HTTP
   *   response, or [] if response was found but no header found,
   *   or undefined if no response is available.
   */
  getHeader (doc, header) {
    const kb = this.store
    const requests = kb.each(undefined, ns.link('requestedURI'), doc.uri)

    for (let r = 0; r < requests.length; r++) {
      let request = requests[r]
      if (request !== undefined) {
        let response = kb.any(request, ns.link('response'))

        if (response !== undefined) {
          let results = kb.each(response, ns.httph(header.toLowerCase()))

          if (results.length) {
            return results.map(v => { return v.value })
          }

          return []
        }
      }
    }
    return undefined
  }

  saveResponseMetadata (response, options) {
    const kb = this.store

    let responseNode = kb.bnode()

    kb.add(options.req, ns.link('responseNode'), responseNode)
    kb.add(responseNode, ns.http('status'),
      kb.literal(response.status), responseNode)
    kb.add(responseNode, ns.http('statusText'),
      kb.literal(response.statusText), responseNode)

    if (!options.resource.uri.startsWith('http')) {
      return responseNode
    }

    // Save the response headers
    response.headers.forEach((value, header) => {
      kb.add(responseNode, ns.httph(header), value, responseNode)

      if (header === 'content-type') {
        kb.add(options.resource, ns.rdf('type'), Util.mediaTypeClass(value), responseNode)
      }
    })

    return responseNode
  }

  objectRefresh (term) {
    let uris = this.store.uris(term) // Get all URIs
    if (typeof uris !== 'undefined') {
      for (let i = 0; i < uris.length; i++) {
        this.refresh(this.store.sym(Uri.docpart(uris[i])))
        // what about rterm?
      }
    }
  }

  refresh (term, userCallback) { // sources_refresh
    this.fireCallbacks('refresh', arguments)
    this.requestURI(term.uri, undefined,
      { force: true, clearPreviousData: true }, userCallback)
  }

  retract (term) { // sources_retract
    this.store.removeMany(undefined, undefined, undefined, term)
    if (term.uri) {
      delete this.requested[Uri.docpart(term.uri)]
    }
    this.fireCallbacks('retract', arguments)
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

  isPending (docuri) { // sources_pending
    // doing anyStatementMatching is wasting time
    // if it's not pending: false -> flailed
    //   'done' -> done 'redirected' -> redirected
    return this.requested[docuri] === true
  }

  /**
   * @deprecated use IndexedFormula.removeDocument(doc)
   */
  unload (term) {
    this.store.removeMany(undefined, undefined, undefined, term)
    delete this.requested[term.uri] // So it can be loaded again
  }

  webCopy (here, there, contentType) {
    here = here.uri || here

    return this.webOperation('GET', here)
      .then((xhr) => {
        return this.webOperation(
          'PUT', // change to binary from text
          there, { data: xhr.responseText, contentType })
      })
  }

  addHandler (handler) {
    this.handlers.push(handler)
    handler.register(this)
  }

  switchHandler (name, xhr, cb, args) {
    let Handler = HANDLERS[name]

    if (!Handler) {
      throw new Error('web.js: switchHandler: name=' + name + ' , ' +
        'this.handlers =' + this.handlers + '\n' +
        'switchHandler: switching to ' + Handler + '; sf=' + this +
        '; typeof Fetcher=' + typeof Fetcher +
        ';\n\t Fetcher.HTMLHandler=' + Fetcher.HTMLHandler + '\n' +
        '\n\tsf.handlers=' + this.handlers + '\n')
    }
    (new Handler(args)).initHandler(xhr, this)
    xhr.handle(cb)
  }

  checkCredentialsRetry (docuri, rterm, xhr) {
    if (!xhr.withCredentials) { return false }  // not dealt with

    if (xhr.retriedWithNoCredentials) {
      return true
    }

    console.log('web: Retrying with no credentials for ' + xhr.resource)

    xhr.retriedWithNoCredentials = true // protect against being called twice
    xhr.abort()
    xhr.aborted = true

    delete this.requested[docuri] // forget the original request happened

    let newOptions = Object.assign({}, xhr.options, { withCredentials: false })

    this.addStatus(xhr.req,
      'Abort: Will retry with credentials SUPPRESSED to see if that helps')

    // userCallback is already registered with this.fetchCallbacks
    this.requestURI(docuri, rterm, newOptions)
    return true
  }

  /**
   * Tests whether a request is being made to a cross-site URI (for purposes
   * of retrying with a proxy)
   *
   * @param uri {string}
   *
   * @returns {boolean}
   */
  isCrossSite (uri) {
    // Mashup situation, not node etc
    if (typeof document === 'undefined' || !document.location) {
      return false
    }

    const hostpart = Uri.hostpart
    const here = '' + document.location
    return hostpart(here) && hostpart(uri) && hostpart(here) !== hostpart(uri)
  }

  retryOnError (response, docuri, options) {
    console.log('RETRYING ON ERROR:', response)
  }

  onerrorFactory (xhr, docuri, rterm) {
    return () => {
      xhr.onErrorWasCalled = true // debugging and may need it

      if (xhr.status === 401 || xhr.status === 403 || xhr.status === 404) {
        // Not an error; send to the state change handler to deal with
        return this.onreadystatechangeFactory(xhr, docuri, rterm)()
      }

      if (this.isCrossSite(docuri)) {
        // Make sure we haven't retried already
        if (this.checkCredentialsRetry(docuri, rterm, xhr)) {
          return
        }

        // Now attempt retry via proxy
        let proxyUri = Fetcher.crossSiteProxy(docuri)

        if (proxyUri && !xhr.proxyUsed) {
          console.log('web: Direct failed so trying proxy ' + proxyUri)

          xhr.options.proxyUsed = true

          return this.redirectTo(proxyUri, xhr)
        }
      }

      // This is either not a CORS error, or retries have been made
      this.failFetch(xhr, `Request failed: ${xhr.status} ${xhr.statusText}`)
    }
  }

  // deduce some things from the HTTP transaction
  addType (rdfType, req, kb, loc) { // add type to all redirected resources too
    let prev = req
    if (loc) {
      const docURI = kb.any(prev, ns.link('requestedURI'))
      if (docURI !== loc) {
        kb.add(kb.sym(loc), ns.rdf('type'), rdfType, this.appNode)
      }
    }
    for (;;) {
      const doc = kb.any(prev, ns.link('requestedURI'))
      if (doc && doc.value) {
        kb.add(kb.sym(doc.value), ns.rdf('type'), rdfType, this.appNode)
      } // convert Literal
      prev = kb.any(undefined, kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'), prev)
      if (!prev) { break }
      var response = kb.any(prev, kb.sym('http://www.w3.org/2007/ont/link#response'))
      if (!response) { break }
      var redirection = kb.any(response, kb.sym('http://www.w3.org/2007/ont/http#status'))
      if (!redirection) { break }
      if (redirection !== '301' && redirection !== '302') { break }
    }
  }

  /**
   * Handles XHR response
   *
   * @param response {Response} fetch() response object
   * @param docuri {string}
   * @param options {Object}
   */
  handleResponse (response, docuri, options) {
    const kb = this.store
    const headers = response.headers

    const reqNode = options.req

    const responseNode = this.saveResponseMetadata(response, options)

    const contentLocation = headers.get('content-location')

    const contentType = this.normalizedContentType(options, headers) || ''

    // this.fireCallbacks('recv', xhr.args)
    // this.fireCallbacks('headers', [{uri: docuri, headers: xhr.headers}])

    // Check for masked errors (CORS, etc)
    if (response.status === 0) {
      console.log('Masked error - status 0 for ' + docuri)
      return this.retryOnError(response, docuri, options)
    }

    if (response.status >= 400) {
      if (response.status === 404) {
        this.nonexistant[docuri] = true
      }

      return this.saveErrorResponse(response, responseNode)
        .then(() => {
          let errorMessage = 'HTTP error for ' + options.resource + ': ' +
            response.status + ' ' + response.statusText

          return this.failFetch(options, errorMessage, response.status)
        })
    }

    if (response.status === 200) {
      this.addType(ns.link('Document'), reqNode, kb, contentLocation)

      // Before we parse new data clear old but only on 200
      if (options.clearPreviousData) {
        kb.removeDocument(options.resource)
      }

      let isImage = contentType.includes('image/') ||
        contentType.includes('application/pdf')

      if (contentType && isImage) {
        this.addType(kb.sym('http://purl.org/dc/terms/Image'), reqNode, kb,
          contentLocation)
      }
    }

    // If we have already got the thing at this location, abort
    if (contentLocation) {
      let udoc = Uri.join(docuri, contentLocation)

      if (!options.force && udoc !== docuri && this.requested[udoc] === 'done') {
        // we have already fetched this
        // should we smush too?
        // log.info("HTTP headers indicate we have already" + " retrieved " +
        // xhr.resource + " as " + udoc + ". Aborting.")
        return this.doneFetch(options, response)
      }

      this.requested[udoc] = true
    }

    this.parseLinkHeader(headers.get('link'), options.original, reqNode)

    let handler = this.handlerForContentType(contentType, response)

    if (!handler) {
      //  Not a problem, we just don't extract data
      this.addStatus(reqNode, 'Fetch over. No data handled.')
      return this.doneFetch(options, response)
    }

    return response.text()
      .then(responseText => handler.parse(this, responseText, options))
  }

  saveErrorResponse (response, responseNode) {
    let kb = this.store

    return response.text()
      .then(content => {
        if (content.length > 10) {
          kb.add(responseNode, ns.http('content'), kb.literal(content), responseNode)
        }
      })
  }

  /**
   * @param contentType {string}
   *
   * @returns {Handler|null}
   */
  handlerForContentType (contentType, response) {
    if (!contentType) {
      return null
    }

    let Handler = this.handlers.find(handler => {
      return contentType.match(handler.pattern)
    })

    return Handler ? new Handler(response) : null
  }

  /**
   * @param uri {string}
   *
   * @returns {string}
   */
  guessContentType (uri) {
    return CONTENT_TYPE_BY_EXT[uri.split('.').pop()]
  }

  /**
   * @param options {Object}
   * @param headers {Headers}
   *
   * @returns {string}
   */
  normalizedContentType (options, headers) {
    if (options.forceContentType) {
      return options.forceContentType
    }

    let contentType = headers.get('content-type')

    if (!contentType || contentType.includes('application/octet-stream')) {
      let guess = this.guessContentType(options.resource.uri)

      if (guess) {
        return guess
      }
    }

    let protocol = Uri.protocol(options.resource.uri)

    if (!contentType && ['file', 'chrome'].includes(protocol)) {
      return 'text/xml'
    }

    return contentType
  }

  /**
   * Sends a new request to the specified uri. Aborts the old request (and
   * marks it at redirected). (Extracted from `onerrorFactory()`)
   *
   * @param newURI {string}
   * @param xhr {XMLHttpRequest}
   *
   * @returns {XMLHttpRequest|undefined}
   */
  redirectTo (newURI, xhr) {
    this.addStatus(xhr.req, 'BLOCKED -> Cross-site Proxy to <' + newURI + '>')

    if (xhr.aborted) {
      return
    }

    const kb = this.store
    const oldReq = xhr.req  // request metadata blank node

    if (!xhr.options.noMeta) {
      kb.add(oldReq, ns.link('redirectedTo'), kb.sym(newURI), oldReq)

      this.addRequestMeta(newURI, xhr)
      this.addStatus(oldReq, 'redirected to new request') // why
    }

    xhr.abort()
    xhr.aborted = true

    xhr.redirected = true
    this.requested[xhr.resource.uri] = 'redirected'
    this.redirectedTo[xhr.resource.uri] = newURI

    // Nothing needs to happen to the callbacks on redirection;
    // both doneFetch and failFetch dispatch the original uri's callbacks only
    // old:
    // if (this.fetchCallbacks[xhr.resource.uri]) {
    //   if (!this.fetchCallbacks[newURI]) {
    //     this.fetchCallbacks[newURI] = []
    //   }
    //   // this.fetchCallbacks[newURI] === this.fetchCallbacks[newURI].concat(this.fetchCallbacks[xhr.resource.uri])
    //   delete this.fetchCallbacks[xhr.resource.uri]
    // }

    this.fireCallbacks('redirected', xhr.args) // Are these args right? @@@

    let options = Object.assign({}, xhr.options, { baseURI: xhr.original })

    const newXhr = this.requestURI(newURI, xhr.resource, options, xhr.userCallback)

    if (newXhr) {
      if (!options.noMeta) {
        kb.add(oldReq, ns.link('redirectedRequest'), newXhr.req, this.appNode)
      }
    }

    return newXhr
  }

  /**
   * Requests a document URI and arranges to load the document. This is the main
   * fetching function, used by `load()` and `nowOrWhenFetched()`.
   *
   * @param docuri {Node|string} Term for the thing whose URI is to be dereferenced
   *
   * @param rterm {Node} Referring term, the resource which referred to this
   *   (for tracking bad links)
   *
   * @param [options={}] {Object}
   *
   * @param [options.force] {boolean} Load the data even if loaded before.
   *   Also sets the `Cache-Control:` header to `no-cache`
   *
   * @param [options.baseURI=docuri] {Node|string} Original uri to preserve
   *   through proxying etc (`xhr.original`).
   *
   * @param [options.proxyUsed] {boolean} Whether this request is a retry via
   *   a proxy (generally done from an error handler)
   *
   * @param [options.withCredentials] {boolean} flag for XHR/CORS etc
   *
   * @param [options.clearPreviousData] {boolean} Before we parse new data,
   *   clear old, but only on status 200 responses
   *
   * @param [options.forceContentType] {string} Override the incoming header to
   *   force the data to be treated as this content-type
   *
   * @param [options.noMeta] {boolean} Prevents the addition of various metadata
   *   triples (about the fetch request) to the store
   *
   * @param [options.noRDFa] {boolean}
   *
   * @param userCallback {Function} Called with (true) or (false, errorbody,
   *   {status: 400}) after load is done or failed
   *
   * This operation adds the following properties to the XHR object (downstream):
   *
   * - `xhr.handle` - The response parsing function registered by various Handler
   *     classes
   * - `xhr.options` - The `options` argument itself
   * - `xhr.req` - A Blank Node that acts as a subject for various additional
   *     metadata triples about the request itself (status, requestedUri, etc),
   *     if the `options.noMeta` flag is not set.
   * - `xhr.original` - A Named Node of `options.baseURI`
   * - `xhr.resource` - A Named Node of the `docuri` to be loaded
   * - `xhr.requestedURI` - Actual URI to be requested (could be proxied, etc)
   * - `xhr.actualProxyURI`
   * - `xhr.retriedWithNoCredentials` - Set by `checkCredentialsRetry()` to prevent
   *     multiple retries.
   * - `xhr.onErrorWasCalled`
   * - `xhr.proxyUsed` - Set when the proxy url is tried (to prevent retries)
   * - `xhr.aborted`
   * - `xhr.handleResponseDone`
   * - `xhr.redirected`
   * - `xhr.userCallback`
   * - `xhr.CORS_status`
   * - `xhr.channel` - In Tabulator/Firefox extension environment
   *
   * @returns {XMLHttpRequest|undefined} The xhr object for the HTTP access,
   *   undefined if the protocol is not a look-up protocol,
   *   or URI has already been loaded
   */
  requestURI (docuri, rterm, options, userCallback) {
    docuri = docuri.uri || docuri // NamedNode or string
    docuri = docuri.split('#')[0]

    if (typeof options === 'boolean') {
      options = { 'force': options } // Old signature
    }
    if (typeof options === 'undefined') {
      options = {}
    }

    options.baseURI = options.baseURI || docuri // Preserve though proxying etc
    options.userCallback = userCallback

    const args = arguments

    if (Fetcher.unsupportedProtocol(docuri)) {
      console.log('Unsupported protocol in: ' + docuri)
      return userCallback(false, 'Unsupported protocol', { 'status': 900 })
    }

    let state = this.getState(docuri)
    if (!options.force) {
      if (state === 'fetched') {
        return userCallback ? userCallback(true) : undefined
      }
      if (state === 'failed') {
        return userCallback
          ? userCallback(false, 'Previously failed. ' + this.requested[docuri],
            {'status': this.requested[docuri]})
          : undefined // An xhr standin
      }
    } else {
      delete this.nonexistant[docuri]
    }

    this.fireCallbacks('request', args)

    if (userCallback) {
      // Beyond this point, failure/success will be signaled via .fetchCallbacks
      this.addFetchCallback(docuri, userCallback)
    }

    if (state === 'requested') {
      return // Don't ask again - wait for existing call
    } else {
      this.requested[docuri] = true  // mark this uri as 'requested'
    }

    let requestedURI = Fetcher.offlineOverride(docuri)

    let actualProxyURI = Fetcher.proxyIfNecessary(requestedURI)

    const xhr = this.xhrFor(docuri, rterm, requestedURI, actualProxyURI, options, args)

    if (!options.noMeta) {
      this.addRequestMeta(docuri, xhr, rterm)
    }

    try {
      xhr.open('GET', actualProxyURI, this.async)
    } catch (err) {
      return this.failFetch(xhr, 'XHR open for GET failed for <' + requestedURI + '>:\n\t' + err)
    }

    if (options.force) { // must happen after open
      xhr.setRequestHeader('Cache-control', 'no-cache')
    }

    try {
      this.initExtensionCallbacks(xhr, rterm)  // tabulator / Firefox only
    } catch (err) {
      return this.failFetch(xhr, 'Error setting callbacks for extension redirects: ' + err)
    }

    try {
      let acceptString = this.acceptString()

      xhr.setRequestHeader('Accept', acceptString)
      this.addStatus(xhr.req, 'Accept: ' + acceptString)
    } catch (err) {
      return this.failFetch(xhr, "Can't set Accept header: " + err)
    }

    try {  // Fire
      xhr.send(null)
    } catch (err) {
      return this.failFetch(xhr, 'XHR send failed:' + err)
    }

    this.setXHRTimeout(xhr)

    this.addStatus(xhr.req, 'HTTP Request sent.')

    return xhr
  }

  /**
   * Creates, initializes and returns an XHR instance used by `requestURI()`.
   *
   * @param docuri {string}
   * @param rterm {NamedNode|string}
   * @param requestedURI {string}
   * @param actualProxyURI {string}
   * @param options {Object} requestURI `options` argument
   * @param args {Object} Arguments passed to requestURI
   *
   * @returns {XMLHttpRequest}
   */
  xhrFor (docuri, rterm, requestedURI, actualProxyURI, options, args) {
    const kb = this.store
    const xhr = this.xhr()

    xhr.req = kb.bnode()
    xhr.original = kb.sym(options.baseURI)
    xhr.options = options

    xhr.resource = kb.sym(docuri) // This might be proxified
    xhr.userCallback = options.userCallback

    // Setup the request
    xhr.onerror = this.onerrorFactory(xhr, docuri, rterm)
    xhr.onreadystatechange = this.onreadystatechangeFactory(xhr, docuri, rterm)
    xhr.timeout = this.timeout
    xhr.withCredentials = Fetcher.withCredentials(requestedURI, options)
    xhr.actualProxyURI = actualProxyURI
    xhr.proxyUsed = options.proxyUsed

    xhr.requestedURI = requestedURI

    xhr.ontimeout = () => {
      this.failFetch(xhr, 'requestTimeout')
    }
    return xhr
  }

  xhr () {
    return Util.XMLHTTPFactory()
  }

  setXHRTimeout () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.failFetch({}, 'Request timed out', 'timeout'))
      }, this.timeout)
    })

    // setTimeout(() => {
    //   if (xhr.readyState !== 4 && this.isPending(xhr.resource.uri)) {
    //     this.failFetch(xhr, 'requestTimeout')
    //   }
    // }, this.timeout)
  }

  addFetchCallback (uri, callback) {
    if (!this.fetchCallbacks[uri]) {
      this.fetchCallbacks[uri] = [ callback ]
    } else {
      this.fetchCallbacks[uri].push(callback)
    }
  }

  acceptString () {
    let acceptstring = ''

    for (let mediaType in this.mediatypes) {
      if (acceptstring !== '') {
        acceptstring += ', '
      }

      acceptstring += mediaType

      for (let property in this.mediatypes[mediaType]) {
        acceptstring += ';' + property + '=' + this.mediatypes[mediaType][property]
      }
    }

    return acceptstring
  }

  initExtensionCallbacks (xhr, rterm) {
    // Set redirect callback and request headers -- alas Firefox Extension Only
    if (typeof tabulator !== 'undefined' &&
        tabulator.isExtension && xhr.channel &&
        (Uri.protocol(xhr.resource.uri) === 'http' ||
         Uri.protocol(xhr.resource.uri) === 'https')) {
      xhr.channel.notificationCallbacks = this.channelNotificationCallbacks(xhr, rterm)
    }
  }

  /**
   *
   * @param docuri
   * @param options
   */
  addRequestMeta (docuri, options) {
    let req = options.req
    let kb = this.store
    let rterm = options.referringTerm

    if (rterm && rterm.uri) {
      kb.add(docuri, ns.link('requestedBy'), rterm.uri, this.appNode)
    }

    if (options.original && options.original.uri !== docuri) {
      kb.add(req, ns.link('orginalURI'), kb.literal(options.original.uri),
        this.appNode)
    }

    const now = new Date()
    const timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' +
      now.getSeconds() + '] '

    kb.add(req, ns.rdfs('label'),
      kb.literal(timeNow + ' Request for ' + docuri), this.appNode)
    kb.add(req, ns.link('requestedURI'), kb.literal(docuri), this.appNode)
    kb.add(req, ns.link('status'), kb.collection(), this.appNode)
  }

  channelNotificationCallbacks (xhr, rterm) {
    return {
      getInterface: (iid) => {
        if (iid.equals(Components.interfaces.nsIChannelEventSink)) {
          return {
            // See https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIChannelEventSink
            asyncOnChannelRedirect: (oldC, newC, flags, callback) => {
              if (xhr.aborted) return
              var kb = this.store
              var newURI = newC.URI.spec
              var oldreq = xhr.req
              this.addStatus(xhr.req, 'Redirected: ' + xhr.status + ' to <' + newURI + '>')
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
              if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

              if (xhr.status - 0 !== 303) kb.HTTPRedirects[xhr.resource.uri] = newURI // same document as
              if (xhr.status - 0 === 301 && rterm) { // 301 Moved
                var badDoc = Uri.docpart(rterm.uri)
                var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.'
                if (rterm) {
                  msg += ' Link in <' + badDoc + ' >should be changed'
                  kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, this.appNode)
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
              this.requested[xhr.resource.uri] = 'redirected'
              this.redirectedTo[xhr.resource.uri] = newURI

              let xhr2 = this.requestURI(newURI, xhr.resource, xhr.options, xhr.userCallback)
              if (xhr2) { // may be no XHR is other URI already loaded
                xhr2.original = xhr.original // use this for finding base
                if (xhr2.req) {
                  kb.add(
                    xhr.req,
                    kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                    xhr2.req,
                    this.appNode
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
  }

  // var updatesVia = new $rdf.UpdatesVia(this) // Subscribe to headers
// @@@@@@@@ This is turned off because it causes a websocket to be set up for ANY fetch
// whether we want to track it ot not. including ontologies loaed though the XSSproxy
}

module.exports = Fetcher
module.exports.HANDLERS = HANDLERS
