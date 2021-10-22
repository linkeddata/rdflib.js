import {
  IRDFlibDataFactory,
} from '../types'
import Literal from '../literal'
import Statement from '../statement'
import IndexedFormula from '../store'
import Fetcher from '../fetcher'
import ExtendedTermFactory from './extended-term-factory'
import { NamedNode, Quad_Subject, Quad_Predicate, Quad_Object, Quad_Graph } from '../tf-types'

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
   */
  lit (val: string, lang?: string, dt?: NamedNode): Literal {
    return this.literal('' + val, lang || dt)
  },

  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   * @param graph The containing graph
   */
  st (
    subject: Quad_Subject,
    predicate: Quad_Predicate,
    object: Quad_Object,
    graph?: Quad_Graph
  ): Statement {
    return this.quad(subject, predicate, object, graph)
  },
}

export default RDFlibDataFactory
