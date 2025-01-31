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
const ExtendedTermFactory = {
  ...CanonicalDataFactory,
  supports: {
    [Feature.collections]: true,
    [Feature.defaultGraphType]: false,
    [Feature.equalsMethod]: true,
    [Feature.identity]: false,
    [Feature.id]: true,
    [Feature.reversibleId]: false,
    [Feature.variableType]: true
  },
  /**
   * Creates a new collection
   * @param elements - The initial element
   */
  collection(elements) {
    return new Collection(elements);
  },
  id(term) {
    if (isCollection(term)) {
      return `( ${term.elements.map(e => {
        return this.id(e);
      }).join(', ')} )`;
    }
    if (isVariable(term)) {
      return Variable.toString(term);
    }
    return CanonicalDataFactory.id(term);
  },
  termToNQ(term) {
    if (term.termType === CollectionTermType) {
      return Collection.toNT(term);
    }
    return CanonicalDataFactory.termToNQ(term);
  }
};
export default ExtendedTermFactory;