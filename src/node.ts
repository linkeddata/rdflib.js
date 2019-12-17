// This file attaches all functionality to Node
// that would otherwise require circular dependencies.
import { fromValue } from './collection'
import Node from './node-internal'
import Namespace from './namespace'
import { isCollection, isLiteral } from './utils/terms'
import { Term } from './tf-types'

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * @method fromValue
 * @static
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
Node.fromValue = fromValue;

export default Node

const ns = { xsd: Namespace('http://www.w3.org/2001/XMLSchema#') }

/**
 * Gets the javascript object equivalent to a node
 * @param term The RDF node
 */
Node.toJS = function (term: Term): Term | boolean | number | Date | string | any[] {
  if (isCollection(term)) {
    return term.elements.map(Node.toJS) // Array node (not standard RDFJS)
  }
  if (!isLiteral(term)) return term
  if (term.datatype.equals(ns.xsd('boolean'))) {
    return term.value === '1' || term.value === 'true'
  }
  if (term.datatype.equals(ns.xsd('dateTime')) ||
    term.datatype.equals(ns.xsd('date'))) {
    return new Date(term.value)
  }
  if (
    term.datatype.equals(ns.xsd('integer')) ||
    term.datatype.equals(ns.xsd('float')) ||
    term.datatype.equals(ns.xsd('decimal'))
  ) {
    return Number(term.value)
  }
  return term.value
}
