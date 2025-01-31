import _defineProperty from "@babel/runtime/helpers/defineProperty";
import Node from './node-internal';
import { EmptyTermType } from './types';
/**
* An empty node
*/
export default class Empty extends Node {
  constructor() {
    super('');
    _defineProperty(this, "termType", EmptyTermType);
  }
  toString() {
    return '()';
  }
}