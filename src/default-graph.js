'use strict'
import Node from './node'

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
