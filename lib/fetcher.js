"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

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

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var Parsable = {
  'text/n3': true,
  'text/turtle': true,
  'application/rdf+xml': true,
  'application/xhtml+xml': true,
  'text/html': true,
  'application/ld+json': true
}; // This is a minimal set to allow the use of damaged servers if necessary

var CONTENT_TYPE_BY_EXT = {
  'rdf': _types.RDFXMLContentType,
  'owl': _types.RDFXMLContentType,
  'n3': 'text/n3',
  'ttl': 'text/turtle',
  'nt': 'text/n3',
  'acl': 'text/n3',
  'html': 'text/html',
  'xml': 'text/xml'
}; // Convenience namespaces needed in this module.
// These are deliberately not exported as the user application should
// make its own list and not rely on the prefixes used here,
// and not be tempted to add to them, and them clash with those of another
// application.

var getNS = function getNS(factory) {
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

var ns = getNS();

var Handler = // TODO: Document, type
// TODO: Document, type
function Handler(response, dom) {
  (0, _classCallCheck2.default)(this, Handler);
  (0, _defineProperty2.default)(this, "response", void 0);
  (0, _defineProperty2.default)(this, "dom", void 0);
  this.response = response; // The type assertion operator here might need to be removed.

  this.dom = dom;
};

(0, _defineProperty2.default)(Handler, "pattern", void 0);

var RDFXMLHandler = /*#__PURE__*/function (_Handler) {
  (0, _inherits2.default)(RDFXMLHandler, _Handler);

  var _super = _createSuper(RDFXMLHandler);

  function RDFXMLHandler() {
    (0, _classCallCheck2.default)(this, RDFXMLHandler);
    return _super.apply(this, arguments);
  }

  (0, _createClass2.default)(RDFXMLHandler, [{
    key: "parse",
    value: function parse(fetcher,
    /** An XML String */
    responseText,
    /** Requires .original */
    options) {
      var kb = fetcher.store;

      if (!this.dom) {
        this.dom = Util.parseXML(responseText);
      }

      var root = this.dom.documentElement;

      if (root.nodeName === 'parsererror') {
        // Mozilla only See issue/issue110
        // have to fail the request
        return fetcher.failFetch(options, 'Badly formed XML in ' + options.resource.value, 'parse_error');
      }

      var parser = new _rdfxmlparser.default(kb);

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
  }], [{
    key: "toString",
    value: function toString() {
      return 'RDFXMLHandler';
    }
  }, {
    key: "register",
    value: function register(fetcher) {
      fetcher.mediatypes[_types.RDFXMLContentType] = {
        'q': 0.9
      };
    }
  }]);
  return RDFXMLHandler;
}(Handler);

RDFXMLHandler.pattern = new RegExp('application/rdf\\+xml');

var XHTMLHandler = /*#__PURE__*/function (_Handler2) {
  (0, _inherits2.default)(XHTMLHandler, _Handler2);

  var _super2 = _createSuper(XHTMLHandler);

  function XHTMLHandler() {
    (0, _classCallCheck2.default)(this, XHTMLHandler);
    return _super2.apply(this, arguments);
  }

  (0, _createClass2.default)(XHTMLHandler, [{
    key: "parse",
    value: function parse(fetcher, responseText, options) {
      var relation, reverse;

      if (!this.dom) {
        this.dom = Util.parseXML(responseText);
      }

      var kb = fetcher.store; // dc:title

      var title = this.dom.getElementsByTagName('title');

      if (title.length > 0) {
        kb.add(options.resource, ns.dc('title'), kb.rdfFactory.literal(title[0].textContent), options.resource); // log.info("Inferring title of " + xhr.resource)
      } // link rel


      var links = this.dom.getElementsByTagName('link');

      for (var x = links.length - 1; x >= 0; x--) {
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
      } // Data Islands


      var scripts = this.dom.getElementsByTagName('script');

      for (var i = 0; i < scripts.length; i++) {
        var contentType = scripts[i].getAttribute('type');

        if (Parsable[contentType]) {
          // @ts-ignore incompatibility between Store.add and Formula.add
          (0, _parse.default)(scripts[i].textContent, kb, options.original.value, contentType); // @ts-ignore incompatibility between Store.add and Formula.add

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
          var msg = 'Error trying to parse ' + options.resource + ' as RDFa:\n' + err + ':\n' + err.stack;
          return fetcher.failFetch(options, msg, 'parse_error');
        }
      }

      return fetcher.doneFetch(options, this.response);
    }
  }], [{
    key: "toString",
    value: function toString() {
      return 'XHTMLHandler';
    }
  }, {
    key: "register",
    value: function register(fetcher) {
      fetcher.mediatypes[_types.XHTMLContentType] = {};
    }
  }]);
  return XHTMLHandler;
}(Handler);

XHTMLHandler.pattern = new RegExp('application/xhtml');

var XMLHandler = /*#__PURE__*/function (_Handler3) {
  (0, _inherits2.default)(XMLHandler, _Handler3);

  var _super3 = _createSuper(XMLHandler);

  function XMLHandler() {
    (0, _classCallCheck2.default)(this, XMLHandler);
    return _super3.apply(this, arguments);
  }

  (0, _createClass2.default)(XMLHandler, [{
    key: "parse",
    value: function parse(fetcher, responseText, options) {
      var dom = Util.parseXML(responseText); // XML Semantics defined by root element namespace
      // figure out the root element

      for (var c = 0; c < dom.childNodes.length; c++) {
        // is this node an element?
        if (dom.childNodes[c].nodeType === 1) {
          // We've found the first element, it's the root
          var _ns = dom.childNodes[c].namespaceURI; // Is it RDF/XML?

          if (_ns && _ns === _ns['rdf']) {
            fetcher.addStatus(options.req, 'Has XML root element in the RDF namespace, so assume RDF/XML.');
            var rdfHandler = new RDFXMLHandler(this.response, dom);
            return rdfHandler.parse(fetcher, responseText, options);
          }

          break;
        }
      } // Or it could be XHTML?
      // Maybe it has an XHTML DOCTYPE?


      if (dom.doctype) {
        // log.info("We found a DOCTYPE in " + xhr.resource)
        if (dom.doctype.name === 'html' && dom.doctype.publicId.match(/^-\/\/W3C\/\/DTD XHTML/) && dom.doctype.systemId.match(/http:\/\/www.w3.org\/TR\/xhtml/)) {
          fetcher.addStatus(options.req, 'Has XHTML DOCTYPE. Switching to XHTML Handler.\n');
          var xhtmlHandler = new XHTMLHandler(this.response, dom);
          return xhtmlHandler.parse(fetcher, responseText, options);
        }
      } // Or what about an XHTML namespace?


      var html = dom.getElementsByTagName('html')[0];

      if (html) {
        var xmlns = html.getAttribute('xmlns');

        if (xmlns && xmlns.match(/^http:\/\/www.w3.org\/1999\/xhtml/)) {
          fetcher.addStatus(options.req, 'Has a default namespace for ' + 'XHTML. Switching to XHTMLHandler.\n');

          var _xhtmlHandler = new XHTMLHandler(this.response, dom);

          return _xhtmlHandler.parse(fetcher, responseText, options);
        }
      } // At this point we should check the namespace document (cache it!) and
      // look for a GRDDL transform
      // @@  Get namespace document <n>, parse it, look for  <n> grddl:namespaceTransform ?y
      // Apply ?y to   dom
      // We give up. What dialect is this?


      return fetcher.failFetch(options, 'Unsupported dialect of XML: not RDF or XHTML namespace, etc.\n' + responseText.slice(0, 80), 901);
    }
  }], [{
    key: "toString",
    value: function toString() {
      return 'XMLHandler';
    }
  }, {
    key: "register",
    value: function register(fetcher) {
      fetcher.mediatypes['text/xml'] = {
        'q': 0.5
      };
      fetcher.mediatypes['application/xml'] = {
        'q': 0.5
      };
    }
  }]);
  return XMLHandler;
}(Handler);

XMLHandler.pattern = new RegExp('(text|application)/(.*)xml');

var HTMLHandler = /*#__PURE__*/function (_Handler4) {
  (0, _inherits2.default)(HTMLHandler, _Handler4);

  var _super4 = _createSuper(HTMLHandler);

  function HTMLHandler() {
    (0, _classCallCheck2.default)(this, HTMLHandler);
    return _super4.apply(this, arguments);
  }

  (0, _createClass2.default)(HTMLHandler, [{
    key: "parse",
    value: function parse(fetcher, responseText, options) {
      var kb = fetcher.store; // We only handle XHTML so we have to figure out if this is XML
      // log.info("Sniffing HTML " + xhr.resource + " for XHTML.")

      if (isXML(responseText)) {
        fetcher.addStatus(options.req, "Has an XML declaration. We'll assume " + "it's XHTML as the content-type was text/html.\n");
        var xhtmlHandler = new XHTMLHandler(this.response);
        return xhtmlHandler.parse(fetcher, responseText, options);
      } // DOCTYPE html


      if (isXHTML(responseText)) {
        fetcher.addStatus(options.req, 'Has XHTML DOCTYPE. Switching to XHTMLHandler.\n');

        var _xhtmlHandler2 = new XHTMLHandler(this.response);

        return _xhtmlHandler2.parse(fetcher, responseText, options);
      } // xmlns


      if (isXMLNS(responseText)) {
        fetcher.addStatus(options.req, 'Has default namespace for XHTML, so switching to XHTMLHandler.\n');

        var _xhtmlHandler3 = new XHTMLHandler(this.response);

        return _xhtmlHandler3.parse(fetcher, responseText, options);
      } // dc:title
      // no need to escape '/' here


      var titleMatch = new RegExp('<title>([\\s\\S]+?)</title>', 'im').exec(responseText);

      if (titleMatch) {
        kb.add(options.resource, ns.dc('title'), kb.rdfFactory.literal(titleMatch[1]), options.resource); // think about xml:lang later
      }

      kb.add(options.resource, ns.rdf('type'), ns.link('WebPage'), fetcher.appNode);
      fetcher.addStatus(options.req, 'non-XML HTML document, not parsed for data.');
      return fetcher.doneFetch(options, this.response);
    }
  }], [{
    key: "toString",
    value: function toString() {
      return 'HTMLHandler';
    }
  }, {
    key: "register",
    value: function register(fetcher) {
      fetcher.mediatypes['text/html'] = {
        'q': 0.9
      };
    }
  }]);
  return HTMLHandler;
}(Handler);

HTMLHandler.pattern = new RegExp('text/html');

var JsonLdHandler = /*#__PURE__*/function (_Handler5) {
  (0, _inherits2.default)(JsonLdHandler, _Handler5);

  var _super5 = _createSuper(JsonLdHandler);

  function JsonLdHandler() {
    (0, _classCallCheck2.default)(this, JsonLdHandler);
    return _super5.apply(this, arguments);
  }

  (0, _createClass2.default)(JsonLdHandler, [{
    key: "parse",
    value: function parse(fetcher, responseText, options, response) {
      var kb = fetcher.store;
      return new Promise(function (resolve, reject) {
        try {
          (0, _jsonldparser.default)(responseText, kb, options.original.value, function () {
            resolve(fetcher.doneFetch(options, response));
          });
        } catch (err) {
          var msg = 'Error trying to parse ' + options.resource + ' as JSON-LD:\n' + err; // not err.stack -- irrelevant

          resolve(fetcher.failFetch(options, msg, 'parse_error', response));
        }
      });
    }
  }], [{
    key: "toString",
    value: function toString() {
      return 'JsonLdHandler';
    }
  }, {
    key: "register",
    value: function register(fetcher) {
      fetcher.mediatypes['application/ld+json'] = {
        'q': 0.9
      };
    }
  }]);
  return JsonLdHandler;
}(Handler);

JsonLdHandler.pattern = /application\/ld\+json/;

var TextHandler = /*#__PURE__*/function (_Handler6) {
  (0, _inherits2.default)(TextHandler, _Handler6);

  var _super6 = _createSuper(TextHandler);

  function TextHandler() {
    (0, _classCallCheck2.default)(this, TextHandler);
    return _super6.apply(this, arguments);
  }

  (0, _createClass2.default)(TextHandler, [{
    key: "parse",
    value: function parse(fetcher, responseText, options) {
      // We only speak dialects of XML right now. Is this XML?
      // Look for an XML declaration
      if (isXML(responseText)) {
        fetcher.addStatus(options.req, 'Warning: ' + options.resource + " has an XML declaration. We'll assume " + "it's XML but its content-type wasn't XML.\n");
        var xmlHandler = new XMLHandler(this.response);
        return xmlHandler.parse(fetcher, responseText, options);
      } // Look for an XML declaration


      if (responseText.slice(0, 500).match(/xmlns:/)) {
        fetcher.addStatus(options.req, "May have an XML namespace. We'll assume " + "it's XML but its content-type wasn't XML.\n");

        var _xmlHandler = new XMLHandler(this.response);

        return _xmlHandler.parse(fetcher, responseText, options);
      } // We give up finding semantics - this is not an error, just no data


      fetcher.addStatus(options.req, 'Plain text document, no known RDF semantics.');
      return fetcher.doneFetch(options, this.response);
    }
  }], [{
    key: "toString",
    value: function toString() {
      return 'TextHandler';
    }
  }, {
    key: "register",
    value: function register(fetcher) {
      fetcher.mediatypes['text/plain'] = {
        'q': 0.5
      };
    }
  }]);
  return TextHandler;
}(Handler);

TextHandler.pattern = new RegExp('text/plain');

var N3Handler = /*#__PURE__*/function (_Handler7) {
  (0, _inherits2.default)(N3Handler, _Handler7);

  var _super7 = _createSuper(N3Handler);

  function N3Handler() {
    (0, _classCallCheck2.default)(this, N3Handler);
    return _super7.apply(this, arguments);
  }

  (0, _createClass2.default)(N3Handler, [{
    key: "parse",
    value: function parse(fetcher, responseText, options, response) {
      // Parse the text of this N3 file
      var kb = fetcher.store;
      var p = (0, _n3parser.default)(kb, kb, options.original.value, options.original.value, null, null, '', null); //                p.loadBuf(xhr.responseText)

      try {
        p.loadBuf(responseText);
      } catch (err) {
        var msg = 'Error trying to parse ' + options.resource + ' as Notation3:\n' + err; // not err.stack -- irrelevant

        return fetcher.failFetch(options, msg, 'parse_error', response);
      }

      fetcher.addStatus(options.req, 'N3 parsed: ' + p.statementCount + ' triples in ' + p.lines + ' lines.');
      fetcher.store.add(options.original, ns.rdf('type'), ns.link('RDFDocument'), fetcher.appNode);
      return fetcher.doneFetch(options, this.response);
    }
  }], [{
    key: "toString",
    value: function toString() {
      return 'N3Handler';
    }
  }, {
    key: "register",
    value: function register(fetcher) {
      fetcher.mediatypes['text/n3'] = {
        'q': '1.0'
      }; // as per 2008 spec

      /*
       fetcher.mediatypes['application/x-turtle'] = {
       'q': 1.0
       } // pre 2008
       */

      fetcher.mediatypes['text/turtle'] = {
        'q': 1.0
      }; // post 2008
    }
  }]);
  return N3Handler;
}(Handler);

N3Handler.pattern = new RegExp('(application|text)/(x-)?(rdf\\+)?(n3|turtle)');
var defaultHandlers = {
  RDFXMLHandler: RDFXMLHandler,
  XHTMLHandler: XHTMLHandler,
  XMLHandler: XMLHandler,
  HTMLHandler: HTMLHandler,
  TextHandler: TextHandler,
  N3Handler: N3Handler,
  JsonLdHandler: JsonLdHandler
};

function isXHTML(responseText) {
  var docTypeStart = responseText.indexOf('<!DOCTYPE html');
  var docTypeEnd = responseText.indexOf('>');

  if (docTypeStart === -1 || docTypeEnd === -1 || docTypeStart > docTypeEnd) {
    return false;
  }

  return responseText.substr(docTypeStart, docTypeEnd - docTypeStart).indexOf('XHTML') !== -1;
}

function isXML(responseText) {
  var match = responseText.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/);
  return !!match;
}

function isXMLNS(responseText) {
  var match = responseText.match(/[^(<html)]*<html\s+[^<]*xmlns=['"]http:\/\/www.w3.org\/1999\/xhtml["'][^<]*>/);
  return !!match;
}

/** Fetcher
 *
 * The Fetcher object is a helper object for a quadstore
 * which turns it from an offline store to an online store.
 * The fetcher deals with loading data files rom the web,
  * figuring how to parse them.  It will also refresh, remove, the data
  * and put back the data to the web.
 */
var Fetcher = /*#__PURE__*/function () {
  /** Denoting this session */

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

  /** List of timeouts associated with a requested URL */

  /** Redirected from *key uri* to *value uri* */

  /** fetchCallbacks[uri].push(callback) */

  /** Keep track of explicit 404s -> we can overwrite etc */
  // TODO: Document this

  /** Methods added by calling Util.callbackify in the constructor*/
  function Fetcher(store) {
    var _this = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2.default)(this, Fetcher);
    (0, _defineProperty2.default)(this, "store", void 0);
    (0, _defineProperty2.default)(this, "timeout", void 0);
    (0, _defineProperty2.default)(this, "_fetch", void 0);
    (0, _defineProperty2.default)(this, "mediatypes", void 0);
    (0, _defineProperty2.default)(this, "appNode", void 0);
    (0, _defineProperty2.default)(this, "requested", void 0);
    (0, _defineProperty2.default)(this, "timeouts", void 0);
    (0, _defineProperty2.default)(this, "redirectedTo", void 0);
    (0, _defineProperty2.default)(this, "fetchQueue", void 0);
    (0, _defineProperty2.default)(this, "fetchCallbacks", void 0);
    (0, _defineProperty2.default)(this, "nonexistent", void 0);
    (0, _defineProperty2.default)(this, "lookedUp", void 0);
    (0, _defineProperty2.default)(this, "handlers", void 0);
    (0, _defineProperty2.default)(this, "ns", void 0);
    (0, _defineProperty2.default)(this, "fireCallbacks", void 0);
    this.store = store || new _store.default();
    this.ns = getNS(this.store.rdfFactory);
    this.timeout = options.timeout || 30000;
    this._fetch = options.fetch || typeof global !== 'undefined' && global.solidFetcher || typeof window !== 'undefined' && window.solidFetcher || _crossFetch.default;

    if (!this._fetch) {
      throw new Error('No _fetch function available for Fetcher');
    }

    this.appNode = this.store.rdfFactory.blankNode();
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

    }; // Util.callbackify(this, ['request', 'recv', 'headers', 'load', 'fail',
    //   'refresh', 'retract', 'done'])
    // In switching to fetch(), 'recv', 'headers' and 'load' do not make sense

    Util.callbackify(this, ['request', 'fail', 'refresh', 'retract', 'done']);
    Object.keys(options.handlers || defaultHandlers).map(function (key) {
      return _this.addHandler(defaultHandlers[key]);
    });
  }

  (0, _createClass2.default)(Fetcher, [{
    key: "load",
    value:
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
    function load(uri) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      options = Object.assign({}, options); // Take a copy as we add stuff to the options!!

      if (uri instanceof Array) {
        return Promise.all(uri.map(function (x) {
          return _this2.load(x, Object.assign({}, options));
        }));
      }

      var uriIn = uri;
      var docuri = (0, _termValue.termValue)(uriIn);
      docuri = docuri.split('#')[0];
      options = this.initFetchOptions(docuri, options);
      var initialisedOptions = this.initFetchOptions(docuri, options);
      return this.pendingFetchPromise(docuri, initialisedOptions.baseURI, initialisedOptions);
    }
  }, {
    key: "pendingFetchPromise",
    value: function pendingFetchPromise(uri, originalUri, options) {
      var _this3 = this;

      var pendingPromise; // Check to see if some request is already dealing with this uri

      if (!options.force && this.fetchQueue[originalUri]) {
        pendingPromise = this.fetchQueue[originalUri];
      } else {
        pendingPromise = Promise.race([this.setRequestTimeout(uri, options), this.fetchUri(uri, options)]);
        this.fetchQueue[originalUri] = pendingPromise; // Clean up the queued promise after a time, if it's resolved

        this.cleanupFetchRequest(originalUri, undefined, this.timeout);
      }

      return pendingPromise.then(function (x) {
        if (uri in _this3.timeouts) {
          _this3.timeouts[uri].forEach(clearTimeout);

          delete _this3.timeouts[uri];
        }

        return x;
      });
    }
    /**
     * @param _options - DEPRECATED
     */

  }, {
    key: "cleanupFetchRequest",
    value: function cleanupFetchRequest(originalUri, _options, timeout) {
      var _this4 = this;

      if (_options !== undefined) {
        console.warn("_options is deprecated");
      }

      this.timeouts[originalUri] = (this.timeouts[originalUri] || []).concat(setTimeout(function () {
        if (!_this4.isPending(originalUri)) {
          delete _this4.fetchQueue[originalUri];
        }
      }, timeout));
    }
  }, {
    key: "initFetchOptions",
    value: function initFetchOptions(uri, options) {
      var kb = this.store;
      var isGet = !options.method || options.method.toUpperCase() === 'GET';

      if (!isGet) {
        options.force = true;
      }

      options.resource = kb.rdfFactory.namedNode(uri); // This might be proxified

      options.baseURI = options.baseURI || uri; // Preserve though proxying etc

      options.original = kb.rdfFactory.namedNode(options.baseURI);
      options.req = kb.bnode();
      options.headers = options.headers || new _crossFetch.Headers();

      if (options.contentType) {
        // @ts-ignore
        options.headers['content-type'] = options.contentType;
      }

      if (options.force) {
        options.cache = 'no-cache';
      }

      var acceptString = this.acceptString(); // @ts-ignore

      options.headers['accept'] = acceptString;
      var requestedURI = Fetcher.offlineOverride(uri);
      options.requestedURI = requestedURI;
      Fetcher.setCredentials(requestedURI, options);
      var actualProxyURI = Fetcher.proxyIfNecessary(requestedURI);

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

  }, {
    key: "fetchUri",
    value: function fetchUri(docuri, options) {
      var _this5 = this;

      if (!docuri) {
        return Promise.reject(new Error('Cannot fetch an empty uri'));
      }

      if (Fetcher.unsupportedProtocol(docuri)) {
        return this.failFetch(options, 'fetcher: Unsupported protocol', 'unsupported_protocol');
      }

      var state = this.getState(docuri);

      if (!options.force) {
        if (state === 'fetched') {
          // URI already fetched and added to store
          return Promise.resolve( // @ts-ignore This is not a valid response object
          this.doneFetch(options, {
            status: 200,
            ok: true,
            statusText: 'Already loaded into quadstore.'
          }));
        }

        if (state === 'failed' && this.requested[docuri] === 404) {
          // Remember nonexistence
          var _message = 'Previously failed: ' + this.requested[docuri]; // @ts-ignore This is not a valid response object


          var dummyResponse = {
            url: docuri,
            // This does not comply to Fetch spec, it can be a string value in rdflib
            status: this.requested[docuri],
            statusText: _message,
            responseText: _message,
            headers: new _crossFetch.Headers(),
            // Headers() ???
            ok: false,
            body: null,
            bodyUsed: false,
            size: 0,
            timeout: 0
          };
          return this.failFetch(options, _message, this.requested[docuri], dummyResponse);
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

      var actualProxyURI = options.actualProxyURI; // Map might get mistakenly added into headers
      // error TS2339: Property 'map' does not exist on type 'Headers'.

      /* let map
      if (options.headers && map in options.headers) {
        delete options.headers.map
      } */

      return this._fetch(actualProxyURI, options).then(function (response) {
        return _this5.handleResponse(response, docuri, options);
      }, function (error) {
        // @@ handleError?
        // @ts-ignore Invalid response object
        var dummyResponse = {
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
        console.log('Fetcher: <' + actualProxyURI + '> Non-HTTP fetch exception: ' + error);
        return _this5.handleError(dummyResponse, docuri, options); // possible credentials retry
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

  }, {
    key: "nowOrWhenFetched",
    value: function nowOrWhenFetched(uriIn, p2, userCallback) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var uri = (0, _termValue.termValue)(uriIn);

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

      this.load(uri, options).then(function (fetchResponse) {
        if (userCallback) {
          if (fetchResponse) {
            if (fetchResponse.ok) {
              userCallback(true, 'OK', fetchResponse);
            } else {
              // console.log('@@@ fetcher.js Should not take this path !!!!!!!!!!!!')
              var oops = 'HTTP error: Status ' + fetchResponse.status + ' (' + fetchResponse.statusText + ')';

              if (fetchResponse.responseText) {
                oops += ' ' + fetchResponse.responseText; // not in 404, dns error, nock failure
              }

              console.log(oops + ' fetching ' + uri);
              userCallback(false, oops, fetchResponse);
            }
          } else {
            var _oops = '@@ nowOrWhenFetched:  no response object!';
            console.log(_oops);
            userCallback(false, _oops);
          }
        }
      }, function (err) {
        var message = err.message || err.statusText;
        message = 'Failed to load  <' + uri + '> ' + message;
        console.log(message);

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

  }, {
    key: "addStatus",
    value: function addStatus(req, statusMessage) {
      // <Debug about="parsePerformance">
      var now = new Date();
      statusMessage = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '.' + now.getMilliseconds() + '] ' + statusMessage; // </Debug>

      var kb = this.store;
      var statusNode = kb.the(req, this.ns.link('status'));

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

  }, {
    key: "failFetch",
    value: function failFetch(options, errorMessage, statusCode, response) {
      this.addStatus(options.req, errorMessage);

      if (!options.noMeta) {
        this.store.add(options.original, this.ns.link('error'), this.store.rdfFactory.literal(errorMessage));
      }

      var meth = (options.method || 'GET').toUpperCase();
      var isGet = meth === 'GET' || meth === 'HEAD';

      if (isGet) {
        // only cache the status code on GET or HEAD
        if (!options.resource.equals(options.original)) {// console.log('@@ Recording failure  ' + meth + '  original ' + options.original +option '( as ' + options.resource + ') : ' + statusCode)
        } else {// console.log('@@ Recording ' + meth + ' failure for ' + options.original + ': ' + statusCode)
        }

        this.requested[Uri.docpart(options.original.value)] = statusCode;
        this.fireCallbacks('fail', [options.original.value, errorMessage]);
      }

      var err = new Error('Fetcher: ' + errorMessage); // err.ok = false // Is taken as a response, will work too @@ phase out?

      err.status = statusCode;
      err.statusText = errorMessage;
      err.response = response;
      return Promise.reject(err);
    } // in the why part of the quad distinguish between HTML and HTTP header
    // Reverse is set iif the link was rev= as opposed to rel=

  }, {
    key: "linkData",
    value: function linkData(originalUri, rel, uri, why, reverse) {
      if (!uri) return;
      var kb = this.store;
      var predicate; // See http://www.w3.org/TR/powder-dr/#httplink for describedby 2008-12-10

      var obj = kb.rdfFactory.namedNode(Uri.join(uri, originalUri.value));

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
  }, {
    key: "parseLinkHeader",
    value: function parseLinkHeader(linkHeader, originalUri, reqNode) {
      if (!linkHeader) {
        return;
      } // const linkexp = /<[^>]*>\s*(\s*;\s*[^()<>@,;:"/[\]?={} \t]+=(([^()<>@,;:"/[]?={} \t]+)|("[^"]*")))*(,|$)/g
      // const paramexp = /[^()<>@,;:"/[]?={} \t]+=(([^()<>@,;:"/[]?={} \t]+)|("[^"]*"))/g
      // From https://www.dcode.fr/regular-expression-simplificator:
      // const linkexp = /<[^>]*>\s*(\s*;\s*[^()<>@,;:"/[\]?={} t]+=["]))*[,$]/g
      // const paramexp = /[^\\<>@,;:"\/\[\]?={} \t]+=["])/g
      // Original:


      var linkexp = /<[^>]*>\s*(\s*;\s*[^()<>@,;:"/[\]?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
      var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;
      var matches = linkHeader.match(linkexp);
      if (matches == null) return;

      for (var i = 0; i < matches.length; i++) {
        var split = matches[i].split('>');
        var href = split[0].substring(1);
        var ps = split[1];
        var s = ps.match(paramexp);
        if (s == null) return;

        for (var j = 0; j < s.length; j++) {
          var p = s[j];
          var paramsplit = p.split('='); // var name = paramsplit[0]

          var rel = paramsplit[1].replace(/["']/g, ''); // '"

          this.linkData(originalUri, rel, href, reqNode);
        }
      }
    }
  }, {
    key: "doneFetch",
    value: function doneFetch(options, response) {
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

  }, {
    key: "nowKnownAs",
    value: function nowKnownAs(was, now) {
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

  }, {
    key: "putBack",
    value: function putBack(uri) {
      var _this6 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var uriSting = (0, _termValue.termValue)(uri);
      var doc = new _namedNode.default(uriSting).doc(); // strip off #

      options.contentType = options["content-type"] || options["Content-Type"] || options.contentType || _types.TurtleContentType;

      if (options.contentType === 'application/ld+json') {
        return new Promise(function (resolve, reject) {
          (0, _serialize.default)(doc, _this6.store, doc.uri, options.contentType, function (err, jsonString) {
            if (err) {
              reject(err);
            } else {
              // @ts-ignore
              options.data = jsonString;

              _this6.webOperation('PUT', uri, options).then(function (res) {
                return resolve(res);
              }).catch(function (error) {
                return reject(error);
              });
            }
          });
        });
      }

      options.data = (0, _serialize.default)(doc, this.store, doc.value, options.contentType);
      return this.webOperation('PUT', uriSting, options);
    }
  }, {
    key: "webCopy",
    value: function webCopy(here, there, contentType) {
      var _this7 = this;

      return this.webOperation('GET', here).then(function (result) {
        return _this7.webOperation('PUT', // change to binary from text
        there, {
          data: result.responseText,
          contentType: contentType
        });
      });
    }
  }, {
    key: "delete",
    value: function _delete(uri, options) {
      var _this8 = this;

      return this.webOperation('DELETE', uri, options).then(function (response) {
        _this8.requested[uri] = 404;
        _this8.nonexistent[uri] = true;

        _this8.unload(_this8.store.rdfFactory.namedNode(uri));

        return response;
      });
    }
    /** Create an empty resource if it really does not exist
     *  Be absolutely sure something does not exist before creating a new empty file
     * as otherwise existing could  be deleted.
     * @param doc - The resource
    */

  }, {
    key: "createIfNotExists",
    value: function () {
      var _createIfNotExists = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee(doc) {
        var contentType,
            data,
            fetcher,
            response,
            _args = arguments;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                contentType = _args.length > 1 && _args[1] !== undefined ? _args[1] : _types.TurtleContentType;
                data = _args.length > 2 && _args[2] !== undefined ? _args[2] : '';
                fetcher = this;
                _context.prev = 3;
                _context.next = 6;
                return fetcher.load(doc);

              case 6:
                response = _context.sent;
                _context.next = 29;
                break;

              case 9:
                _context.prev = 9;
                _context.t0 = _context["catch"](3);

                if (!(_context.t0.response.status === 404)) {
                  _context.next = 27;
                  break;
                }

                console.log('createIfNotExists: doc does NOT exist, will create... ' + doc);
                _context.prev = 13;
                _context.next = 16;
                return fetcher.webOperation('PUT', doc.value, {
                  data: data,
                  contentType: contentType
                });

              case 16:
                response = _context.sent;
                _context.next = 23;
                break;

              case 19:
                _context.prev = 19;
                _context.t1 = _context["catch"](13);
                console.log('createIfNotExists doc FAILED: ' + doc + ': ' + _context.t1);
                throw _context.t1;

              case 23:
                delete fetcher.requested[doc.value]; // delete cached 404 error
                // console.log('createIfNotExists doc created ok ' + doc)

                return _context.abrupt("return", response);

              case 27:
                console.log('createIfNotExists doc load error NOT 404:  ' + doc + ': ' + _context.t0);
                throw _context.t0;

              case 29:
                return _context.abrupt("return", response);

              case 30:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 9], [13, 19]]);
      }));

      function createIfNotExists(_x) {
        return _createIfNotExists.apply(this, arguments);
      }

      return createIfNotExists;
    }()
    /**
     * @param parentURI URI of parent container
     * @param folderName - Optional folder name (slug)
     * @param data - Optional folder metadata
     */

  }, {
    key: "createContainer",
    value: function createContainer(parentURI, folderName, data) {
      var headers = {
        // Force the right mime type for containers
        'content-type': _types.TurtleContentType,
        'link': this.ns.ldp('BasicContainer') + '; rel="type"'
      };

      if (folderName) {
        headers['slug'] = folderName;
      } // @ts-ignore These headers lack some of the required operators.


      var options = {
        headers: headers
      };

      if (data) {
        options.body = data;
      }

      return this.webOperation('POST', parentURI, options);
    }
  }, {
    key: "invalidateCache",
    value: function invalidateCache(iri) {
      var uri = (0, _termValue.termValue)(iri);
      var fetcher = this; // @ts-ignore

      if (fetcher.fetchQueue && fetcher.fetchQueue[uri]) {
        console.log('Internal error - fetchQueue exists ' + uri);
        var promise = fetcher.fetchQueue[uri];

        if (promise['PromiseStatus'] === 'resolved') {
          delete fetcher.fetchQueue[uri];
        } else {
          // pending
          delete fetcher.fetchQueue[uri];
          console.log('*** Fetcher: pending fetchQueue deleted ' + uri);
        }
      }

      if (fetcher.requested[uri] && fetcher.requested[uri] !== 'done' && fetcher.requested[uri] !== 'failed' && fetcher.requested[uri] !== 404) {
        var msg = "Rdflib: fetcher: Destructive operation on <".concat(fetcher.requested[uri], "> file being fetched! ") + uri;
        console.error(msg); // alert(msg)
      } else {
        delete fetcher.requested[uri]; // invalidate read cache -- @@ messes up logic if request in progress ??

        delete fetcher.nonexistent[uri];
      }
    }
    /**
     * A generic web opeation, at the fetch() level.
     * does not invole the quadstore.
     *
     *  Returns promise of Response
     *  If data is returned, copies it to response.responseText before returning
     */

  }, {
    key: "webOperation",
    value: function webOperation(method, uriIn) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var uri = (0, _termValue.termValue)(uriIn);
      options.method = method;
      options.body = options.data || options.body;
      options.force = true;
      var fetcher = this;

      if (options.body && !options.contentType) {
        throw new Error('Web operation sending data must have a defined contentType.');
      }

      if (options.contentType) {
        options.headers = options.headers || {};
        options.headers['content-type'] = options.contentType;
      }

      Fetcher.setCredentials(uri, options);
      return new Promise(function (resolve, reject) {
        fetcher._fetch(uri, options).then(function (response) {
          if (response.ok) {
            if (method === 'PUT' || method === 'PATCH' || method === 'POST' || method === 'DELETE') {
              fetcher.invalidateCache(uri);
            } // response.body with Chrome can't be relied on


            if (response.text) {
              // Was: response.body https://github.com/linkeddata/rdflib.js/issues/506
              response.text().then(function (data) {
                response.responseText = data;
                resolve(response);
              });
            } else {
              resolve(response);
            }
          } else {
            var msg = 'Web error: ' + response.status;
            if (response.statusText) msg += ' (' + response.statusText + ')';
            msg += ' on ' + method + ' of <' + uri + '>';
            if (response.responseText) msg += ': ' + response.responseText;
            var e2 = new Error(msg);
            e2.response = response;
            reject(e2);
          }
        }, function (err) {
          var msg = 'Fetch error for ' + method + ' of <' + uri + '>:' + err;
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

  }, {
    key: "lookUpThing",
    value: function lookUpThing(term, rterm) {
      var _this9 = this;

      var uris = this.store.uris(term); // Get all URIs

      uris = uris.map(function (u) {
        return Uri.docpart(u);
      }); // Drop hash fragments

      uris.forEach(function (u) {
        _this9.lookedUp[u] = true;
      }); // @ts-ignore Recursive type

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

  }, {
    key: "getHeader",
    value: function getHeader(doc, header) {
      var kb = this.store; // look for the URI (AS A STRING NOT A NODE) for a stored request

      var docuri = doc.value;
      var requests = kb.each(undefined, this.ns.link('requestedURI'), kb.rdfFactory.literal(docuri));

      for (var r = 0; r < requests.length; r++) {
        var request = requests[r];

        if (request !== undefined) {
          var _response = kb.any(request, this.ns.link('response'));

          if (_response !== undefined && kb.anyValue(_response, this.ns.http('status')) && kb.anyValue(_response, this.ns.http('status')).startsWith('2')) {
            // Only look at success returns - not 401 error messagess etc
            var results = kb.each(_response, this.ns.httph(header.toLowerCase()));

            if (results.length) {
              return results.map(function (v) {
                return v.value;
              });
            }

            return [];
          }
        }
      }

      return undefined;
    }
  }, {
    key: "saveRequestMetadata",
    value: function saveRequestMetadata(docuri, options) {
      var req = options.req;
      var kb = this.store;
      var rterm = options.referringTerm;
      this.addStatus(options.req, 'Accept: ' + options.headers['accept']);

      if ((0, _terms.isNamedNode)(rterm)) {
        kb.add(kb.rdfFactory.namedNode(docuri), this.ns.link('requestedBy'), rterm, this.appNode);
      }

      if (options.original && options.original.value !== docuri) {
        kb.add(req, this.ns.link('orginalURI'), kb.rdfFactory.literal(options.original.value), this.appNode);
      }

      var now = new Date();
      var timeNow = '[' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '] ';
      kb.add(req, this.ns.rdfs('label'), kb.rdfFactory.literal(timeNow + ' Request for ' + docuri), this.appNode); // We store the docuri as a string, not as a node,
      // see https://github.com/linkeddata/rdflib.js/pull/427#pullrequestreview-447910061

      kb.add(req, this.ns.link('requestedURI'), kb.rdfFactory.literal(docuri), this.appNode);
      kb.add(req, this.ns.link('status'), kb.collection(), this.appNode);
    }
  }, {
    key: "saveResponseMetadata",
    value: function saveResponseMetadata(response, options) {
      var _this10 = this;

      var kb = this.store;
      var responseNode = kb.bnode();
      kb.add(options.req, this.ns.link('response'), responseNode, responseNode);
      kb.add(responseNode, this.ns.http('status'), kb.rdfFactory.literal(response.status), responseNode);
      kb.add(responseNode, this.ns.http('statusText'), kb.rdfFactory.literal(response.statusText), responseNode); // Save the response headers

      response.headers.forEach(function (value, header) {
        kb.add(responseNode, _this10.ns.httph(header), _this10.store.rdfFactory.literal(value), responseNode);

        if (header === 'content-type') {
          kb.add(options.resource, _this10.ns.rdf('type'), kb.rdfFactory.namedNode(Util.mediaTypeClass(value).value), responseNode);
        }
      });
      return responseNode;
    }
  }, {
    key: "objectRefresh",
    value: function objectRefresh(term) {
      var uris = this.store.uris(term); // Get all URIs

      if (typeof uris !== 'undefined') {
        for (var i = 0; i < uris.length; i++) {
          this.refresh(this.store.rdfFactory.namedNode(Uri.docpart(uris[i]))); // what about rterm?
        }
      }
    }
    /* refresh  Reload data from a given document
    **
    ** @param term - An RDF Named Node for the eodcument in question
    ** @param userCallback - A function userCallback(ok, message, response)
    */

  }, {
    key: "refresh",
    value: function refresh(term, userCallback) {
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

  }, {
    key: "refreshIfExpired",
    value: function refreshIfExpired(term, userCallback) {
      var exp = this.getHeader(term, 'Expires');

      if (!exp || new Date(exp[0]).getTime() <= new Date().getTime()) {
        this.refresh(term, userCallback);
      } else {
        userCallback(true, 'Not expired', {});
      }
    }
  }, {
    key: "retract",
    value: function retract(term) {
      // sources_retract
      this.store.removeMany(undefined, undefined, undefined, term);

      if (term.value) {
        delete this.requested[Uri.docpart(term.value)];
      }

      this.fireCallbacks('retract', arguments);
    }
  }, {
    key: "getState",
    value: function getState(docuri) {
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
  }, {
    key: "isPending",
    value: function isPending(docuri) {
      // sources_pending
      // doing anyStatementMatching is wasting time
      // if it's not pending: false -> flailed
      //   'done' -> done 'redirected' -> redirected
      return this.requested[docuri] === true;
    }
  }, {
    key: "unload",
    value: function unload(term) {
      this.store.removeDocument(term);
      delete this.requested[term.value]; // So it can be load2ed again
    }
  }, {
    key: "addHandler",
    value: function addHandler(handler) {
      this.handlers.push(handler);
      handler.register(this);
    }
  }, {
    key: "retryNoCredentials",
    value: function retryNoCredentials(docuri, options) {
      console.log('Fetcher: CORS: RETRYING with NO CREDENTIALS for ' + options.resource);
      options.retriedWithNoCredentials = true; // protect against being called twice

      delete this.requested[docuri]; // forget the original request happened

      delete this.fetchQueue[docuri]; // Note: XHR property was withCredentials, but fetch property is just credentials

      var newOptions = Object.assign({}, options, {
        credentials: 'omit'
      });
      this.addStatus(options.req, 'Abort: Will retry with credentials SUPPRESSED to see if that helps');
      return this.load(docuri, newOptions);
    }
    /**
     * Tests whether a request is being made to a cross-site URI (for purposes
     * of retrying with a proxy)
     */

  }, {
    key: "isCrossSite",
    value: function isCrossSite(uri) {
      // Mashup situation, not node etc
      if (typeof document === 'undefined' || !document.location) {
        return false;
      }

      var hostpart = Uri.hostpart;
      var here = '' + document.location;
      return (hostpart(here) && hostpart(uri) && hostpart(here)) !== hostpart(uri);
    }
    /**
     * Called when there's a network error in fetch(), or a response
     * with status of 0.
     */

  }, {
    key: "handleError",
    value: function handleError(response, docuri, options) {
      if (this.isCrossSite(docuri)) {
        // Make sure we haven't retried already
        if (options.credentials && options.credentials === 'include' && !options.retriedWithNoCredentials) {
          return this.retryNoCredentials(docuri, options);
        } // Now attempt retry via proxy


        var proxyUri = Fetcher.crossSiteProxy(docuri);

        if (proxyUri && !options.proxyUsed) {
          console.log('web: Direct failed so trying proxy ' + proxyUri);
          return this.redirectToProxy(proxyUri, options);
        }
      }

      var message;

      if (response instanceof Error) {
        message = 'Fetch error: ' + response.message;
      } else {
        message = response.statusText;

        if (response.responseText) {
          message += " ".concat(response.responseText);
        }
      } // This is either not a CORS error, or retries have been made


      return this.failFetch(options, message, response.status || 998, response);
    } // deduce some things from the HTTP transaction

  }, {
    key: "addType",
    value: function addType(rdfType, req, kb, locURI) {
      // add type to all redirected resources too
      var prev = req;

      if (locURI) {
        var reqURI = kb.any(prev, this.ns.link('requestedURI'));

        if (reqURI && reqURI.value !== locURI) {
          kb.add(kb.rdfFactory.namedNode(locURI), this.ns.rdf('type'), rdfType, this.appNode);
        }
      }

      for (;;) {
        var doc = kb.any(prev, this.ns.link('requestedURI'));

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
        } // @ts-ignore always true?


        if (redirection !== '301' && redirection !== '302') {
          break;
        }
      }
    }
    /**
     * Handle fetch() response
     */

  }, {
    key: "handleResponse",
    value: function handleResponse(response, docuri, options) {
      var _this11 = this;

      var kb = this.store;
      var headers = response.headers;
      var reqNode = options.req;
      var responseNode = this.saveResponseMetadata(response, options);
      var contentType = this.normalizedContentType(options, headers) || '';
      var contentLocation = headers.get('content-location'); // this.fireCallbacks('recv', xhr.args)
      // this.fireCallbacks('headers', [{uri: docuri, headers: xhr.headers}])
      // Check for masked errors (CORS, etc)

      if (response.status === 0) {
        console.log('Masked error - status 0 for ' + docuri);
        return this.handleError(response, docuri, options);
      }

      if (response.status >= 400) {
        if (response.status === 404) {
          this.nonexistent[options.original.value] = true;
          this.nonexistent[docuri] = true;
        }

        return this.saveErrorResponse(response, responseNode).then(function () {
          var errorMessage = options.resource + ' ' + response.statusText;
          return _this11.failFetch(options, errorMessage, response.status, response);
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
        } // Before we parse new data clear old but only on 200


        if (options.clearPreviousData) {
          kb.removeDocument(options.resource);
        }

        var isImage = contentType.includes('image/') || contentType.includes('application/pdf');

        if (contentType && isImage) {
          this.addType(kb.rdfFactory.namedNode('http://purl.org/dc/terms/Image'), reqNode, kb, docuri);

          if (diffLocation) {
            this.addType(kb.rdfFactory.namedNode('http://purl.org/dc/terms/Image'), reqNode, kb, diffLocation);
          }
        }
      } // If we have already got the thing at this location, abort


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
      var handler = this.handlerForContentType(contentType, response);

      if (!handler) {
        //  Not a problem, we just don't extract data
        this.addStatus(reqNode, 'Fetch over. No data handled.');
        return this.doneFetch(options, response);
      }

      return response.text() // @ts-ignore Types seem right
      .then(function (responseText) {
        response.responseText = responseText;
        return handler.parse(_this11, responseText, options, response);
      });
    }
  }, {
    key: "saveErrorResponse",
    value: function saveErrorResponse(response, responseNode) {
      var _this12 = this;

      var kb = this.store;
      return response.text().then(function (content) {
        if (content.length > 10) {
          kb.add(responseNode, _this12.ns.http('content'), kb.rdfFactory.literal(content), responseNode);
        }
      });
    }
  }, {
    key: "handlerForContentType",
    value: function handlerForContentType(contentType, response) {
      if (!contentType) {
        return null;
      }

      var Handler = this.handlers.find(function (handler) {
        return contentType.match(handler.pattern);
      }); // @ts-ignore in practice all Handlers have constructors.

      return Handler ? new Handler(response) : null;
    }
  }, {
    key: "guessContentType",
    value: function guessContentType(uri) {
      return CONTENT_TYPE_BY_EXT[uri.split('.').pop()];
    }
  }, {
    key: "normalizedContentType",
    value: function normalizedContentType(options, headers) {
      if (options.forceContentType) {
        return options.forceContentType;
      }

      var contentType = headers.get('content-type');

      if (!contentType || contentType.includes('application/octet-stream')) {
        var guess = this.guessContentType(options.resource.value);

        if (guess) {
          return guess;
        }
      }

      var protocol = Uri.protocol(options.resource.value);

      if (!contentType && ['file', 'chrome'].includes(protocol)) {
        return 'text/xml';
      }

      return contentType;
    }
    /**
     * Sends a new request to the specified uri. (Extracted from `onerrorFactory()`)
     */

  }, {
    key: "redirectToProxy",
    value: function redirectToProxy(newURI, options) {
      var _this13 = this;

      this.addStatus(options.req, 'BLOCKED -> Cross-site Proxy to <' + newURI + '>');
      options.proxyUsed = true;
      var kb = this.store;
      var oldReq = options.req; // request metadata blank node

      if (!options.noMeta) {
        kb.add(oldReq, this.ns.link('redirectedTo'), kb.rdfFactory.namedNode(newURI), oldReq);
        this.addStatus(oldReq, 'redirected to new request'); // why
      }

      this.requested[options.resource.value] = 'redirected';
      this.redirectedTo[options.resource.value] = newURI;
      var newOptions = Object.assign({}, options);
      newOptions.baseURI = options.resource.value;
      return this.fetchUri(newURI, newOptions).then(function (response) {
        if (!newOptions.noMeta) {
          kb.add(oldReq, _this13.ns.link('redirectedRequest'), newOptions.req, _this13.appNode);
        }

        return response;
      });
    }
  }, {
    key: "setRequestTimeout",
    value: function setRequestTimeout(uri, options) {
      var _this14 = this;

      return new Promise(function (resolve) {
        _this14.timeouts[uri] = (_this14.timeouts[uri] || []).concat(setTimeout(function () {
          if (_this14.isPending(uri) && !options.retriedWithNoCredentials && !options.proxyUsed) {
            resolve(_this14.failFetch(options, "Request to ".concat(uri, " timed out"), 'timeout'));
          }
        }, _this14.timeout));
      });
    }
  }, {
    key: "addFetchCallback",
    value: function addFetchCallback(uri, callback) {
      if (!this.fetchCallbacks[uri]) {
        this.fetchCallbacks[uri] = [callback];
      } else {
        this.fetchCallbacks[uri].push(callback);
      }
    }
  }, {
    key: "acceptString",
    value: function acceptString() {
      var acceptstring = '';

      for (var mediaType in this.mediatypes) {
        if (acceptstring !== '') {
          acceptstring += ', ';
        }

        acceptstring += mediaType;

        for (var property in this.mediatypes[mediaType]) {
          acceptstring += ';' + property + '=' + this.mediatypes[mediaType][property];
        }
      }

      return acceptstring;
    } // var updatesVia = new $rdf.UpdatesVia(this) // Subscribe to headers
    // @@@@@@@@ This is turned off because it causes a websocket to be set up for ANY fetch
    // whether we want to track it ot not. including ontologies loaed though the XSSproxy

  }], [{
    key: "crossSiteProxy",
    value: function crossSiteProxy(uri) {
      if (Fetcher.crossSiteProxyTemplate) {
        return Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
      } else {
        return undefined;
      }
    }
  }, {
    key: "offlineOverride",
    value: function offlineOverride(uri) {
      // Map the URI to a localhost proxy if we are running on localhost
      // This is used for working offline, e.g. on planes.
      // Is the script itself is running in localhost, then access all
      //   data in a localhost mirror.
      // Do not remove without checking with TimBL
      var requestedURI = uri;
      var UI;

      if (typeof window !== 'undefined' && window.panes && (UI = window.panes.UI) && UI.preferences && UI.preferences.get('offlineModeUsingLocalhost')) {
        if (requestedURI.slice(0, 7) === 'http://' && requestedURI.slice(7, 17) !== 'localhost/') {
          requestedURI = 'http://localhost/' + requestedURI.slice(7);

          _log.default.warn('Localhost kludge for offline use: actually getting <' + requestedURI + '>');
        } else {// log.warn("Localhost kludge NOT USED <" + requestedURI + ">")
        }
      } else {// log.warn("Localhost kludge OFF offline use: actually getting <" +
        //   requestedURI + ">")
      }

      return requestedURI;
    }
  }, {
    key: "proxyIfNecessary",
    value: function proxyIfNecessary(uri) {
      var UI;

      if (typeof window !== 'undefined' && window.panes && (UI = window.panes.UI) && UI.isExtension) {
        return uri;
      } // Extension does not need proxy


      if (typeof $SolidTestEnvironment !== 'undefined' && $SolidTestEnvironment.localSiteMap) {
        // nested dictionaries of URI parts from origin down
        var hostpath = uri.split('/').slice(2); // the bit after the //

        var lookup = function lookup(parts, index) {
          var z = index[parts.shift()];

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

        var y = lookup(hostpath, $SolidTestEnvironment.localSiteMap);

        if (y) {
          return y;
        }
      } // browser does 2014 on as https browser script not trusted
      // If the web app origin is https: then the mixed content rules
      // prevent it loading insecure http: stuff so we need proxy.


      if (Fetcher.crossSiteProxyTemplate && typeof document !== 'undefined' && document.location && ('' + document.location).slice(0, 6) === 'https:' && // origin is secure
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

  }, {
    key: "unsupportedProtocol",
    value: function unsupportedProtocol(uri) {
      var pcol = Uri.protocol(uri);
      return pcol === 'tel' || pcol === 'mailto' || pcol === 'urn';
    }
    /** Decide on credentials using old XXHR api or new fetch()  one
     * @param requestedURI
     * @param options
     */

  }, {
    key: "setCredentials",
    value: function setCredentials(requestedURI) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

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
  }]);
  return Fetcher;
}();

exports.default = Fetcher;
(0, _defineProperty2.default)(Fetcher, "HANDLERS", void 0);
(0, _defineProperty2.default)(Fetcher, "CONTENT_TYPE_BY_EXT", void 0);
(0, _defineProperty2.default)(Fetcher, "crossSiteProxyTemplate", void 0);
Fetcher.HANDLERS = defaultHandlers;
Fetcher.CONTENT_TYPE_BY_EXT = CONTENT_TYPE_BY_EXT;