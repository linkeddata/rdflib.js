'use strict'
/**
 * The superclass of all RDF Statement objects, that is
 * NamedNode, Literal, BlankNode, etc.
 * @class Node
 */
class Node {
  substitute (bindings) {
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
  if (value instanceof Node || value instanceof Collection) {
    return value
  }
  if (typeof value === 'undefined' || value === null) {
    return value
  }
  if (Array.isArray(value)) {
    return new Collection(value)
  }
  return Literal.fromValue(value)
}
