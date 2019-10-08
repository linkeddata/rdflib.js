import Node from './node-internal'

/**
* An empty node
*/
export default class Empty extends Node {

  static termType: 'empty'

  constructor () {
    super()
    this.termType = Empty.termType
  }
  toString () {
    return '()'
  }
}
Empty.termType = 'empty'
