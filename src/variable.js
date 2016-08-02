'use strict'
const ClassOrder = require('./class-order')
const Node = require('./node')
const Uri = require('./uri')

/**
 * @class Variable
 * Variables are placeholders used in patterns to be matched.
 * In cwm they are symbols which are the formula's list of quantified variables.
 * In sparl they are not visibily URIs.  Here we compromise, by having
 * a common special base URI for variables. Their names are uris,
 * but the ? nottaion has an implicit base uri of 'varid:'
 */
class Variable extends Node {
  constructor (rel) {
    super()
    this.termType = Variable.termType
    this.base = 'varid:'
    this.uri = Uri.join(rel, this.base)
  }
  equals (other) {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) && (this.uri === other.uri)
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

Variable.termType = 'variable'
Variable.prototype.classOrder = ClassOrder['Variable']
Variable.prototype.isVar = 1

module.exports = Variable
