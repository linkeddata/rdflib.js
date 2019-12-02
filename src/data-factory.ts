import Collection from './collection'
import CanonicalDataFactory from './data-factory-internal'
import { TFBlankNode, TFLiteral, TFNamedNode, ValueType } from './types'
import { Indexable, SupportTable } from './data-factory-type'
import NamedNode from './named-node'

const RDFlibjsSupports: SupportTable = {
  COLLECTIONS: true,
  DEFAULT_GRAPH_TYPE: true,
  EQUALS_METHOD: true,
  VARIABLE_TYPE: true,
  IDENTITY: false,
  REVERSIBLE_ID: false,
  ID: false,
}

function id (term: TFNamedNode | TFBlankNode | TFLiteral | Collection ): Indexable {
  if (!term) {
    return term
  }
  if (Object.prototype.hasOwnProperty.call(term, "id") && typeof (term as NamedNode).id === "function") {
    return (term as NamedNode).id()
  }
  if (Object.prototype.hasOwnProperty.call(term, "hashString")) {
    return (term as NamedNode).hashString()
  }

  if (term.termType === "Collection") {
    Collection.toNT(term)
  }

  return CanonicalDataFactory.id(term as NamedNode)
}
/**
 * Creates a new collection
 * @param elements - The initial element
 */
function collection(elements: ReadonlyArray<ValueType>): Collection {
  return new Collection(elements)
}

/**
 * Data factory which also supports Collections
 *
 * Necessary for preventing circular dependencies.
 */
const ExtendedTermFactory = {
  ...CanonicalDataFactory,
  collection,
  id,
  supports: RDFlibjsSupports
}

export default ExtendedTermFactory
