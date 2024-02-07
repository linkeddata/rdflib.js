import { SupportTable } from './factories/factory-types'
import {
  BlankNodeTermType,
  DefaultGraphTermType,
  LiteralTermType,
  NamedNodeTermType,
  VariableTermType,
} from './types'

/**
 * RDF/JS spec Term
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
  equals (other: Term | null | undefined): boolean
}

/**
 * RDF/JS spec NamedNode
 * @link https://rdf.js.org/data-model-spec/#namednode-interface
 */
export interface NamedNode extends Term {
  termType: typeof NamedNodeTermType
  value: string
}

/**
 * RDF/JS spec Literal
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export interface BlankNode extends Term {
  termType: typeof BlankNodeTermType
  value: string
}

export interface BaseQuad {
  subject: Term
  predicate: Term
  object: Term
  graph: Term
}

/**
 * RDF/JS spec Quad
 * @link https://rdf.js.org/data-model-spec/#quad-interface
 */
export interface Quad<
  S extends Term = Quad_Subject,
  P extends Term = Quad_Predicate,
  O extends Term = Quad_Object,
  G extends Term = Quad_Graph
> {
  subject: S
  predicate: P
  object: O
  graph: G
  equals (other: BaseQuad): boolean
}

/**
 * RDF/JS spec Literal
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export interface Literal extends Term {
  /** Contains the constant "Literal". */
  termType: typeof LiteralTermType
  /** The text value, unescaped, without language or type (example: "Brad Pitt") */
  value: string
  /**
   * The language as lowercase BCP-47 [BCP47] string (examples: "en", "en-gb")
   * or an empty string if the literal has no language.
   */
  language: string
  /** A NamedNode whose IRI represents the datatype of the literal. */
  datatype: NamedNode
}

/**
 * RDF/JS spec Variable
 * @link https://rdf.js.org/data-model-spec/#variable-interface
 */
export interface Variable extends Term {
  /** Contains the constant "Variable". */
  termType: typeof VariableTermType
  /** The name of the variable without leading "?" (example: "a"). */
  value: string
}

/**
 * RDF/JS spec DefaultGraph
 * An instance of DefaultGraph represents the default graph.
 * It's only allowed to assign a DefaultGraph to the graph property of a Quad.
 * @link https://rdf.js.org/data-model-spec/#defaultgraph-interface
 */
export interface DefaultGraph extends Term {
  termType: typeof DefaultGraphTermType;
  /** should return and empty string'' */
  value: '';
}

/**
 * RDF/JS spec DataFactory
 *
 * Not 100% compliant due to to practicality problems.
 *
 * @link https://rdf.js.org/data-model-spec/#datafactory-interface
 */
export interface RdfJsDataFactory {
  /** Returns a new instance of NamedNode. */
  namedNode: (value: string) => NamedNode,

  /**
   * Returns a new instance of BlankNode.
   * If the value parameter is undefined a new identifier for the
   * blank node is generated for each call.
   */
  blankNode: (value?: string) => BlankNode,

  /**
   * Returns a new instance of Literal.
   * If languageOrDatatype is a NamedNode, then it is used for the value of datatype.
   * Otherwise languageOrDatatype is used for the value of language. */
  literal: (value: string, languageOrDatatype: string | NamedNode) => Literal,

  /** Returns a new instance of Variable. This method is optional. */
  variable?: (value: string) => Variable,

  /**
   * Returns an instance of DefaultGraph.
   */
  defaultGraph: () => DefaultGraph,

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
   * Returns a new instance of Quad.
   * If graph is undefined or null it MUST set graph to a DefaultGraph.
   */
  triple: (
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

/** A RDF/JS spec Subject */
export type Quad_Subject = NamedNode | BlankNode | Variable
/** A RDF/JS spec Predicate */
export type Quad_Predicate = NamedNode | Variable
/** A RDF/JS spec Object */
export type Quad_Object = NamedNode | BlankNode | Literal | Variable | Term
/** A RDF/JS spec Graph */
export type Quad_Graph = NamedNode | DefaultGraph | BlankNode | Variable
