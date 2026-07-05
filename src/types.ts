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
import { NamedNode, Term, Quad_Subject, Quad_Predicate, Quad_Object, Quad_Graph } from './tf-types'

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

export const HTMLContentType = "text/html" as const
export const JSONLDContentType = "application/ld+json" as const
export const N3ContentType = "text/n3" as const
export const N3LegacyContentType = "application/n3" as const
export const NQuadsAltContentType = "application/nquads" as const
export const NQuadsContentType = "application/n-quads" as const
export const NTriplesContentType = "application/n-triples" as const
export const RDFXMLContentType = "application/rdf+xml" as const
export const SPARQLUpdateContentType = "application/sparql-update" as const
export const SPARQLUpdateSingleMatchContentType = "application/sparql-update-single-match" as const
export const TrigContentType = "application/trig" as const
export const TurtleContentType = "text/turtle" as const
export const TurtleLegacyContentType = "application/x-turtle" as const
export const XHTMLContentType = "application/xhtml+xml" as const

/**
 * A jsonld.js documentLoader: resolves a (context) URL to a remote document.
 * See https://github.com/digitalbazaar/jsonld.js#custom-document-loader
 */
export type JsonLdDocumentLoader = (
  url: string,
  options?: unknown
) => Promise<{
  /** The retrieved document, parsed */
  document: unknown
  /** The final URL of the document, after redirects */
  documentUrl?: string
  /** A context URL found in an HTTP Link header, if any */
  contextUrl?: string | null
}>

/**
 * Options accepted by the JSON-LD parser (and threaded through `parse()` for
 * `application/ld+json` input).
 */
export interface JsonLdParserOptions {
  /**
   * Loader used to resolve remote `@context` URLs. When omitted, remote
   * context fetching is REFUSED: parsing untrusted JSON-LD must not trigger
   * outbound network requests (SSRF). Pass a loader (e.g. jsonld.js's
   * `documentLoaders.node()` or one backed by your own fetch policy) to opt
   * in.
   */
  documentLoader?: JsonLdDocumentLoader
  /**
   * A context to expand the input document with, for documents whose context
   * is supplied out-of-band (JSON-LD API `expandContext`).
   */
  expandContext?: unknown
}

/**
 * A valid mime type header
 */
export type ContentType = typeof RDFXMLContentType
  | typeof HTMLContentType
  | typeof JSONLDContentType
  | typeof N3ContentType
  | typeof N3LegacyContentType
  | typeof NQuadsAltContentType
  | typeof NQuadsContentType
  | typeof NTriplesContentType
  | typeof SPARQLUpdateContentType
  | typeof SPARQLUpdateSingleMatchContentType
  | typeof TrigContentType
  | typeof TurtleContentType
  | typeof TurtleLegacyContentType
  | typeof XHTMLContentType

/** A type for values that serves as inputs */
export type ValueType = Term | Node | Date | string | number | boolean | undefined | null | Collection

/**
 * In this project, there exist two types for the same kind of RDF concept.
 * We have RDF/JS spec types (standardized, generic), and RDFlib types (internal, specific).
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
  lit: (val: string, lang?: string, dt?: NamedNode) => RDFlibLiteral
  graph: (features?, opts?) => IndexedFormula
  st: (
    subject: Quad_Subject,
    predicate: Quad_Predicate,
    object: Quad_Object,
    graph?: Quad_Graph
  ) => Statement
}
