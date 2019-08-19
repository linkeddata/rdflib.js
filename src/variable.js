'use strict'
import ClassOrder from './class-order'
import Node from './node'
import * as Uri from './uri'

/**
 * Variables are placeholders used in patterns to be matched.
 * In cwm they are symbols which are the formula's list of quantified variables.
 * In sparql they are not visibly URIs.  Here we compromise, by having
 * a common special base URI for variables. Their names are uris,
 * but the ? notation has an implicit base uri of 'varid:'
 * @class Variable
 */
export default class Variable extends Node {
  constructor (name = '') {
    super()
    this.termType = Variable.termType
    this.value = name
    this.base = 'varid:'
    this.uri = Uri.join(name, this.base)
  }
  equals (other) {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) && (this.value === other.value)
  }
  hashString () {
    return this.toString()
  }
  substitute (bindings) {
    var ref
    return (ref = bindings[this.toNT()]) != null ? ref : this
  }
  toString () {
    if (this.uri.slice(0, this.base.length) === this.base) {
      return '?' + this.uri.slice(this.base.length)
    }
    return '?' + this.uri
  }
}

Variable.termType = 'Variable'
Variable.prototype.classOrder = ClassOrder['Variable']
Variable.prototype.isVar = 1
