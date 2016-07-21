'use strict'
const ClassOrder = require('./class-order')
const Node = require('./node')

class BlankNode extends Node {
  constructor (id) {
    super()
    this.termType = BlankNode.termType
    this.id = BlankNode.nextId++
    this.value = id || this.id.toString()
  }
  compareTerm (other) {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.id < other.id) {
      return -1
    }
    if (this.id > other.id) {
      return +1
    }
    return 0
  }
  copy (formula) { // depends on the formula
    var bnodeNew = new BlankNode()
    formula.copyTo(this, bnodeNew)
    return bnodeNew
  }
  toString () {
    return BlankNode.NTAnonymousNodePrefix + this.id
  }
}
BlankNode.nextId = 0
BlankNode.termType = 'bnode'
BlankNode.NTAnonymousNodePrefix = '_:n'
BlankNode.prototype.classOrder = ClassOrder['BlankNode']
BlankNode.prototype.isBlank = 1
BlankNode.prototype.isVar = 1

module.exports = BlankNode
