import {
  IRDFlibDataFactory,
  ObjectType,
  PredicateType,
  SubjectType,
  TFNamedNode,
  TFTerm
} from '../types'
import Literal from '../literal'
import Statement from '../statement'
import IndexedFormula from '../store'
import Fetcher from '../fetcher'
import ExtendedTermFactory from './extended-term-factory'

/** Full RDFLib.js Data Factory */
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
   * @deprecated use {literal} with the second and third argument combined
   */
  lit (val: string, lang?: string, dt?: TFNamedNode): Literal {
    return this.literal('' + val, lang || dt)
  },

  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   * @param graph The containing graph
   * @deprecated use {quad} instead
   */
  st (
    subject: TFTerm,
    predicate: TFTerm,
    object: TFTerm,
    graph?: TFTerm
  ): Statement {
    return this.quad(subject, predicate, object, graph)
  },

  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   * @deprecated use {quad} without the last argument instead
   */
  triple (
    subject: SubjectType,
    predicate: PredicateType,
    object: ObjectType
  ): Statement {
    return this.quad(subject, predicate, object)
  },
}

export default RDFlibDataFactory
