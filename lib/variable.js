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
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/**
* Variables are placeholders used in patterns to be matched.
* In cwm they are symbols which are the formula's list of quantified variables.
* In sparql they are not visibly URIs.  Here we compromise, by having
* a common special base URI for variables. Their names are uris,
* but the ? notation has an implicit base uri of 'varid:'
*/
class Variable extends _nodeInternal.default {
  /** The base string for a variable's name */

  /** The unique identifier of this variable */

  /**
   * Initializes this variable
   * @param name The variable's name
   */
  constructor() {
    let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    super(name);
    (0, _defineProperty2.default)(this, "termType", _types.VariableTermType);
    (0, _defineProperty2.default)(this, "base", 'varid:');
    (0, _defineProperty2.default)(this, "classOrder", _classOrder.default.Variable);
    (0, _defineProperty2.default)(this, "isVar", 1);
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