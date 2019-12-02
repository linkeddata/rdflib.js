import {
  GraphType,
  IRDFlibDataFactory,
  ObjectType,
  PredicateType,
  SubjectType,
  TFNamedNode
} from './types'
import Literal from './literal'
import Statement from './statement'
import IndexedFormula from './store'
import Fetcher from './fetcher'
import ExtendedTermFactory from './data-factory'

/** Full RDFLib.js Data Factory
 *  @todo Add missing functions (isQuad, equals, toNQ), so Partial can be removed
 */
const RDFlibDataFactory: IRDFlibDataFactory = {
  ...ExtendedTermFactory,

  /**
   * Creates a new fetcher
   * @param store - The store to use
   * @param options - The options
   */
  fetcher (store: IndexedFormula, options: any): Fetcher {
    return new Fetcher(store, options)
  },

  /**
   * Creates a new graph (store)
   */
  graph (features = undefined, opts = undefined): IndexedFormula {
    return new IndexedFormula(features, opts || {rdfFactory: ExtendedTermFactory})
  },

  /**
   * Creates a new literal node
   * @param val The lexical value
   * @param lang The language
   * @param dt The datatype
   */
  lit (val: string, lang?: string, dt?: TFNamedNode): Literal {
    return new Literal('' + val, lang, dt)
  },

  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   * @param graph The containing graph
   */
  st (
    subject: SubjectType,
    predicate: PredicateType,
    object: ObjectType,
    graph?: GraphType
  ): Statement {
    return new Statement(subject, predicate, object, graph)
  },

  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   */
  triple (
    subject: SubjectType,
    predicate: PredicateType,
    object: ObjectType
  ): Statement {
    // Statement is inherited from data-factory-internal#quad
    return this.quad(subject, predicate, object) as Statement
  },
}

export default RDFlibDataFactory
