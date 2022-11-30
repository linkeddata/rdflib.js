import _defineProperty from "@babel/runtime/helpers/defineProperty";
import Node from './node-internal';
import { DefaultGraphTermType } from './types';
import { defaultGraphURI } from './utils/default-graph-uri';

/** The RDF default graph */
export default class DefaultGraph extends Node {
  constructor() {
    super('');
    _defineProperty(this, "value", '');
    _defineProperty(this, "termType", DefaultGraphTermType);
    _defineProperty(this, "uri", defaultGraphURI);
  }
  toCanonical() {
    return this.value;
  }
  toString() {
    return 'DefaultGraph';
  }
}
export function isDefaultGraph(object) {
  return !!object && object.termType === DefaultGraphTermType;
}