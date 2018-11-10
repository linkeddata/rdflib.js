var $rdf = {
  BlankNode: require('./blank-node'),
  Collection: require('./collection'),
  convert: require('./convert'),
  DataFactory: require('./data-factory'),
  Empty: require('./empty'),
  Fetcher: require('./fetcher'),
  Formula: require('./formula'),
  Store: require('./store'),
  jsonParser: require('./jsonparser'),
  Literal: require('./literal'),
  log: require('./log'),
  N3Parser: require('./n3parser'),
  NamedNode: require('./named-node'),
  Namespace: require('./namespace'),
  Node: require('./node'),
  parse: require('./parse'),
  Query: require('./query').Query,
  queryToSPARQL: require('./query-to-sparql'),
  RDFaProcessor: require('./rdfaparser'),
  RDFParser: require('./rdfxmlparser'),
  serialize: require('./serialize'),
  Serializer: require('./serializer'),
  SPARQLToQuery: require('./sparql-to-query'),
  sparqlUpdateParser: require('./patch-parser'),
  Statement: require('./statement'),
  term: require('./node').fromValue,
  UpdateManager: require('./update-manager'),
  UpdatesSocket: require('./updates-via').UpdatesSocket,
  UpdatesVia: require('./updates-via').UpdatesVia,
  uri: require('./uri'),
  Util: require('./util'),
  Variable: require('./variable')
}

$rdf.IndexedFormula = $rdf.Store // Alias

$rdf.NextId = $rdf.BlankNode.nextId

$rdf.fromNT = $rdf.Formula.prototype.fromNT
$rdf.fetcher = $rdf.DataFactory.fetcher
$rdf.graph = $rdf.DataFactory.graph
$rdf.lit = $rdf.DataFactory.lit
$rdf.st = $rdf.DataFactory.st
$rdf.sym = $rdf.DataFactory.namedNode
$rdf.variable = $rdf.DataFactory.variable

// RDFJS DataFactory interface
$rdf.blankNode = $rdf.DataFactory.blankNode
$rdf.defaultGraph = $rdf.DataFactory.defaultGraph
$rdf.literal = $rdf.DataFactory.literal
$rdf.namedNode = $rdf.DataFactory.namedNode
$rdf.quad = $rdf.DataFactory.quad
$rdf.triple = $rdf.DataFactory.triple

module.exports = $rdf
