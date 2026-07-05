import Formula from './formula'
import statementsToN3js from './n3-writer'
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
  TrigContentType,
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
  target: Formula | NamedNode | BlankNode | null | undefined,
  /** The store */
  kb: Formula,
  base?: unknown,
  /**
   * The mime type.
   * Defaults to Turtle.
   */
  contentType?: string | ContentType,
  callback?: (err: Error | undefined | null, result?: string) => any,
  options?: {
    /**
     * A string of letters, each of which set an options
     * e.g. `deinprstux`
     */
    flags?: string,
    /**
     * A set of [prefix, uri] pairs that define namespace prefixes
     */
    namespaces?: Record<string, string>
  }
): string | undefined {
  base = base || target?.value
  const opts = options || {}
  contentType = contentType || TurtleContentType // text/n3 if complex?
  var documentString: string | undefined = undefined
  try {
    var sz = Serializer(kb)
    if ((opts as any).flags) sz.setFlags((opts as any).flags)
    var newSts = kb!.statementsMatching(undefined, undefined, undefined, target as NamedNode)

    // If an IndexedFormula, use the namespaces from the given graph as suggestions
    if ('namespaces' in kb) {
      sz.suggestNamespaces( (kb as IndexedFormula).namespaces);
    }

    // use the provided options.namespaces are mandatory prefixes
    if (opts.namespaces) {
      sz.setNamespaces( opts.namespaces);
    }

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
        // Suppress = for sameAs and => for implies; preserve any user-specified flags (e.g., 'o')
        sz.setFlags('si' + (opts.flags ? (' ' + opts.flags) : ''))
        documentString = sz.statementsToN3(newSts)
        return executeCallback(null, documentString)
      case NTriplesContentType:
        documentString = statementsToN3js(newSts, NTriplesContentType, {
          factory: (kb as any).rdfFactory,
        })
        return executeCallback(null, documentString)
      case TrigContentType:
        documentString = statementsToN3js(newSts, TrigContentType, {
          factory: (kb as any).rdfFactory,
          namespaces: {
            ...('namespaces' in kb ? (kb as IndexedFormula).namespaces : {}),
            ...(opts.namespaces || {}),
          },
        })
        return executeCallback(null, documentString)
      case JSONLDContentType:
        // turtle + dr (means no default, no relative prefix); preserve user flags
        sz.setFlags('si dr' + (opts.flags ? (' ' + opts.flags) : ''))
        documentString = sz.statementsToJsonld(newSts) // convert via turtle
        return executeCallback(null, documentString)
      case NQuadsContentType:
      case NQuadsAltContentType:
        documentString = statementsToN3js(newSts, NQuadsContentType, {
          factory: (kb as any).rdfFactory,
        })
        return executeCallback(null, documentString)
      default:
        throw new Error('Serialize: Content-type ' + contentType + ' not supported for data write.')
    }
  } catch (err) {
    if (callback) {
      // @ts-ignore
      return callback(err, undefined)
    }
    throw err // Don't hide problems from caller in sync mode
  }

  function executeCallback (err: Error | null | undefined, result: string | undefined): string | undefined {
    if (callback) {
      callback(err, result)
      return
    } else {
      return result as string
    }
  }
}
