'use strict'
import BlankNode from './blank-node'
import ClassOrder from './class-order'
import Node from './node-internal'

export default class Collection extends Node {
  constructor (initial) {
    super()
    this.termType = Collection.termType
    this.id = BlankNode.nextId++
    this.elements = []
    this.closed = false
    if (initial && initial.length > 0) {
      initial.forEach(element => {
        this.elements.push(Node.fromValue(element))
      })
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
Collection.termType = 'Collection'
Collection.prototype.classOrder = ClassOrder['Collection']
Collection.prototype.compareTerm = BlankNode.prototype.compareTerm
Collection.prototype.isVar = 0
