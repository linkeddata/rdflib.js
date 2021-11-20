"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = serialize;

var convert = _interopRequireWildcard(require("./convert"));

var _serializer = _interopRequireDefault(require("./serializer"));

var _types = require("./types");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Serialize to the appropriate format
 */
function serialize(
/** The graph or nodes that should be serialized */
target,
/** The store */
kb, base,
/**
 * The mime type.
 * Defaults to Turtle.
 */
contentType, callback, options) {
  base = base || target.value;
  var opts = options || {};
  contentType = contentType || _types.TurtleContentType; // text/n3 if complex?

  var documentString = undefined;

  try {
    var sz = (0, _serializer.default)(kb);
    if (opts.flags) sz.setFlags(opts.flags);
    var newSts = kb.statementsMatching(undefined, undefined, undefined, target);
    var n3String;
    sz.suggestNamespaces(kb.namespaces);
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
        sz.setFlags('si'); // Suppress = for sameAs and => for implies

        documentString = sz.statementsToN3(newSts);
        return executeCallback(null, documentString);

      case _types.NTriplesContentType:
        sz.setFlags('deinprstux'); // Suppress nice parts of N3 to make ntriples

        documentString = sz.statementsToNTriples(newSts);
        return executeCallback(null, documentString);

      case _types.JSONLDContentType:
        sz.setFlags('deinprstux'); // Use adapters to connect to incmpatible parser

        n3String = sz.statementsToNTriples(newSts); // n3String = sz.statementsToN3(newSts)

        convert.convertToJson(n3String, callback);
        break;

      case _types.NQuadsContentType:
      case _types.NQuadsAltContentType:
        // @@@ just outpout the quads? Does not work for collections
        sz.setFlags('deinprstux q'); // Suppress nice parts of N3 to make ntriples

        documentString = sz.statementsToNTriples(newSts); // q in flag means actually quads

        return executeCallback(null, documentString);
      // n3String = sz.statementsToN3(newSts)
      // documentString = convert.convertToNQuads(n3String, callback)
      // break

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