'use strict'
import ClassOrder from './class-order'
import NamedNode from './named-node'
import Node from './node-internal'
import { TermType } from './types';
import XSD from './xsd-internal'

/**
 * An RDF literal, containing some value which isn't expressed as an IRI.
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export default class Literal extends Node {
  static termType = TermType.Literal

  classOrder = ClassOrder.Literal
  datatype = XSD.string
  isVar = 0
  /**
   * The language for the literal
   */
  language: string = ''
  termType = TermType.Literal


  constructor (value: string, language?: string | null, datatype?) {
    super(value)

    if (language) {
      this.language = language
      this.datatype = XSD.langString
    } else if (datatype) {
      this.datatype = NamedNode.fromValue(datatype)
    } else {
      this.datatype = XSD.string
    }
  }

  /**
   * Gets a copy of this literal
   */
  copy (): Literal {
    return new Literal(this.value, this.lang, this.datatype)
  }

  /**
   * Gets whether two literals are the same
   * @param other The other statement
   */
  equals (other: any): boolean {
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
   * @deprecated use {language} instead
   */
  get lang () {
    return this.language
  }

  set lang (language) {
    this.language = language || ''
  }

  toNT() {
    return Literal.toNT(this)
  }

  /** Serializes a literal to an N-Triples string */
  static toNT (literal: Literal): string {
    if (typeof literal.value === 'number') {
      return '' + literal.value
    } else if (typeof literal.value !== 'string') {
      throw new Error('Value of RDF literal is not string or number: ' +
        literal.value)
    }
    var str = literal.value
    str = str.replace(/\\/g, '\\\\')
    str = str.replace(/\"/g, '\\"')
    str = str.replace(/\n/g, '\\n')
    str = '"' + str + '"'

    if (literal.language) {
      str += '@' + literal.language
    } else if (!literal.datatype.equals(XSD.string)) {
      // Only add datatype if it's not a string
      str += '^^' + literal.datatype.toCanonical()
    }
    return str
  }

  toString () {
    return '' + this.value
  }

  /**
   * Builds a literal node from a boolean value
   * @param value {Boolean} The value
   */
  static fromBoolean (value: boolean): Literal {
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
