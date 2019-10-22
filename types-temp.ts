// This is a Temporary file to help with the migration to typescript.
// See issue: https://github.com/linkeddata/rdflib.js/issues/355
// Migrate these types and comments to the according files, then remove them from this list.
// Don't import types from this file.
// When you do want to use a type from this file, move it to `./types.ts`
// And import it here.

import {
    Bindings,
    ValueType,
} from './src/types'
import { NamedNode } from './src'

// Type definitions for rdflib 0.20
// Project: http://github.com/linkeddata/rdflib.js
// Definitions by: Cénotélie <https://github.com/cenotelie>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.0
// Acknowledgements: This work has been financed by Logilab SA, FRANCE, logilab.fr

export namespace log {
  /**
   * Logs a debug event
   * @param x The event
   */
  function debug(x: any): void;
  /**
   * Logs a warning event
   * @param x The event
   */
  function warn(x: any): void;
  /**
   * Logs an information event
   * @param x The event
   */
  function info(x: any): void;
  /**
   * Logs an error event
   * @param x The event
   */
  function error(x: any): void;
  /**
   * Logs a success event
   * @param x The event
   */
  function success(x: any): void;
  /**
   * Logs a message event
   * @param x The event
   */
  function msg(x: any): void;
}

export namespace convert {
  /**
   * Converts an n3 string to JSON
   * @param n3String The n3 string
   * @param jsonCallback Callback when the operation terminated
   */
  function convertToJson(
      n3String: string,
      jsonCallback: (err: string, jsonString: string) => void
  ): void;
  /**
   * Converts an n3 string to n-quads
   * @param n3String The n3 string
   * @param nquadCallback Callback when the operation terminated
   */
  function convertToNQuads(
      n3String: string,
      nquadCallback: (err: string, nquadString: string) => void
  ): void;
}

export class Query {
         pat: IndexedFormula;
         name: string;
         id?: string;
         constructor(name: string, id?: any);
     }

export namespace Util {
  /**
   * Gets a named node for a media type
   * @param mediaType A media type
   */
  function mediaTypeClass(mediaType: string): NamedNode;
  /**
   * Gets a named node from the name of a relation
   * @param relation The name of a relation
   */
  function linkRelationProperty(relation: string): NamedNode;
  /**
   * Loads ontologies of the data we load (this is the callback from the kb to
   * the fetcher). Exports as `AJAR_handleNewTerm`
   * @param kb The store
   * @param p A property
   * @param requestedBy
   */
  function AJAR_handleNewTerm(
      kb: Formula,
      p: NamedNode,
      requestedBy: string
  ): Promise<any>;
}
/**
* A datatype-specific handler for fetching data
*/
export interface Handler {
  response: any;
  dom: any;
}
export interface FetchOptions {
  fetch?: typeof fetch;
  /**
   * The resource which referred to this (for tracking bad links).
   */
  referringTerm?: NamedNode;
  /**
   * Provided content type (for writes).
   */
  contentType?: string;
  /**
   * Override the incoming header to force the data to be treated as this content-type (for reads).
   */
  forceContentType?: string;
  /**
   * Load the data even if loaded before. Also sets the `Cache-Control:` header to `no-cache`.
   */
  force?: boolean;
  /**
   * Original uri to preserve through proxying etc (`xhr.original`).
   */
  baseUri?: Node | string;
  /**
   * Whether this request is a retry via a proxy (generally done from an error handler).
   */
  proxyUsed?: boolean;
  /**
   * Flag for XHR/CORS etc
   */
  withCredentials?: boolean;
  /**
   * Before we parse new data, clear old, but only on status 200 responses.
   */
  clearPreviousData?: boolean;
  /**
   * Prevents the addition of various metadata triples (about the fetch request) to the store.
   */
  noMeta?: boolean;
  noRDFa?: boolean;
}
/**
* Responsible for fetching RDF data
*/
export class Fetcher {
  store: any;
  timeout: number;
  appNode: BlankNode;
  requested: {
      [uri: string]: any;
  };
  timeouts: any;
  redirectedTo: any;
  constructor(store: any, options: any);
  static HANDLERS: {
      RDFXMLHandler: Handler;
      XHTMLHandler: Handler;
      XMLHandler: Handler;
      HTMLHandler: Handler;
      TextHandler: Handler;
      N3Handler: Handler;
  };
  static CONTENT_TYPE_BY_EXT: {
      [ext: string]: string;
  };
  /**
   * Loads a web resource or resources into the store.
   * @param uri Resource to load, provided either as a NamedNode object or a plain URL. If multiple resources are passed as an array, they will be fetched in parallel.
   */
  load: (uri: ReadonlyArray<NamedNode> | ReadonlyArray<string> | NamedNode | string, options?: FetchOptions) => Promise<Response>;
}
/**
* Gets a node for the specified input
* @param value An input value
*/
export function term(value: ValueType): Node | Collection | ValueType;
/**
* Gets a namespace
* @param nsuri The URI for the namespace
*/
export function Namespace(nsuri: string): (ln: string) => NamedNode;
/**
* Transforms an NTriples string format into a Node.
* The bnode bit should not be used on program-external values; designed
* for internal work such as storing a bnode id in an HTML attribute.
* This will only parse the strings generated by the vaious toNT() methods.
* @param str A string representation
*/
export function fromNT(str: string): Node;
/**
* Creates a new fetcher
* @param store The store to use
* @param options The options
*/
export function fetcher(store: Formula, options: any): Fetcher;
/**
* Creates a new graph (store)
*/
export function graph(): IndexedFormula;
/**
* Creates a new literal node
* @param val The lexical value
* @param lang The language
* @param dt The datatype
*/
export function lit(val: string, lang: string, dt: NamedNode): Literal;
/**
* Creates a new statement
* @param subject The subject
* @param predicate The predicate
* @param object The object
* @param graph The containing graph
*/
export function st(
  subject: Node | Date | string,
  predicate: Node,
  object: Node | Date | string,
  graph: Node
): Statement;
/**
* Creates a new named node
* @param value The new named node
*/
export function sym(value: string): NamedNode;
/**
* Creates a new variable
* @param name The name for the variable
*/
export function variable(name: string): Variable;
/**
* Creates a new blank node
* @param value The blank node's identifier
*/
export function blankNode(value: string): BlankNode;
/**
* Gets the default graph
*/
export function defaultGraph(): DefaultGraph;
/**
* Creates a new literal node
* @param value The lexical value
* @param languageOrDatatype Either the language or the datatype
*/
export function literal(
  value: string,
  languageOrDatatype: string | NamedNode
): Literal;
/**
* Creates a new named node
* @param value The new named node
*/
export function namedNode(value: string): NamedNode;

/**
* Creates a new statement
* @param subject The subject
* @param predicate The predicate
* @param object The object
*/
export function triple(subject: Node, predicate: Node, object: Node): Statement;
/**
* Parse a string and put the result into the graph kb.
* Normal method is sync.
* Unfortunately jsdonld is currently written to need to be called async.
* Hence the mess below with executeCallback.
* @param str The input string to parse
* @param kb The store to use
* @param base The base URI to use
* @param contentType The content type for the input
* @param callback The callback to call when the data has been loaded
*/
export function parse(
  str: string,
  kb: Formula,
  base: string,
  contentType: string,
  callback: (error: any, kb: Formula) => void
): void;
/**
* Get the next available unique identifier
*/
export let NextId: number;
