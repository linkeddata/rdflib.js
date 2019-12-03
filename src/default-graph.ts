'use strict'
import Node from './node-internal'
import { TermType, DefaultGraphTermType } from './types'
import { TFDefaultGraph } from './tf-types'

/** The RDF default graph */
export default class DefaultGraph extends Node implements TFDefaultGraph {
  static termType = TermType.DefaultGraph;

  termType: DefaultGraphTermType = TermType.DefaultGraph;

  constructor () {
    super('')
  }

  toCanonical () {
    return this.value
  }
}
