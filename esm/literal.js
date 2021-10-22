import _typeof from "@babel/runtime/helpers/typeof";
import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inherits from "@babel/runtime/helpers/inherits";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _defineProperty from "@babel/runtime/helpers/defineProperty";

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

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
var Literal = /*#__PURE__*/function (_Node) {
  _inherits(Literal, _Node);

  var _super = _createSuper(Literal);

  /**
   * The literal's datatype as a named node
   */

  /**
   * The language for the literal
   */

  /**
   * Initializes a literal
   * @param value - The literal's lexical value
   * @param language - The language for the literal. Defaults to ''.
   * @param datatype - The literal's datatype as a named node. Defaults to xsd:string.
   */
  function Literal(value, language, datatype) {
    var _this;

    _classCallCheck(this, Literal);

    _this = _super.call(this, value);

    _defineProperty(_assertThisInitialized(_this), "termType", LiteralTermType);

    _defineProperty(_assertThisInitialized(_this), "classOrder", ClassOrder.Literal);

    _defineProperty(_assertThisInitialized(_this), "datatype", XSD.string);

    _defineProperty(_assertThisInitialized(_this), "isVar", 0);

    _defineProperty(_assertThisInitialized(_this), "language", '');

    if (language) {
      _this.language = language;
      _this.datatype = XSD.langString;
    } else if (datatype) {
      _this.datatype = RDFlibNamedNode.fromValue(datatype);
    } else {
      _this.datatype = XSD.string;
    }

    return _this;
  }
  /**
   * Gets a copy of this literal
   */


  _createClass(Literal, [{
    key: "copy",
    value: function copy() {
      return new Literal(this.value, this.lang, this.datatype);
    }
    /**
     * Gets whether two literals are the same
     * @param other The other statement
     */

  }, {
    key: "equals",
    value: function equals(other) {
      if (!other) {
        return false;
      }

      return this.termType === other.termType && this.value === other.value && this.language === other.language && (!this.datatype && !other.datatype || this.datatype && this.datatype.equals(other.datatype));
    }
    /**
     * The language for the literal
     * @deprecated use {language} instead
     */

  }, {
    key: "lang",
    get: function get() {
      return this.language;
    },
    set: function set(language) {
      this.language = language || '';
    }
  }, {
    key: "toNT",
    value: function toNT() {
      return Literal.toNT(this);
    }
    /** Serializes a literal to an N-Triples string */

  }, {
    key: "toString",
    value: function toString() {
      return '' + this.value;
    }
    /**
     * Builds a literal node from a boolean value
     * @param value - The value
     */

  }], [{
    key: "toNT",
    value: function toNT(literal) {
      if (typeof literal.value === 'number') {
        return '' + literal.value;
      } else if (typeof literal.value !== 'string') {
        throw new Error('Value of RDF literal is not string or number: ' + literal.value);
      }

      var str = literal.value; // #x22 ("), #x5C (\), #x0A (\n) and #xD (\r) are disallowed and need to be replaced
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
  }, {
    key: "fromBoolean",
    value: function fromBoolean(value) {
      var strValue = value ? '1' : '0';
      return new Literal(strValue, null, XSD.boolean);
    }
    /**
     * Builds a literal node from a date value
     * @param value The value
     */

  }, {
    key: "fromDate",
    value: function fromDate(value) {
      if (!(value instanceof Date)) {
        throw new TypeError('Invalid argument to Literal.fromDate()');
      }

      var d2 = function d2(x) {
        return ('' + (100 + x)).slice(1, 3);
      };

      var date = '' + value.getUTCFullYear() + '-' + d2(value.getUTCMonth() + 1) + '-' + d2(value.getUTCDate()) + 'T' + d2(value.getUTCHours()) + ':' + d2(value.getUTCMinutes()) + ':' + d2(value.getUTCSeconds()) + 'Z';
      return new Literal(date, null, XSD.dateTime);
    }
    /**
     * Builds a literal node from a number value
     * @param value - The value
     */

  }, {
    key: "fromNumber",
    value: function fromNumber(value) {
      if (typeof value !== 'number') {
        throw new TypeError('Invalid argument to Literal.fromNumber()');
      }

      var datatype;
      var strValue = value.toString();

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

  }, {
    key: "fromValue",
    value: function fromValue(value) {
      if (isLiteral(value)) {
        return value;
      }

      switch (_typeof(value)) {
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

      throw new Error("Can't make literal from " + value + ' of type ' + _typeof(value));
    }
  }]);

  return Literal;
}(Node);

export { Literal as default };