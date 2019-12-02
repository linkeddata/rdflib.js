import Node from './node-internal'
import Variable from './variable'
import BlankNode from './blank-node'
import Collection from './collection'
import Literal from './literal'
import NamedNode from './named-node'
import DefaultGraph from './default-graph'
import { DataFactory, SupportTable } from './data-factory-type'
import IndexedFormula from './store'
import Fetcher from './fetcher'
import Statement from './statement'

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
  NamedNode = 'NamedNode',
  BlankNode = 'BlankNode',
  Literal = 'Literal',
  Variable = 'Variable',
  DefaultGraph = 'DefaultGraph',
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
export type ValueType = TFTerm | Node | Date | string | number | boolean | undefined | null | Collection

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
export type ObjectType = NamedNode | Literal | Collection | BlankNode | Variable // | Empty
/** An RDF/JS Graph */
export type GraphType = DefaultGraph | NamedNode | Variable // | Formula

/**
 * RDF/JS taskforce Term
 * @link https://rdf.js.org/data-model-spec/#term-interface
 */
export interface TFTerm {
  termType: string
  value: string
  equals(other: TFTerm): boolean
}

/**
 * RDF/JS taskforce NamedNode
 * @link https://rdf.js.org/data-model-spec/#namednode-interface
 */
export interface TFNamedNode extends TFTerm {
  termType: NamedNodeTermType
  value: string
  equals(other: TFTerm): boolean
}

/**
 * RDF/JS taskforce Literal
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export interface TFBlankNode extends TFTerm {
  termType: BlankNodeTermType
  value: string
  equals(other: TFTerm): boolean
}

/**
 * RDF/JS taskforce Quad
 * @link https://rdf.js.org/data-model-spec/#quad-interface
 */
export interface TFQuad<
  S extends TFSubject = TFSubject,
  P extends TFPredicate = TFPredicate,
  O extends TFTerm = TFObject,
  G extends TFGraph = TFGraph
> {
  subject: S
  predicate: P
  object: O
  graph: G
  equals(other: TFQuad): boolean
}

/**
 * RDF/JS taskforce Literal
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export interface TFLiteral extends TFTerm {
  /** Contains the constant "Literal". */
  termType: LiteralTermType
  /** The text value, unescaped, without language or type (example: "Brad Pitt") */
  value: string
  /**
   * The language as lowercase BCP-47 [BCP47] string (examples: "en", "en-gb")
   * or an empty string if the literal has no language.
   */
  language: string
  /** A NamedNode whose IRI represents the datatype of the literal. */
  datatype: TFNamedNode
  equals(other: TFTerm): boolean
}

/**
 * RDF/JS taskforce Variable
 * @link https://rdf.js.org/data-model-spec/#variable-interface
 */
export interface TFVariable extends TFTerm {
  /** Contains the constant "Variable". */
  termType: VariableTermType
  /** The name of the variable without leading "?" (example: "a"). */
  value: string
  /**
   * Returns true if all general Term.equals conditions hold and term.value
   * is the same string as other.value; otherwise, it returns false.
   */
  equals(other: TFTerm): boolean
}

/**
 * RDF/JS taskforce DefaultGraph
 * An instance of DefaultGraph represents the default graph.
 * It's only allowed to assign a DefaultGraph to the graph property of a Quad.
 * @link https://rdf.js.org/data-model-spec/#defaultgraph-interface
 */
export interface TFDefaultGraph extends TFTerm {
  termType: DefaultGraphTermType;
  /** should return and empty string'' */
  value: string;
  equals(other: TFTerm): boolean
}

/**
 * RDF/JS taskforce DataFactory
 * @link https://rdf.js.org/data-model-spec/#datafactory-interface
 */
export interface TFDataFactory<
  DFNamedNode extends TFNamedNode = TFNamedNode,
  DFBlankNode extends TFBlankNode = TFBlankNode,
  DFLiteral extends TFLiteral = TFLiteral,
  DFSubject = TFSubject,
  DFPredicate = TFPredicate,
  DFObject = TFObject,
  DFGraph = TFGraph,
  DFDefaultGraph = TFDefaultGraph,
  DFQuad = TFQuad,
> {
  /** Returns a new instance of NamedNode. */
  namedNode: (value: string) => DFNamedNode,
  /**
   * Returns a new instance of BlankNode.
   * If the value parameter is undefined a new identifier for the
   * blank node is generated for each call.
   */
  blankNode: (value?: string) => DFBlankNode,
  /**
   * Returns a new instance of Literal.
   * If languageOrDatatype is a NamedNode, then it is used for the value of datatype.
   * Otherwise languageOrDatatype is used for the value of language. */
  literal: (value: string, languageOrDatatype: string | DFNamedNode) => DFLiteral,
  /** Returns a new instance of Variable. This method is optional. */
  variable?: (value: string) => TFVariable,
  /**
   * Returns an instance of DefaultGraph.
  */
  defaultGraph: () => DFDefaultGraph,
  /**
   * Returns a new instance of the specific Term subclass given by original.termType
   * (e.g., NamedNode, BlankNode, Literal, etc.),
   * such that newObject.equals(original) returns true.
   * Not implemented in RDFJS, so optional.
   */
  fromTerm?: (original: TFTerm) => TFTerm
  /**
   * Returns a new instance of Quad, such that newObject.equals(original) returns true.
   * Not implemented in RDFJS, so optional.
   */
  fromQuad?: (original: DFQuad) => DFQuad
  /**
   * Returns a new instance of Quad.
   * If graph is undefined or null it MUST set graph to a DefaultGraph.
   */
  quad: (
    subject: DFSubject,
    predicate: DFPredicate,
    object: DFObject,
    graph?: DFGraph,
  ) => DFQuad
  /**
   * This does not exist on the original RDF/JS spec
   */
  supports: SupportTable
}

export interface Bindings {
  [id: string]: TFTerm;
}

/** A RDF/JS taskforce Subject */
export type TFSubject = TFNamedNode | TFBlankNode | TFVariable
/** A RDF/JS taskforce Predicate */
export type TFPredicate = TFNamedNode | TFVariable
/** A RDF/JS taskforce Object */
export type TFObject = TFNamedNode | TFBlankNode | TFLiteral | TFVariable
/** A RDF/JS taskforce Graph */
export type TFGraph = TFNamedNode | TFDefaultGraph | TFBlankNode | TFVariable

/** All the types that a .fromValue() method might return */
export type FromValueReturns<C extends Node = any> = TFTerm | undefined | null | Collection<C>

export interface IRDFlibDataFactory extends DataFactory<NamedNode> {
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
