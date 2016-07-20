'use strict'
const ClassOrder = require('./class-order')
const Node = require('./node')

class Literal extends Node {
  constructor (value, language, datatype) {
    super()
    this.termType = Literal.termType
    this.value = value
    this.lang = language  // property currently used by rdflib
    this.language = language  // rdfjs property
    this.datatype = datatype
  }
  equals (other) {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) &&
      (this.value === other.value) &&
      (this.language === other.language) &&
      ((!this.datatype && !other.datatype) ||
        (this.datatype && this.datatype.equals(other.datatype)))
  }
  toNT () {
    if (typeof this.value === 'number') {
      return this.toString()
    } else if (typeof this.value !== 'string') {
      throw new Error('Value of RDF literal is not string or number: ' +
        this.value)
    }
    var str = this.value
    str = str.replace(/\\/g, '\\\\')
    str = str.replace(/\"/g, '\\"')
    str = str.replace(/\n/g, '\\n')
    str = '"' + str + '"'
    if (this.datatype) {
      str += '^^' + this.datatype.toNT()
    }
    if (this.language) {
      str += '@' + this.language
    }
    return str
  }
  toString () {
    return '' + this.value
  }
}
Literal.termType = 'literal'
Literal.prototype.classOrder = ClassOrder['Literal']

module.exports = Literal
