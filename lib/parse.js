"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
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
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// @ts-ignore is this injected?
// @@ Goal: remove this dependency

/**
 * Parse a string and put the result into the graph kb.
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * If you are parsing JSON-LD and want to know when and whether it succeeded, you need to use the callback param.
 * @param str - The input string to parse
 * @param kb - The store to use
 * @param base - The base URI to use
 * @param contentType - The MIME content type string for the input - defaults to text/turtle
 * @param [callback] - The callback to call when the data has been loaded
 */
function parse(str, kb, base, contentType = 'text/turtle', callback) {
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
      // since we do not await the promise here, rejections will not be covered by the surrounding try catch
      // we do not use await, because parse() should stay sync
      // so, to not lose the async error, we need to catch the rejection and call the error callback here too
      (0, _jsonldparser.default)(str, kb, base).then(executeCallback).catch(executeErrorCallback);
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
    if (
    // TODO: Always true, what is the right behavior
    contentType !== _types.JSONLDContentType ||
    // @ts-ignore always true?
    contentType !== _types.NQuadsContentType ||
    // @ts-ignore always true?
    contentType !== _types.NQuadsAltContentType) {
      if (callback) {
        callback(e, kb);
      } else {
        let e2 = new Error('' + e + ' while trying to parse <' + base + '> as ' + contentType);
        //@ts-ignore .cause is not a default error property
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