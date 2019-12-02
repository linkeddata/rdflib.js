import {
  TFNamedNode,
  TFBlankNode,
  TFLiteral,
  TFQuad,
  TFTerm,
  TFVariable,
  TFDataFactory,
} from './types'
import Literal from './literal'
import Statement from './statement'
import NamedNode from './named-node'
import BlankNode from './blank-node'

export type DefaultFactoryTypes = NamedNode | BlankNode | Literal | Statement

/**
 * Defines a DataFactory as used in rdflib, based on the RDF/JS: Data model specification,
 * but with additional extensions
 * bnIndex is optional but useful.
 */
export interface DataFactory<
  FactoryTypes = DefaultFactoryTypes,
  IndexType = Indexable
> extends TFDataFactory {
  /**
   * BlankNode index
   * @private
  */
  bnIndex?: number

  supports: SupportTable

  literal(value: string, languageOrDatatype?: string | TFNamedNode): Literal

  isQuad(obj: any): obj is Statement

  equals(a: Comparable, b: Comparable): boolean

  toNQ(term: FactoryTypes): string

  /**
   * Generates a unique session-idempotent identifier for the given object.
   *
   * @example NQ serialization (reversible from value)
   * @example MD5 hash of termType + value (irreversible from value, map needed)
   *
   * @return {Indexable} A unique value which must also be a valid JS object key type.
   */
  id(obj: FactoryTypes): IndexType
}

export type TFIDFactoryTypes = TFNamedNode | TFBlankNode | TFLiteral | TFQuad | TFVariable | TFTerm

export type Namespace = (term:string) => TFNamedNode
export type NamespaceCreator = (ns: string) => Namespace

/** A set of features that may be supported by a Data Factory */
export type SupportTable = Record<Feature, boolean>

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

export type Comparable = TFNamedNode | TFBlankNode | TFLiteral | TFQuad | undefined | null

export type Indexable = number | string
