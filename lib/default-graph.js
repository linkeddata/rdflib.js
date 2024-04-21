"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.isDefaultGraph = isDefaultGraph;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
var _defaultGraphUri = require("./utils/default-graph-uri");
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2.default)(o), (0, _possibleConstructorReturn2.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2.default)(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
/** The RDF default graph */
var DefaultGraph = exports.default = /*#__PURE__*/function (_Node) {
  function DefaultGraph() {
    var _this;
    (0, _classCallCheck2.default)(this, DefaultGraph);
    _this = _callSuper(this, DefaultGraph, ['']);
    (0, _defineProperty2.default)(_this, "value", '');
    (0, _defineProperty2.default)(_this, "termType", _types.DefaultGraphTermType);
    (0, _defineProperty2.default)(_this, "uri", _defaultGraphUri.defaultGraphURI);
    return _this;
  }
  (0, _inherits2.default)(DefaultGraph, _Node);
  return (0, _createClass2.default)(DefaultGraph, [{
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
}(_nodeInternal.default);
function isDefaultGraph(object) {
  return !!object && object.termType === _types.DefaultGraphTermType;
}