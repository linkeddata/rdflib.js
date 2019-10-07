'use strict'
import Node from './node-internal'

/**
 * Singleton subclass of an empty Collection.
 */
export default class Empty extends Node {
  constructor () {
    super()
    this.termType = Empty.termType
  }
  toString () {
    return '()'
  }
}
Empty.termType = 'empty'
