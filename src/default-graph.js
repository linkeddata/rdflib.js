'use strict'
import Node from './node-internal'

export default class DefaultGraph extends Node {
  constructor () {
    super()
    this.termType = 'DefaultGraph'
    this.value = ''
  }
  toCanonical () {
    return this.value
  }
}
