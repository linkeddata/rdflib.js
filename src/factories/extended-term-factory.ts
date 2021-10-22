import Collection from '../collection'
import CanonicalDataFactory from './canonical-data-factory'
import { ValueType, CollectionTermType } from '../types'
import { DataFactory, DefaultFactoryTypes, Feature, Indexable } from './factory-types'
import { isCollection, isVariable } from '../utils/terms'
import Variable from '../variable'
import { Term } from '../tf-types'

interface CollectionFactory extends DataFactory {
  collection(elements: ReadonlyArray<ValueType>): Collection
}

/**
 * Data factory which also supports Collections
 *
 * Necessary for preventing circular dependencies.
 */
const ExtendedTermFactory: CollectionFactory = {
  ...CanonicalDataFactory,

  supports: {
    [Feature.collections]: true,
    [Feature.defaultGraphType]: false,
    [Feature.equalsMethod]: true,
    [Feature.identity]: false,
    [Feature.id]: true,
    [Feature.reversibleId]: false,
    [Feature.variableType]: true,
  },

  /**
   * Creates a new collection
   * @param elements - The initial element
   */
  collection (elements: ReadonlyArray<ValueType>): Collection {
    return new Collection(elements)
  },

  id (term: Term | DefaultFactoryTypes): Indexable {
    if (isCollection(term)) {
      return `( ${term.elements.map((e) => {
        return this.id(e) }).join(', ')} )`
    }

    if (isVariable(term)) {
      return Variable.toString(term)
    }

    return CanonicalDataFactory.id(term)
  },

  termToNQ (term: Term): string {
    if (term.termType === CollectionTermType) {
      return Collection.toNT(term)
    }

    return CanonicalDataFactory.termToNQ(term)
  }
}

export default ExtendedTermFactory
