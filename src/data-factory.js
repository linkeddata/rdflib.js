'use strict'
import BlankNode from './blank-node'
import Collection from './collection'
import DefaultGraph from './default-graph'
import Fetcher from './fetcher'
import IndexedFormula from './store'
import Literal from './literal'
import NamedNode from './named-node'
import Statement from './statement'
import Variable from './variable'

const DataFactory = {
  blankNode,
  defaultGraph,
  fetcher,
  graph,
  lit,
  literal,
  namedNode,
  quad,
  st,
  triple,
  variable,
}
export default DataFactory

function blankNode (value) {
  return new BlankNode(value)
}
function collection (elements) {
  return new Collection(elements)
}
function defaultGraph () {
  return new DefaultGraph()
}
function fetcher (store, options) {
  return new Fetcher(store, options)
}
function graph () {
  return new IndexedFormula()
}
function lit (val, lang, dt) {
  return new Literal('' + val, lang, dt)
}
function literal (value, languageOrDatatype) {
  if (typeof languageOrDatatype === 'string') {
    if (languageOrDatatype.indexOf(':') === -1) {
      return new Literal(value, languageOrDatatype)
    } else {
      return new Literal(value, null, namedNode(languageOrDatatype))
    }
  } else {
    return new Literal(value, null, languageOrDatatype)
  }
}
function namedNode (value) {
  return new NamedNode(value)
}
function quad (subject, predicate, object, graph) {
  graph = graph || new DefaultGraph()
  return new Statement(subject, predicate, object, graph)
}
function st (subject, predicate, object, graph) {
  return new Statement(subject, predicate, object, graph)
}
function triple (subject, predicate, object) {
  return quad(subject, predicate, object)
}
function variable (name) {
  return new Variable(name)
}
