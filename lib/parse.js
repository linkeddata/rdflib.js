"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parse;

var _extendedTermFactory = _interopRequireDefault(require("./factories/extended-term-factory"));

var _jsonldparser = _interopRequireDefault(require("./jsonldparser"));

var _n = require("n3");

var _n3parser = _interopRequireDefault(require("./n3parser"));

var _rdfaparser = require("./rdfaparser");

var _rdfxmlparser = _interopRequireDefault(require("./rdfxmlparser"));

var _patchParser = _interopRequireDefault(require("./patch-parser"));

var Util = _interopRequireWildcard(require("./utils-js"));

var _types = require("./types");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// @ts-ignore is this injected?
// @@ Goal: remove this dependency

/**
 * Parse a string and put the result into the graph kb.
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 * @param str - The input string to parse
 * @param kb - The store to use
 * @param base - The base URI to use
 * @param contentType - The MIME content type string for the input - defaults to text/turtle
 * @param [callback] - The callback to call when the data has been loaded
 */
function parse(str, kb, base) {
  var contentType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'text/turtle';
  var callback = arguments.length > 4 ? arguments[4] : undefined;
  contentType = contentType || _types.TurtleContentType;
  contentType = contentType.split(';')[0];

  try {
    if (contentType === _types.N3ContentType || contentType === _types.TurtleContentType) {
      var p = (0, _n3parser.default)(kb, kb, base, base, null, null, '', null);
      p.loadBuf(str);
      executeCallback();
    } else if (contentType === _types.RDFXMLContentType) {
      var parser = new _rdfxmlparser.default(kb);
      parser.parse(Util.parseXML(str), base, kb.sym(base));
      executeCallback();
    } else if (contentType === _types.XHTMLContentType) {
      (0, _rdfaparser.parseRDFaDOM)(Util.parseXML(str, {
        contentType: _types.XHTMLContentType
      }), kb, base);
      executeCallback();
    } else if (contentType === _types.HTMLContentType) {
      (0, _rdfaparser.parseRDFaDOM)(Util.parseXML(str, {
        contentType: _types.HTMLContentType
      }), kb, base);
      executeCallback();
    } else if (contentType === _types.SPARQLUpdateContentType || contentType === _types.SPARQLUpdateSingleMatchContentType) {
      // @@ we handle a subset
      (0, _patchParser.default)(str, kb, base);
      executeCallback();
    } else if (contentType === _types.JSONLDContentType) {
      (0, _jsonldparser.default)(str, kb, base, executeCallback);
    } else if (contentType === _types.NQuadsContentType || contentType === _types.NQuadsAltContentType) {
      var n3Parser = new _n.Parser({
        factory: _extendedTermFactory.default
      });
      nquadCallback(null, str);
    } else if (contentType === undefined) {
      throw new Error("contentType is undefined");
    } else {
      throw new Error("Don't know how to parse " + contentType + ' yet');
    }
  } catch (e) {
    // @ts-ignore
    executeErrorCallback(e);
  }

  parse.handled = {
    'text/n3': true,
    'text/turtle': true,
    'application/rdf+xml': true,
    'application/xhtml+xml': true,
    'text/html': true,
    'application/sparql-update': true,
    'application/sparql-update-single-match': true,
    'application/ld+json': true,
    'application/nquads': true,
    'application/n-quads': true
  };

  function executeCallback() {
    if (callback) {
      callback(null, kb);
    } else {
      return;
    }
  }

  function executeErrorCallback(e) {
    if ( // TODO: Always true, what is the right behavior
    contentType !== _types.JSONLDContentType || // @ts-ignore always true?
    contentType !== _types.NQuadsContentType || // @ts-ignore always true?
    contentType !== _types.NQuadsAltContentType) {
      if (callback) {
        callback(e, kb);
      } else {
        var e2 = new Error('' + e + ' while trying to parse <' + base + '> as ' + contentType); //@ts-ignore .cause is not a default error property

        e2.cause = e;
        throw e2;
      }
    }
  }
  /*
    function setJsonLdBase (doc, base) {
      if (doc instanceof Array) {
        return
      }
      if (!('@context' in doc)) {
        doc['@context'] = {}
      }
      doc['@context']['@base'] = base
    }
  */


  function nquadCallback(err, nquads) {
    if (err) {
      callback(err, kb);
    }

    try {
      n3Parser.parse(nquads, tripleCallback);
    } catch (err) {
      callback(err, kb);
    }
  }

  function tripleCallback(err, triple) {
    if (triple) {
      kb.add(triple.subject, triple.predicate, triple.object, triple.graph);
    } else {
      callback(err, kb);
    }
  }
}