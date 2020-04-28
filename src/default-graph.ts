import Node from './node-internal'
import { DefaultGraphTermType } from './types'
import { DefaultGraph as TFDefaultGraph } from './tf-types'
import { defaultGraphURI } from './utils/default-graph-uri'

/** The RDF default graph */
export default class DefaultGraph extends Node implements TFDefaultGraph {
  value: '' = '';
  termType: typeof DefaultGraphTermType = DefaultGraphTermType;
  uri = defaultGraphURI

  constructor () {
    super('')
  }

  toCanonical () {
    return this.value
  }

  toString () {
    return 'DefaultGraph';
  }
}

export function isDefaultGraph(object: any): object is DefaultGraph {
  return !!object && object.termType === DefaultGraphTermType;
}
