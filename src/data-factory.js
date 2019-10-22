'use strict'
import Collection from './collection'
import CanonicalDataFactory from './data-factory-internal'
import Fetcher from './fetcher'
import Literal from './literal'
import Statement from './statement'
import IndexedFormula from './store'

/**
 * Data factory which also supports Collections
 *
 * Necessary for preventing circular dependencies.
 */
const ExtendedTermFactory = {
  ...CanonicalDataFactory,
  collection,
  id,
  supports: {
    COLLECTIONS: true,
    DEFAULT_GRAPH_TYPE: true,
    EQUALS_METHOD: true,
    NODE_LOOKUP: false,
    VARIABLE_TYPE: true,
  }
}

/** Full RDFLib.js Data Factory */
const DataFactory = {
  ...ExtendedTermFactory,
  fetcher,
  graph,
  lit,
  st,
  triple,
}
export default DataFactory

function id (term) {
  if (!term) {
    return term
  }
  if (Object.prototype.hasOwnProperty.call(term, "id") && typeof term.id === "function") {
    return term.id()
  }
  if (Object.prototype.hasOwnProperty.call(term, "hashString")) {
    return term.hashString()
  }

  if (term.termType === "Collection") {
    Collection.toNT(term)
  }

  return CanonicalDataFactory.id(term)
}
function collection (elements) {
  return new Collection(elements)
}
function fetcher (store, options) {
  return new Fetcher(store, options)
}
function graph (features = undefined, opts = undefined) {
  return new IndexedFormula(features, opts || { rdfFactory: ExtendedTermFactory })
}
function lit (val, lang, dt) {
  return new Literal('' + val, lang, dt)
}
function st (subject, predicate, object, graph) {
  return new Statement(subject, predicate, object, graph)
}
function triple (subject, predicate, object) {
  return CanonicalDataFactory.quad(subject, predicate, object)
}
