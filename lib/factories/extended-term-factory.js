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

var _supports;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/**
 * Data factory which also supports Collections
 *
 * Necessary for preventing circular dependencies.
 */
var ExtendedTermFactory = _objectSpread(_objectSpread({}, _canonicalDataFactory.default), {}, {
  supports: (_supports = {}, (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.collections, true), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.defaultGraphType, false), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.equalsMethod, true), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.identity, false), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.id, true), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.reversibleId, false), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.variableType, true), _supports),

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

var _default = ExtendedTermFactory;
exports.default = _default;