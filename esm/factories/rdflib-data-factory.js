import IndexedFormula from '../store';
import Fetcher from '../fetcher';
import ExtendedTermFactory from './extended-term-factory';
/** Full RDFLib.js Data Factory */
const RDFlibDataFactory = {
  ...ExtendedTermFactory,
  /**
   * Creates a new fetcher
   * @param store - The store to use
   * @param options - The options
   */
  fetcher(store, options) {
    return new Fetcher(store, options);
  },
  /**
   * Creates a new graph (store)
   */
  graph(features = undefined, opts = undefined) {
    return new IndexedFormula(features, opts || {
      rdfFactory: ExtendedTermFactory
    });
  },
  /**
   * Creates a new literal node
   * @param val The lexical value
   * @param lang The language
   * @param dt The datatype
   */
  lit(val, lang, dt) {
    return this.literal('' + val, lang || dt);
  },
  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   * @param graph The containing graph
   */
  st(subject, predicate, object, graph) {
    return this.quad(subject, predicate, object, graph);
  }
};
export default RDFlibDataFactory;