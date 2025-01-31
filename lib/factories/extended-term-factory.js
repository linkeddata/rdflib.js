"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _collection = _interopRequireDefault(require("../collection"));
var _canonicalDataFactory = _interopRequireDefault(require("./canonical-data-factory"));
var _types = require("../types");
var _factoryTypes = require("./factory-types");
var _terms = require("../utils/terms");
var _variable = _interopRequireDefault(require("../variable"));
/**
 * Data factory which also supports Collections
 *
 * Necessary for preventing circular dependencies.
 */
const ExtendedTermFactory = {
  ..._canonicalDataFactory.default,
  supports: {
    [_factoryTypes.Feature.collections]: true,
    [_factoryTypes.Feature.defaultGraphType]: false,
    [_factoryTypes.Feature.equalsMethod]: true,
    [_factoryTypes.Feature.identity]: false,
    [_factoryTypes.Feature.id]: true,
    [_factoryTypes.Feature.reversibleId]: false,
    [_factoryTypes.Feature.variableType]: true
  },
  /**
   * Creates a new collection
   * @param elements - The initial element
   */
  collection(elements) {
    return new _collection.default(elements);
  },
  id(term) {
    if ((0, _terms.isCollection)(term)) {
      return `( ${term.elements.map(e => {
        return this.id(e);
      }).join(', ')} )`;
    }
    if ((0, _terms.isVariable)(term)) {
      return _variable.default.toString(term);
    }
    return _canonicalDataFactory.default.id(term);
  },
  termToNQ(term) {
    if (term.termType === _types.CollectionTermType) {
      return _collection.default.toNT(term);
    }
    return _canonicalDataFactory.default.termToNQ(term);
  }
};
var _default = exports.default = ExtendedTermFactory;