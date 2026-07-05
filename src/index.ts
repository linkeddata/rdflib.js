import { IRDFlibDataFactory } from './types'

import BlankNode from './blank-node'
import Collection from './collection'
import Empty from './empty'
import Fetcher from './fetcher'
import Formula from './formula'
import Store from './store'
import Literal from './literal'
import log from './log'
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
import * as Util from './utils-js'
import Variable from './variable'
import DataFactory from './factories/rdflib-data-factory'

// Prepare bound versions of data factory methods for export
const boundDataFactory = {} as IRDFlibDataFactory
for (const name in DataFactory) {
  if (typeof DataFactory[name] === 'function')
    boundDataFactory[name] = DataFactory[name].bind(DataFactory);
}
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
} = boundDataFactory

const formula = new Formula();
const fromNT = str => formula.fromNT(str);

const term = Node.fromValue

// TODO: this export is broken;
// it exports the _current_ value of nextId, which is always 0
const NextId = BlankNode.nextId

/**
 * @deprecated The hand-rolled N3 parser was removed in rdflib 3.0 in favour
 * of N3.js. This stub only exists to fail loudly with a pointer: use
 * `parse(text, store, base, contentType)` (or the `n3` package directly)
 * instead. Calling or constructing it always throws.
 */
function N3Parser (): never {
  throw new Error(
    'N3Parser was removed in rdflib 3.0; use parse(text, store, base, contentType) or the n3 package directly'
  )
}

export * from './utils/terms'
export { isTrue, literalToBoolean, literalToNumber } from './utils/literalValue'
export type { AutoInitOptions, ExtendedResponse, FetchError } from './fetcher'
export type { ParseOptions } from './parse'
export {
  BlankNode,
  Collection,
  DataFactory,
  Empty,
  Fetcher,
  Formula,
  Store,
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
export { termValue } from './utils/termValue'

export class ConnectedStore extends Store {

  fetcher: Fetcher;

  constructor (features) {
    super(features)
    this.fetcher = new Fetcher(this, {})
  }
}

export class  LiveStore extends ConnectedStore {

  updater: UpdateManager;
  
  constructor (features) {
    super(features)
    this.updater = new UpdateManager(this)
  }
}
