"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classOrder = _interopRequireDefault(require("./class-order"));

var _nodeInternal = _interopRequireDefault(require("./node-internal"));

var _types = require("./types");

var Uri = _interopRequireWildcard(require("./uri"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
* Variables are placeholders used in patterns to be matched.
* In cwm they are symbols which are the formula's list of quantified variables.
* In sparql they are not visibly URIs.  Here we compromise, by having
* a common special base URI for variables. Their names are uris,
* but the ? notation has an implicit base uri of 'varid:'
*/
var Variable = /*#__PURE__*/function (_Node) {
  (0, _inherits2.default)(Variable, _Node);

  var _super = _createSuper(Variable);

  /** The base string for a variable's name */

  /** The unique identifier of this variable */

  /**
   * Initializes this variable
   * @param name The variable's name
   */
  function Variable() {
    var _this;

    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    (0, _classCallCheck2.default)(this, Variable);
    _this = _super.call(this, name);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "termType", _types.VariableTermType);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "base", 'varid:');
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "classOrder", _classOrder.default.Variable);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "isVar", 1);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "uri", void 0);
    _this.base = 'varid:';
    _this.uri = Uri.join(name, _this.base);
    return _this;
  }

  (0, _createClass2.default)(Variable, [{
    key: "equals",
    value: function equals(other) {
      if (!other) {
        return false;
      }

      return this.termType === other.termType && this.value === other.value;
    }
  }, {
    key: "hashString",
    value: function hashString() {
      return this.toString();
    }
  }, {
    key: "substitute",
    value: function substitute(bindings) {
      var ref;
      return (ref = bindings[this.toNT()]) != null ? ref : this;
    }
  }, {
    key: "toString",
    value: function toString() {
      return Variable.toString(this);
    }
  }], [{
    key: "toString",
    value: function toString(variable) {
      if (variable.uri.slice(0, variable.base.length) === variable.base) {
        return "?".concat(variable.uri.slice(variable.base.length));
      }

      return "?".concat(variable.uri);
    }
  }]);
  return Variable;
}(_nodeInternal.default);

exports.default = Variable;