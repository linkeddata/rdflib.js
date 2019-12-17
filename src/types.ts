import Node from './node-internal'
import RDFlibVariable from './variable'
import RDFlibBlankNode from './blank-node'
import Collection from './collection'
import RDFlibLiteral from './literal'
import RDFlibNamedNode from './named-node'
import RDFlibDefaultGraph from './default-graph'
import { DataFactory } from './factories/factory-types'
import IndexedFormula from './store'
import Fetcher from './fetcher'
import Statement from './statement'
import Empty from './empty'
import { NamedNode, Term } from './tf-types'

export const NamedNodeTermType = "NamedNode" as const
export const BlankNodeTermType = "BlankNode" as const
export const LiteralTermType = "Literal" as const
export const VariableTermType = "Variable" as const
export const DefaultGraphTermType = "DefaultGraph" as const
// Non-RDF/JS types:
export const CollectionTermType = "Collection" as const
export const EmptyTermType = "Empty" as const
export const GraphTermType = "Graph" as const

export type TermType = typeof NamedNodeTermType
  | typeof BlankNodeTermType
  | typeof LiteralTermType
  | typeof VariableTermType
  | typeof DefaultGraphTermType
  | typeof CollectionTermType
  | typeof EmptyTermType
  | typeof GraphTermType

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
export type SubjectType = RDFlibBlankNode | RDFlibNamedNode | RDFlibVariable
/** An RDF/JS Predicate */
export type PredicateType = RDFlibNamedNode | RDFlibVariable
/** An RDF/JS Object */
export type ObjectType = RDFlibNamedNode | RDFlibLiteral | Collection | RDFlibBlankNode | RDFlibVariable | Empty
/** An RDF/JS Graph */
export type GraphType = RDFlibDefaultGraph | RDFlibNamedNode | RDFlibVariable // | Formula

export interface Bindings {
  [id: string]: Term;
}

/** All the types that a .fromValue() method might return */
export type FromValueReturns<C extends Node = any> = Term | undefined | null | Collection<C>

export interface IRDFlibDataFactory extends DataFactory<
  RDFlibNamedNode | RDFlibBlankNode | RDFlibLiteral | Collection | Statement
> {
  fetcher: (store: IndexedFormula, options: any) => Fetcher
  graph: (features, opts) => IndexedFormula
  lit: (val: string, lang?: string, dt?: NamedNode) => RDFlibLiteral
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
