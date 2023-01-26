import Serializer from './serializer';
import { JSONLDContentType, N3ContentType, N3LegacyContentType, NQuadsAltContentType, NQuadsContentType, NTriplesContentType, RDFXMLContentType, TurtleContentType, TurtleLegacyContentType } from './types';
import * as jsonld from 'jsonld';

/**
 * Serialize to the appropriate format
 */
export default function serialize( /** The graph or nodes that should be serialized */
target, /** The store */
kb, base,
/**
 * The mime type.
 * Defaults to Turtle.
 */
contentType, callback, options) {
  base = base || (target === null || target === void 0 ? void 0 : target.value);
  const opts = options || {};
  contentType = contentType || TurtleContentType; // text/n3 if complex?
  var documentString = undefined;
  try {
    var sz = Serializer(kb);
    if (opts.flags) sz.setFlags(opts.flags);
    var newSts = kb.statementsMatching(undefined, undefined, undefined, target);
    var n3String;

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
        n3String = sz.statementsToNTriples(newSts);
        // n3String = sz.statementsToN3(newSts)
        return toJsonld(n3String);
      case NQuadsContentType:
      case NQuadsAltContentType:
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
  function toJsonld(item) {
    try {
      return jsonld.fromRDF(item, {
        format: 'application/n-quads'
      }).then(docJsonld => {
        return JSON.stringify(docJsonld);
      });
      // return JSON.stringify(await jsonld.fromRDF(item, {format: 'application/n-quads'}))
    } catch (e) {
      throw e;
    }
  }
}