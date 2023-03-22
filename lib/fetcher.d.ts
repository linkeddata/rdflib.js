/**
 *
 * Project: rdflib.js
 *
 * @file: fetcher.js
 *
 * Description: contains functions for requesting/fetching/retracting
 *  This implements quite a lot of the web architecture.
 * A fetcher is bound to a specific quad store, into which
 * it loads stuff and into which it writes its metadata
 * @@ The metadata could be optionally a separate graph
 *
 * - implements semantics of HTTP headers, Internet Content Types
 * - selects parsers for rdf/xml, n3, rdfa, grddl
 *
 * TO do:
 * - Implement a runtime registry for parsers and serializers
 * -
 */
/**
 * Things to test: callbacks on request, refresh, retract
 *   loading from HTTP, HTTPS, FTP, FILE, others?
 * To do:
 * Firing up a mail client for mid:  (message:) URLs
 */
import IndexedFormula from './store';
import RDFlibNamedNode from './named-node';
import { ContentType } from './types';
import { BlankNode, Quad_Graph, NamedNode, Quad_Predicate, Quad_Subject } from './tf-types';
export interface FetchError extends Error {
    statusText?: string;
    status?: StatusValues;
    response?: ExtendedResponse;
}
/** An extended interface of Response, since RDFlib.js adds some properties. */
export interface ExtendedResponse extends Response {
    /** String representation of the Body */
    responseText?: string;
    /** Identifier of the reqest */
    req?: Quad_Subject;
    size?: number;
    timeout?: number;
    /** Used in UpdateManager.updateDav */
    error?: string;
}
/** tell typescript that a 'panes' child may exist on Window */
declare global {
    interface Window {
        panes?: any;
        solidFetcher?: any;
        solidFetch?: any;
    }
    var solidFetcher: Function;
    var solidFetch: Function;
}
type UserCallback = (ok: boolean, message: string, response?: any) => void;
type HTTPMethods = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'HEAD' | 'DELETE' | 'CONNECT' | 'TRACE' | 'OPTIONS';
/** All valid inputs for initFetchOptions */
export type Options = Partial<AutoInitOptions>;
/** Initiated by initFetchOptions, which runs on load */
export interface AutoInitOptions extends RequestInit {
    /** The used Fetch function */
    fetch?: Fetch;
    /**
     * Referring term, the resource which
     * referred to this (for tracking bad links).
     * The document in which this link was found.
     */
    referringTerm?: NamedNode;
    /** Provided content type (for writes) */
    contentType?: string;
    /**
     * Override the incoming header to
     * force the data to be treated as this content-type (for reads)
     */
    forceContentType?: ContentType;
    /**
     * Load the data even if loaded before.
     * Also sets the `Cache-Control:` header to `no-cache`
     */
    force?: boolean;
    /**
     * Original uri to preserve
     * through proxying etc (`xhr.original`).
     */
    baseURI: string;
    /**
     * Whether this request is a retry via
     * a proxy (generally done from an error handler)
     */
    proxyUsed?: boolean;
    actualProxyURI?: string;
    /** flag for XHR/CORS etc */
    withCredentials?: boolean;
    /** Before we parse new data, clear old, but only on status 200 responses */
    clearPreviousData?: boolean;
    /** Prevents the addition of various metadata triples (about the fetch request) to the store*/
    noMeta?: boolean;
    noRDFa?: boolean;
    handlers?: Handler[];
    timeout?: number;
    method?: HTTPMethods;
    retriedWithNoCredentials?: boolean;
    requestedURI?: string;
    resource: Quad_Subject;
    /** The serialized resource in the body*/
    original: NamedNode;
    data?: string;
    req: BlankNode;
    body?: string;
    headers: HeadersInit;
    credentials?: 'include' | 'omit';
}
declare class Handler {
    response: ExtendedResponse;
    dom: Document;
    static pattern: RegExp;
    constructor(response: ExtendedResponse, dom?: Document);
}
type StatusValues = 
/** No record of web access or record reset */
undefined | 
/** Has been requested, fetch in progress */
true | 
/** Received, OK */
'done' | 
/** Not logged in */
401 | 
/** HTTP status unauthorized */
403 | 
/** Not found, resource does not exist */
404 | 
/** In attempt to counter CORS problems retried */
'redirected' | 
/** If it did fail */
'failed' | 'parse_error' | 
/**
 * URI is not a protocol Fetcher can deal with
 * other strings mean various other errors.
 */
'unsupported_protocol' | 'timeout' | 
/** Any other HTTP status code */
number;
interface MediatypesMap {
    [id: string]: {
        'q'?: number | string;
    };
}
interface RequestedMap {
    [uri: string]: StatusValues;
}
interface TimeOutsMap {
    [uri: string]: number[];
}
interface FetchQueue {
    [uri: string]: Promise<ExtendedResponse>;
}
interface FetchCallbacks {
    [uri: string]: UserCallback[];
}
interface BooleanMap {
    [uri: string]: boolean;
}
type Result = Response;
/** Differs from normal Fetch, has an extended Response type */
type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<ExtendedResponse>;
interface CallbackifyInterface {
    fireCallbacks: Function;
}
/** Fetcher
 *
 * The Fetcher object is a helper object for a quadstore
 * which turns it from an offline store to an online store.
 * The fetcher deals with loading data files rom the web,
  * figuring how to parse them.  It will also refresh, remove, the data
  * and put back the data to the web.
 */
export default class Fetcher implements CallbackifyInterface {
    store: IndexedFormula;
    timeout: number;
    _fetch: Fetch;
    mediatypes: MediatypesMap;
    /** Denoting this session */
    appNode: NamedNode;
    /**
     * this.requested[uri] states:
     * undefined     no record of web access or records reset
     * true          has been requested, fetch in progress
     * 'done'        received, Ok
     * 401           Not logged in
     * 403           HTTP status unauthorized
     * 404           Resource does not exist. Can be created etc.
     * 'redirected'  In attempt to counter CORS problems retried.
     * 'parse_error' Parse error
     * 'unsupported_protocol'  URI is not a protocol Fetcher can deal with
     * other strings mean various other errors.
     */
    requested: RequestedMap;
    /** List of timeouts associated with a requested URL */
    timeouts: TimeOutsMap;
    /** Redirected from *key uri* to *value uri* */
    redirectedTo: Record<string, string>;
    fetchQueue: FetchQueue;
    /** fetchCallbacks[uri].push(callback) */
    fetchCallbacks: FetchCallbacks;
    /** Keep track of explicit 404s -> we can overwrite etc */
    nonexistent: BooleanMap;
    lookedUp: BooleanMap;
    handlers: Array<typeof Handler>;
    ns: {
        [k: string]: (ln: string) => Quad_Predicate;
    };
    static HANDLERS: {
        [handlerName: number]: Handler;
    };
    static CONTENT_TYPE_BY_EXT: Record<string, string>;
    static crossSiteProxyTemplate: any;
    /** Methods added by calling Util.callbackify in the constructor*/
    fireCallbacks: Function;
    constructor(store: IndexedFormula, options?: Options);
    static crossSiteProxy(uri: string): undefined | any;
    static offlineOverride(uri: string): string;
    static proxyIfNecessary(uri: string): any;
    /**
     * Tests whether the uri's protocol is supported by the Fetcher.
     * @param uri
     */
    static unsupportedProtocol(uri: string): boolean;
    /** Decide on credentials using old XXHR api or new fetch()  one
     * @param requestedURI
     * @param options
     */
    static setCredentials(requestedURI: string, options?: Options): void;
    /**
     * Promise-based load function
     *
     * Loads a web resource or resources into the store.
     *
     * A resource may be given as NamedNode object, or as a plain URI.
     * an array of resources will be given, in which they will be fetched in parallel.
     * By default, the HTTP headers are recorded also, in the same store, in a separate graph.
     * This allows code like editable() for example to test things about the resource.
     *
     * @param uri {Array<RDFlibNamedNode>|Array<string>|RDFlibNamedNode|string}
     *
     * @param [options={}] {Object}
     *
     * @param [options.fetch] {Function}
     *
     * @param [options.referringTerm] {RDFlibNamedNode} Referring term, the resource which
     *   referred to this (for tracking bad links)
     *
     * @param [options.contentType] {string} Provided content type (for writes)
     *
     * @param [options.forceContentType] {string} Override the incoming header to
     *   force the data to be treated as this content-type (for reads)
     *
     * @param [options.force] {boolean} Load the data even if loaded before.
     *   Also sets the `Cache-Control:` header to `no-cache`
     *
     * @param [options.baseURI=docuri] {Node|string} Original uri to preserve
     *   through proxying etc (`xhr.original`).
     *
     * @param [options.proxyUsed] {boolean} Whether this request is a retry via
     *   a proxy (generally done from an error handler)
     *
     * @param [options.withCredentials] {boolean} flag for XHR/CORS etc
     *
     * @param [options.clearPreviousData] {boolean} Before we parse new data,
     *   clear old, but only on status 200 responses
     *
     * @param [options.noMeta] {boolean} Prevents the addition of various metadata
     *   triples (about the fetch request) to the store
     *
     * @param [options.noRDFa] {boolean}
     *
     * @returns {Promise<Result>}
     */
    load<T extends NamedNode | string | Array<string | NamedNode>>(uri: T, options?: Options): T extends Array<string | NamedNode> ? Promise<Result[]> : Promise<Result>;
    pendingFetchPromise(uri: string, originalUri: string, options: AutoInitOptions): Promise<Result>;
    /**
     * @param _options - DEPRECATED
     */
    cleanupFetchRequest(originalUri: string, _options: any, timeout: number): void;
    initFetchOptions(uri: string, options: Options): AutoInitOptions;
    /**
     * (The promise chain ends in either a `failFetch()` or a `doneFetch()`)
     *
     * @param docuri {string}
     * @param options {Object}
     *
     * @returns {Promise<Object>} fetch() result or an { error, status } object
     */
    fetchUri(docuri: string, options: AutoInitOptions): Promise<ExtendedResponse | FetchError>;
    /**
     * Asks for a doc to be loaded if necessary then calls back
     *
     * Calling methods:
     *   nowOrWhenFetched (uri, userCallback)
     *   nowOrWhenFetched (uri, options, userCallback)
     *   nowOrWhenFetched (uri, referringTerm, userCallback, options)  <-- old
     *   nowOrWhenFetched (uri, referringTerm, userCallback) <-- old
     *
     *  Options include:
     *   referringTerm    The document in which this link was found.
     *                    this is valuable when finding the source of bad URIs
     *   force            boolean.  Never mind whether you have tried before,
     *                    load this from scratch.
     *   forceContentType Override the incoming header to force the data to be
     *                    treated as this content-type.
     *
     *  Callback function takes:
     *
     *    ok               True if the fetch worked, and got a 200 response.
     *                     False if any error happened
     *
     *    errmessage       Text error message if not OK.
     *
     *    response         The fetch Response object (was: XHR) if there was was one
     *                     includes response.status as the HTTP status if any.
     */
    nowOrWhenFetched(uriIn: string | NamedNode, p2?: UserCallback | Options, userCallback?: UserCallback, options?: Options): void;
    /**
     * Records a status message (as a literal node) by appending it to the
     * request's metadata status collection.
     *
     */
    addStatus(req: BlankNode, statusMessage: string): void;
    /**
     * Records errors in the system on failure:
     *
     *  - Adds an entry to the request status collection
     *  - Adds an error triple with the fail message to the metadata
     *  - Fires the 'fail' callback
     *  - Rejects with an error result object, which has a response object if any
     */
    failFetch(options: {
        req: BlankNode;
        original: Quad_Subject;
    } & Options, errorMessage: string, statusCode: StatusValues, response?: ExtendedResponse): Promise<FetchError>;
    linkData(originalUri: NamedNode, rel: string, uri: string, why: Quad_Graph, reverse?: boolean): void;
    parseLinkHeader(linkHeader: string, originalUri: NamedNode, reqNode: Quad_Graph): void;
    doneFetch(options: {
        req: Quad_Subject;
        original: Quad_Subject;
    } & Options, response: ExtendedResponse): Response;
    /**
     * Note two nodes are now smushed
     * If only one was flagged as looked up, then the new node is looked up again,
     * which will make sure all the URIs are dereferenced
     */
    nowKnownAs(was: Quad_Subject, now: Quad_Subject): void;
    /**
     * Writes back to the web what we have in the store for this uri
     */
    putBack(uri: NamedNode | string, options?: Options): Promise<Response>;
    webCopy(here: string, there: string, contentType: any): Promise<ExtendedResponse>;
    delete(uri: string, options?: Options): Promise<ExtendedResponse>;
    /** Create an empty resource if it really does not exist
     *  Be absolutely sure something does not exist before creating a new empty file
     * as otherwise existing could  be deleted.
     * @param doc - The resource
    */
    createIfNotExists(doc: RDFlibNamedNode, contentType?: "text/turtle", data?: string): Promise<ExtendedResponse>;
    /**
     * @param parentURI URI of parent container
     * @param folderName - Optional folder name (slug)
     * @param data - Optional folder metadata
     */
    createContainer(parentURI: string, folderName: string, data: string): Promise<Response>;
    invalidateCache(iri: string | NamedNode): void;
    /**
     * A generic web operation, at the fetch() level.
     * does not involve the quad store.
     *
     *  Returns promise of Response
     *  If data is returned, copies it to response.responseText before returning
     */
    webOperation(method: HTTPMethods, uriIn: string | NamedNode, options?: Options): Promise<ExtendedResponse>;
    /**
     * Looks up something.
     * Looks up all the URIs a things has.
     *
     * @param term - canonical term for the thing whose URI is
     *   to be dereferenced
     * @param rterm - the resource which referred to this
     *   (for tracking bad links)
     */
    lookUpThing(term: Quad_Subject, rterm: Quad_Subject): Promise<Response> | Promise<Response>[];
    /**
     * Looks up response header.
     *
     * @returns {Array|undefined} a list of header values found in a stored HTTP
     *   response, or [] if response was found but no header found,
     *   or undefined if no response is available.
     * Looks for { [] link:requestedURI ?uri; link:response [ httph:header-name  ?value ] }
     */
    getHeader(doc: NamedNode, header: string): undefined | string[];
    saveRequestMetadata(docuri: string, options: AutoInitOptions): void;
    saveResponseMetadata(response: Response, options: {
        req: BlankNode;
        resource: Quad_Subject;
    } & Options): BlankNode;
    objectRefresh(term: NamedNode): void;
    refresh(term: NamedNode, userCallback?: UserCallback): void;
    refreshIfExpired(term: NamedNode, userCallback: UserCallback): void;
    retract(term: Quad_Graph): void;
    getState(docuri: string): any;
    isPending(docuri: string): boolean;
    unload(term: NamedNode): void;
    addHandler(handler: typeof Handler): void;
    retryNoCredentials(docuri: string, options: any): Promise<Result>;
    /**
     * Tests whether a request is being made to a cross-site URI (for purposes
     * of retrying with a proxy)
     */
    isCrossSite(uri: string): boolean;
    /**
     * Called when there's a network error in fetch(), or a response
     * with status of 0.
     */
    handleError(response: ExtendedResponse | Error, docuri: string, options: AutoInitOptions): Promise<ExtendedResponse | FetchError>;
    addType(rdfType: NamedNode, req: Quad_Subject, kb: IndexedFormula, locURI: string): void;
    /**
     * Handle fetch() response
     */
    handleResponse(response: ExtendedResponse, docuri: string, options: AutoInitOptions): Promise<FetchError | ExtendedResponse> | ExtendedResponse;
    saveErrorResponse(response: ExtendedResponse, responseNode: Quad_Subject): Promise<void>;
    handlerForContentType(contentType: string, response: ExtendedResponse): Handler | null;
    guessContentType(uri: string): ContentType | undefined;
    normalizedContentType(options: AutoInitOptions, headers: Headers): ContentType | string | null;
    /**
     * Sends a new request to the specified uri. (Extracted from `onerrorFactory()`)
     */
    redirectToProxy(newURI: string, options: AutoInitOptions): Promise<ExtendedResponse | FetchError>;
    setRequestTimeout(uri: string, options: {
        req: Quad_Subject;
        original: Quad_Subject;
    } & Options): Promise<number | FetchError>;
    addFetchCallback(uri: string, callback: UserCallback): void;
    acceptString(): string;
}
export {};
