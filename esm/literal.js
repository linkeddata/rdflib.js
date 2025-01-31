import _defineProperty from "@babel/runtime/helpers/defineProperty";
import ClassOrder from './class-order';
import RDFlibNamedNode from './named-node';
import Node from './node-internal';
import { LiteralTermType } from './types';
import { isLiteral } from './utils/terms';
import XSD from './xsd-internal';
/**
 * An RDF literal, containing some value which isn't expressed as an IRI.
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export default class Literal extends Node {
  /**
   * Initializes a literal
   * @param value - The literal's lexical value
   * @param language - The language for the literal. Defaults to ''.
   * @param datatype - The literal's datatype as a named node. Defaults to xsd:string.
   */
  constructor(value, language, datatype) {
    super(value);
    _defineProperty(this, "termType", LiteralTermType);
    _defineProperty(this, "classOrder", ClassOrder.Literal);
    /**
     * The literal's datatype as a named node
     */
    _defineProperty(this, "datatype", XSD.string);
    _defineProperty(this, "isVar", 0);
    /**
     * The language for the literal
     */
    _defineProperty(this, "language", '');
    if (language) {
      this.language = language;
      this.datatype = XSD.langString;
    } else if (datatype) {
      this.datatype = RDFlibNamedNode.fromValue(datatype);
    } else {
      this.datatype = XSD.string;
    }
  }

  /**
   * Gets a copy of this literal
   */
  copy() {
    return new Literal(this.value, this.lang, this.datatype);
  }

  /**
   * Gets whether two literals are the same
   * @param other The other statement
   */
  equals(other) {
    if (!other) {
      return false;
    }
    return this.termType === other.termType && this.value === other.value && this.language === other.language && (!this.datatype && !other.datatype || this.datatype && this.datatype.equals(other.datatype));
  }

  /**
   * The language for the literal
   * @deprecated use {language} instead
   */
  get lang() {
    return this.language;
  }
  set lang(language) {
    this.language = language || '';
  }
  toNT() {
    return Literal.toNT(this);
  }

  /** Serializes a literal to an N-Triples string */
  static toNT(literal) {
    if (typeof literal.value === 'number') {
      return '' + literal.value;
    } else if (typeof literal.value !== 'string') {
      throw new Error('Value of RDF literal is not string or number: ' + literal.value);
    }
    var str = literal.value;
    // #x22 ("), #x5C (\), #x0A (\n) and #xD (\r) are disallowed and need to be replaced
    // see https://www.w3.org/TR/n-triples/#grammar-production-STRING_LITERAL_QUOTE
    str = str.replace(/\\/g, '\\\\');
    str = str.replace(/\"/g, '\\"');
    str = str.replace(/\n/g, '\\n');
    str = str.replace(/\r/g, '\\r');
    str = '"' + str + '"';
    if (literal.language) {
      str += '@' + literal.language;
    } else if (!literal.datatype.equals(XSD.string)) {
      // Only add datatype if it's not a string
      str += '^^' + literal.datatype.toCanonical();
    }
    return str;
  }
  toString() {
    return '' + this.value;
  }

  /**
   * Builds a literal node from a boolean value
   * @param value - The value
   */
  static fromBoolean(value) {
    let strValue = value ? '1' : '0';
    return new Literal(strValue, null, XSD.boolean);
  }

  /**
   * Builds a literal node from a date value
   * @param value The value
   */
  static fromDate(value) {
    if (!(value instanceof Date)) {
      throw new TypeError('Invalid argument to Literal.fromDate()');
    }
    let d2 = function (x) {
      return ('' + (100 + x)).slice(1, 3);
    };
    let date = '' + value.getUTCFullYear() + '-' + d2(value.getUTCMonth() + 1) + '-' + d2(value.getUTCDate()) + 'T' + d2(value.getUTCHours()) + ':' + d2(value.getUTCMinutes()) + ':' + d2(value.getUTCSeconds()) + 'Z';
    return new Literal(date, null, XSD.dateTime);
  }

  /**
   * Builds a literal node from a number value
   * @param value - The value
   */
  static fromNumber(value) {
    if (typeof value !== 'number') {
      throw new TypeError('Invalid argument to Literal.fromNumber()');
    }
    let datatype;
    const strValue = value.toString();
    if (strValue.indexOf('e') < 0 && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
      datatype = Number.isInteger(value) ? XSD.integer : XSD.decimal;
    } else {
      datatype = XSD.double;
    }
    return new Literal(strValue, null, datatype);
  }

  /**
   * Builds a literal node from an input value
   * @param value - The input value
   */
  static fromValue(value) {
    if (isLiteral(value)) {
      return value;
    }
    switch (typeof value) {
      case 'object':
        if (value instanceof Date) {
          return Literal.fromDate(value);
        }
      case 'boolean':
        return Literal.fromBoolean(value);
      case 'number':
        return Literal.fromNumber(value);
      case 'string':
        return new Literal(value);
    }
    throw new Error("Can't make literal from " + value + ' of type ' + typeof value);
  }
}