'use strict'
const ClassOrder = require('./class-order')
const Node = require('./node')

/**
 * @class NamedNode
 * @extends Node
 */
class NamedNode extends Node {
  /**
   * @constructor
   * @param iri {String}
   */
  constructor (iri) {
    super()
    this.termType = NamedNode.termType
    this.uri = iri
    this.value = iri
  }
  /**
   * Returns an $rdf node for the containing directory, ending in slash.
   */
  dir () {
    var str = this.uri.split('#')[0]
    var p = str.slice(0, -1).lastIndexOf('/')
    var q = str.indexOf('//')
    if ((q >= 0 && p < q + 2) || p < 0) return null
    return new NamedNode(str.slice(0, p + 1))
  }
  doc () {
    if (this.uri.indexOf('#') < 0) {
      return this
    } else {
      return new NamedNode(this.uri.split('#')[0])
    }
  }
  toString () {
    return '<' + this.uri + '>'
  }
}
NamedNode.termType = 'symbol'
NamedNode.prototype.classOrder = ClassOrder['NamedNode']
NamedNode.prototype.isVar = 0

module.exports = NamedNode
