'use strict'
import NamedNode from './named-node'
import Node from './node-internal'
import XSD from './xsd'
import { ValueType } from './types'
import classOrder from './class-order'

/**
* An RDF literal node, containing something different than a URI.
* @link https://rdf.js.org/data-model-spec/#literal-interface
*/
export default class Literal extends Node {
  /**
   * The language for the literal
   */
  lang!: string

  /**
   * The literal's datatype as a named node
   */
  datatype!: NamedNode

  termType: string

  /**
   * Initializes this literal
   * @param value The literal's lexical value
   * @param language The language for the literal
   * @param datatype The literal's datatype as a named node
   */
  constructor (value: string, language?: string | null, datatype?: NamedNode) {
    super()
    this.termType = 'Literal'
    this.value = value
    if (language) {
      this.lang = language
      datatype = XSD.langString
    }
    // If not specified, a literal has the implied XSD.string default datatype
    if (datatype) {
      this.datatype = NamedNode.fromValue(datatype)
    }
    if (!datatype) {
      this.datatype = XSD.string
    }
  }
   /**
   * Gets a copy of this literal
   */
  copy (): Literal {
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
  /**
   * The language for the literal
   */
  get language (): string {
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
   * Builds a literal node from a boolean value
   * @param value The value
   */
  static fromBoolean(value: boolean): Literal {
    let strValue = value ? '1' : '0'
    return new Literal(strValue, null, XSD.boolean)
  }

  /**
   * Builds a literal node from a date value
   * @param value The value
   */
  static fromDate(value: Date): Literal {
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
   * Builds a literal node from a number value
   * @param value The value
   */
  static fromNumber(value: number): Literal {
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
   * Builds a literal node from an input value
   * @param value The input value
   */
  static fromValue(value: ValueType): Literal | Node | undefined | null {
    if (typeof value === 'undefined' || value === null) {
      return value
    }
    // @ts-ignore
    if (typeof value === 'object' && value.termType) {  // this is a Node instance
      return value as Node
    }
    switch (typeof value) {
      case 'object':
        if (value instanceof Date) {
          return Literal.fromDate(value)
        }
      case 'boolean':
        return Literal.fromBoolean(value as boolean)
      case 'number':
        return Literal.fromNumber(value)
      case 'string':
        return new Literal(value)
    }
    throw new Error("Can't make literal from " + value + ' of type ' +
      typeof value)

  }
}

Literal.prototype.classOrder = classOrder['Literal']
Literal.prototype.lang = ''
Literal.prototype.isVar = false
