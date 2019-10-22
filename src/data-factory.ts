import Collection from './collection'
import CanonicalDataFactory from './data-factory-internal'
import Fetcher from './fetcher'
import Literal from './literal'
import Statement from './statement'
import { ValueType, TFNamedNode, SubjectType, PredicateType, ObjectType, GraphType, TFBlankNode, TFLiteral } from './types'
import IndexedFormula from './store'
import { DataFactory, Indexable, SupportTable } from './data-factory-type'
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

interface IRDFlibDataFactory extends DataFactory<NamedNode> {
  fetcher: (store: IndexedFormula, options: any) => Fetcher
  graph: (features, opts) => IndexedFormula
  lit: (val: string, lang?: string, dt?: TFNamedNode) => Literal
  st: (
    subject: SubjectType,
    predicate: PredicateType,
    object: ObjectType,
    graph?: GraphType
  ) => Statement
  triple: (
    subject: SubjectType,
    predicate: PredicateType,
    object: ObjectType
  ) => Statement
}

/** Full RDFLib.js Data Factory
 *  @todo Add missing functions (isQuad, equals, toNQ), so Partial can be removed
 */
const RDFlibDataFactory: Partial<IRDFlibDataFactory> = {
  ...ExtendedTermFactory,
  fetcher,
  graph,
  lit,
  st,
  triple,
}

export default RDFlibDataFactory

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
 * Creates a new fetcher
 * @param store - The store to use
 * @param options - The options
 */
function fetcher(store: IndexedFormula, options: any): Fetcher {
  return new Fetcher(store, options)
}
/**
 * Creates a new graph (store)
 */
function graph (features = undefined, opts = undefined): IndexedFormula {
  return new IndexedFormula(features, opts || { rdfFactory: ExtendedTermFactory })
}
/**
 * Creates a new literal node
 * @param val The lexical value
 * @param lang The language
 * @param dt The datatype
 */
function lit(val: string, lang?: string, dt?: TFNamedNode): Literal {
  return new Literal('' + val, lang, dt)
}
/**
 * Creates a new statement
 * @param subject The subject
 * @param predicate The predicate
 * @param object The object
 * @param graph The containing graph
 */
function st(
  subject: SubjectType,
  predicate: PredicateType,
  object: ObjectType,
  graph?: GraphType
): Statement {
  return new Statement(subject, predicate, object, graph)
}
/**
 * Creates a new statement
 * @param subject The subject
 * @param predicate The predicate
 * @param object The object
 */
function triple(
  subject: SubjectType,
  predicate: PredicateType,
  object: ObjectType
): Statement {
  return CanonicalDataFactory.quad(subject, predicate, object)
}
