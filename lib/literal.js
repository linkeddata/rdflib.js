"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classOrder = _interopRequireDefault(require("./class-order"));

var _namedNode = _interopRequireDefault(require("./named-node"));

var _nodeInternal = _interopRequireDefault(require("./node-internal"));

var _types = require("./types");

var _terms = require("./utils/terms");

var _xsdInternal = _interopRequireDefault(require("./xsd-internal"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * An RDF literal, containing some value which isn't expressed as an IRI.
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
var Literal = /*#__PURE__*/function (_Node) {
  (0, _inherits2.default)(Literal, _Node);

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

    (0, _classCallCheck2.default)(this, Literal);
    _this = _super.call(this, value);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "termType", _types.LiteralTermType);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "classOrder", _classOrder.default.Literal);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "datatype", _xsdInternal.default.string);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "isVar", 0);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "language", '');

    if (language) {
      _this.language = language;
      _this.datatype = _xsdInternal.default.langString;
    } else if (datatype) {
      _this.datatype = _namedNode.default.fromValue(datatype);
    } else {
      _this.datatype = _xsdInternal.default.string;
    }

    return _this;
  }
  /**
   * Gets a copy of this literal
   */


  (0, _createClass2.default)(Literal, [{
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
      } else if (!literal.datatype.equals(_xsdInternal.default.string)) {
        // Only add datatype if it's not a string
        str += '^^' + literal.datatype.toCanonical();
      }

      return str;
    }
  }, {
    key: "fromBoolean",
    value: function fromBoolean(value) {
      var strValue = value ? '1' : '0';
      return new Literal(strValue, null, _xsdInternal.default.boolean);
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
      return new Literal(date, null, _xsdInternal.default.dateTime);
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

  }, {
    key: "fromValue",
    value: function fromValue(value) {
      if ((0, _terms.isLiteral)(value)) {
        return value;
      }

      switch ((0, _typeof2.default)(value)) {
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

      throw new Error("Can't make literal from " + value + ' of type ' + (0, _typeof2.default)(value));
    }
  }]);
  return Literal;
}(_nodeInternal.default);

exports.default = Literal;