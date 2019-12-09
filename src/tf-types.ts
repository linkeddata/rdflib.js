import { SupportTable } from './factories/factory-types'
import {
  BlankNodeTermType,
  DefaultGraphTermType,
  LiteralTermType,
  NamedNodeTermType,
  VariableTermType,
} from './types'

/**
 * RDF/JS taskforce Term
 * @link https://rdf.js.org/data-model-spec/#term-interface
 */
export interface Term {
  termType: string
  value: string

  /**
   * Compare this term with {other} for structural equality
   *
   * Note that the task force spec only allows comparison with other terms
   */
  equals (other: any): boolean
}

/**
 * RDF/JS taskforce NamedNode
 * @link https://rdf.js.org/data-model-spec/#namednode-interface
 */
export interface TFNamedNode extends Term {
  termType: NamedNodeTermType
  value: string
}

/**
 * RDF/JS taskforce Literal
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export interface TFBlankNode extends Term {
  termType: BlankNodeTermType
  value: string
}

/**
 * RDF/JS taskforce Quad
 * @link https://rdf.js.org/data-model-spec/#quad-interface
 */
export interface Quad<
  S extends Term = TFSubject,
  P extends Term = TFPredicate,
  O extends Term = TFObject,
  G extends Term = TFGraph
> {
  subject: S
  predicate: P
  object: O
  graph: G
}

/**
 * RDF/JS taskforce Literal
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export interface TFLiteral extends Term {
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
}

/**
 * RDF/JS taskforce Variable
 * @link https://rdf.js.org/data-model-spec/#variable-interface
 */
export interface TFVariable extends Term {
  /** Contains the constant "Variable". */
  termType: VariableTermType
  /** The name of the variable without leading "?" (example: "a"). */
  value: string
}

/**
 * RDF/JS taskforce DefaultGraph
 * An instance of DefaultGraph represents the default graph.
 * It's only allowed to assign a DefaultGraph to the graph property of a Quad.
 * @link https://rdf.js.org/data-model-spec/#defaultgraph-interface
 */
export interface TFDefaultGraph extends Term {
  termType: DefaultGraphTermType;
  /** should return and empty string'' */
  value: string;
}

/**
 * RDF/JS taskforce DataFactory
 *
 * Not 100% compliant due to to practicality problems.
 *
 * @link https://rdf.js.org/data-model-spec/#datafactory-interface
 */
export interface TFDataFactory {
  /** Returns a new instance of NamedNode. */
  namedNode: (value: string) => TFNamedNode,

  /**
   * Returns a new instance of BlankNode.
   * If the value parameter is undefined a new identifier for the
   * blank node is generated for each call.
   */
  blankNode: (value?: string) => TFBlankNode,

  /**
   * Returns a new instance of Literal.
   * If languageOrDatatype is a NamedNode, then it is used for the value of datatype.
   * Otherwise languageOrDatatype is used for the value of language. */
  literal: (value: string, languageOrDatatype: string | TFNamedNode) => TFLiteral,

  /** Returns a new instance of Variable. This method is optional. */
  variable?: (value: string) => TFVariable,

  /**
   * Returns an instance of DefaultGraph.
   */
  defaultGraph: () => TFDefaultGraph | TFNamedNode | TFBlankNode,

  /**
   * Returns a new instance of the specific Term subclass given by original.termType
   * (e.g., NamedNode, BlankNode, Literal, etc.),
   * such that newObject.equals(original) returns true.
   * Not implemented in RDFJS, so optional.
   */
  fromTerm?: (original: Term) => Term

  /**
   * Returns a new instance of Quad, such that newObject.equals(original) returns true.
   * Not implemented in RDFJS, so optional.
   */
  fromQuad?: (original: Quad) => Quad

  /**
   * Returns a new instance of Quad.
   * If graph is undefined or null it MUST set graph to a DefaultGraph.
   */
  quad: (
    subject: Term,
    predicate: Term,
    object: Term,
    graph?: Term,
  ) => Quad<any, any, any, any>

  /**
   * Check for specific features/behaviour on the factory.
   *
   * This does not exist on the original RDF/JS spec
   */
  supports: SupportTable
}

/** A RDF/JS taskforce Subject */
export type TFSubject = TFNamedNode | TFBlankNode | TFVariable
/** A RDF/JS taskforce Predicate */
export type TFPredicate = TFNamedNode | TFVariable
/** A RDF/JS taskforce Object */
export type TFObject = TFNamedNode | TFBlankNode | TFLiteral | TFVariable
/** A RDF/JS taskforce Graph */
export type TFGraph = TFNamedNode | TFDefaultGraph | TFBlankNode | TFVariable
