'use strict'
const BlankNode = require('./blank-node')
const ClassOrder = require('./class-order')
const Node = require('./node')
const term = require('./term')

class Collection extends Node {
  constructor (initial) {
    super()
    var i, len, s
    this.termType = Collection.termType
    this.id = BlankNode.nextId++
    this.elements = []
    this.closed = false
    if (typeof initial !== 'undefined') {
      for (i = 0, len = initial.length; i < len; i++) {
        s = initial[i]
        this.elements.push(term(s))
      }
    }
  }
  append (element) {
    return this.elements.push(element)
  }
  close () {
    this.closed = true
    return this.closed
  }
  shift () {
    return this.elements.shift()
  }
  substitute (bindings) {
    var elementsCopy = this.elements.map(function (ea) {
      ea.substitute(bindings)
    })
    return new Collection(elementsCopy)
  }
  toNT () {
    return BlankNode.NTAnonymousNodePrefix + this.id
  }
  toString () {
    return '(' + this.elements.join(' ') + ')'
  }
  unshift (element) {
    return this.elements.unshift(element)
  }
}
Collection.termType = 'collection'
Collection.prototype.classOrder = ClassOrder['Collection']
Collection.prototype.compareTerm = BlankNode.prototype.compareTerm
Collection.prototype.isVar = 0

module.exports = Collection
