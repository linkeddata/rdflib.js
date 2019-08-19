'use strict'
import ClassOrder from './class-order'
import Node from './node-internal'

export default class BlankNode extends Node {
  constructor (id) {
    super()
    this.termType = BlankNode.termType

    if (id) {
      if (typeof id !== 'string') {
        console.log('Bad blank id:', id)
        throw new Error('Bad id argument to new blank node: ' + id)
      }
      if (id.includes('#')) {
        // Is a URI with hash fragment
        let fragments = id.split('#')
        id = fragments[fragments.length - 1]
      }
      this.id = id
      // this.id = '' + BlankNode.nextId++
    } else {
      this.id = 'n' + BlankNode.nextId++
    }

    this.value = this.id
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

  toCanonical () {
    return '_:' + this.value
  }

  toString () {
    return BlankNode.NTAnonymousNodePrefix + this.id
  }
}

BlankNode.nextId = 0
BlankNode.termType = 'BlankNode'
BlankNode.NTAnonymousNodePrefix = '_:'
BlankNode.prototype.classOrder = ClassOrder['BlankNode']
BlankNode.prototype.isBlank = 1
BlankNode.prototype.isVar = 1
