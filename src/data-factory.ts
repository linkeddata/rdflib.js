import Collection from './collection'
import CanonicalDataFactory from './data-factory-internal'
import { ValueType } from './types'
import { DataFactory, Feature } from './data-factory-type'

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
}

export default ExtendedTermFactory
