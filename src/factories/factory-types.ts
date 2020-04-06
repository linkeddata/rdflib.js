import Literal from '../literal'
import Statement from '../statement'
import NamedNode from '../named-node'
import BlankNode from '../blank-node'
import Variable from '../variable'
import DefaultGraph from '../default-graph'
import {
  BlankNode as TFBlankNode,
  RdfJsDataFactory,
  Literal as TFLiteral,
  NamedNode as TFNamedNode,
  Quad,
  Term,
  Variable as TFVariable,
} from '../tf-types'

export type Comparable = Term | TFNamedNode | TFBlankNode | TFLiteral | Quad | undefined | null

export type DefaultFactoryTypes = NamedNode | BlankNode | Literal | Variable | Statement

export type Indexable = number | string

export type Namespace = (term:string) => TFNamedNode

/** A set of features that may be supported by a Data Factory */
export type SupportTable = Record<Feature, boolean>

export type TFIDFactoryTypes = TFNamedNode | TFBlankNode | TFLiteral | Quad | TFVariable | Term

export enum Feature {
  /** Whether the factory supports termType:Collection terms */
  collections = "COLLECTIONS",
  /** Whether the factory supports termType:DefaultGraph terms */
  defaultGraphType = "DEFAULT_GRAPH_TYPE",
  /** Whether the factory supports equals on produced instances */
  equalsMethod = "EQUALS_METHOD",
  /** Whether the factory can create a unique idempotent identifier for the given term. */
  id = "ID",
  /**
   * Whether the factory will return the same instance for subsequent calls.
   * This implies `===`, which means methods like `indexOf` can be used.
   */
  identity = "IDENTITY",
  /** Whether the factory supports mapping ids back to instances (should adhere to the identity setting) */
  reversibleId = "REVERSIBLE_ID",
  /** Whether the factory supports termType:Variable terms */
  variableType = "VARIABLE_TYPE",
}

/**
 * Defines a DataFactory as used in rdflib, based on the RDF/JS: Data model specification,
 * but with additional extensions
 *
 * bnIndex is optional but useful.
 */
export interface DataFactory<
  FactoryTypes = DefaultFactoryTypes,
  IndexType = Indexable
> extends RdfJsDataFactory {
  /**
   * BlankNode index
   * @private
  */
  bnIndex?: number

  supports: SupportTable

  namedNode(value: string): NamedNode

  blankNode(value?: string): BlankNode

  literal(value: string, languageOrDatatype?: string | TFNamedNode): Literal

  variable(value: string): Variable,

  defaultGraph(): DefaultGraph,

  isQuad(obj: any): obj is Statement

  equals(a: Comparable, b: Comparable): boolean

  toNQ(term: Term | FactoryTypes): string

  quad(
    subject: Term,
    predicate: Term,
    object: Term,
    graph?: Term,
  ): Statement;

  quadToNQ(term: Statement | Quad): string

  termToNQ(term: Term): string

  /**
   * Generates a unique session-idempotent identifier for the given object.
   *
   * @example NQ serialization (reversible from value)
   * @example MD5 hash of termType + value (irreversible from value, map needed)
   *
   * @return {Indexable} A unique value which must also be a valid JS object key type.
   */
  id(obj: Term | FactoryTypes): IndexType
}
