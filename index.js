var $rdf = {
  BlankNode: require('./src/blank-node'),
  Collection: require('./src/collection'),
  convert: require('./src/convert'),
  DataFactory: require('./src/data-factory'),
  Empty: require('./src/empty'),
  Fetcher: require('./src/fetcher'),
  Formula: require('./src/formula'),
  IndexedFormula: require('./src/indexed-formula'),
  jsonParser: require('./src/jsonparser'),
  Literal: require('./src/literal'),
  log: require('./src/log'),
  N3Parser: require('./src/n3parser'),
  NamedNode: require('./src/named-node'),
  Namespace: require('./src/namespace'),
  Node: require('./src/node'),
  parse: require('./src/parse'),
  Query: require('./src/query').Query,
  queryToSPARQL: require('./src/query-to-sparql'),
  RDFaProcessor: require('./src/rdfaparser'),
  RDFParser: require('./src/rdfxmlparser'),
  serialize: require('./src/serialize'),
  Serializer: require('./src/serializer'),
  SPARQLToQuery: require('./src/sparql-to-query'),
  sparqlUpdateParser: require('./src/patch-parser'),
  Statement: require('./src/statement'),
  term: require('./src/node').fromValue,
  UpdateManager: require('./src/update-manager'),
  UpdatesSocket: require('./src/updates-via').UpdatesSocket,
  UpdatesVia: require('./src/updates-via').UpdatesVia,
  uri: require('./src/uri'),
  Util: require('./src/util'),
  Variable: require('./src/variable')
}

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
$rdf.literal = $rdf.DataFactory.literal
$rdf.namedNode = $rdf.DataFactory.namedNode
$rdf.quad = $rdf.DataFactory.quad
$rdf.triple = $rdf.DataFactory.triple

module.exports = $rdf
