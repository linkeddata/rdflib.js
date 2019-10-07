// This file attaches all functionality to Node
// that would otherwise require circular dependencies.
import Node from './node-internal'
import Collection from './collection'
import Literal from './literal'
import { ValueType } from './types'

export default Node

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * @method fromValue
 * @param value - Any native Javascript value
 */
Node.fromValue = function (value: ValueType): Node | Literal | undefined | null | Collection {
  if (typeof value === 'undefined' || value === null) {
    return value
  }
  const isNode = Object.prototype.hasOwnProperty.call(value, 'termType')
  if (isNode) {  // a Node subclass or a Collection
    // @ts-ignore
    return value
  }
  if (Array.isArray(value)) {
    return new Collection(value)
  }
  return Literal.fromValue(value)
}

import Namespace from './namespace'
const ns = { xsd: Namespace('http://www.w3.org/2001/XMLSchema#') }

/**
 * Gets the javascript object equivalent to a node
 * @param term The RDF node
 */
Node.toJS = function (term: Node | Literal) {
  if (term.elements) {
    return term.elements.map(Node.toJS) // Array node (not standard RDFJS)
  }
  // Node remains Node
  // @ts-ignore
  if (!term.datatype) return term // Objects remain objects
  const literalTerm = term as Literal
  // if (!Object.prototype.hasOwnProperty.call(term, 'dataType')) return term // Objects remain objects
  if (literalTerm.datatype.sameTerm(ns.xsd('boolean'))) {
    return literalTerm.value === '1'
  }
  console.log("4", term)
  if (literalTerm.datatype.sameTerm(ns.xsd('dateTime')) ||
    literalTerm.datatype.sameTerm(ns.xsd('date'))) {
    return new Date(literalTerm.value)
  }
  if (
    literalTerm.datatype.sameTerm(ns.xsd('integer')) ||
    literalTerm.datatype.sameTerm(ns.xsd('float')) ||
    literalTerm.datatype.sameTerm(ns.xsd('decimal'))
  ) {
    let z = Number(literalTerm.value)
    return Number(literalTerm.value)
  }
  console.log("7", term)
  return literalTerm.value
}
