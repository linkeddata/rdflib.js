"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _collection = _interopRequireDefault(require("../collection"));
var _canonicalDataFactory = _interopRequireDefault(require("./canonical-data-factory"));
var _types = require("../types");
var _factoryTypes = require("./factory-types");
var _terms = require("../utils/terms");
var _variable = _interopRequireDefault(require("../variable"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2.default)(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
/**
 * Data factory which also supports Collections
 *
 * Necessary for preventing circular dependencies.
 */
var ExtendedTermFactory = _objectSpread(_objectSpread({}, _canonicalDataFactory.default), {}, {
  supports: (0, _defineProperty2.default)((0, _defineProperty2.default)((0, _defineProperty2.default)((0, _defineProperty2.default)((0, _defineProperty2.default)((0, _defineProperty2.default)((0, _defineProperty2.default)({}, _factoryTypes.Feature.collections, true), _factoryTypes.Feature.defaultGraphType, false), _factoryTypes.Feature.equalsMethod, true), _factoryTypes.Feature.identity, false), _factoryTypes.Feature.id, true), _factoryTypes.Feature.reversibleId, false), _factoryTypes.Feature.variableType, true),
  /**
   * Creates a new collection
   * @param elements - The initial element
   */
  collection: function collection(elements) {
    return new _collection.default(elements);
  },
  id: function id(term) {
    var _this = this;
    if ((0, _terms.isCollection)(term)) {
      return "( ".concat(term.elements.map(function (e) {
        return _this.id(e);
      }).join(', '), " )");
    }
    if ((0, _terms.isVariable)(term)) {
      return _variable.default.toString(term);
    }
    return _canonicalDataFactory.default.id(term);
  },
  termToNQ: function termToNQ(term) {
    if (term.termType === _types.CollectionTermType) {
      return _collection.default.toNT(term);
    }
    return _canonicalDataFactory.default.termToNQ(term);
  }
});
var _default = exports.default = ExtendedTermFactory;