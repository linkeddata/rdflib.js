'use strict'
const ClassOrder = require('./class-order')
const Node = require('./node')
const XSD = require('./xsd')

class Literal extends Node {
  constructor (value, language, datatype) {
    super()
    this.termType = Literal.termType
    this.value = value
    this.lang = language  // property currently used by rdflib
    this.language = language  // rdfjs property
    this.datatype = datatype
  }
  copy () {
    return new Literal(this.value, this.lang, this.datatype)
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
  /**
   * @method fromBoolean
   * @static
   * @param value {Boolean}
   * @return {Literal}
   */
  static fromBoolean (value) {
    let strValue = value ? '1' : '0'
    return new Literal(strValue, void 0, XSD.boolean)
  }
  /**
   * @method fromDate
   * @static
   * @param value {Date}
   * @return {Literal}
   */
  static fromDate (value) {
    if (!(value instanceof Date)) {
      throw new TypeError('Invalid argument to Literal.fromDate()')
    }
    let d2 = function (x) {
      return ('' + (100 + x)).slice(1, 3)
    }
    let date = '' + value.getUTCFullYear() + '-' + d2(value.getUTCMonth() + 1) +
      '-' + d2(value.getUTCDate()) + 'T' + d2(value.getUTCHours()) + ':' +
      d2(value.getUTCMinutes()) + ':' + d2(value.getUTCSeconds()) + 'Z'
    return new Literal(date, void 0, XSD.dateTime)
  }
  /**
   * @method fromNumber
   * @static
   * @param value {Number}
   * @return {Literal}
   */
  static fromNumber (value) {
    if (typeof value !== 'number') {
      throw new TypeError('Invalid argument to Literal.fromNumber()')
    }
    let datatype
    if (('' + value).indexOf('e') >= 0) {
      datatype = XSD.float
    } else if (('' + value).indexOf('.') >= 0) {
      datatype = XSD.decimal
    } else {
      datatype = XSD.integer
    }
    return new Literal('' + value, void 0, datatype)
  }
  /**
   * @method fromValue
   * @param value
   * @return {Literal}
   */
  static fromValue (value) {
    if (value instanceof Node) {
      return value
    }
    if (typeof value === 'undefined' || value === null) {
      return value
    }
    switch (typeof value) {
      case 'object':
        if (value instanceof Date) {
          return Literal.fromDate(value)
        }
      case 'boolean':
        return Literal.fromBoolean(value)
      case 'number':
        return Literal.fromNumber(value)
      case 'string':
        return new Literal(value)
    }
    throw new Error("Can't make literal from " + value + ' of type ' +
      typeof value)

  }
}
Literal.termType = 'literal'
Literal.prototype.classOrder = ClassOrder['Literal']
Literal.prototype.isVar = 0

module.exports = Literal
