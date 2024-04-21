import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/inherits";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
import ClassOrder from './class-order';
import Node from './node-internal';
import { VariableTermType } from './types';
import * as Uri from './uri';
/**
* Variables are placeholders used in patterns to be matched.
* In cwm they are symbols which are the formula's list of quantified variables.
* In sparql they are not visibly URIs.  Here we compromise, by having
* a common special base URI for variables. Their names are uris,
* but the ? notation has an implicit base uri of 'varid:'
*/
var Variable = /*#__PURE__*/function (_Node) {
  /**
   * Initializes this variable
   * @param name The variable's name
   */
  function Variable() {
    var _this;
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    _classCallCheck(this, Variable);
    _this = _callSuper(this, Variable, [name]);
    _defineProperty(_this, "termType", VariableTermType);
    /** The base string for a variable's name */
    _defineProperty(_this, "base", 'varid:');
    _defineProperty(_this, "classOrder", ClassOrder.Variable);
    _defineProperty(_this, "isVar", 1);
    /** The unique identifier of this variable */
    _defineProperty(_this, "uri", void 0);
    _this.base = 'varid:';
    _this.uri = Uri.join(name, _this.base);
    return _this;
  }
  _inherits(Variable, _Node);
  return _createClass(Variable, [{
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
}(Node);
export { Variable as default };