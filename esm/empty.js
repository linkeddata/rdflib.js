import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/inherits";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
import Node from './node-internal';
import { EmptyTermType } from './types';
/**
* An empty node
*/
var Empty = /*#__PURE__*/function (_Node) {
  function Empty() {
    var _this;
    _classCallCheck(this, Empty);
    _this = _callSuper(this, Empty, ['']);
    _defineProperty(_this, "termType", EmptyTermType);
    return _this;
  }
  _inherits(Empty, _Node);
  return _createClass(Empty, [{
    key: "toString",
    value: function toString() {
      return '()';
    }
  }]);
}(Node);
export { Empty as default };