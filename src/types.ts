import Node from './node-internal'
import Variable from './variable'
import BlankNode from './blank-node'
import Collection from './collection'
import Literal from './literal'
import NamedNode from './named-node'
import DefaultGraph from './default-graph'
import { DataFactory } from './factories/factory-types'
import IndexedFormula from './store'
import Fetcher from './fetcher'
import Statement from './statement'
import Empty from './empty'
import { TFNamedNode, Term } from './tf-types'

/**
 * Types that support both Enums (for typescript) and regular strings
 */
export type NamedNodeTermType = "NamedNode" | TermType.NamedNode
export type BlankNodeTermType = "BlankNode" | TermType.BlankNode
export type LiteralTermType = "Literal" | TermType.Literal
export type VariableTermType = "Variable" | TermType.Variable
export type CollectionTermType = "Collection" | TermType.Collection
export type DefaultGraphTermType = "DefaultGraph" | TermType.DefaultGraph

/**
 * All the possible TermTypes
 * @todo Convert these to const enums when it's supported https://github.com/babel/babel/issues/8741
 */
export enum TermType {
  BlankNode = 'BlankNode',
  DefaultGraph = 'DefaultGraph',
  Literal = 'Literal',
  NamedNode = 'NamedNode',
  Variable = 'Variable',

  // The next ones are not specified by the rdf.js taskforce
  Collection = 'Collection',
  Empty = 'Empty',
  Graph = 'Graph',
}

/**
 * A valid mime type header
 * @todo Convert these to const enums when it's supported https://github.com/babel/babel/issues/8741
 */
export enum ContentType {
  rdfxml = "application/rdf+xml",
  turtle = "text/turtle",
  turtleLegacy = "application/x-turtle",
  n3 = "text/n3",
  n3Legacy = "application/n3",
  nTriples = "application/n-triples",
  nQuads = "application/n-quads",
  nQuadsAlt = "application/nquads",
  jsonld = "application/ld+json",
  xhtml = "application/xhtml+xml",
  html = "text/html",
  sparqlupdate = "application/sparql-update",
}

/** A type for values that serves as inputs */
export type ValueType = Term | Node | Date | string | number | boolean | undefined | null | Collection

/**
 * In this project, there exist two types for the same kind of RDF concept.
 * We have RDF/JS Taskforce types (standardized, generic), and RDFlib types (internal, specific).
 * When deciding which type to use in a function, it is preferable to accept generic inputs,
 * whenever possible, and provide strict outputs.
 * In some ways, the TF types in here are a bit more strict.
 * Variables are missing, and the statement requires specific types of terms (e.g. NamedNode instead of Term).
 */

/** An RDF/JS Subject */
export type SubjectType = BlankNode | NamedNode | Variable
/** An RDF/JS Predicate */
export type PredicateType = NamedNode | Variable
/** An RDF/JS Object */
export type ObjectType = NamedNode | Literal | Collection | BlankNode | Variable | Empty
/** An RDF/JS Graph */
export type GraphType = DefaultGraph | NamedNode | Variable // | Formula

export interface Bindings {
  [id: string]: Term;
}

/** All the types that a .fromValue() method might return */
export type FromValueReturns<C extends Node = any> = Term | undefined | null | Collection<C>

export interface IRDFlibDataFactory extends DataFactory<
  NamedNode | BlankNode | Literal | Collection | Statement
> {
  fetcher: (store: IndexedFormula, options: any) => Fetcher
  graph: (features, opts) => IndexedFormula
  lit: (val: string, lang?: string, dt?: TFNamedNode) => Literal
  st: (
    subject: SubjectType,
    predicate: PredicateType,
    object: ObjectType,
    graph?: GraphType
  ) => Statement
  triple: (
    subject: SubjectType,
    predicate: PredicateType,
    object: ObjectType
  ) => Statement
}
