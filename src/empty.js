'use strict'
const Node = require('./node')

/**
 * Singleton subclass of an empty Collection.
 */
class Empty extends Node {
  constructor () {
    super()
    this.termType = Empty.termType
  }
  toString () {
    return '()'
  }
}
Empty.termType = 'empty'

module.exports = Empty
