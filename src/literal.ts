import ClassOrder from './class-order'
import RDFlibNamedNode from './named-node'
import Node from './node-internal'
import {
  FromValueReturns,
  LiteralTermType,
  ValueType
} from './types'
import { isLiteral } from './utils/terms'
import XSD from './xsd-internal'
import { Literal as TFLiteral, Term } from './tf-types'

/**
 * An RDF literal, containing some value which isn't expressed as an IRI.
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export default class Literal extends Node implements TFLiteral {
  termType: typeof LiteralTermType = LiteralTermType

  classOrder = ClassOrder.Literal

  /**
   * The literal's datatype as a named node
   */
  datatype: RDFlibNamedNode = XSD.string

  isVar = 0

  /**
   * The language for the literal
   */
  language: string = ''

  /**
   * Initializes a literal
   * @param value - The literal's lexical value
   * @param language - The language for the literal. Defaults to ''.
   * @param datatype - The literal's datatype as a named node. Defaults to xsd:string.
   */
  constructor (value: string, language?: string | null, datatype?) {
    super(value)

    if (language) {
      this.language = language
      this.datatype = XSD.langString
    } else if (datatype) {
      this.datatype = RDFlibNamedNode.fromValue(datatype)
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
  equals (other: Term | null | undefined): boolean {
    if (!other) {
      return false
    }

    return (this.termType === other.termType) &&
      (this.value === other.value) &&
      (this.language === (other as Literal).language) &&
      ((!this.datatype && !(other as Literal).datatype) ||
        (this.datatype && this.datatype.equals((other as Literal).datatype)))
  }

  /**
   * The language for the literal
   * @deprecated use {language} instead
   */
  get lang (): string {
    return this.language
  }

  set lang (language: string) {
    this.language = language || ''
  }

  toNT(): string {
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
    // #x22 ("), #x5C (\), #x0A (\n) and #xD (\r) are disallowed and need to be replaced
    // see https://www.w3.org/TR/n-triples/#grammar-production-STRING_LITERAL_QUOTE
    str = str.replace(/\\/g, '\\\\')
    str = str.replace(/\"/g, '\\"')
    str = str.replace(/\n/g, '\\n')
    str = str.replace(/\r/g, '\\r')
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
   * @param value - The value
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
   * @param value - The value
   */
  static fromNumber(value: number): Literal {
    if (typeof value !== 'number') {
      throw new TypeError('Invalid argument to Literal.fromNumber()')
    }
    let datatype: RDFlibNamedNode
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
   * @param value - The input value
   */
  static fromValue<T extends FromValueReturns>(value: ValueType): T {
    if (isLiteral(value)) {
      return value as unknown as T
    }
    switch (typeof value) {
      case 'object':
        if (value instanceof Date) {
          return Literal.fromDate(value) as unknown as T
        }
      case 'boolean':
        return Literal.fromBoolean(value as boolean) as unknown as T
      case 'number':
        return Literal.fromNumber(value as number) as unknown as T
      case 'string':
        return new Literal(value) as unknown as T
    }

    throw new Error("Can't make literal from " + value + ' of type ' +
      typeof value)
  }
}
