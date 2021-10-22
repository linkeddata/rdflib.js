import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inherits from "@babel/runtime/helpers/inherits";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _defineProperty from "@babel/runtime/helpers/defineProperty";

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

import Node from './node-internal';
import { DefaultGraphTermType } from './types';
import { defaultGraphURI } from './utils/default-graph-uri';
/** The RDF default graph */

var DefaultGraph = /*#__PURE__*/function (_Node) {
  _inherits(DefaultGraph, _Node);

  var _super = _createSuper(DefaultGraph);

  function DefaultGraph() {
    var _this;

    _classCallCheck(this, DefaultGraph);

    _this = _super.call(this, '');

    _defineProperty(_assertThisInitialized(_this), "value", '');

    _defineProperty(_assertThisInitialized(_this), "termType", DefaultGraphTermType);

    _defineProperty(_assertThisInitialized(_this), "uri", defaultGraphURI);

    return _this;
  }

  _createClass(DefaultGraph, [{
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
}(Node);

export { DefaultGraph as default };
export function isDefaultGraph(object) {
  return !!object && object.termType === DefaultGraphTermType;
}