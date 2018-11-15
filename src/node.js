'use strict'

/**
 * The superclass of all RDF Statement objects, that is
 * NamedNode, Literal, BlankNode, etc.
 * @class Node
 */


class Node {

  substitute (bindings) {
    console.log('@@@ node substitute' + this)
    return this
  }
  compareTerm (other) {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.value < other.value) {
      return -1
    }
    if (this.value > other.value) {
      return +1
    }
    return 0
  }
  equals (other) {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) &&
      (this.value === other.value)
  }
  hashString () {
    return this.toCanonical()
  }
  sameTerm (other) {
    return this.equals(other)
  }
  toCanonical () {
    return this.toNT()
  }
  toNT () {
    return this.toString()
  }
  toString () {
    throw new Error('Node.toString() is abstract - see the subclasses instead')
  }
}
module.exports = Node

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * @method fromValue
 * @static
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
Node.fromValue = function fromValue (value) {
  const Collection = require('./collection')
  const Literal = require('./literal')
  const NamedNode = require('./named-node')
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

const Namespace = require('./namespace')
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
