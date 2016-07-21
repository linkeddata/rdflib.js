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
  Namespace: require('./src/namespace'),
  Node: require('./src/node'),
  Query: require('./src/query').Query,
  queryToSPARQL: require('./src/query-to-sparql'),
  RDFaProcessor: require('./src/rdfaparser'),
  RDFParser: require('./src/rdfparser'),
  Serializer: require('./src/serializer'),
  SPARQLToQuery: require('./src/sparql-to-query'),
  sparqlUpdateParser: require('./patch-parser'),
  Statement: require('./src/statement'),
  term: require('./src/term'),
  UpdateManager: require('./src/update-manager'),
  uri: require('./src/uri'),
  Util: require('./src/util'),
  Variable: require('./src/variable')
}

$rdf.NextId = $rdf.BlankNode.nextId

$rdf.fromNT = $rdf.Formula.prototype.fromNT
$rdf.graph = $rdf.DataFactory.graph
$rdf.lit = $rdf.DataFactory.lit
$rdf.st = $rdf.DataFactory.st
$rdf.sym = $rdf.DataFactory.namedNode
$rdf.variable = $rdf.DataFactory.variable
module.exports = $rdf
