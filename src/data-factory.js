'use strict'
const BlankNode = require('./blank-node')
const Collection = require('./collection')
const Fetcher = require('./fetcher')
const IndexedFormula = require('./indexed-formula')
const Literal = require('./literal')
const NamedNode = require('./named-node')
const Statement = require('./statement')
const Variable = require('./variable')

function blankNode (value) {
  return new BlankNode(value)
}
function collection (elements) {
  return new Collection(elements)
}
function fetcher (store, timeout, async) {
  return new Fetcher(store, timeout, async)
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

// rdfjs spec factory methods
module.exports.blankNode = blankNode
module.exports.graph = graph
module.exports.literal = literal
module.exports.namedNode = namedNode
module.exports.quad = quad
module.exports.triple = triple
module.exports.variable = variable

// rdflib only
module.exports.collection = collection
module.exports.fetcher = fetcher
module.exports.lit = lit
module.exports.st = st
