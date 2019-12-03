import Node from './node-internal'
import { TermType} from './types'
import { TFTerm } from './tf-types'

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
