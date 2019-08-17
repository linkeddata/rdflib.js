'use strict'

// This file attaches all functionality to Node
// that would otherwise require circular dependencies.
import Node from './node-internal'
import Collection from './collection'
import Literal from './literal'

export default Node

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * @method fromValue
 * @static
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
Node.fromValue = function fromValue (value) {
  if (typeof value === 'undefined' || value === null) {
    return value
  }
  const isNode = value && value.termType
  if (isNode) {  // a Node subclass or a Collection
    return value
  }
  if (Array.isArray(value)) {
    return new Collection(value)
  }
  return Literal.fromValue(value)
}

import Namespace from './namespace'
const ns = { xsd: Namespace('http://www.w3.org/2001/XMLSchema#') }

Node.toJS = function toJS (term) {
  if (term.elements) {
    return term.elements.map(Node.toJS) // Array node (not standard RDFJS)
  }
  if (!term.datatype) return term // Objects remain objects
  if (term.datatype.sameTerm(ns.xsd('boolean'))) {
    return term.value === '1'
  }
  if (term.datatype.sameTerm(ns.xsd('dateTime')) ||
    term.datatype.sameTerm(ns.xsd('date'))) {
    return new Date(term.value)
  }
  if (
    term.datatype.sameTerm(ns.xsd('integer')) ||
    term.datatype.sameTerm(ns.xsd('float')) ||
    term.datatype.sameTerm(ns.xsd('decimal'))
  ) {
    let z = Number(term.value)
    return Number(term.value)
  }
  return term.value
}
