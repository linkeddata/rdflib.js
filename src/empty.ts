import Node from './node-internal'
import { TermType } from './types'

/**
* An empty node
*/
export default class Empty extends Node {
  static termType = TermType.Empty

  termType = TermType.Empty

  constructor () {
    super('')
  }

  toString () {
    return '()'
  }
}
