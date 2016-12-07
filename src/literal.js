'use strict'
const ClassOrder = require('./class-order')
const NamedNode = require('./named-node')
const Node = require('./node')
const XSD = require('./xsd')

class Literal extends Node {
  constructor (value, language, datatype) {
    super()
    this.termType = Literal.termType
    this.value = value
    if (language) {
      this.lang = language
      datatype = XSD.langString
    }
    // If not specified, a literal has the implied XSD.string default datatype
    if (datatype) {
      this.datatype = NamedNode.fromValue(datatype)
    }
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
  get language () {
    return this.lang
  }
  set language (language) {
    this.lang = language || ''
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

    if (this.language) {
      str += '@' + this.language
    } else if (!this.datatype.equals(XSD.string)) {
      // Only add datatype if it's not a string
      str += '^^' + this.datatype.toCanonical()
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
    return new Literal(strValue, null, XSD.boolean)
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
    return new Literal(date, null, XSD.dateTime)
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
    const strValue = value.toString()
    if (strValue.indexOf('e') < 0 && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
      datatype = Number.isInteger(value) ? XSD.integer : XSD.decimal
    } else {
      datatype = XSD.double
    }
    return new Literal(strValue, null, datatype)
  }
  /**
   * @method fromValue
   * @param value
   * @return {Literal}
   */
  static fromValue (value) {
    if (typeof value === 'undefined' || value === null) {
      return value
    }
    if (typeof value === 'object' && value.termType) {  // this is a Node instance
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
Literal.termType = 'Literal'
Literal.prototype.classOrder = ClassOrder['Literal']
Literal.prototype.datatype = XSD.string
Literal.prototype.lang = ''
Literal.prototype.isVar = 0

module.exports = Literal
