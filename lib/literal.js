"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classOrder = _interopRequireDefault(require("./class-order"));
var _namedNode = _interopRequireDefault(require("./named-node"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
var _terms = require("./utils/terms");
var _xsdInternal = _interopRequireDefault(require("./xsd-internal"));
/**
 * An RDF literal, containing some value which isn't expressed as an IRI.
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
class Literal extends _nodeInternal.default {
  /**
   * Initializes a literal
   * @param value - The literal's lexical value
   * @param language - The language for the literal. Defaults to ''.
   * @param datatype - The literal's datatype as a named node. Defaults to xsd:string.
   */
  constructor(value, language, datatype) {
    super(value);
    (0, _defineProperty2.default)(this, "termType", _types.LiteralTermType);
    (0, _defineProperty2.default)(this, "classOrder", _classOrder.default.Literal);
    /**
     * The literal's datatype as a named node
     */
    (0, _defineProperty2.default)(this, "datatype", _xsdInternal.default.string);
    (0, _defineProperty2.default)(this, "isVar", 0);
    /**
     * The language for the literal
     */
    (0, _defineProperty2.default)(this, "language", '');
    if (language) {
      this.language = language;
      this.datatype = _xsdInternal.default.langString;
    } else if (datatype) {
      this.datatype = _namedNode.default.fromValue(datatype);
    } else {
      this.datatype = _xsdInternal.default.string;
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
    } else if (!literal.datatype.equals(_xsdInternal.default.string)) {
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
    return new Literal(strValue, null, _xsdInternal.default.boolean);
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
    return new Literal(date, null, _xsdInternal.default.dateTime);
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
      datatype = Number.isInteger(value) ? _xsdInternal.default.integer : _xsdInternal.default.decimal;
    } else {
      datatype = _xsdInternal.default.double;
    }
    return new Literal(strValue, null, datatype);
  }

  /**
   * Builds a literal node from an input value
   * @param value - The input value
   */
  static fromValue(value) {
    if ((0, _terms.isLiteral)(value)) {
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
exports.default = Literal;