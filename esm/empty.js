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
import { EmptyTermType } from './types';

/**
* An empty node
*/
var Empty = /*#__PURE__*/function (_Node) {
  _inherits(Empty, _Node);

  var _super = _createSuper(Empty);

  function Empty() {
    var _this;

    _classCallCheck(this, Empty);

    _this = _super.call(this, '');

    _defineProperty(_assertThisInitialized(_this), "termType", EmptyTermType);

    return _this;
  }

  _createClass(Empty, [{
    key: "toString",
    value: function toString() {
      return '()';
    }
  }]);

  return Empty;
}(Node);

export { Empty as default };