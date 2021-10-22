import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inherits from "@babel/runtime/helpers/inherits";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _defineProperty from "@babel/runtime/helpers/defineProperty";

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

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
  _inherits(Variable, _Node);

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

    _classCallCheck(this, Variable);

    _this = _super.call(this, name);

    _defineProperty(_assertThisInitialized(_this), "termType", VariableTermType);

    _defineProperty(_assertThisInitialized(_this), "base", 'varid:');

    _defineProperty(_assertThisInitialized(_this), "classOrder", ClassOrder.Variable);

    _defineProperty(_assertThisInitialized(_this), "isVar", 1);

    _defineProperty(_assertThisInitialized(_this), "uri", void 0);

    _this.base = 'varid:';
    _this.uri = Uri.join(name, _this.base);
    return _this;
  }

  _createClass(Variable, [{
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
}(Node);

export { Variable as default };