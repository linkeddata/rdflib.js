"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classOrder = _interopRequireDefault(require("./class-order"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
var Uri = _interopRequireWildcard(require("./uri"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
* Variables are placeholders used in patterns to be matched.
* In cwm they are symbols which are the formula's list of quantified variables.
* In sparql they are not visibly URIs.  Here we compromise, by having
* a common special base URI for variables. Their names are uris,
* but the ? notation has an implicit base uri of 'varid:'
*/
class Variable extends _nodeInternal.default {
  /**
   * Initializes this variable
   * @param name The variable's name
   */
  constructor(name = '') {
    super(name);
    (0, _defineProperty2.default)(this, "termType", _types.VariableTermType);
    /** The base string for a variable's name */
    (0, _defineProperty2.default)(this, "base", 'varid:');
    (0, _defineProperty2.default)(this, "classOrder", _classOrder.default.Variable);
    (0, _defineProperty2.default)(this, "isVar", 1);
    /** The unique identifier of this variable */
    (0, _defineProperty2.default)(this, "uri", void 0);
    this.base = 'varid:';
    this.uri = Uri.join(name, this.base);
  }
  equals(other) {
    if (!other) {
      return false;
    }
    return this.termType === other.termType && this.value === other.value;
  }
  hashString() {
    return this.toString();
  }
  substitute(bindings) {
    var ref;
    return (ref = bindings[this.toNT()]) != null ? ref : this;
  }
  toString() {
    return Variable.toString(this);
  }
  static toString(variable) {
    if (variable.uri.slice(0, variable.base.length) === variable.base) {
      return `?${variable.uri.slice(variable.base.length)}`;
    }
    return `?${variable.uri}`;
  }
}
exports.default = Variable;