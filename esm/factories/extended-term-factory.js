import _defineProperty from "@babel/runtime/helpers/defineProperty";
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
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
  supports: _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, Feature.collections, true), Feature.defaultGraphType, false), Feature.equalsMethod, true), Feature.identity, false), Feature.id, true), Feature.reversibleId, false), Feature.variableType, true),
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