"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _store = _interopRequireDefault(require("./store"));
var _log = _interopRequireDefault(require("./log"));
var _n3parser = _interopRequireDefault(require("./n3parser"));
var _namedNode = _interopRequireDefault(require("./named-node"));
var _namespace = _interopRequireDefault(require("./namespace"));
var _parse = _interopRequireDefault(require("./parse"));
var _rdfaparser = require("./rdfaparser");
var _rdfxmlparser = _interopRequireDefault(require("./rdfxmlparser"));
var Uri = _interopRequireWildcard(require("./uri"));
var _terms = require("./utils/terms");
var Util = _interopRequireWildcard(require("./utils-js"));
var _serialize = _interopRequireDefault(require("./serialize"));
var _crossFetch = _interopRequireWildcard(require("cross-fetch"));
var _types = require("./types");
var _termValue = require("./utils/termValue");
var _jsonldparser = _interopRequireDefault(require("./jsonldparser"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/* global $SolidTestEnvironment */
/**
 *
 * Project: rdflib.js
 *
 * @file: fetcher.js
 *
 * Description: contains functions for requesting/fetching/retracting
 *  This implements quite a lot of the web architecture.
 * A fetcher is bound to a specific quad store, into which
 * it loads stuff and into which it writes its metadata
 * @@ The metadata could be optionally a separate graph
 *
 * - implements semantics of HTTP headers, Internet Content Types
 * - selects parsers for rdf/xml, n3, rdfa, grddl
 *
 * TO do:
 * - Implement a runtime registry for parsers and serializers
 * -
 */

/**
 * Things to test: callbacks on request, refresh, retract
 *   loading from HTTP, HTTPS, FTP, FILE, others?
 * To do:
 * Firing up a mail client for mid:  (message:) URLs
 */

const Parsable = {
  'text/n3': true,
  'text/turtle': true,
  'application/rdf+xml': true,
  'application/xhtml+xml': true,
  'text/html': true,
  'application/ld+json': true
};

// This is a minimal set to allow the use of damaged servers if necessary
const CONTENT_TYPE_BY_EXT = {
  'rdf': _types.RDFXMLContentType,
  'owl': _types.RDFXMLContentType,
  'n3': 'text/n3',
  'ttl': 'text/turtle',
  'nt': 'text/n3',
  'acl': 'text/n3',
  'html': 'text/html',
  'xml': 'text/xml'
};

// Convenience namespaces needed in this module.
// These are deliberately not exported as the user application should
// make its own list and not rely on the prefixes used here,
// and not be tempted to add to them, and them clash with those of another
// application.
const getNS = factory => {
  return {
    link: (0, _namespace.default)('http://www.w3.org/2007/ont/link#', factory),
    http: (0, _namespace.default)('http://www.w3.org/2007/ont/http#', factory),
    httph: (0, _namespace.default)('http://www.w3.org/2007/ont/httph#', factory),
    // headers
    rdf: (0, _namespace.default)('http://www.w3.org/1999/02/22-rdf-syntax-ns#', factory),
    rdfs: (0, _namespace.default)('http://www.w3.org/2000/01/rdf-schema#', factory),
    dc: (0, _namespace.default)('http://purl.org/dc/elements/1.1/', factory),
    ldp: (0, _namespace.default)('http://www.w3.org/ns/ldp#', factory)
  };
};
const ns = getNS();

/** An extended interface of Response, since RDFlib.js adds some properties. */

/** tell typescript that a 'panes' child may exist on Window */

/** All valid inputs for initFetchOptions */

/** Initiated by initFetchOptions, which runs on load */

class Handler {
  constructor(response, dom) {
    // TODO: Document, type
    (0, _defineProperty2.default)(this, "response", void 0);
    // TODO: Document, type
    (0, _defineProperty2.default)(this, "dom", void 0);
    this.response = response;
    // The type assertion operator here might need to be removed.
    this.dom = dom;
  }
}
(0, _defineProperty2.default)(Handler, "pattern", void 0);
class RDFXMLHandler extends Handler {
  static toString() {
    return 'RDFXMLHandler';
  }
  static register(fetcher) {
    fetcher.mediatypes[_types.RDFXMLContentType] = {
      'q': 0.9
    };
  }
  parse(fetcher, /** An XML String */
  responseText, /** Requires .original */
  options) {
    let kb = fetcher.store;
    if (!this.dom) {
      this.dom = Util.parseXML(responseText);
    }
    let root = this.dom.documentElement;
    if (root && root.nodeName === 'parsererror') {
      // Mozilla only See issue/issue110
      // have to fail the request
      return fetcher.failFetch(options, 'Badly formed XML in ' + options.resource.value, 'parse_error');
    }
    let parser = new _rdfxmlparser.default(kb);
    try {
      parser.parse(this.dom, options.original.value, options.original);
    } catch (err) {
      return fetcher.failFetch(options, 'Syntax error parsing RDF/XML! ' + err, 'parse_error');
    }
    if (!options.noMeta) {
      kb.add(options.original, ns.rdf('type'), ns.link('RDFDocument'), fetcher.appNode);
    }
    return fetcher.doneFetch(options, this.response);
  }
}
RDFXMLHandler.pattern = new RegExp('application/rdf\\+xml');
class XHTMLHandler extends Handler {
  static toString() {
    return 'XHTMLHandler';
  }
  static register(fetcher) {
    fetcher.mediatypes[_types.XHTMLContentType] = {
      'q': 0.8
    };
  }
  parse(fetcher, responseText, options) {
    let relation, reverse;
    if (!this.dom) {
      this.dom = Util.parseXML(responseText);
    }
    let kb = fetcher.store;

    // dc:title
    let title = this.dom.getElementsByTagName('title');
    if (title.length > 0) {
      kb.add(options.resource, ns.dc('title'), kb.rdfFactory.literal(title[0].textContent), options.resource);
      // log.info("Inferring title of " + xhr.resource)
    }

    // link rel
    let links = this.dom.getElementsByTagName('link');
    for (let x = links.length - 1; x >= 0; x--) {
      // @@ rev
      relation = links[x].getAttribute('rel');
      reverse = false;
      if (!relation) {
        relation = links[x].getAttribute('rev');
        reverse = true;
      }
      if (relation) {
        fetcher.linkData(options.original, relation, links[x].getAttribute('href'), options.resource, reverse);
      }
    }

    // Data Islands
    let scripts = this.dom.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      let contentType = scripts[i].getAttribute('type');
      if (Parsable[contentType]) {
        // @ts-ignore incompatibility between Store.add and Formula.add
        (0, _parse.default)(scripts[i].textContent, kb, options.original.value, contentType);
        // @ts-ignore incompatibility between Store.add and Formula.add
        (0, _parse.default)(scripts[i].textContent, kb, options.original.value, contentType);
      }
    }
    if (!options.noMeta) {
      kb.add(options.resource, ns.rdf('type'), ns.link('WebPage'), fetcher.appNode);
    }
    if (!options.noRDFa && _rdfaparser.parseRDFaDOM) {
      // enable by default
      try {
        (0, _rdfaparser.parseRDFaDOM)(this.dom, kb, options.original.value);
      } catch (err) {
        // @ts-ignore
        let msg = 'Error trying to parse ' + options.resource + ' as RDFa:\n' + err + ':\n' + err.stack;
        return fetcher.failFetch(options, msg, 'parse_error');
      }
    }
    return fetcher.doneFetch(options, this.response);
  }
}
XHTMLHandler.pattern = new RegExp('application/xhtml');
class XMLHandler extends Handler {
  static toString() {
    return 'XMLHandler';
  }
  static register(fetcher) {
    fetcher.mediatypes['text/xml'] = {
      'q': 0.5
    };
    fetcher.mediatypes['application/xml'] = {
      'q': 0.5
    };
  }
  static isElement(node) {
    return node.nodeType === Node.ELEMENT_NODE;
  }
  parse(fetcher, responseText, options) {
    let dom = Util.parseXML(responseText);

    // XML Semantics defined by root element namespace
    // figure out the root element
    for (let c = 0; c < dom.childNodes.length; c++) {
      const node = dom.childNodes[c];
      // is this node an element?
      if (XMLHandler.isElement(node)) {
        // We've found the first element, it's the root
        let ns = node.namespaceURI;

        // Is it RDF/XML?
        if (ns && ns === ns['rdf']) {
          fetcher.addStatus(options.req, 'Has XML root element in the RDF namespace, so assume RDF/XML.');
          let rdfHandler = new RDFXMLHandler(this.response, dom);
          return rdfHandler.parse(fetcher, responseText, options);
        }
        break;
      }
    }

    // Or it could be XHTML?
    // Maybe it has an XHTML DOCTYPE?
    if (dom.doctype) {
      // log.info("We found a DOCTYPE in " + xhr.resource)
      if (dom.doctype.name === 'html' && dom.doctype.publicId.match(/^-\/\/W3C\/\/DTD XHTML/) && dom.doctype.systemId.match(/http:\/\/www.w3.org\/TR\/xhtml/)) {
        fetcher.addStatus(options.req, 'Has XHTML DOCTYPE. Switching to XHTML Handler.\n');
        let xhtmlHandler = new XHTMLHandler(this.response, dom);
        return xhtmlHandler.parse(fetcher, responseText, options);
      }
    }

    // Or what about an XHTML namespace?
    let html = dom.getElementsByTagName('html')[0];
    if (html) {
      let xmlns = html.getAttribute('xmlns');
      if (xmlns && xmlns.match(/^http:\/\/www.w3.org\/1999\/xhtml/)) {
        fetcher.addStatus(options.req, 'Has a default namespace for ' + 'XHTML. Switching to XHTMLHandler.\n');
        let xhtmlHandler = new XHTMLHandler(this.response, dom);
        return xhtmlHandler.parse(fetcher, responseText, options);
      }
    }

    // At this point we should check the namespace document (cache it!) and
    // look for a GRDDL transform
    // @@  Get namespace document <n>, parse it, look for  <n> grddl:namespaceTransform ?y
    // Apply ?y to   dom
    // We give up. What dialect is this?
    return fetcher.failFetch(options, 'Unsupported dialect of XML: not RDF or XHTML namespace, etc.\n' + responseText.slice(0, 80), 901);
  }
}
XMLHandler.pattern = new RegExp('(text|application)/(.*)xml');
class HTMLHandler extends Handler {
  static toString() {
    return 'HTMLHandler';
  }
  static register(fetcher) {
    fetcher.mediatypes['text/html'] = {
      'q': 0.8
    };
  }
  parse(fetcher, responseText, options) {
    let kb = fetcher.store;

    // We only handle XHTML so we have to figure out if this is XML
    // log.info("Sniffing HTML " + xhr.resource + " for XHTML.")
    if (isXML(responseText)) {
      fetcher.addStatus(options.req, "Has an XML declaration. We'll assume " + "it's XHTML as the content-type was text/html.\n");
      let xhtmlHandler = new XHTMLHandler(this.response);
      return xhtmlHandler.parse(fetcher, responseText, options);
    }

    // DOCTYPE html
    if (isXHTML(responseText)) {
      fetcher.addStatus(options.req, 'Has XHTML DOCTYPE. Switching to XHTMLHandler.\n');
      let xhtmlHandler = new XHTMLHandler(this.response);
      return xhtmlHandler.parse(fetcher, responseText, options);
    }

    // xmlns
    if (isXMLNS(responseText)) {
      fetcher.addStatus(options.req, 'Has default namespace for XHTML, so switching to XHTMLHandler.\n');
      let xhtmlHandler = new XHTMLHandler(this.response);
      return xhtmlHandler.parse(fetcher, responseText, options);
    }

    // dc:title
    // no need to escape '/' here
    let titleMatch = new RegExp('<title>([\\s\\S]+?)</title>', 'im').exec(responseText);
    if (titleMatch) {
      kb.add(options.resource, ns.dc('title'), kb.rdfFactory.literal(titleMatch[1]), options.resource); // think about xml:lang later
    }
    kb.add(options.resource, ns.rdf('type'), ns.link('WebPage'), fetcher.appNode);
    fetcher.addStatus(options.req, 'non-XML HTML document, not parsed for data.');
    return fetcher.doneFetch(options, this.response);
  }
}
HTMLHandler.pattern = new RegExp('text/html');
class JsonLdHandler extends Handler {
  static toString() {
    return 'JsonLdHandler';
  }
  static register(fetcher) {
    fetcher.mediatypes['application/ld+json'] = {
      'q': 0.9
    };
  }
  async parse(fetcher, responseText, options, response) {
    const kb = fetcher.store;
    try {
      await (0, _jsonldparser.default)(responseText, kb, options.original.value);
      fetcher.store.add(options.original, ns.rdf('type'), ns.link('RDFDocument'), fetcher.appNode);
      return fetcher.doneFetch(options, response);
    } catch (err) {
      const msg = 'Error trying to parse ' + options.resource + ' as JSON-LD:\n' + err; // not err.stack -- irrelevant
      return fetcher.failFetch(options, msg, 'parse_error', response);
    }
  }
}
JsonLdHandler.pattern = /application\/(ld\+json|activity\+json)/;
class TextHandler extends Handler {
  static toString() {
    return 'TextHandler';
  }
  static register(fetcher) {
    fetcher.mediatypes['text/plain'] = {
      'q': 0.5
    };
  }
  parse(fetcher, responseText, options) {
    // We only speak dialects of XML right now. Is this XML?

    // Look for an XML declaration
    if (isXML(responseText)) {
      fetcher.addStatus(options.req, 'Warning: ' + options.resource + " has an XML declaration. We'll assume " + "it's XML but its content-type wasn't XML.\n");
      let xmlHandler = new XMLHandler(this.response);
      return xmlHandler.parse(fetcher, responseText, options);
    }

    // Look for an XML declaration
    if (responseText.slice(0, 500).match(/xmlns:/)) {
      fetcher.addStatus(options.req, "May have an XML namespace. We'll assume " + "it's XML but its content-type wasn't XML.\n");
      let xmlHandler = new XMLHandler(this.response);
      return xmlHandler.parse(fetcher, responseText, options);
    }

    // We give up finding semantics - this is not an error, just no data
    fetcher.addStatus(options.req, 'Plain text document, no known RDF semantics.');
    return fetcher.doneFetch(options, this.response);
  }
}
TextHandler.pattern = new RegExp('text/plain');
class N3Handler extends Handler {
  static toString() {
    return 'N3Handler';
  }
  static register(fetcher) {
    fetcher.mediatypes['text/n3'] = {};
    fetcher.mediatypes['text/turtle'] = {};
  }
  parse(fetcher, responseText, options, response) {
    // Parse the text of this N3 file
    let kb = fetcher.store;
    let p = (0, _n3parser.default)(kb, kb, options.original.value, options.original.value, null, null, '', null);
    //                p.loadBuf(xhr.responseText)
    try {
      p.loadBuf(responseText);
    } catch (err) {
      let msg = 'Error trying to parse ' + options.resource + ' as Notation3:\n' + err; // not err.stack -- irrelevant
      return fetcher.failFetch(options, msg, 'parse_error', response);
    }
    fetcher.addStatus(options.req, 'N3 parsed: ' + p.statementCount + ' triples in ' + p.lines + ' lines.');
    fetcher.store.add(options.original, ns.rdf('type'), ns.link('RDFDocument'), fetcher.appNode);
    return fetcher.doneFetch(options, this.response);
  }
}
N3Handler.pattern = new RegExp('(application|text)/(x-)?(rdf\\+)?(n3|turtle)');
const defaultHandlers = {
  RDFXMLHandler,
  XHTMLHandler,
  XMLHandler,
  HTMLHandler,
  TextHandler,
  N3Handler,
  JsonLdHandler
};
function isXHTML(responseText) {
  const docTypeStart = responseText.indexOf('<!DOCTYPE html');
  const docTypeEnd = responseText.indexOf('>');
  if (docTypeStart === -1 || docTypeEnd === -1 || docTypeStart > docTypeEnd) {
    return false;
  }
  return responseText.substr(docTypeStart, docTypeEnd - docTypeStart).indexOf('XHTML') !== -1;
}
function isXML(responseText) {
  const match = responseText.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/);
  return !!match;
}
function isXMLNS(responseText) {
  const match = responseText.match(/[^(<html)]*<html\s+[^<]*xmlns=['"]http:\/\/www.w3.org\/1999\/xhtml["'][^<]*>/);
  return !!match;
}

// Not sure about the shapes of this. Response? FetchError?

/** Differs from normal Fetch, has an extended Response type */

/** Fetcher
 *
 * The Fetcher object is a helper object for a quadstore
 * which turns it from an offline store to an online store.
 * The fetcher deals with loading data files rom the web,
  * figuring how to parse them.  It will also refresh, remove, the data
  * and put back the data to the web.
 */
class Fetcher {
  constructor(store, options = {}) {
    (0, _defineProperty2.default)(this, "store", void 0);
    (0, _defineProperty2.default)(this, "timeout", void 0);
    (0, _defineProperty2.default)(this, "_fetch", void 0);
    (0, _defineProperty2.default)(this, "mediatypes", void 0);
    /** Denoting this session */
    (0, _defineProperty2.default)(this, "appNode", void 0);
    /**
     * this.requested[uri] states:
     * undefined     no record of web access or records reset
     * true          has been requested, fetch in progress
     * 'done'        received, Ok
     * 401           Not logged in
     * 403           HTTP status unauthorized
     * 404           Resource does not exist. Can be created etc.
     * 'redirected'  In attempt to counter CORS problems retried.
     * 'parse_error' Parse error
     * 'unsupported_protocol'  URI is not a protocol Fetcher can deal with
     * other strings mean various other errors.
     */
    (0, _defineProperty2.default)(this, "requested", void 0);
    /** List of timeouts associated with a requested URL */
    (0, _defineProperty2.default)(this, "timeouts", void 0);
    /** Redirected from *key uri* to *value uri* */
    (0, _defineProperty2.default)(this, "redirectedTo", void 0);
    (0, _defineProperty2.default)(this, "fetchQueue", void 0);
    /** fetchCallbacks[uri].push(callback) */
    (0, _defineProperty2.default)(this, "fetchCallbacks", void 0);
    /** Keep track of explicit 404s -> we can overwrite etc */
    (0, _defineProperty2.default)(this, "nonexistent", void 0);
    (0, _defineProperty2.default)(this, "lookedUp", void 0);
    (0, _defineProperty2.default)(this, "handlers", void 0);
    (0, _defineProperty2.default)(this, "ns", void 0);
    /** Methods added by calling Util.callbackify in the constructor*/
    (0, _defineProperty2.default)(this, "fireCallbacks", void 0);
    this.store = store || new _store.default();
    this.ns = getNS(this.store.rdfFactory);
    this.timeout = options.timeout || 30000;

    // solidFetcher is deprecated
    let fetchFunc = options.fetch || typeof global !== 'undefined' && (global.solidFetcher || global.solidFetch) || typeof window !== 'undefined' && (window.solidFetcher || window.solidFetch) || _crossFetch.default;
    if (!fetchFunc) {
      throw new Error('No _fetch function available for Fetcher');
    }
    // Bind fetch to its context to avoid "Illegal invocation" errors
    // Check if it's the native browser fetch or global fetch that needs binding
    if (typeof window !== 'undefined' && fetchFunc === window.fetch) {
      this._fetch = fetchFunc.bind(window);
    } else if (typeof global !== 'undefined' && fetchFunc === global.fetch) {
      this._fetch = fetchFunc.bind(global);
    } else {
      this._fetch = fetchFunc;
    }
    // This is the name of the graph we store all the HTTP metadata in
    this.appNode = this.store.sym('chrome://TheCurrentSession');
    // this.appNode = this.store.rdfFactory.blankNode() // Needs to have a URI in tests
    this.store.fetcher = this; // Bi-linked
    this.requested = {};
    this.timeouts = {};
    this.redirectedTo = {};
    this.fetchQueue = {};
    this.fetchCallbacks = {};
    this.nonexistent = {};
    this.lookedUp = {};
    this.handlers = [];
    this.mediatypes = {
      'image/*': {
        'q': 0.9
      },
      '*/*': {
        'q': 0.1
      } // Must allow access to random content
    };

    // Util.callbackify(this, ['request', 'recv', 'headers', 'load', 'fail',
    //   'refresh', 'retract', 'done'])
    // In switching to fetch(), 'recv', 'headers' and 'load' do not make sense
    Util.callbackify(this, ['request', 'fail', 'refresh', 'retract', 'done']);
    Object.keys(options.handlers || defaultHandlers).map(key => this.addHandler(defaultHandlers[key]));
  }
  static crossSiteProxy(uri) {
    if (Fetcher.crossSiteProxyTemplate) {
      return Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
    } else {
      return undefined;
    }
  }
  static offlineOverride(uri) {
    // Map the URI to a localhost proxy if we are running on localhost
    // This is used for working offline, e.g. on planes.
    // Is the script itself is running in localhost, then access all
    //   data in a localhost mirror.
    // Do not remove without checking with TimBL
    let requestedURI = uri;
    var UI;
    if (typeof window !== 'undefined' && window.panes && (UI = window.panes.UI) && UI.preferences && UI.preferences.get('offlineModeUsingLocalhost')) {
      if (requestedURI.slice(0, 7) === 'http://' && requestedURI.slice(7, 17) !== 'localhost/') {
        requestedURI = 'http://localhost/' + requestedURI.slice(7);
        _log.default.warn('Localhost kludge for offline use: actually getting <' + requestedURI + '>');
      } else {
        // log.warn("Localhost kludge NOT USED <" + requestedURI + ">")
      }
    } else {
      // log.warn("Localhost kludge OFF offline use: actually getting <" +
      //   requestedURI + ">")
    }
    return requestedURI;
  }
  static proxyIfNecessary(uri) {
    var UI;
    if (typeof window !== 'undefined' && window.panes && (UI = window.panes.UI) && UI.isExtension) {
      return uri;
    } // Extension does not need proxy

    if (typeof $SolidTestEnvironment !== 'undefined' && $SolidTestEnvironment.localSiteMap) {
      // nested dictionaries of URI parts from origin down
      let hostpath = uri.split('/').slice(2); // the bit after the //

      const lookup = (parts, index) => {
        let z = index[parts.shift()];
        if (!z) {
          return null;
        }
        if (typeof z === 'string') {
          return z + parts.join('/');
        }
        if (!parts) {
          return null;
        }
        return lookup(parts, z);
      };
      const y = lookup(hostpath, $SolidTestEnvironment.localSiteMap);
      if (y) {
        return y;
      }
    }

    // browser does 2014 on as https browser script not trusted
    // If the web app origin is https: then the mixed content rules
    // prevent it loading insecure http: stuff so we need proxy.
    if (Fetcher.crossSiteProxyTemplate && typeof document !== 'undefined' && document.location && ('' + document.location).slice(0, 6) === 'https:' &&
    // origin is secure
    uri.slice(0, 5) === 'http:') {
      // requested data is not
      return Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
    }
    return uri;
  }

  /**
   * Tests whether the uri's protocol is supported by the Fetcher.
   * @param uri
   */
  static unsupportedProtocol(uri) {
    let pcol = Uri.protocol(uri);
    return pcol === 'tel' || pcol === 'mailto' || pcol === 'urn';
  }

  /** Decide on credentials using old XXHR api or new fetch()  one
   * @param requestedURI
   * @param options
   */
  static setCredentials(requestedURI, options = {}) {
    // 2014 CORS problem:
    // XMLHttpRequest cannot load http://www.w3.org/People/Berners-Lee/card.
    // A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin'
    //   header when the credentials flag is true.
    // @ Many ontology files under http: and need CORS wildcard ->
    //   can't have credentials
    if (options.credentials === undefined) {
      // Caller using new fetch convention
      if (options.withCredentials !== undefined) {
        // XHR style is what Fetcher specified before
        options.credentials = options.withCredentials ? 'include' : 'omit';
      } else {
        options.credentials = 'include'; // default is to be logged on
      }
    }
  }

  /**
   * Promise-based load function
   *
   * Loads a web resource or resources into the store.
   *
   * A resource may be given as NamedNode object, or as a plain URI.
   * an array of resources will be given, in which they will be fetched in parallel.
   * By default, the HTTP headers are recorded also, in the same store, in a separate graph.
   * This allows code like editable() for example to test things about the resource.
   *
   * @param uri {Array<RDFlibNamedNode>|Array<string>|RDFlibNamedNode|string}
   *
   * @param [options={}] {Object}
   *
   * @param [options.fetch] {Function}
   *
   * @param [options.referringTerm] {RDFlibNamedNode} Referring term, the resource which
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
  load(uri, options = {}) {
    options = Object.assign({}, options); // Take a copy as we add stuff to the options!!
    if (uri instanceof Array) {
      return Promise.all(uri.map(x => {
        return this.load(x, Object.assign({}, options));
      }));
    }
    const uriIn = uri;
    let docuri = (0, _termValue.termValue)(uriIn);
    docuri = docuri.split('#')[0];
    options = this.initFetchOptions(docuri, options);
    // if metadata flaged clear cache and removeDocument
    const meta = this.appNode;
    const kb = this.store;
    const requests = kb.statementsMatching(undefined, this.ns.link('requestedURI'), kb.sym(docuri), meta).map(st => st.subject);
    for (const request of requests) {
      const response = kb.any(request, this.ns.link('response'), null, meta);
      if (response != undefined) {
        // ts
        const quad = kb.statementsMatching(response, this.ns.link('outOfDate'), true, meta);
        kb.remove(quad);
        options.force = true;
        options.clearPreviousData = true;
      }
    }
    const initialisedOptions = this.initFetchOptions(docuri, options);
    return this.pendingFetchPromise(docuri, initialisedOptions.baseURI, initialisedOptions);
  }
  async pendingFetchPromise(uri, originalUri, options) {
    let pendingPromise;

    // Check to see if some request is already dealing with this uri
    if (!options.force && (await this.fetchQueue[originalUri])) {
      pendingPromise = this.fetchQueue[originalUri];
    } else {
      pendingPromise = Promise.race([this.setRequestTimeout(uri, options), this.fetchUri(uri, options)]);
      this.fetchQueue[originalUri] = pendingPromise;

      // Clean up the queued promise after a time, if it's resolved
      this.cleanupFetchRequest(originalUri, undefined, this.timeout);
    }
    return pendingPromise.then(x => {
      if (uri in this.timeouts) {
        this.timeouts[uri].forEach(clearTimeout);
        delete this.timeouts[uri];
      }
      return x;
    });
  }

  /**
   * @param _options - DEPRECATED
   */
  cleanupFetchRequest(originalUri, _options, timeout) {
    if (_options !== undefined) {
      console.warn("_options is deprecated");
    }
    this.timeouts[originalUri] = (this.timeouts[originalUri] || []).concat(setTimeout(() => {
      if (!this.isPending(originalUri)) {
        delete this.fetchQueue[originalUri];
      }
    }, timeout));
  }
  initFetchOptions(uri, options) {
    let kb = this.store;
    let isGet = !options.method || options.method.toUpperCase() === 'GET';
    if (!isGet) {
      options.force = true;
    }
    options.resource = kb.rdfFactory.namedNode(uri); // This might be proxified
    options.baseURI = options.baseURI || uri; // Preserve though proxying etc
    options.original = kb.rdfFactory.namedNode(options.baseURI);
    options.req = kb.bnode();
    options.headers = options.headers || {};
    if (options.contentType) {
      // @ts-ignore
      options.headers['content-type'] = options.contentType;
    }
    if (options.force) {
      options.cache = 'no-cache';
    }
    let acceptString = this.acceptString();
    // @ts-ignore
    options.headers['accept'] = acceptString;
    let requestedURI = Fetcher.offlineOverride(uri);
    options.requestedURI = requestedURI;
    Fetcher.setCredentials(requestedURI, options);
    let actualProxyURI = Fetcher.proxyIfNecessary(requestedURI);
    if (requestedURI !== actualProxyURI) {
      options.proxyUsed = true;
    }
    options.actualProxyURI = actualProxyURI;
    return options;
  }

  /**
   * (The promise chain ends in either a `failFetch()` or a `doneFetch()`)
   *
   * @param docuri {string}
   * @param options {Object}
   *
   * @returns {Promise<Object>} fetch() result or an { error, status } object
   */
  fetchUri(docuri, options) {
    if (!docuri) {
      return Promise.reject(new Error('Cannot fetch an empty uri'));
    }
    if (Fetcher.unsupportedProtocol(docuri)) {
      return this.failFetch(options, 'fetcher: Unsupported protocol', 'unsupported_protocol');
    }
    let state = this.getState(docuri);
    if (!options.force) {
      if (state === 'fetched') {
        // URI already fetched and added to store
        return Promise.resolve(
        // @ts-ignore This is not a valid response object
        this.doneFetch(options, {
          status: 200,
          ok: true,
          statusText: 'Already loaded into quadstore.'
        }));
      }
      if (state === 'failed' && this.requested[docuri] === 404) {
        // Remember nonexistence
        let message = 'Previously failed: ' + this.requested[docuri];
        // @ts-ignore This is not a valid response object
        let dummyResponse = {
          url: docuri,
          // This does not comply to Fetch spec, it can be a string value in rdflib
          status: this.requested[docuri],
          statusText: message,
          responseText: message,
          headers: new _crossFetch.Headers(),
          // Headers() ???
          ok: false,
          body: null,
          bodyUsed: false,
          size: 0,
          timeout: 0
        };
        return this.failFetch(options, message, this.requested[docuri], dummyResponse);
      }
    } else {
      // options.force == true
      delete this.nonexistent[docuri];
    }
    this.fireCallbacks('request', [docuri]);
    this.requested[docuri] = true; // mark this uri as 'requested'

    if (!options.noMeta) {
      this.saveRequestMetadata(docuri, options);
    }
    let {
      actualProxyURI
    } = options;

    // Map might get mistakenly added into headers
    // error TS2339: Property 'map' does not exist on type 'Headers'.
    /* let map
    if (options.headers && map in options.headers) {
      delete options.headers.map
    } */

    return this._fetch(actualProxyURI, options).then(response => this.handleResponse(response, docuri, options), error => {
      // @@ handleError?
      // @ts-ignore Invalid response object
      let dummyResponse = {
        url: actualProxyURI,
        status: 999,
        // @@ what number/string should fetch failures report?
        statusText: (error.name || 'network failure') + ': ' + (error.errno || error.code || error.type),
        responseText: error.message,
        headers: new _crossFetch.Headers(),
        // Headers() ???
        ok: false,
        body: null,
        bodyUsed: false,
        size: 0,
        timeout: 0
      };
      // console.log('Fetcher: <' + actualProxyURI + '> Non-HTTP fetch exception: ' + error)
      return this.handleError(dummyResponse, docuri, options); // possible credentials retry
      // return this.failFetch(options, 'fetch failed: ' + error, 999, dummyResponse) // Fake status code: fetch exception

      // handleError expects a response so we fake some important bits.
      /*
      this.handleError(, docuri, options)
      */
    });
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
  nowOrWhenFetched(uriIn, p2, userCallback, options = {}) {
    const uri = (0, _termValue.termValue)(uriIn);
    if (typeof p2 === 'function') {
      // nowOrWhenFetched (uri, userCallback)
      userCallback = p2;
    } else if (typeof p2 === 'undefined') {// original calling signature
      // referringTerm = undefined
    } else if ((0, _terms.isNamedNode)(p2)) {
      // referringTerm = p2
      options.referringTerm = p2;
    } else {
      // nowOrWhenFetched (uri, options, userCallback)
      options = p2;
    }
    this.load(uri, options).then(fetchResponse => {
      if (userCallback) {
        if (fetchResponse) {
          if (fetchResponse.ok) {
            userCallback(true, 'OK', fetchResponse);
          } else {
            let oops = 'HTTP error: Status ' + fetchResponse.status + ' (' + fetchResponse.statusText + ')';
            if (fetchResponse.responseText) {
              oops += ' ' + fetchResponse.responseText; // not in 404, dns error, nock failure
            }
            userCallback(false, oops, fetchResponse);
          }
        } else {
          let oops = '@@ nowOrWhenFetched:  no response object!';
          userCallback(false, oops);
        }
      }
    }, function (err) {
      var message = err.message || err.statusText;
      message = 'Failed to load  <' + uri + '> ' + message;
      if (err.response && err.response.status) {
        message += ' status: ' + err.response.status;
      }
      userCallback(false, message, err.response);
    });
  }

  /**
   * Records a status message (as a literal node) by appending it to the
   * request's metadata status collection.
   *
   */
  addStatus(req, statusMessage) {
    // <Debug about="parsePerformance">
    let now = new Date();
    statusMessage = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '.' + now.getMilliseconds() + '] ' + statusMessage;
    // </Debug>
    let kb = this.store;
    const statusNode = kb.the(req, this.ns.link('status'));
    if ((0, _terms.isCollection)(statusNode)) {
      statusNode.append(kb.rdfFactory.literal(statusMessage));
    } else {
      _log.default.warn('web.js: No list to add to: ' + statusNode + ',' + statusMessage);
    }
  }

  /**
   * Records errors in the system on failure:
   *
   *  - Adds an entry to the request status collection
   *  - Adds an error triple with the fail message to the metadata
   *  - Fires the 'fail' callback
   *  - Rejects with an error result object, which has a response object if any
   */
  failFetch(options, errorMessage, statusCode, response) {
    this.addStatus(options.req, errorMessage);
    if (!options.noMeta) {
      this.store.add(options.original, this.ns.link('error'), this.store.rdfFactory.literal(errorMessage));
    }
    let meth = (options.method || 'GET').toUpperCase();
    let isGet = meth === 'GET' || meth === 'HEAD';
    if (isGet) {
      // only cache the status code on GET or HEAD
      if (!options.resource.equals(options.original)) {
        // console.log('@@ Recording failure  ' + meth + '  original ' + options.original +option '( as ' + options.resource + ') : ' + statusCode)
      } else {
        // console.log('@@ Recording ' + meth + ' failure for ' + options.original + ': ' + statusCode)
      }
      this.requested[Uri.docpart(options.original.value)] = statusCode;
      this.fireCallbacks('fail', [options.original.value, errorMessage]);
    }
    var err = new Error('Fetcher: ' + errorMessage);

    // err.ok = false // Is taken as a response, will work too @@ phase out?
    err.status = statusCode;
    err.statusText = errorMessage;
    err.response = response;
    return Promise.reject(err);
  }

  // in the why part of the quad distinguish between HTML and HTTP header
  // Reverse is set iif the link was rev= as opposed to rel=
  linkData(originalUri, rel, uri, why, reverse) {
    if (!uri) return;
    let kb = this.store;
    let predicate;
    // See http://www.w3.org/TR/powder-dr/#httplink for describedby 2008-12-10
    let obj = kb.rdfFactory.namedNode(Uri.join(uri, originalUri.value));
    if (rel === 'alternate' || rel === 'seeAlso' || rel === 'meta' || rel === 'describedby') {
      if (obj.value === originalUri.value) {
        return;
      }
      predicate = this.ns.rdfs('seeAlso');
    } else if (rel === 'type') {
      predicate = kb.rdfFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
    } else {
      // See https://www.iana.org/assignments/link-relations/link-relations.xml
      // Alas not yet in RDF yet for each predicate
      // encode space in e.g. rel="shortcut icon"
      predicate = kb.rdfFactory.namedNode(Uri.join(encodeURIComponent(rel), 'http://www.iana.org/assignments/link-relations/'));
    }
    if (reverse) {
      kb.add(obj, predicate, originalUri, why);
    } else {
      kb.add(originalUri, predicate, obj, why);
    }
  }
  parseLinkHeader(linkHeader, originalUri, reqNode) {
    if (!linkHeader) {
      return;
    }

    // const linkexp = /<[^>]*>\s*(\s*;\s*[^()<>@,;:"/[\]?={} \t]+=(([^()<>@,;:"/[]?={} \t]+)|("[^"]*")))*(,|$)/g
    // const paramexp = /[^()<>@,;:"/[]?={} \t]+=(([^()<>@,;:"/[]?={} \t]+)|("[^"]*"))/g

    // From https://www.dcode.fr/regular-expression-simplificator:
    // const linkexp = /<[^>]*>\s*(\s*;\s*[^()<>@,;:"/[\]?={} t]+=["]))*[,$]/g
    // const paramexp = /[^\\<>@,;:"\/\[\]?={} \t]+=["])/g
    // Original:
    const linkexp = /<[^>]*>\s*(\s*;\s*[^()<>@,;:"/[\]?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
    const paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;
    const matches = linkHeader.match(linkexp);
    if (matches == null) return;
    for (let i = 0; i < matches.length; i++) {
      let split = matches[i].split('>');
      let href = split[0].substring(1);
      let ps = split[1];
      let s = ps.match(paramexp);
      if (s == null) return;
      for (let j = 0; j < s.length; j++) {
        let p = s[j];
        let paramsplit = p.split('=');
        // var name = paramsplit[0]
        let rel = paramsplit[1].replace(/["']/g, ''); // '"
        this.linkData(originalUri, rel, href, reqNode);
      }
    }
  }
  doneFetch(options, response) {
    this.addStatus(options.req, 'Done.');
    this.requested[options.original.value] = 'done';
    this.fireCallbacks('done', [options.original.value]);
    response.req = options.req; // Set the request meta blank node

    return response;
  }

  /**
   * Note two nodes are now smushed
   * If only one was flagged as looked up, then the new node is looked up again,
   * which will make sure all the URIs are dereferenced
   */
  nowKnownAs(was, now) {
    if (this.lookedUp[was.value]) {
      // Transfer userCallback
      if (!this.lookedUp[now.value]) {
        this.lookUpThing(now, was);
      }
    } else if (this.lookedUp[now.value]) {
      if (!this.lookedUp[was.value]) {
        this.lookUpThing(was, now);
      }
    }
  }

  /**
   * Writes back to the web what we have in the store for this uri
   */
  putBack(uri, options = {}) {
    const uriSting = (0, _termValue.termValue)(uri);
    let doc = new _namedNode.default(uriSting).doc(); // strip off #
    options.contentType = options["content-type"] || options["Content-Type"] || options.contentType || _types.TurtleContentType;
    if (options.contentType === 'application/ld+json') {
      return new Promise((resolve, reject) => {
        (0, _serialize.default)(doc, this.store, doc.uri, options.contentType, (err, jsonString) => {
          if (err) {
            reject(err);
          } else {
            // @ts-ignore
            options.data = jsonString;
            this.webOperation('PUT', uri, options).then(res => resolve(res)).catch(error => reject(error));
          }
        });
      });
    }
    options.data = (0, _serialize.default)(doc, this.store, doc.value, options.contentType);
    return this.webOperation('PUT', uriSting, options);
  }
  webCopy(here, there, contentType) {
    return this.webOperation('GET', here).then(result => {
      return this.webOperation('PUT',
      // change to binary from text
      there, {
        data: result.responseText,
        contentType
      });
    });
  }
  delete(uri, options) {
    return this.webOperation('DELETE', uri, options).then(response => {
      this.requested[uri] = 404;
      this.nonexistent[uri] = true;
      this.unload(this.store.rdfFactory.namedNode(uri));
      return response;
    });
  }

  /** Create an empty resource if it really does not exist
   *  Be absolutely sure something does not exist before creating a new empty file
   * as otherwise existing could  be deleted.
   * @param doc - The resource
  */
  async createIfNotExists(doc, contentType = _types.TurtleContentType, data = '') {
    const fetcher = this;
    try {
      var response = await fetcher.load(doc);
    } catch (err) {
      // @ts-ignore
      if (err.response.status === 404) {
        // console.log('createIfNotExists: doc does NOT exist, will create... ' + doc)
        try {
          response = await fetcher.webOperation('PUT', doc.value, {
            data,
            contentType
          });
        } catch (err) {
          // console.log('createIfNotExists doc FAILED: ' + doc + ': ' + err)
          throw err;
        }
        delete fetcher.requested[doc.value]; // delete cached 404 error
        // console.log('createIfNotExists doc created ok ' + doc)
        return response;
      } else {
        // console.log('createIfNotExists doc load error NOT 404:  ' + doc + ': ' + err)
        throw err;
      }
    }
    // console.log('createIfNotExists: doc exists, all good: ' + doc)
    return response;
  }

  /**
   * @param parentURI URI of parent container
   * @param folderName - Optional folder name (slug)
   * @param data - Optional folder metadata
   */
  createContainer(parentURI, folderName, data) {
    let headers = {
      // Force the right mime type for containers
      'content-type': _types.TurtleContentType,
      'link': this.ns.ldp('BasicContainer') + '; rel="type"'
    };
    if (folderName) {
      headers['slug'] = folderName;
    }

    // @ts-ignore These headers lack some of the required operators.
    let options = {
      headers
    };
    if (data) {
      options.body = data;
    }
    return this.webOperation('POST', parentURI, options);
  }
  invalidateCache(iri) {
    const uri = (0, _termValue.termValue)(iri);
    const fetcher = this;
    // @ts-ignore
    if (fetcher.fetchQueue && fetcher.fetchQueue[uri]) {
      // console.log('Internal error - fetchQueue exists ' + uri)
      var promise = fetcher.fetchQueue[uri];
      if (promise['PromiseStatus'] === 'resolved') {
        delete fetcher.fetchQueue[uri];
      } else {
        // pending
        delete fetcher.fetchQueue[uri];
        // console.log('*** Fetcher: pending fetchQueue deleted ' + uri)
      }
    }
    if (fetcher.requested[uri] && fetcher.requested[uri] !== 'done' && fetcher.requested[uri] !== 'failed' && fetcher.requested[uri] !== 404) {
      let msg = `Rdflib: fetcher: Destructive operation on <${fetcher.requested[uri]}> file being fetched! ` + uri;
      console.error(msg);
      // alert(msg)
    } else {
      delete fetcher.requested[uri]; // invalidate read cache -- @@ messes up logic if request in progress ??
      delete fetcher.nonexistent[uri];
    }
  }

  /**
   * A generic web operation, at the fetch() level.
   * does not involve the quad store.
   *
   *  Returns promise of Response
   *  If data is returned, copies it to response.responseText before returning
   */
  webOperation(method, uriIn,
  // Not sure about this type. Maybe this Options is different?
  options = {}) {
    const uri = (0, _termValue.termValue)(uriIn);
    options.method = method;
    options.body = options.data || options.body;
    options.force = true;
    const fetcher = this;
    if (options.body && !options.contentType) {
      throw new Error('Web operation sending data must have a defined contentType.');
    }
    if (options.contentType) {
      options.headers = options.headers || {};
      options.headers['content-type'] = options.contentType;
    }
    Fetcher.setCredentials(uri, options);
    return new Promise(function (resolve, reject) {
      fetcher._fetch(uri, options).then(response => {
        if (response.ok) {
          if (method === 'PUT' || method === 'PATCH' || method === 'POST' || method === 'DELETE') {
            fetcher.invalidateCache(uri);
          } // response.body with Chrome can't be relied on
          if (response.text) {
            // Was: response.body https://github.com/linkeddata/rdflib.js/issues/506
            response.text().then(data => {
              response.responseText = data;
              resolve(response);
            });
          } else {
            resolve(response);
          }
        } else {
          let msg = 'Web error: ' + response.status;
          if (response.statusText) msg += ' (' + response.statusText + ')';
          msg += ' on ' + method + ' of <' + uri + '>';
          if (response.responseText) msg += ': ' + response.responseText;
          let e2 = new Error(msg);
          e2.response = response;
          reject(e2);
        }
      }, err => {
        let msg = 'Fetch error for ' + method + ' of <' + uri + '>:' + err;
        reject(new Error(msg));
      });
    });
  }

  /**
   * Looks up something.
   * Looks up all the URIs a things has.
   *
   * @param term - canonical term for the thing whose URI is
   *   to be dereferenced
   * @param rterm - the resource which referred to this
   *   (for tracking bad links)
   */
  lookUpThing(term, rterm) {
    let uris = this.store.uris(term); // Get all URIs
    uris = uris.map(u => Uri.docpart(u)); // Drop hash fragments

    uris.forEach(u => {
      this.lookedUp[u] = true;
    });

    // @ts-ignore Recursive type
    return this.load(uris, {
      referringTerm: rterm
    });
  }

  /**
   * Looks up response header.
   *
   * @returns {Array|undefined} a list of header values found in a stored HTTP
   *   response, or [] if response was found but no header found,
   *   or undefined if no response is available.
   * Looks for { [] link:requestedURI ?uri; link:response [ httph:header-name  ?value ] }
   */
  getHeader(doc, header) {
    const kb = this.store; // look for the URI (AS A STRING NOT A NODE) for a stored request
    const docuri = doc.value;
    const requests = kb.each(undefined, this.ns.link('requestedURI'), kb.rdfFactory.literal(docuri));
    for (let r = 0; r < requests.length; r++) {
      let request = requests[r];
      if (request !== undefined) {
        let response = kb.any(request, this.ns.link('response'));
        if (response !== undefined && kb.anyValue(response, this.ns.http('status')) && kb.anyValue(response, this.ns.http('status')).startsWith('2')) {
          // Only look at success returns - not 401 error messagess etc
          let results = kb.each(response, this.ns.httph(header.toLowerCase()));
          if (results.length) {
            return results.map(v => {
              return v.value;
            });
          }
          return [];
        }
      }
    }
    return undefined;
  }
  saveRequestMetadata(docuri, options) {
    let req = options.req;
    let kb = this.store;
    let rterm = options.referringTerm;
    this.addStatus(options.req, 'Accept: ' + options.headers['accept']);
    if ((0, _terms.isNamedNode)(rterm)) {
      kb.add(kb.rdfFactory.namedNode(docuri), this.ns.link('requestedBy'), rterm, this.appNode);
    }
    if (options.original && options.original.value !== docuri) {
      kb.add(req, this.ns.link('orginalURI'), kb.rdfFactory.literal(options.original.value), this.appNode);
    }
    const now = new Date();
    const timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] ';
    kb.add(req, this.ns.rdfs('label'), kb.rdfFactory.literal(timeNow + ' Request for ' + docuri), this.appNode);
    // We store the docuri as a string, not as a node,
    // see https://github.com/linkeddata/rdflib.js/pull/427#pullrequestreview-447910061
    kb.add(req, this.ns.link('requestedURI'), kb.rdfFactory.literal(docuri), this.appNode);
    kb.add(req, this.ns.link('status'), kb.collection(), this.appNode);
  }
  saveResponseMetadata(response, options) {
    const kb = this.store;
    let responseNode = kb.bnode();
    kb.add(options.req, this.ns.link('response'), responseNode, this.appNode);
    kb.add(responseNode, this.ns.http('status'), kb.rdfFactory.literal(response.status), this.appNode);
    kb.add(responseNode, this.ns.http('statusText'), kb.rdfFactory.literal(response.statusText), this.appNode);

    // Save the response headers
    response.headers.forEach((value, header) => {
      kb.add(responseNode, this.ns.httph(header), this.store.rdfFactory.literal(value), this.appNode);
      if (header === 'content-type') {
        kb.add(options.resource, this.ns.rdf('type'), kb.rdfFactory.namedNode(Util.mediaTypeClass(value).value), this.appNode // responseNode
        );
      }
    });
    return responseNode;
  }
  objectRefresh(term) {
    let uris = this.store.uris(term); // Get all URIs
    if (typeof uris !== 'undefined') {
      for (let i = 0; i < uris.length; i++) {
        this.refresh(this.store.rdfFactory.namedNode(Uri.docpart(uris[i])));
        // what about rterm?
      }
    }
  }

  /* refresh  Reload data from a given document
  **
  ** @param term - An RDF Named Node for the eodcument in question
  ** @param userCallback - A function userCallback(ok, message, response)
  */
  refresh(term, userCallback) {
    // sources_refresh
    this.fireCallbacks('refresh', arguments);
    this.nowOrWhenFetched(term, {
      force: true,
      clearPreviousData: true
    }, userCallback);
  }

  /* refreshIfExpired   Conditional refresh if Expired
  **
  ** @param term - An RDF Named Node for the eodcument in question
  ** @param userCallback - A function userCallback(ok, message, response)
  */
  refreshIfExpired(term, userCallback) {
    let exp = this.getHeader(term, 'Expires');
    if (!exp || new Date(exp[0]).getTime() <= new Date().getTime()) {
      this.refresh(term, userCallback);
    } else {
      userCallback(true, 'Not expired', {});
    }
  }
  retract(term) {
    // sources_retract
    this.store.removeMany(undefined, undefined, undefined, term);
    if (term.value) {
      delete this.requested[Uri.docpart(term.value)];
    }
    this.fireCallbacks('retract', arguments);
  }
  getState(docuri) {
    if (typeof this.requested[docuri] === 'undefined') {
      return 'unrequested';
    } else if (this.requested[docuri] === true) {
      return 'requested';
    } else if (this.requested[docuri] === 'done') {
      return 'fetched';
    } else if (this.requested[docuri] === 'redirected') {
      return this.getState(this.redirectedTo[docuri]);
    } else {
      // An non-200 HTTP error status
      return 'failed';
    }
  }
  isPending(docuri) {
    // sources_pending
    // doing anyStatementMatching is wasting time
    // if it's not pending: false -> flailed
    //   'done' -> done 'redirected' -> redirected
    return this.requested[docuri] === true;
  }
  unload(term) {
    this.store.removeDocument(term);
    delete this.requested[term.value]; // So it can be load2ed again
  }
  addHandler(handler) {
    this.handlers.push(handler);
    handler.register(this);
  }
  retryNoCredentials(docuri, options) {
    // console.log('Fetcher: CORS: RETRYING with NO CREDENTIALS for ' + options.resource)

    options.retriedWithNoCredentials = true; // protect against being called twice

    delete this.requested[docuri]; // forget the original request happened
    delete this.fetchQueue[docuri];
    // Note: XHR property was withCredentials, but fetch property is just credentials
    let newOptions = Object.assign({}, options, {
      credentials: 'omit'
    });
    this.addStatus(options.req, 'Abort: Will retry with credentials SUPPRESSED to see if that helps');
    return this.load(docuri, newOptions);
  }

  /**
   * Tests whether a request is being made to a cross-site URI (for purposes
   * of retrying with a proxy)
   */
  isCrossSite(uri) {
    // Mashup situation, not node etc
    if (typeof document === 'undefined' || !document.location) {
      return false;
    }
    const hostpart = Uri.hostpart;
    const here = '' + document.location;
    return (hostpart(here) && hostpart(uri) && hostpart(here)) !== hostpart(uri);
  }

  /**
   * Called when there's a network error in fetch(), or a response
   * with status of 0.
   */
  handleError(response, docuri, options) {
    if (this.isCrossSite(docuri)) {
      // Make sure we haven't retried already
      if (options.credentials && options.credentials === 'include' && !options.retriedWithNoCredentials) {
        return this.retryNoCredentials(docuri, options);
      }

      // Now attempt retry via proxy
      let proxyUri = Fetcher.crossSiteProxy(docuri);
      if (proxyUri && !options.proxyUsed) {
        // console.log('web: Direct failed so trying proxy ' + proxyUri)
        return this.redirectToProxy(proxyUri, options);
      }
    }
    var message;
    if (response instanceof Error) {
      message = 'Fetch error: ' + response.message;
    } else {
      message = response.statusText;
      if (response.responseText) {
        message += ` ${response.responseText}`;
      }
    }

    // This is either not a CORS error, or retries have been made
    return this.failFetch(options, message, response.status || 998, response);
  }

  // deduce some things from the HTTP transaction
  addType(rdfType, req, kb, locURI) {
    // add type to all redirected resources too
    let prev = req;
    if (locURI) {
      var reqURI = kb.any(prev, this.ns.link('requestedURI'));
      if (reqURI && reqURI.value !== locURI) {
        kb.add(kb.rdfFactory.namedNode(locURI), this.ns.rdf('type'), rdfType, this.appNode);
      }
    }
    for (;;) {
      const doc = kb.any(prev, this.ns.link('requestedURI'));
      if (doc && doc.value) {
        kb.add(kb.rdfFactory.namedNode(doc.value), this.ns.rdf('type'), rdfType, this.appNode);
      } // convert Literal
      prev = kb.any(undefined, kb.rdfFactory.namedNode('http://www.w3.org/2007/ont/link#redirectedRequest'), prev);
      if (!prev) {
        break;
      }
      var response = kb.any(prev, kb.rdfFactory.namedNode('http://www.w3.org/2007/ont/link#response'));
      if (!response) {
        break;
      }
      var redirection = kb.any(response, kb.rdfFactory.namedNode('http://www.w3.org/2007/ont/http#status'));
      if (!redirection) {
        break;
      }
      // @ts-ignore always true?
      if (redirection !== '301' && redirection !== '302') {
        break;
      }
    }
  }

  /**
   * Handle fetch() response
   */
  handleResponse(response, docuri, options) {
    const kb = this.store;
    const headers = response.headers;
    const reqNode = options.req;
    const responseNode = this.saveResponseMetadata(response, options);
    const contentType = this.normalizedContentType(options, headers) || '';
    let contentLocation = headers.get('content-location');

    // this.fireCallbacks('recv', xhr.args)
    // this.fireCallbacks('headers', [{uri: docuri, headers: xhr.headers}])

    // Check for masked errors (CORS, etc)
    if (response.status === 0) {
      // console.log('Masked error - status 0 for ' + docuri)
      return this.handleError(response, docuri, options);
    }
    if (response.status >= 400) {
      if (response.status === 404) {
        this.nonexistent[options.original.value] = true;
        this.nonexistent[docuri] = true;
      }
      return this.saveErrorResponse(response, responseNode).then(() => {
        let errorMessage = options.resource + ' ' + response.statusText;
        return this.failFetch(options, errorMessage, response.status, response);
      });
    }
    var diffLocation = null;
    var absContentLocation = null;
    if (contentLocation) {
      absContentLocation = Uri.join(contentLocation, docuri);
      if (absContentLocation !== docuri) {
        diffLocation = absContentLocation;
      }
    }
    if (response.status === 200) {
      this.addType(this.ns.link('Document'), reqNode, kb, docuri);
      if (diffLocation) {
        this.addType(this.ns.link('Document'), reqNode, kb, diffLocation);
      }

      // Before we parse new data clear old but only on 200
      if (options.clearPreviousData) {
        // kb.removeDocument(options.resource)
        // only remove content, keep metatdata
        const sts = kb.statementsMatching(undefined, undefined, undefined, options.resource).slice(); // Take a copy as this is the actual index
        for (let i = 0; i < sts.length; i++) {
          kb.removeStatement(sts[i]);
        }
      }
      let isImage = contentType.includes('image/') || contentType.includes('application/pdf');
      if (contentType && isImage) {
        this.addType(kb.rdfFactory.namedNode('http://purl.org/dc/terms/Image'), reqNode, kb, docuri);
        if (diffLocation) {
          this.addType(kb.rdfFactory.namedNode('http://purl.org/dc/terms/Image'), reqNode, kb, diffLocation);
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
        return this.doneFetch(options, response);
      }
      this.requested[absContentLocation] = true;
    }
    this.parseLinkHeader(headers.get('link'), options.original, reqNode);
    let handler = this.handlerForContentType(contentType, response);
    if (!handler) {
      //  Not a problem, we just don't extract data
      this.addStatus(reqNode, 'Fetch over. No data handled.');
      return this.doneFetch(options, response);
    }
    return response.text()
    // @ts-ignore Types seem right
    .then(responseText => {
      response.responseText = responseText;
      return handler.parse(this, responseText, options, response);
    });
  }
  saveErrorResponse(response, responseNode) {
    let kb = this.store;
    return response.text().then(content => {
      if (content.length > 10) {
        kb.add(responseNode, this.ns.http('content'), kb.rdfFactory.literal(content), responseNode);
      }
    });
  }
  handlerForContentType(contentType, response) {
    if (!contentType) {
      return null;
    }
    let Handler = this.handlers.find(handler => {
      return contentType.match(handler.pattern);
    });

    // @ts-ignore in practice all Handlers have constructors.
    return Handler ? new Handler(response) : null;
  }
  guessContentType(uri) {
    return CONTENT_TYPE_BY_EXT[uri.split('.').pop()];
  }
  normalizedContentType(options, headers) {
    if (options.forceContentType) {
      return options.forceContentType;
    }
    let contentType = headers.get('content-type');
    if (!contentType || contentType.includes('application/octet-stream')) {
      let guess = this.guessContentType(options.resource.value);
      if (guess) {
        return guess;
      }
    }
    let protocol = Uri.protocol(options.resource.value);
    if (!contentType && ['file', 'chrome'].includes(protocol)) {
      return 'text/xml';
    }
    return contentType;
  }

  /**
   * Sends a new request to the specified uri. (Extracted from `onerrorFactory()`)
   */
  redirectToProxy(newURI, options) {
    this.addStatus(options.req, 'BLOCKED -> Cross-site Proxy to <' + newURI + '>');
    options.proxyUsed = true;
    const kb = this.store;
    const oldReq = options.req; // request metadata blank node

    if (!options.noMeta) {
      kb.add(oldReq, this.ns.link('redirectedTo'), kb.rdfFactory.namedNode(newURI), oldReq);
      this.addStatus(oldReq, 'redirected to new request'); // why
    }
    this.requested[options.resource.value] = 'redirected';
    this.redirectedTo[options.resource.value] = newURI;
    let newOptions = Object.assign({}, options);
    newOptions.baseURI = options.resource.value;
    return this.fetchUri(newURI, newOptions).then(response => {
      if (!newOptions.noMeta) {
        kb.add(oldReq, this.ns.link('redirectedRequest'), newOptions.req, this.appNode);
      }
      return response;
    });
  }
  setRequestTimeout(uri, options) {
    return new Promise(resolve => {
      this.timeouts[uri] = (this.timeouts[uri] || []).concat(setTimeout(() => {
        if (this.isPending(uri) && !options.retriedWithNoCredentials && !options.proxyUsed) {
          resolve(this.failFetch(options, `Request to ${uri} timed out`, 'timeout'));
        }
      }, this.timeout));
    });
  }
  addFetchCallback(uri, callback) {
    if (!this.fetchCallbacks[uri]) {
      this.fetchCallbacks[uri] = [callback];
    } else {
      this.fetchCallbacks[uri].push(callback);
    }
  }
  acceptString() {
    let acceptstring = '';
    for (let mediaType in this.mediatypes) {
      if (acceptstring !== '') {
        acceptstring += ', ';
      }
      acceptstring += mediaType;
      for (let property in this.mediatypes[mediaType]) {
        acceptstring += ';' + property + '=' + this.mediatypes[mediaType][property];
      }
    }
    return acceptstring;
  }
  // var updatesVia = new $rdf.UpdatesVia(this) // Subscribe to headers
  // @@@@@@@@ This is turned off because it causes a websocket to be set up for ANY fetch
  // whether we want to track it ot not. including ontologies loaed though the XSSproxy
}
exports.default = Fetcher;
(0, _defineProperty2.default)(Fetcher, "HANDLERS", void 0);
(0, _defineProperty2.default)(Fetcher, "CONTENT_TYPE_BY_EXT", void 0);
// TODO: Document this
(0, _defineProperty2.default)(Fetcher, "crossSiteProxyTemplate", void 0);
Fetcher.HANDLERS = defaultHandlers;
Fetcher.CONTENT_TYPE_BY_EXT = CONTENT_TYPE_BY_EXT;