"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.isDefaultGraph = isDefaultGraph;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _nodeInternal = _interopRequireDefault(require("./node-internal"));

var _types = require("./types");

var _defaultGraphUri = require("./utils/default-graph-uri");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/** The RDF default graph */
var DefaultGraph = /*#__PURE__*/function (_Node) {
  (0, _inherits2.default)(DefaultGraph, _Node);

  var _super = _createSuper(DefaultGraph);

  function DefaultGraph() {
    var _this;

    (0, _classCallCheck2.default)(this, DefaultGraph);
    _this = _super.call(this, '');
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "value", '');
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "termType", _types.DefaultGraphTermType);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "uri", _defaultGraphUri.defaultGraphURI);
    return _this;
  }

  (0, _createClass2.default)(DefaultGraph, [{
    key: "toCanonical",
    value: function toCanonical() {
      return this.value;
    }
  }, {
    key: "toString",
    value: function toString() {
      return 'DefaultGraph';
    }
  }]);
  return DefaultGraph;
}(_nodeInternal.default);

exports.default = DefaultGraph;

function isDefaultGraph(object) {
  return !!object && object.termType === _types.DefaultGraphTermType;
}