import _defineProperty from "@babel/runtime/helpers/defineProperty";

var _supports;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

import Collection from '../collection';
import CanonicalDataFactory from './canonical-data-factory';
import { CollectionTermType } from '../types';
import { Feature } from './factory-types';
import { isCollection, isVariable } from '../utils/terms';
import Variable from '../variable';

/**
 * Data factory which also supports Collections
 *
 * Necessary for preventing circular dependencies.
 */
var ExtendedTermFactory = _objectSpread(_objectSpread({}, CanonicalDataFactory), {}, {
  supports: (_supports = {}, _defineProperty(_supports, Feature.collections, true), _defineProperty(_supports, Feature.defaultGraphType, false), _defineProperty(_supports, Feature.equalsMethod, true), _defineProperty(_supports, Feature.identity, false), _defineProperty(_supports, Feature.id, true), _defineProperty(_supports, Feature.reversibleId, false), _defineProperty(_supports, Feature.variableType, true), _supports),

  /**
   * Creates a new collection
   * @param elements - The initial element
   */
  collection: function collection(elements) {
    return new Collection(elements);
  },
  id: function id(term) {
    var _this = this;

    if (isCollection(term)) {
      return "( ".concat(term.elements.map(function (e) {
        return _this.id(e);
      }).join(', '), " )");
    }

    if (isVariable(term)) {
      return Variable.toString(term);
    }

    return CanonicalDataFactory.id(term);
  },
  termToNQ: function termToNQ(term) {
    if (term.termType === CollectionTermType) {
      return Collection.toNT(term);
    }

    return CanonicalDataFactory.termToNQ(term);
  }
});

export default ExtendedTermFactory;