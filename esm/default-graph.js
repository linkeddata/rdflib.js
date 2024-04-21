import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/inherits";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
import Node from './node-internal';
import { DefaultGraphTermType } from './types';
import { defaultGraphURI } from './utils/default-graph-uri';

/** The RDF default graph */
var DefaultGraph = /*#__PURE__*/function (_Node) {
  function DefaultGraph() {
    var _this;
    _classCallCheck(this, DefaultGraph);
    _this = _callSuper(this, DefaultGraph, ['']);
    _defineProperty(_this, "value", '');
    _defineProperty(_this, "termType", DefaultGraphTermType);
    _defineProperty(_this, "uri", defaultGraphURI);
    return _this;
  }
  _inherits(DefaultGraph, _Node);
  return _createClass(DefaultGraph, [{
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
}(Node);
export { DefaultGraph as default };
export function isDefaultGraph(object) {
  return !!object && object.termType === DefaultGraphTermType;
}