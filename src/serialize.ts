import * as convert from './convert'
import Formula from './formula'
import Serializer from './serializer'
import {
  ContentType,
  JSONLDContentType,
  N3ContentType,
  N3LegacyContentType,
  NQuadsAltContentType,
  NQuadsContentType,
  NTriplesContentType,
  RDFXMLContentType,
  TurtleContentType,
  TurtleLegacyContentType,
} from './types'
import IndexedFormula from './store'
import { BlankNode, NamedNode } from './tf-types'

/**
 * Serialize to the appropriate format
 */
export default function serialize (
  /** The graph or nodes that should be serialized */
  target: Formula | NamedNode | BlankNode,
  /** The store */
  kb?: IndexedFormula,
  base?: unknown,
  /**
   * The mime type.
   * Defaults to Turtle.
   */
  contentType?: string | ContentType,
  callback?: (err: Error | undefined | null, result?: string | null) => any,
  options?: {
    /**
     * A string of letters, each of which set an options
     * e.g. `deinprstux`
     */
    flags: string
  }
): string | undefined {
  base = base || target.value
  const opts = options || {}
  contentType = contentType || TurtleContentType // text/n3 if complex?
  var documentString: string | null = null
  try {
    var sz = Serializer(kb)
    if ((opts as any).flags) sz.setFlags((opts as any).flags)
    var newSts = kb!.statementsMatching(undefined, undefined, undefined, target as NamedNode)
    var n3String: string
    sz.suggestNamespaces(kb!.namespaces)
    sz.setBase(base)
    switch (contentType) {
      case RDFXMLContentType:
        documentString = sz.statementsToXML(newSts)
        return executeCallback(null, documentString)
      case N3ContentType:
      case N3LegacyContentType:
        documentString = sz.statementsToN3(newSts)
        return executeCallback(null, documentString)
      case TurtleContentType:
      case TurtleLegacyContentType:
        sz.setFlags('si') // Suppress = for sameAs and => for implies
        documentString = sz.statementsToN3(newSts)
        return executeCallback(null, documentString)
      case NTriplesContentType:
        sz.setFlags('deinprstux') // Suppress nice parts of N3 to make ntriples
        documentString = sz.statementsToNTriples(newSts)
        return executeCallback(null, documentString)
      case JSONLDContentType:
        sz.setFlags('deinprstux') // Use adapters to connect to incmpatible parser
        n3String = sz.statementsToNTriples(newSts)
        // n3String = sz.statementsToN3(newSts)
        convert.convertToJson(n3String, callback)
        break
      case NQuadsContentType:
      case NQuadsAltContentType: // @@@ just outpout the quads? Does not work for collections
        sz.setFlags('deinprstux q') // Suppress nice parts of N3 to make ntriples
        documentString = sz.statementsToNTriples(newSts) // q in flag means actually quads
        return executeCallback(null, documentString)
        // n3String = sz.statementsToN3(newSts)
        // documentString = convert.convertToNQuads(n3String, callback)
        // break
      default:
        throw new Error('Serialize: Content-type ' + contentType + ' not supported for data write.')
    }
  } catch (err) {
    if (callback) {
      return callback(err, undefined)
    }
    throw err // Don't hide problems from caller in sync mode
  }

  function executeCallback (err: Error | null | undefined, result: string | null | undefined): string | undefined {
    if (callback) {
      callback(err, result)
      return
    } else {
      return result as string
    }
  }
}
