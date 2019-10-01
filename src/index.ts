import BlankNode from './blank-node'
import Collection from './collection'
import * as convert from './convert'
import DataFactory from './data-factory'
import Empty from './empty'
import Fetcher from './fetcher'
import Formula from './formula'
import Store from './store'
import jsonParser from './jsonparser'
import Literal from './literal'
import log from './log'
import N3Parser from './n3parser'
import NamedNode from './named-node'
import Namespace from './namespace'
import Node from './node'
import parse from './parse'
import { Query } from './query'
import queryToSPARQL from './query-to-sparql'
import RDFaProcessor from './rdfaparser'
import RDFParser from './rdfxmlparser'
import serialize from './serialize'
import Serializer from './serializer'
import SPARQLToQuery from './sparql-to-query'
import sparqlUpdateParser from './patch-parser'
import Statement from './statement'
import UpdateManager from './update-manager'
import { UpdatesSocket } from './updates-via'
import { UpdatesVia } from './updates-via'
import * as uri from './uri'
import * as Util from './util'
import Variable from './variable'

const NextId = BlankNode.nextId

const { fromNT } = Formula.prototype;

const {
  fetcher,
  graph,
  lit,
  st,
  namedNode,
  variable,
  blankNode,
  defaultGraph,
  literal,
  quad,
  triple,
} = DataFactory

const { fromValue: term } = Node

export {
  BlankNode,
  Collection,
  convert,
  DataFactory,
  Empty,
  Fetcher,
  Formula,
  Store,
  jsonParser,
  Literal,
  log,
  N3Parser,
  NamedNode,
  Namespace,
  Node,
  parse,
  Query,
  queryToSPARQL,
  RDFaProcessor,
  RDFParser,
  serialize,
  Serializer,
  SPARQLToQuery,
  sparqlUpdateParser,
  Statement,
  term,
  UpdateManager,
  UpdatesSocket,
  UpdatesVia,
  uri,
  Util,
  Variable,

  Store as IndexedFormula, // Alias

  NextId,

  fromNT,
  fetcher,
  graph,
  lit,
  st,
  namedNode as sym,

  // RDFJS DataFactory interface
  blankNode,
  defaultGraph,
  literal,
  namedNode,
  quad,
  triple,
  variable,
}
