"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = serialize;
var _serializer = _interopRequireDefault(require("./serializer"));
var _types = require("./types");
/**
 * Serialize to the appropriate format
 */
function serialize(/** The graph or nodes that should be serialized */
target, /** The store */
kb, base,
/**
 * The mime type.
 * Defaults to Turtle.
 */
contentType, callback, options) {
  base = base || target?.value;
  const opts = options || {};
  contentType = contentType || _types.TurtleContentType; // text/n3 if complex?
  var documentString = undefined;
  try {
    var sz = (0, _serializer.default)(kb);
    if (opts.flags) sz.setFlags(opts.flags);
    var newSts = kb.statementsMatching(undefined, undefined, undefined, target);

    // If an IndexedFormula, use the namespaces from the given graph as suggestions
    if ('namespaces' in kb) {
      sz.suggestNamespaces(kb.namespaces);
    }

    // use the provided options.namespaces are mandatory prefixes
    if (opts.namespaces) {
      sz.setNamespaces(opts.namespaces);
    }
    sz.setBase(base);
    switch (contentType) {
      case _types.RDFXMLContentType:
        documentString = sz.statementsToXML(newSts);
        return executeCallback(null, documentString);
      case _types.N3ContentType:
      case _types.N3LegacyContentType:
        documentString = sz.statementsToN3(newSts);
        return executeCallback(null, documentString);
      case _types.TurtleContentType:
      case _types.TurtleLegacyContentType:
        // Suppress = for sameAs and => for implies; preserve any user-specified flags (e.g., 'o')
        sz.setFlags('si' + (opts.flags ? ' ' + opts.flags : ''));
        documentString = sz.statementsToN3(newSts);
        return executeCallback(null, documentString);
      case _types.NTriplesContentType:
        sz.setFlags('deinprstux'); // Suppress nice parts of N3 to make ntriples
        documentString = sz.statementsToNTriples(newSts);
        return executeCallback(null, documentString);
      case _types.JSONLDContentType:
        // turtle + dr (means no default, no relative prefix); preserve user flags
        sz.setFlags('si dr' + (opts.flags ? ' ' + opts.flags : ''));
        documentString = sz.statementsToJsonld(newSts); // convert via turtle
        return executeCallback(null, documentString);
      case _types.NQuadsContentType:
      case _types.NQuadsAltContentType:
        // @@@ just outpout the quads? Does not work for collections
        sz.setFlags('deinprstux q'); // Suppress nice parts of N3 to make ntriples
        documentString = sz.statementsToNTriples(newSts); // q in flag means actually quads
        return executeCallback(null, documentString);
      default:
        throw new Error('Serialize: Content-type ' + contentType + ' not supported for data write.');
    }
  } catch (err) {
    if (callback) {
      // @ts-ignore
      return callback(err, undefined);
    }
    throw err; // Don't hide problems from caller in sync mode
  }
  function executeCallback(err, result) {
    if (callback) {
      callback(err, result);
      return;
    } else {
      return result;
    }
  }
}