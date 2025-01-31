import _defineProperty from "@babel/runtime/helpers/defineProperty";
import ClassOrder from './class-order';
import Node from './node-internal';
import { VariableTermType } from './types';
import * as Uri from './uri';
/**
* Variables are placeholders used in patterns to be matched.
* In cwm they are symbols which are the formula's list of quantified variables.
* In sparql they are not visibly URIs.  Here we compromise, by having
* a common special base URI for variables. Their names are uris,
* but the ? notation has an implicit base uri of 'varid:'
*/
export default class Variable extends Node {
  /**
   * Initializes this variable
   * @param name The variable's name
   */
  constructor() {
    let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    super(name);
    _defineProperty(this, "termType", VariableTermType);
    /** The base string for a variable's name */
    _defineProperty(this, "base", 'varid:');
    _defineProperty(this, "classOrder", ClassOrder.Variable);
    _defineProperty(this, "isVar", 1);
    /** The unique identifier of this variable */
    _defineProperty(this, "uri", void 0);
    this.base = 'varid:';
    this.uri = Uri.join(name, this.base);
  }
  equals(other) {
    if (!other) {
      return false;
    }
    return this.termType === other.termType && this.value === other.value;
  }
  hashString() {
    return this.toString();
  }
  substitute(bindings) {
    var ref;
    return (ref = bindings[this.toNT()]) != null ? ref : this;
  }
  toString() {
    return Variable.toString(this);
  }
  static toString(variable) {
    if (variable.uri.slice(0, variable.base.length) === variable.base) {
      return `?${variable.uri.slice(variable.base.length)}`;
    }
    return `?${variable.uri}`;
  }
}