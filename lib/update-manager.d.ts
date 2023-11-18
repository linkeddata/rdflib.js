import IndexedFormula from './store';
import Fetcher, { Options } from './fetcher';
import Statement from './statement';
import RDFlibNamedNode from './named-node';
import { BlankNode, NamedNode, Quad, Quad_Subject, Term } from './tf-types';
interface UpdateManagerFormula extends IndexedFormula {
    fetcher: Fetcher;
}
type CallBackFunction = (uri: string, ok: boolean, message: string, response: Error | Response) => {} | void;
/**
* The UpdateManager is a helper object for a store.
* Just as a Fetcher provides the store with the ability to read and write,
* the Update Manager provides functionality for making small patches in real time,
* and also looking out for concurrent updates from other agents
*/
export default class UpdateManager {
    store: UpdateManagerFormula;
    ifps: {};
    fps: {};
    /** Index of objects for coordinating incoming and outgoing patches */
    patchControl: [];
    /** Object of namespaces */
    ns: any;
    /**
     * @param  store - The quadstore to store data and metadata. Created if not passed.
    */
    constructor(store?: IndexedFormula);
    patchControlFor(doc: NamedNode): any;
    isHttpUri(uri: string): boolean;
    /** Remove from the store HTTP authorization metadata
    * The editable function below relies on copies we have in the store
    * of the results of previous HTTP transactions. However, when
    * the user logs in, then that data misrepresents what would happen
    * if the user tried again.
    */
    flagAuthorizationMetadata(kb?: IndexedFormula): void;
    /**
     * Tests whether a file is editable.
     * If the file has a specific annotation that it is machine written,
     * for safety, it is editable (this doesn't actually check for write access)
     * If the file has wac-allow and accept patch headers, those are respected.
     * and local write access is determined by those headers.
     * This async version not only looks at past HTTP requests, it also makes new ones if necessary.
     *
     * @returns The method string N3PATCH or SPARQL or DAV or
     *   LOCALFILE or false if known, undefined if not known.
     */
    checkEditable(uri: string | NamedNode, kb?: IndexedFormula): Promise<string | boolean | undefined>;
    /**
     * Tests whether a file is editable.
     * If the file has a specific annotation that it is machine written,
     * for safety, it is editable (this doesn't actually check for write access)
     * If the file has wac-allow and accept patch headers, those are respected.
     * and local write access is determined by those headers.
     * This synchronous version only looks at past HTTP requests, does not make new ones.
     *
     * @returns The method string SPARQL or DAV or
     *   LOCALFILE or false if known, undefined if not known.
     */
    editable(uri: string | NamedNode, kb?: IndexedFormula): string | boolean | undefined;
    anonymize(obj: any): any;
    anonymizeNT(stmt: Quad): string;
    nTriples(stmt: any): string;
    /**
     * Returns a list of all bnodes occurring in a statement
     * @private
     */
    statementBnodes(st: Quad): BlankNode[];
    /**
     * Returns a list of all bnodes occurring in a list of statements
     * @private
     */
    statementArrayBnodes(sts: ReadonlyArray<Quad>): BlankNode[];
    /**
     * Makes a cached list of [Inverse-]Functional properties
     * @private
     */
    cacheIfps(): void;
    /**
     * Returns a context to bind a given node, up to a given depth
     * @private
     */
    bnodeContext2(x: any, source: any, depth: any): any;
    /**
     * Returns the smallest context to bind a given single bnode
     * @private
     */
    bnodeContext1(x: any, source: any): any;
    /**
     * @private
     */
    mentioned(x: any): boolean;
    /**
     * @private
     */
    bnodeContext(bnodes: any, doc: any): never[];
    /**
     * Returns the best context for a single statement
     * @private
     */
    statementContext(st: Quad): never[];
    /**
     * @private
     */
    contextWhere(context: any): string;
    /**
     * @private
     */
    fire(uri: string, query: string, callbackFunction: CallBackFunction, options?: Options): Promise<void>;
    /** return a statemnet updating function
     *
     * This does NOT update the statement.
     * It returns an object which includes
     *  function which can be used to change the object of the statement.
     */
    update_statement(statement: Quad): {
        statement: Term[] | undefined;
        statementNT: string | undefined;
        where: string;
        set_object: (obj: any, callbackFunction: any) => void;
    } | undefined;
    insert_statement(st: Quad, callbackFunction: CallBackFunction): void;
    delete_statement(st: Quad | Quad[], callbackFunction: CallBackFunction): void;
    /**
     * Requests a now or future action to refresh changes coming downstream
     * This is designed to allow the system to re-request the server version,
     * when a websocket has pinged to say there are changes.
     * If the websocket, by contrast, has sent a patch, then this may not be necessary.
     *
     * @param doc
     * @param action
     */
    requestDownstreamAction(doc: NamedNode, action: any): void;
    /**
     * We want to start counting websocket notifications
     * to distinguish the ones from others from our own.
     */
    clearUpstreamCount(doc: NamedNode): void;
    getUpdatesVia(doc: NamedNode): string | null;
    addDownstreamChangeListener(doc: NamedNode, listener: any): void;
    reloadAndSync(doc: NamedNode): void;
    /**
     * Sets up websocket to listen on
     *
     * There is coordination between upstream changes and downstream ones
     * so that a reload is not done in the middle of an upstream patch.
     * If you use this API then you get called when a change happens, and you
     * have to reload the file yourself, and then refresh the UI.
     * Alternative is addDownstreamChangeListener(), where you do not
     * have to do the reload yourself. Do mot mix them.
     *
     * kb contains the HTTP  metadata from previous operations
     *
     * @param doc
     * @param handler
     *
     * @returns {boolean}
     */
    setRefreshHandler(doc: NamedNode, handler: any): boolean;
    /**
     * This high-level function updates the local store iff the web is changed successfully.
     * Deletions, insertions may be undefined or single statements or lists or formulae (may contain bnodes which can be indirectly identified by a where clause).
     * The `why` property of each statement must be the give the web document to be updated.
     * The statements to be deleted and inserted may span more than one web document.
     * @param deletions - Statement or statements to be deleted.
     * @param insertions - Statement or statements to be inserted.
     * @returns a promise
     */
    updateMany(deletions: ReadonlyArray<Statement>, insertions?: ReadonlyArray<Statement>): Promise<void[]>;
    /**
     * @private
     *
     * This helper function constructs SPARQL Update query from resolved arguments.
     *
     * @param ds: deletions array.
     * @param is: insertions array.
     * @param bnodes_context: Additional context to uniquely identify any blank nodes.
     */
    constructSparqlUpdateQuery(ds: ReadonlyArray<Statement>, is: ReadonlyArray<Statement>, bnodes_context: any): string;
    /**
     * @private
     *
     * This helper function constructs n3-patch query from resolved arguments.
     *
     * @param ds: deletions array.
     * @param is: insertions array.
     * @param bnodes_context: Additional context to uniquely identify any blanknodes.
     */
    constructN3PatchQuery(ds: ReadonlyArray<Statement>, is: ReadonlyArray<Statement>, bnodes_context: any): string;
    /**
     * This high-level function updates the local store if the web is changed successfully.
     * Deletions, insertions may be undefined or single statements or lists or formulae (may contain bnodes which can be indirectly identified by a where clause).
     * The `why` property of each statement must be the same and give the web document to be updated.
     * @param deletions - Statement or statements to be deleted.
     * @param insertions - Statement or statements to be inserted.
     * @param callback - called as callbackFunction(uri, success, errorbody)
     *           OR returns a promise
     * @param options - Options for the fetch call
     */
    update(deletions: ReadonlyArray<Statement>, insertions: ReadonlyArray<Statement>, callback?: (uri: string | undefined | null, success: boolean, errorBody?: string, response?: Response | Error) => void, secondTry?: boolean, options?: Options): void | Promise<void>;
    updateDav(doc: Quad_Subject, ds: any, is: any, callbackFunction: any, options?: Options): null | Promise<void>;
    /**
     * Likely deprecated, since this lib no longer deals with browser extension
     *
     * @param doc
     * @param ds
     * @param is
     * @param callbackFunction
     * @param options
     */
    updateLocalFile(doc: NamedNode, ds: any, is: any, callbackFunction: any, options?: Options): void;
    /**
     * @throws {Error} On unsupported content type
     *
     * @returns {string}
     */
    serialize(uri: string, data: string | Quad[], contentType: string): string;
    /**
     * This is suitable for an initial creation of a document.
     */
    put(doc: RDFlibNamedNode, data: string | Quad[], contentType: string, callback: (uri: string, ok: boolean, errorMessage?: string, response?: unknown) => void): Promise<void>;
    /**
     * Reloads a document.
     *
     * Fast and cheap, no metadata. Measure times for the document.
     * Load it provisionally.
     * Don't delete the statements before the load, or it will leave a broken
     * document in the meantime.
     *
     * @param kb
     * @param doc {RDFlibNamedNode}
     * @param callbackFunction
     */
    reload(kb: IndexedFormula, doc: docReloadType, callbackFunction: (ok: boolean, message?: string, response?: Error | Response) => {} | void): void;
}
interface docReloadType extends NamedNode {
    reloadTimeCount?: number;
    reloadTimeTotal?: number;
}
export {};
