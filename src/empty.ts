import Node from './node-internal'
import { TermType, TFTerm } from './types'

/**
* An empty node
*/
export default class Empty extends Node implements TFTerm {
  static termType = TermType.Empty

  termType = TermType.Empty

  constructor () {
    super('')
  }

  toString () {
    return '()'
  }
}
