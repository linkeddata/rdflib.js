import * as convert from './convert';
import Serializer from './serializer';
import { JSONLDContentType, N3ContentType, N3LegacyContentType, NQuadsAltContentType, NQuadsContentType, NTriplesContentType, RDFXMLContentType, TurtleContentType, TurtleLegacyContentType } from './types';

/**
 * Serialize to the appropriate format
 */
export default function serialize(
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
  contentType = contentType || TurtleContentType; // text/n3 if complex?

  var documentString = undefined;

  try {
    var sz = Serializer(kb);
    if (opts.flags) sz.setFlags(opts.flags);
    var newSts = kb.statementsMatching(undefined, undefined, undefined, target);
    var n3String;
    sz.suggestNamespaces(kb.namespaces);
    sz.setBase(base);

    switch (contentType) {
      case RDFXMLContentType:
        documentString = sz.statementsToXML(newSts);
        return executeCallback(null, documentString);

      case N3ContentType:
      case N3LegacyContentType:
        documentString = sz.statementsToN3(newSts);
        return executeCallback(null, documentString);

      case TurtleContentType:
      case TurtleLegacyContentType:
        sz.setFlags('si'); // Suppress = for sameAs and => for implies

        documentString = sz.statementsToN3(newSts);
        return executeCallback(null, documentString);

      case NTriplesContentType:
        sz.setFlags('deinprstux'); // Suppress nice parts of N3 to make ntriples

        documentString = sz.statementsToNTriples(newSts);
        return executeCallback(null, documentString);

      case JSONLDContentType:
        sz.setFlags('deinprstux'); // Use adapters to connect to incmpatible parser

        n3String = sz.statementsToNTriples(newSts); // n3String = sz.statementsToN3(newSts)

        convert.convertToJson(n3String, callback);
        break;

      case NQuadsContentType:
      case NQuadsAltContentType:
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