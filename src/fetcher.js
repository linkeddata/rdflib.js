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

const fetch = require('solid-auth-client').fetch

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
  dc: Namespace('http://purl.org/dc/elements/1.1/'),
  ldp: Namespace('http://www.w3.org/ns/ldp#')
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

    // console.log('@@ Creating new Fetcher. Store size: ' + store.statements.length)

    this._fetch = options.fetch || fetch

/*
    if (!this._fetch) {
      if (typeof window !== 'undefined') {
        Object.defineProperty(this, '_fetch', {
          // writable: false,
          get: function(){ return window.fetch.bind(window)},
          set: function(x){console.log("@@@@@@@@@@@@@@")}
        }
        )
        // this._fetch = window.fetch.bind(window)
      } else {
        this._fetch = require('node-fetch')
      }
    }
    */
    if (!this._fetch) {
      throw new Error('No _fetch function availble for Fetcher')
    }

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
    this.fetchQueue = {}
    this.fetchCallbacks = {} // fetchCallbacks[uri].push(callback)

    this.nonexistent = {} // keep track of explicit 404s -> we can overwrite etc
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

    var UI
    if (typeof window !== 'undefined' && window.panes && (UI = window.panes.UI) &&
      UI.preferences && UI.preferences.get('offlineModeUsingLocalhost')) {
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
    var UI
    if (typeof window !== 'undefined' && window.panes && (UI = window.panes.UI) && UI.isExtension) {
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
   * Promise-based fetch function
   *
   * @param uri {Array<NamedNode>|Array<string>|NamedNode|string}
   *
   * @param [options={}] {Object}
   *
   * @param [options.fetch] {Function}
   *
   * @param [options.referringTerm] {NamedNode} Referring term, the resource which
   *   referred to this (for tracking bad links)
   *
   * @param [options.contentType] {string} Provided content type (for writes)
   *
   * @param [options.forceContentType] {string} Override the incoming header to
   *   force the data to be treated as this content-type (for reads)
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
   * @returns {Promise<Result>}
   */
  fetch (uri, options = {}) {
    if (uri instanceof Array) {
      return Promise.all(
        uri.map(x => { return this.fetch(x, Object.assign({}, options)) })
      )
    }

    let docuri = uri.uri || uri
    docuri = docuri.split('#')[0]

    options = this.initFetchOptions(docuri, options)

    return this.pendingFetchPromise(docuri, options.baseURI, options)
  }

  /**
   * @param uri {string}
   * @param originalUri {string}
   * @param options {Object}
   * @returns {Promise<Result>}
   */
  pendingFetchPromise (uri, originalUri, options) {
    let pendingPromise

    // Check to see if some request is already dealing with this uri
    if (!options.force && this.fetchQueue[originalUri]) {
      pendingPromise = this.fetchQueue[originalUri]
    } else {
      pendingPromise = Promise
        .race([
          this.setRequestTimeout(uri, options),
          this.fetchUri(uri, options)
        ])
      this.fetchQueue[originalUri] = pendingPromise

      // Clean up the queued promise after a time, if it's resolved
      this.cleanupFetchRequest(originalUri, options, this.timeout)
    }

    return pendingPromise
  }

  cleanupFetchRequest (originalUri, options, timeout) {
    setTimeout(() => {
      if (!this.isPending(originalUri)) {
        delete this.fetchQueue[originalUri]
      }
    }, timeout)
  }

  load (uri, options) {
    return this.fetch(uri, options)
  }

  /**
   * @param uri {string}
   * @param options {Object}
   *
   * @returns {Object}
   */
  initFetchOptions (uri, options) {
    let kb = this.store

    let isGet = !options.method || options.method.toUpperCase() === 'GET'
    if (!isGet) {
      options.force = true
    }

    options.resource = kb.sym(uri) // This might be proxified
    options.baseURI = options.baseURI || uri // Preserve though proxying etc
    options.original = kb.sym(options.baseURI)
    options.req = kb.bnode()
    options.headers = options.headers || {}

    if (options.contentType) {
      options.headers['content-type'] = options.contentType
    }

    if (options.force) {
      options.cache = 'no-cache'
    }

    let acceptString = this.acceptString()
    options.headers['accept'] = acceptString

    let requestedURI = Fetcher.offlineOverride(uri)
    options.requestedURI = requestedURI

    if (Fetcher.withCredentials(requestedURI, options)) {
      options.credentials = 'include'
    }

    let actualProxyURI = Fetcher.proxyIfNecessary(requestedURI)
    if (requestedURI !== actualProxyURI) {
      options.proxyUsed = true
    }
    options.actualProxyURI = actualProxyURI

    return options
  }

  /**
   * (The promise chain ends in either a `failFetch()` or a `doneFetch()`)
   *
   * @param docuri {string}
   * @param options {Object}
   *
   * @returns {Promise<Object>} fetch() result or an { error, status } object
   */
  fetchUri (docuri, options) {
    if (!docuri) {
      return Promise.reject(new Error('Cannot fetch an empty uri'))
    }

    if (Fetcher.unsupportedProtocol(docuri)) {
      return this.failFetch(options, 'Unsupported protocol', 'unsupported_protocol')
    }

    let state = this.getState(docuri)

    if (!options.force) {
      if (state === 'fetched') {  // URI already fetched and added to store
        return Promise.resolve(
          this.doneFetch(options, {status: 200, ok: true, statusText: 'Already loaded into quadstore.'})
        )
      }
      if (state === 'failed') {
        return this.failFetch(options, 'Previously failed: ' + this.requested[docuri],
          this.requested[docuri])
      }
    } else {
      // options.force == true
      delete this.nonexistent[docuri]
    }

    this.fireCallbacks('request', [docuri])

    this.requested[docuri] = true  // mark this uri as 'requested'

    if (!options.noMeta) {
      this.saveRequestMetadata(docuri, options)
    }

    let { actualProxyURI } = options

    return this._fetch(actualProxyURI, options)
      .then(response => this.handleResponse(response, docuri, options),
            error => this.handleError(error, docuri, options))
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
   *
   *  Callback function takes:
   *
   *    ok               True if the fetch worked, and got a 200 response.
   *                     False if any error happened
   *
   *    errmessage       Text error message if not OK.
   *
   *    response         The fetch Response object (was: XHR) if there was was one
   *                     includes response.status as the HTTP status if any.
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

    // console.log('@@ Fetcher: call this.fetch : ' + uri)
    this.fetch(uri, options)
      .then(fetchResponse => {
        console.log('@@ nowOrWhenFetched: Resolved fetch: ok ' + fetchResponse.ok)
        if (userCallback) {
          if (fetchResponse) {
            if (fetchResponse.ok) {
              userCallback(fetchResponse.ok, fetchResponse.status, fetchResponse)
            } else {
              let oops = 'HTTP error: Status ' + fetchResponse.status + ' (' + fetchResponse.statusText + ') ' + fetchResponse.responseText
              console.log(oops + ' fetching ' + uri)
              userCallback(false, oops, fetchResponse)
            }
          } else {
            let oops = ('@@ nowOrWhenFetched:  no response object: ' + fetchResponse)
            console.log(oops)
            userCallback(false, oops)
          }
        }
      }, function (err) {
        console.log('@@ nowOrWhenFetched: REJECTED from fetch ' + err.message)
        userCallback(false, 'Rejection from fetch?! ' + err.message, null)
      })
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

    let isGet = !options.method || options.method.toUpperCase() === 'GET' ||
      options.method.toUpperCase() === 'HEAD'

    if (isGet) {  // only cache the status code on GET or HEAD
      this.requested[Uri.docpart(options.original.uri)] = statusCode

      this.fireCallbacks('fail', [options.original.uri, errorMessage])
    }

    return Promise.resolve({
      ok: false,
      error: errorMessage, // @@ Why does a response object have an "error" property?
      statusText: errorMessage,
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
      // encode space in e.g. rel="shortcut icon"
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

    const linkexp = /<[^>]*>\s*(\s*;\s*[^()<>@,;:"/[\]?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g
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

    response.req = options.req  // Set the request meta blank node

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

  webCopy (here, there, contentType) {
    return this.webOperation('GET', here)
      .then((result) => {
        return this.webOperation(
          'PUT', // change to binary from text
          there, { data: result.responseText, contentType })
      })
  }

  /**
   * @param uri {string}
   * @param [options] {Object}
   *
   * @returns {Promise<Response>}
   */
  delete (uri, options) {
    return this.webOperation('DELETE', uri, options)
      .then(response => {
        this.requested[uri] = 404
        this.nonexistent[uri] = true
        this.unload(this.store.sym(uri))

        return response
      })
  }

  /**
   * @param parentURI {string} URI of parent container
   * @param [folderName] {string} Optional folder name (slug)
   * @param [data] {string} Optional folder metadata
   *
   * @returns {Promise<Response>}
   */
  createContainer (parentURI, folderName, data) {
    let headers = {
      // Force the right mime type for containers
      'content-type': 'text/turtle',
      'link': ns.ldp('BasicContainer') + '; rel="type"'
    }

    if (folderName) {
      headers['slug'] = folderName
    }

    let options = { headers }

    if (data) {
      options.body = data
    }

    return this.webOperation('POST', parentURI, options)
  }

  /**
   * Returns promise of Response
   *
   * @param method
   * @param uri
   * @param options
   *
   * @returns {Promise<Response>}
   */
  webOperation (method, uri, options = {}) {
    options.method = method
    options.body = options.data || options.body
    options.force = true

    return this.fetch(uri, options)
  }

  /**
   * Looks up something.
   * Looks up all the URIs a things has.
   *
   * @param term {NamedNode} canonical term for the thing whose URI is
   *   to be dereferenced
   * @param rterm {NamedNode} the resource which referred to this
   *   (for tracking bad links)
   *
   * @returns {Promise}
   */
  lookUpThing (term, rterm) {
    let uris = this.store.uris(term)  // Get all URIs
    uris = uris.map(u => Uri.docpart(u))  // Drop hash fragments

    uris.forEach(u => {
      this.lookedUp[u] = true
    })

    return this.fetch(uris, { referringTerm: rterm })
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

  /**
   *
   * @param docuri
   * @param options
   */
  saveRequestMetadata (docuri, options) {
    let req = options.req
    let kb = this.store
    let rterm = options.referringTerm

    this.addStatus(options.req, 'Accept: ' + options.headers['accept'])

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

  saveResponseMetadata (response, options) {
    const kb = this.store

    let responseNode = kb.bnode()

    kb.add(options.req, ns.link('response'), responseNode)
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

    this.nowOrWhenFetched(term, { force: true, clearPreviousData: true },
      userCallback)
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

  unload (term) {
    this.store.removeDocument(term)
    delete this.requested[term.uri] // So it can be loaded again
  }

  addHandler (handler) {
    this.handlers.push(handler)
    handler.register(this)
  }

  retryNoCredentials (docuri, options) {
    console.log('web: Retrying with no credentials for ' + options.resource)

    options.retriedWithNoCredentials = true // protect against being called twice

    delete this.requested[docuri] // forget the original request happened

    let newOptions = Object.assign({}, options, { withCredentials: false })

    this.addStatus(options.req,
      'Abort: Will retry with credentials SUPPRESSED to see if that helps')

    return this.fetch(docuri, newOptions)
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

  /**
   * Called when there's a network error in fetch(), or a response
   * with status of 0.
   *
   * @param response {Response|Error}
   * @param docuri {string}
   * @param options {Object}
   *
   * @returns {Promise}
   */
  handleError (response, docuri, options) {
    if (this.isCrossSite(docuri)) {
      // Make sure we haven't retried already
      if (options.withCredentials && !options.retriedWithNoCredentials) {
        return this.retryNoCredentials(docuri, options)
      }

      // Now attempt retry via proxy
      let proxyUri = Fetcher.crossSiteProxy(docuri)

      if (proxyUri && !options.proxyUsed) {
        console.log('web: Direct failed so trying proxy ' + proxyUri)

        return this.redirectToProxy(proxyUri, options)
      }
    }

    var message
    if (response.message) {
      message = 'Fetch error: ' + response.message
    } else {
      message = `HTTP Error: ${response.status} (${response.statusText}) ${response.responseText}`
    }

    // This is either not a CORS error, or retries have been made
    return this.failFetch(options, message, response.status || 998)
  }

  // deduce some things from the HTTP transaction
  addType (rdfType, req, kb, locURI) { // add type to all redirected resources too
    let prev = req
    if (locURI) {
      var reqURI = kb.any(prev, ns.link('requestedURI'))
      if (reqURI && reqURI !== locURI) {
        kb.add(kb.sym(locURI), ns.rdf('type'), rdfType, this.appNode)
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

    const contentType = this.normalizedContentType(options, headers) || ''

    let contentLocation = headers.get('content-location')

    // this.fireCallbacks('recv', xhr.args)
    // this.fireCallbacks('headers', [{uri: docuri, headers: xhr.headers}])

    // Check for masked errors (CORS, etc)
    if (response.status === 0) {
      console.log('Masked error - status 0 for ' + docuri)
      return this.handleError(response, docuri, options)
    }

    if (response.status >= 400) {
      if (response.status === 404) {
        this.nonexistent[options.original.uri] = true
        this.nonexistent[docuri] = true
      }

      return this.saveErrorResponse(response, responseNode)
        .then(() => {
          let errorMessage = 'HTTP error for ' + options.resource + ': ' +
            response.status + ' ' + response.statusText

          return this.failFetch(options, errorMessage, response.status)
        })
    }

    var diffLocation = null
    var absContentLocation = null
    if (contentLocation) {
      absContentLocation = Uri.join(contentLocation, docuri)
      if (absContentLocation !== docuri) {
        diffLocation = absContentLocation
      }
    }
    if (response.status === 200) {
      this.addType(ns.link('Document'), reqNode, kb, docuri)
      if (diffLocation) {
        this.addType(ns.link('Document'), reqNode, kb,
          diffLocation)
      }

      // Before we parse new data clear old but only on 200
      if (options.clearPreviousData) {
        kb.removeDocument(options.resource)
      }

      let isImage = contentType.includes('image/') ||
        contentType.includes('application/pdf')

      if (contentType && isImage) {
        this.addType(kb.sym('http://purl.org/dc/terms/Image'), reqNode, kb,
          docuri)
        if (diffLocation) {
          this.addType(kb.sym('http://purl.org/dc/terms/Image'), reqNode, kb,
            diffLocation)
        }
      }
    }

    // If we have already got the thing at this location, abort
    if (contentLocation) {
      if (!options.force && diffLocation && this.requested[absContentLocation] === 'done') {
        // we have already fetched this
        // should we smush too?
        // log.info("HTTP headers indicate we have already" + " retrieved " +
        // xhr.resource + " as " + absContentLocation + ". Aborting.")
        return this.doneFetch(options, response)
      }

      this.requested[absContentLocation] = true
    }

    this.parseLinkHeader(headers.get('link'), options.original, reqNode)

    let handler = this.handlerForContentType(contentType, response)

    if (!handler) {
      //  Not a problem, we just don't extract data
      this.addStatus(reqNode, 'Fetch over. No data handled.')
      return this.doneFetch(options, response)
    }

    return response.text()
      .then(responseText => {
        response.responseText = responseText
        return handler.parse(this, responseText, options)
      })
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
   * Sends a new request to the specified uri. (Extracted from `onerrorFactory()`)
   *
   * @param newURI {string}
   * @param options {Object}
   *
   * @returns {Promise<Response>}
   */
  redirectToProxy (newURI, options) {
    this.addStatus(options.req, 'BLOCKED -> Cross-site Proxy to <' + newURI + '>')

    options.proxyUsed = true

    const kb = this.store
    const oldReq = options.req  // request metadata blank node

    if (!options.noMeta) {
      kb.add(oldReq, ns.link('redirectedTo'), kb.sym(newURI), oldReq)
      this.addStatus(oldReq, 'redirected to new request') // why
    }

    this.requested[options.resource.uri] = 'redirected'
    this.redirectedTo[options.resource.uri] = newURI

    let newOptions = Object.assign({}, options)
    newOptions.baseURI = options.resource.uri

    return this.fetchUri(newURI, newOptions)
      .then(response => {
        if (!newOptions.noMeta) {
          kb.add(oldReq, ns.link('redirectedRequest'), newOptions.req, this.appNode)
        }

        return response
      })
  }

  setRequestTimeout (uri, options) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.isPending(uri) &&
            !options.retriedWithNoCredentials &&
            !options.proxyUsed) {
          resolve(this.failFetch(options, `Request to ${uri} timed out`, 'timeout'))
        }
      }, this.timeout)
    })
  }

  addFetchCallback (uri, callback) {
    if (!this.fetchCallbacks[uri]) {
      this.fetchCallbacks[uri] = [callback]
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
  // var updatesVia = new $rdf.UpdatesVia(this) // Subscribe to headers
// @@@@@@@@ This is turned off because it causes a websocket to be set up for ANY fetch
// whether we want to track it ot not. including ontologies loaed though the XSSproxy
}

module.exports = Fetcher
module.exports.HANDLERS = HANDLERS
module.exports.CONTENT_TYPE_BY_EXT = CONTENT_TYPE_BY_EXT
