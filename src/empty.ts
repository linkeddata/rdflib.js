import Node from './node-internal'
import { TermType } from './types'
import { Term } from './tf-types'

/**
* An empty node
*/
export default class Empty extends Node implements Term {
  static termType = TermType.Empty

  termType = TermType.Empty

  constructor () {
    super('')
  }

  toString () {
    return '()'
  }
}
