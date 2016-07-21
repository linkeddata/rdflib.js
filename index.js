var $rdf = {
  BlankNode: require('./src/blank-node'),
  Collection: require('./src/collection'),
  DataFactory: require('./src/data-factory'),
  Empty: require('./src/empty'),
  Formula: require('./src/formula'),
  IndexedFormula: require('./src/indexed-formula'),
  Literal: require('./src/literal'),
  log: require('./src/log'),
  N3Parser: require('./src/n3parser'),
  NamedNode: require('./src/named-node'),
  Node: require('./src/node'),
  RDFaProcessor: require('./src/rdfaparser'),
  RDFParser: require('./src/rdfparser'),
  Serializer: require('./src/serialize'),
  sparqlUpdateParser: require('./patch-parser'),
  Statement: require('./src/statement'),
  term: require('./src/term'),
  uri: require('./src/uri'),
  Util: require('./src/util'),
  Variable: require('./src/variable')
}

$rdf.NextId = $rdf.BlankNode.nextId

$rdf.st = function st (subject, predicate, object, graph) {
  return new $rdf.Statement(subject, predicate, object, graph)
}
$rdf.graph = function graph () {
  return new $rdf.IndexedFormula()
}
$rdf.fromNT = $rdf.Formula.prototype.fromNT
$rdf.lit = $rdf.DataFactory.lit
$rdf.Namespace = $rdf.Formula.prototype.ns
$rdf.sym = $rdf.DataFactory.namedNode
$rdf.variable = $rdf.Formula.prototype.variable
module.exports = $rdf