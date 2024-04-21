"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2.default)(o), (0, _possibleConstructorReturn2.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2.default)(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
/**
* An empty node
*/
var Empty = exports.default = /*#__PURE__*/function (_Node) {
  function Empty() {
    var _this;
    (0, _classCallCheck2.default)(this, Empty);
    _this = _callSuper(this, Empty, ['']);
    (0, _defineProperty2.default)(_this, "termType", _types.EmptyTermType);
    return _this;
  }
  (0, _inherits2.default)(Empty, _Node);
  return (0, _createClass2.default)(Empty, [{
    key: "toString",
    value: function toString() {
      return '()';
    }
  }]);
}(_nodeInternal.default);