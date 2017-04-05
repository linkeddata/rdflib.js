
export = rdflib

declare namespace rdflib {
  export type Nodeable = string | Node | (string | Node | Object)[]

  /**
   * Blank node class. Contains the incremental unique id.
   * 
   * @export
   * @class BlankNode
   * @extends {Node}
   */
  export class BlankNode extends Node {
    static nextId: number;
    static readonly termType: string;
    static readonly NTAnonymousNodePrefix: string;
    readonly classOrder: number;
    readonly isBlank: number;
    isVar: number;
    id: number;
    termType: string;
    value: string;
    constructor(id?: string);
    /**
     * Compare this with another terms.
     * Returns 0 if equals, +1 or -1 comparing in order class order and id
     * 
     * @param {Node} other 
     * @returns {number} 
     * 
     * @memberOf BlankNode
     */
    compareTerm(other: Node): number;
    copy(formula: IndexedFormula): BlankNode;
    toCanonical(): string;
    toString(): string;
    sameTerm(other: Node): boolean;
  }

  /**
   * Collection class. Represent a collection of terms
   * 
   * @export
   * @class Collection
   * @extends {Node}
   */
  export class Collection extends Node {
    static nextId: number;
    termType: string;
    classOrder: number;
    isVar: number;
    elements: Node[];
    id: any;
    closed: boolean;
    /**
     * Creates an instance of Collection.
     * @param {Node[]} [initial] An optional list of terms
     * 
     * @memberOf Collection
     */
    constructor(initial?: (string | Node | object)[]);
    append(element: any): number;
    close(): boolean;
    shift(): Node;
    substitute(bindings: any): Collection;
    toNT(): string;
    toString(): string;
    unshift(element: any): number;
  }

  /**
   * Takes a n3 string, converts it to json and pass the results to the given callback
   * 
   * @export
   * @param {string} n3String 
   * @param {(err: any, jsonString: string) => void} jsonCallback 
   */
  export function convertToJson(n3String: string, jsonCallback: (err: any, jsonString: string) => void): void;
  /**
   *  Takes a n3 string, converts it to nquad and pass the results to the given callback
   * 
   * @export
   * @param {string} n3String 
   * @param {(err: any, nquadString: string) => void} nquadCallback 
   */
  export function convertToNQuads(n3String: string, nquadCallback: (err: any, nquadString: string) => void): void;

  export namespace DataFactory {
    export function blankNode(value: string): BlankNode;
    export function collection(elements: any): Collection;
    export function defaultGraph(): DefaultGraph;
    export function fetcher(store: NamedNode | string, timeout?: number, async?: boolean): Fetcher;
    export function graph(): IndexedFormula;
    export function lit(val: string, lang: string, dt: string): Literal;
    export function literal(value: string, languageOrDatatype?: any): Literal;
    export function namedNode(iri: string): NamedNode;
    export function quad(subject: Nodeable, predicate: Nodeable, object: Nodeable, graph?: Nodeable): Statement;
    export function st(subject: Nodeable, predicate: Nodeable, object: Nodeable, graph: Nodeable): Statement;
    export function triple(subject: Nodeable, predicate: Nodeable, object: Nodeable): Statement;
    export function variable(name: string): Variable;
  }

  /**
   * The default graph class, to be used in quads.
   * 
   * @export
   * @class DefaultGraph
   * @extends {Node}
   */
  export class DefaultGraph extends Node {
    constructor();
    toCanonical(): string;
    toString(): string;
  }

  /**
   * Empty node class.
   * 
   * @export
   * @class Empty
   * @extends {Node}
   */
  export class Empty extends Node {
    static termType: string;
    /**
     * Singleton subclass of an empty Collection.
     */
    constructor();
    toString(): string;
  }

  /**
   * Fetcher class. Used for xhr operations, allows to retrieve remote data
   * 
   * @export
   * @class Fetcher
   */
  export class Fetcher {
    static crossSiteProxyTemplate: any;
    static crossSiteProxy(uri: any): any;
    Parsable: {
      'text/n3': boolean;
      'text/turtle': boolean;
      'application/rdf+xml': boolean;
      'application/xhtml+xml': boolean;
      'text/html': boolean;
      'application/ld+json': boolean;
    };
    thisURI: string;
    timeout: number;
    async: boolean;
    appNode: any;
    store: IndexedFormula;
    requested: any;
    redirectedTo: any;
    fetchCallbacks: any;
    nonexistant: any;
    lookedUp: Object;
    handlerList: any[];
    handlers: any[];
    mediatypes: Object;
    crossSiteProxyTemplate: any;

    /**
     * Creates an instance of Fetcher.
     * @param {IndexedFormula} store The store where the fetched data will be stored.
     * @param {number} [timeout] Maximum time the fetcher will wait for a response on an http request.
     * @param {boolean} [async] Flag for asynchronous behaviour. Default at true.
     * 
     * @memberOf Fetcher
     */
    constructor(store: IndexedFormula, timeout?: number, async?: boolean);
    fireCallbacks(a: any, b: any): void;
    addHandler(handler: any): void;
    switchHandler(name: any, xhr: any, cb: any, args?: any): void;
    addStatus(req: any, status: any): void;
    failFetch(xhr: any, status: any): any;
    linkData(xhr: any, rel: any, uri: any, why: any, reverse?: any): void;
    parseLinkHeader(xhr: any, thisReq: any): void;
    doneFetch(xhr: any): void;
    /** Note two nodes are now smushed
     **
     ** If only one was flagged as looked up, then
     ** the new node is looked up again, which
     ** will make sure all the URIs are dereferenced
     */
    nowKnownAs(was: any, now: any): void;
    putBack(uri: any, options: any): Promise<{}>;
    webOperation(method: any, uri: any, options?: any): Promise<{}>;
    webCopy(here: any, there: any, content_type: any): Promise<{}>;
    lookUpThing(term: any, rterm: any, options?: any, oneDone?: any, allDone?: any): number;
    /**
     * Promise-based load function
     * 
     * @param {*} uri 
     * @param {*} [options] 
     * @returns {*} 
     * 
     * @memberOf Fetcher
     */
    /**
     * Look up response header
     * 
     * @param {string} uri 
     * @param {*} [options] 
     * @returns {*} a list of header values found in a stored HTTP response or [] if response was found but no header found or undefined if no response is available.
     * 
     * @memberOf Fetcher
     */
    public load(uri: string, options?: any): any;
    public nowOrWhenFetched(uri: string|Node, p2: any, userCallback: any, options?: any): void;
    getHeader(doc: any, header: any): any[];
    proxyIfNecessary(uri: any): any;
    saveRequestMetadata(xhr: any, kb: any, docuri: any): any;
    saveResponseMetadata(xhr: any, kb: any): any;
    /** 
     * Requests a document URI and arranges to load the document.
     * 	@param docuri  term for the thing whose URI is to be dereferenced
     *  @param rterm  the resource which refered to this (for tracking bad links)
     *  @param options 
     *  [force] Load the data even if loaded before 
     *  - [withCredentials]  flag for XHR/CORS etc
     *  @param userCallback  Called with (true) or (false, errorbody, {status: 400}) after load is done or failed
     *  @returns value
     *	    The xhr object for the HTTP access
     *      null if the protocol is not a look-up protocol,
     *              or URI has already been loaded
     */
    requestURI(docuri: string, rterm: any, options: any, userCallback: (resolved: boolean, errorbody: string, status: Object) => void): any;
    objectRefresh(term: any): void;
    unload(term: any): void;
    refresh(term: any, userCallback?: any): void;
    retract(term: any): void;
    getState(docuri: any): any;
    isPending(docuri: any): boolean;
  }

  export class Formula extends Node {
    static termType: string;
    readonly classOrder: number;
    readonly isVar: number;
    readonly ns: typeof Namespace;
    termType: any;
    value: any;
    statements: Statement[];
    constraints: any;
    initBindings: any;
    optional: any;
    redirections: any;
    /**
     *   A formula of a set of RDF statements, triples.
     *
     *    (The triples are actually instances of StoredStatement.)
     *    Other systems such as jena and redland use the term "Model" for Formula.
     *    For rdflib, this is known as a TripleStore.
     *    Cwm and N3 extend RDF to allow a literal formula as an item in a triple.
     *
     *    A formula is either open or closed.  Initially, it is open. In this
     *    state is may be modified - for example, triples may be added to it.
     *    When it is closed, note that a different interned version of itself
     *    may be returned. From then on it is a constant.
     *
     *    Only closed formulae may be mentioned in statements in other formuale.
     *
     *    There is a reopen() method but it is not recommended, and if desperate should
     *    only be used immediately after a close().
     *
     */
    constructor(statements?: Statement[], constraints?: any, initBindings?: any, optional?: any);
    add(s: any, p: any, o: any, g?: any): number;
    addStatement(st: any): number;
    bnode(id?: any): BlankNode;
    collection(): Collection;
    equals(other: any): boolean;
    /**
     * Transforms an NTriples string format into a Node.
     * The bnode bit should not be used on program-external values; designed
     * for internal work such as storing a bnode id in an HTML attribute.
     * This will only parse the strings generated by the vaious toNT() methods.
     */
    fromNT(str: any): any;
    list(values: any): Collection;
    literal(val: any, lang?: any, dt?: any): Literal;
    /**
     * transform a collection of NTriple URIs into their URI strings
     * @param t some iterable colletion of NTriple URI strings
     * @return a collection of the URIs as strings
     * todo: explain why it is important to go through NT
     */
    NTtoURI(t: any): {};
    substitute(bindings: any): Formula;
    sym(uri: any, name?: any): NamedNode;
    toString(): string;
  }


  /**
   * A triple store
   * 
   * @export
   * @class IndexedFormula
   * @extends {Formula}
   */
  export class IndexedFormula extends Formula {
    static handleRDFType(formula: any, subj: any, pred: any, obj: any, why: any): boolean;
    propertyActions: any;
    classActions: any;
    redirections: any;
    aliases: any;
    HTTPRedirects: any;
    subjectIndex: Statement[][];
    predicateIndex: Statement[][];
    objectIndex: Statement[][];
    whyIndex: Statement[][];
    index: Statement[][][];
    namespaces: any;
    features: any;
    _existentialvariables: any;
    fetcher: any;
    predicateCallback: any;
    _universalvariables: any;

    /**
     * Creates an instance of IndexedFormula.
     * @param [features] - 
     * @param {Statement[]} [statements] - An array of statements 
     * 
     */
    constructor(features?: any, statements?: Statement[]);
    substitute(bindings: any): IndexedFormula;
    applyPatch(patch: any, target: any, patchCallback: any): void;
    declareExistential(x: any): any;
    initPropertyActions(features: any): void;
    /**
     * Adds a triple to the store.
     * Returns the statement added
     * (would it be better to return the original formula for chaining?)
     */
    add(subj: Node | String | Object, pred?: Node | String | Object, obj?: Node | String | Object, why?: any): any;
    addAll(statements: Statement[]): void;
    any(s?: Node | String | Object, p?: Node | String | Object, o?: Node | String | Object, g?: Node | String | Object): any;
    anyValue(s: Node | String | Object, p: Node | String | Object, o: Node | String | Object, g: NamedNode | string): any;
    anyStatementMatching(subj?: Node | String | Object, pred?: Node | String | Object, obj?: Node | String | Object, why?: any): any;

    /**
     * Returns the symbol with canonical URI as smushed
     */
    canon(term: any): any;
    check(): void;
    /**
     * Self-consistency checking for diagnostis only
     * Is each statement properly indexed?
     */
    checkStatementList(sts: any, from?: any): void;
    close(): this;
    /**
     * replaces @template with @target and add appropriate triples (no triple
     * removed)
     * one-direction replication
     * @method copyTo
     */
    copyTo(template: any, target: any, flags?: Array<'two-direction'>): void;
    /**
     * simplify graph in store when we realize two identifiers are equivalent
     * We replace the bigger with the smaller.
     */
    equate(u1: any, u2: any): boolean;
    formula(features?: any): IndexedFormula;
    /**
     * Returns the number of statements contained in this IndexedFormula.
     * (Getter proxy to this.statements).
     * Usage:
     *    ```
     *    let kb = rdf.graph()
     *    kb.length  // -> 0
     *    ```
     * @return {Number}
     */
    readonly length: number;
    /**
     * Returns any quads matching the given arguments.
     * Standard RDFJS Taskforce method for Source objects, implemented as an
     * alias to `statementsMatching()`
     * @method match
     * @param subject {Node|String|Object} 
     * @param predicate {Node|String|Object}
     * @param object {Node|String|Object}
     * @param graph {NamedNode|String}
     */
    match(subject?: Node | String | Object, predicate?: Node | String | Object, object?: Node | String | Object, graph?: NamedNode | string): any;
    /**
     * Find out whether a given URI is used as symbol in the formula
     */
    mentionsURI(uri: any): boolean;
    newExistential(uri: any): any;
    newPropertyAction(pred: any, action: any): boolean;
    newUniversal(uri: any): NamedNode;
    Variable(name: any): Variable;
    /**
     * Find an unused id for a file being edited: return a symbol
     * (Note: Slow iff a lot of them -- could be O(log(k)) )
     */
    nextSymbol(doc: any): NamedNode;
    query(myQuery: any, callback: any, fetcher: any, onDone: any): any;
    /**
     * Finds a statement object and removes it
     */
    remove(st: any): any;
    /**
     * Removes all statemnts in a doc
     */
    removeDocument(doc: any): this;
    /**
     * remove all statements matching args (within limit) *
     */
    removeMany(subj: any, pred: any, obj: any, why: any, limit?: any): void;
    removeMatches(subject: any, predicate: any, object: any, why: any): this;
    /**
     * Remove a particular statement object from the store
     *
     * st    a statement which is already in the store and indexed.
     *      Make sure you only use this for these.
     *    Otherwise, you should use remove() above.
     */
    removeStatement(st: any): this;
    removeStatements(sts: any): this;
    /**
     * Replace big with small, obsoleted with obsoleting.
     */
    replaceWith(big: any, small: any): boolean;
    /**
     * Return all equivalent URIs by which this is known
     */
    allAliases(x: any): any;
    /**
     * Compare by canonical URI as smushed
     */
    sameThings(x: any, y: any): boolean;
    setPrefixForURI(prefix: any, nsuri: any): void;
    /**
      * Return statements matching a pattern. Use undefined as wildcard 
      * ALL CONVENIENCE LOOKUP FUNCTIONS RELY ON THIS!
      * @method match
      * @param subject The subject
      * @param predicate The predicate
      * @param object The object
      * @param why The graph this triple belongs to
      */
    statementsMatching(subject?: Node | String | Object, predicate?: Node | String | Object, object?: Node | String | Object, why?: any, justOne?: any): any;
    /**
     *  A list of all the URIs by which this thing is known
     */
    uris(term: any): any[];
    whether(s: any, p: any, o: any, g: any): any;
    /**
    * Finds the types in the list which have no *stored* supertypes
    * We exclude the universal class, owl:Things and rdf:Resource, as it is
    * information-free.
    */
    topTypeURIs(types: any): any;
    /**
     * RDFS Inference
     * These are hand-written implementations of a backward-chaining reasoner
     * over the RDFS axioms.
     * @param seeds {Object} a hash of NTs of classes to start with
     * @param predicate The property to trace though
     * @param inverse trace inverse direction
     */
    transitiveClosure(seeds: any, predicate: any, inverse: any): {};
    each(s: any, p?: any, o?: any, g?: any): any[];
    /**
     * Finds the types in the list which have no *stored* subtypes
     * These are a set of classes which provide by themselves complete
     * information -- the other classes are redundant for those who
     * know the class DAG.
     */
    bottomTypeURIs(types: any): any;
    /**
     * For thisClass or any subclass, anything which has it is its type
     * or is the object of something which has the type as its range, or subject
     * of something which has the type as its domain
     * We don't bother doing subproperty (yet?)as it doesn't seeem to be used
     * much.
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * @return a hash of URIs
     */
    findMembersNT(thisClass: any): any;
    findMemberURIs(subject: any): {};
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a superclass
     * Returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */
    findSubClassesNT(subject: any): {};
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a subclass
     * Returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */
    findSuperClassesNT(subject: any): {};
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * todo: This will loop is there is a class subclass loop (Sublass loops are
     * not illegal)
     * Returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */
    findTypesNT(subject: any): {};
    findTypeURIs(subject: any): {};
    connectedStatements(subject: any, doc: any, excludePredicateURIs?: any): any[];
    holds(s: any, p?: any, o?: any, g?: any): any;
    holdsStatement(st: any): any;
    serialize(base: any, contentType: any, provenance: any): any;
    the(s: any, p?: any, o?: any, g?: any): any;
    uniqueUri: number;
    getUniqueUri(): string;
  }

  export function jsonParser(data: any, source: any, store: IndexedFormula): void;

  /**
   * Literal class. Contains static methods for booleans, dates, numbers, strings.
   *  
   * @export
   * @class Literal
   * @extends {Node}
   */
  export class Literal extends Node {
    static termType: string;
    /**
     * @method fromBoolean
     * @static
     * @param value {Boolean}
     * @return {Literal}
     */
    static fromBoolean(value: boolean): Literal;
    /**
     * @method fromDate
     * @static
     * @param value {Date}
     * @return {Literal}
     */
    static fromDate(value: any): Literal;
    /**
     * @method fromNumber
     * @static
     * @param value {Number}
     * @return {Literal}
     */
    static fromNumber(value: any): Literal;
    /**
     * @method fromValue
     * @param value
     * @return {Literal}
     */
    static fromValue(value: any): any;
    classOrder: number;
    datatype: NamedNode;
    lang: string;
    isVar: number;
    constructor(value: any, language?: any, datatype?: any);
    copy(): Literal;
    equals(other: any): boolean;
    language: string;
    toNT(): string;
    toString(): string;
  }

  export let logger: {
    debug: (x: any) => void;
    warn: (x: any) => void;
    info: (x: any) => void;
    error: (x: any) => void;
    success: (x: any) => void;
    msg: (x: any) => void;
  }


  /**
   * Class for the n3 parser. Load n3 files/string into the given formula
   * 
   * @export
   * @class N3Parser
   */
  export class N3Parser {
    RDFSink_forSomeSym: string;
    RDFSink_forAllSym: string;
    Logic_NS: string;
    RDF_type_URI: string;
    DAML_sameAs_URI: string;
    ADDED_HASH: string;
    LOG_implies_URI: string;
    INTEGER_DATATYPE: string;
    FLOAT_DATATYPE: string;
    DECIMAL_DATATYPE: string;
    DATE_DATATYPE: string;
    DATETIME_DATATYPE: string;
    BOOLEAN_DATATYPE: string;
    option_noregen: number;
    _notQNameChars: string;
    _notNameChars: string;
    _rdfns: string;
    N3CommentCharacter: string;
    eol: RegExp;
    eof: RegExp;
    ws: RegExp;
    signed_integer: RegExp;
    number_syntax: RegExp;
    datetime_syntax: RegExp;
    digitstring: RegExp;
    interesting: RegExp;
    langcode: RegExp;
    _bindings: any;
    _flags: any;
    _store: any;
    source: any;
    lines: number;
    statementCount: number;
    startOfLine: number;
    previousLine: number;
    _genPrefix: any;
    keywords: any;
    keywordsSet: number;
    _anonymousNodes: any;
    _variables: any;
    _parentVariables: any;
    _reason: any;
    _reason2: any;
    _thisDoc: any;
    _baseURI: any;
    _formula: any;
    _context: any;
    _parentContext: any;
    details: any;

    /**
     * Creates an instance of N3Parser.
     * 
     * @param {IndexedFormula} The target store 
     * @param {*} [openFormula] 
     * @param {*} [thisDoc] 
     * @param {*} [baseURI] 
     * @param {*} [genPrefix] 
     * @param {*} [metaURI] 
     * @param {*} [flags] 
     * @param {*} [why] 
     * 
     * @memberOf N3Parser
     */
    constructor(store: IndexedFormula, openFormula?: any, thisDoc?: any, baseURI?: any, genPrefix?: any, metaURI?: any, flags?: any, why?: any);
    why_BecauseOfData(doc: any, reason: any): any;
    hexify(str: any): string;
    ord(str: any): any;
    string_find(str: any, s: any): any;
    assertFudge(condition: any, desc?: any): void;
    stringFromCharCode(uesc: any): string;
    uripath_join(base: any, given: any): any;
    becauseSubexpression: any;
    diag_tracking: number;
    diag_chatty_flag: number;
    diag_progress: (str: any, ...obj: any[]) => void;
    __SyntaxError(details: any): void;
    here(i: any): string;
    formula(): any;
    loadStream(stream: any): any;
    loadBuf(buf: any): any;
    feed(octets: any): void;
    directiveOrStatement(str: any, h: any): any;
    /**
     *Check for keyword.  Space must have been stripped on entry and
     * we must not be at end of file.
     */
    tok(tok: any, str: any, i: any): any;
    directive(str: any, i: any): any;
    bind(qn: any, uri: any): void;
    setKeywords(k: any): void;
    startDoc(): void;
    endDoc(): any;
    makeStatement(quad: any): void;
    statement(str: any, i: any): any;
    subject(str: any, i: any, res: any): any;
    verb(str: any, i: any, res: any): any;
    prop(str: any, i: any, res: any): any;
    item(str: any, i: any, res: any): any;
    blankNode(uri: any): any;
    path(str: any, i: any, res: any): any;
    anonymousNode(ln: any): any;
    node(str: any, i: any, res: any, subjectAlready?: any): any;
    property_list(str: any, i: any, subj: any): any;
    /**
    * return value: -1 bad syntax; >1 new position in str
    *  res has things found appended
    *
    *   Used to use a final value of the function to be called, e.g. this.bareWord
    *   but passing the function didn't work fo js converion pyjs
    */
    commaSeparatedList(str: any, j: any, res: any, ofUris: any): any;
    objectList: (str: any, i: any, res: any) => any;
    checkDot(str: any, i: any): any;
    uri_ref2(str: any, i: any, res: any): any;
    skipSpace(str: any, i: any): any;
    variable(str: any, i: any, res: any): any;
    bareWord(str: any, i: any, res: any): any;
    qname(str: any, i: any, res: any): any;
    object(str: any, i: any, res: any): any;
    nodeOrLiteral(str: any, i: any, res: any): any;
    strconst(str: any, i: any, delim: any): any;
    uEscape(str: any, i: any, startline: any): any;
    UEscape(str: any, i: any, startline: any): any;
    toString: () => string;
    Utf8: {
      encode: (string: any) => string;
      decode: (utftext: any) => string;
    };
  }

  export class NamedNode extends Node {
    static fromValue(value: Nodeable): Node;
    termType: string;
    classOrder: number;
    isVar: number;
    /**
     * @Class Node
     * @param iri {String}
     */
    constructor(iri: string);
    /**
     * Returns an $rdf node for the containing directory, ending in slash.
     */
    dir(): NamedNode;
    /**
     * Returns an NN for the whole web site, ending in slash.
     * Contrast with the "origin" which does NOT have a trailing slash
     */
    site(): NamedNode;
    doc(): NamedNode;
    toString(): string;
    /**
     * Legacy getter and setter alias, node.uri
     */
    uri: any;
  }

  export function Namespace(nsuri: any): (ln: any) => NamedNode;

  export abstract class Node {
    /**
     * Creates an RDF Node from a native javascript value.
     * RDF Nodes are returned unchanged, undefined returned as itself.
     * @method fromValue
     * @static
     * @param value {Node|Date|String|Number|Boolean|Undefined}
     * @return {Node|Collection}
     */
    static fromValue(value: string | Node | any[]): Node;
    classOrder: any;
    value: any;
    termType: any;
    /**
     * The superclass of all RDF Statement objects
     * @class Node
     */
    constructor();
    substitute(bindings: any): Node;
    compareTerm(other: any): number;
    equals(other: any): boolean;
    hashString(): string;
    sameTerm(other: any): boolean;
    toCanonical(): string;
    toNT(): string;
    abstract toString(): any;
  }

  export function parse(str: any, kb: any, base: any, contentType: any, callback?: any): void;

  /**
   * Query class, for tracking queries the user has in the UI.
   */
  export class Query {
    pat: any;
    vars: any;
    name: any;
    id: any;
    constructor(name?: any, id?: any);
  }
  /**
   * This function will match a pattern to the current kb
   *
   * The callback function is called whenever a match is found
   * When fetcher is supplied this will be called to satisfy any resource requests
   * currently not in the kb. The fetcher function needs to be defined manualy and
   * should call $rdf.Util.AJAR_handleNewTerm to process the requested resource.
   *
   * @param	myQuery,	a knowledgebase containing a pattern to use as query
   * @param	callback, 	whenever the pattern in myQuery is met this is called with
   * 						the new bindings as parameter
   * @param	fetcher,	whenever a resource needs to be loaded this gets called  IGNORED OBSOLETE
   *                              f.fetecher is used as a Fetcher instance to do this.
   * @param       onDone          callback when
   */
  export function indexedFormulaQuery(myQuery: any, callback: any, fetcher: any, onDone: any): void;

  export function queryToSPARQL(query: any): string;

  export class RDFaProcessor {
    static readonly XMLLiteralURI: string;
    static readonly HTMLLiteralURI: string;
    static readonly PlainLiteralURI: string;
    static readonly objectURI: string;
    static readonly typeURI: string;
    static readonly nameChar: string;
    static readonly nameStartChar: string;
    static NCNAME: RegExp;
    static readonly dateTimeTypes: {
      pattern: RegExp;
      type: string;
    }[];
    options: any;
    kb: any;
    target: any;
    blankNodes: any;
    htmlOptions: any;
    theOne: any;
    language: any;
    vocabulary: any;
    blankCounter: any;
    langAttributes: any;
    inXHTMLMode: any;
    inHTMLMode: any;
    absURIRE: any;
    finishedHandlers: any;
    constructor(kb: any, options: any);
    addTriple(origin: any, subject: any, predicate: any, object: any): void;
    ancestorPath(node: any): string;
    copyMappings(mappings: any): {};
    copyProperties(): void;
    deriveDateTimeType(value: any): string;
    newBlankNode(): string;
    newSubjectOrigin(origin: any, subject: any): void;
    parseCURIE(value: any, prefixes: any, base: any): any;
    parseCURIEOrURI(value: any, prefixes: any, base: any): any;
    parsePredicate(value: any, defaultVocabulary: any, terms: any, prefixes: any, base: any, ignoreTerms?: any): any;
    parsePrefixMappings(str: any, target: any): void;
    static parseRDFaDOM(dom: any, kb: any, base: any): void;
    parseSafeCURIEOrCURIEOrURI(value: any, prefixes: any, base: any): any;
    parseTermOrCURIEOrAbsURI(value: any, defaultVocabulary: any, terms: any, prefixes: any, base: any): any;
    parseTermOrCURIEOrURI(value: any, defaultVocabulary: any, terms: any, prefixes: any, base: any): any;
    parseURI(uri: any): any;
    process(node: any, options?: any): void;
    push(parent: any, subject: any): {
      parent: any;
      subject: any;
      parentObject: any;
      incomplete: any[];
      listMapping: any;
      language: any;
      prefixes: any;
      terms: any;
      vocabulary: any;
    };
    resolveAndNormalize(base: any, uri: any): any;
    setContext(node: any): void;
    setHTMLContext(): void;
    setInitialContext(): void;
    setXHTMLContext(): void;
    setXMLContext(): void;
    tokenize(str: any): any;
    toRDFNodeObject(x: any): any;
    trim(str: any): any;
  }

  /**
   * Class of the rdf parser.
   * 
   * @export
   * @class RDFParser
   */
  export class RDFParser {
    /** Standard namespaces that we know how to handle @final
     *  @member RDFParser
     */
    static ns: {
      'RDF': string;
      'RDFS': string;
    };
    /** DOM Level 2 node type magic numbers @final
     *  @member RDFParser
     */
    static nodeType: {
      'ELEMENT': number;
      'ATTRIBUTE': number;
      'TEXT': number;
      'CDATA_SECTION': number;
      'ENTITY_REFERENCE': number;
      'ENTITY': number;
      'PROCESSING_INSTRUCTION': number;
      'COMMENT': number;
      'DOCUMENT': number;
      'DOCUMENT_TYPE': number;
      'DOCUMENT_FRAGMENT': number;
      'NOTATION': number;
    };
    /** Our triple store reference @private */
    store: any;
    bnodes: {};
    why: any;
    reify: boolean;
    base: any;
    constructor(store: IndexedFormula);
    /**
     * Frame class for namespace and base URI lookups
     * Base lookups will always resolve because the parser knows
     * the default base.
     *
     * @private
     */
    frameFactory(parser: any, parent?: any, element?: any): {
      'NODE': number;
      'ARC': number;
      'parent': any;
      'parser': any;
      'store': any;
      'element': any;
      'lastChild': number;
      'base': any;
      'lang': any;
      'node': any;
      'nodeType': any;
      'listIndex': number;
      'rdfid': any;
      'datatype': any;
      'collection': boolean;
      'terminateFrame': () => void;
      'addSymbol': (type: any, uri: any) => void;
      'loadTriple': () => void;
      'isTripleToLoad': () => boolean;
      'addNode': (uri: any) => void;
      'addCollection': () => void;
      'addCollectionArc': () => void;
      'addBNode': (id: any) => void;
      'addArc': (uri: any) => void;
      'addLiteral': (value: any) => void;
    };
    getAttributeNodeNS(node: any, uri: any, name: any): any;
    /**
     * Build our initial scope frame and parse the DOM into triples
     * @param {DOMTree} document The DOM to parse
     * @param {String} base The base URL to use
     * @param {Object} why The context to which this resource belongs
     */
    parse(document: any, base: any, why: any): boolean;
    parseDOM(frame: any): void;
    /**
     * Cleans out state from a previous parse run
     * @private
     */
    cleanParser(): void;
    /**
     * Builds scope frame
     * @private
     */
    buildFrame(parent: any, element?: any): {
      'NODE': number;
      'ARC': number;
      'parent': any;
      'parser': any;
      'store': any;
      'element': any;
      'lastChild': number;
      'base': any;
      'lang': any;
      'node': any;
      'nodeType': any;
      'listIndex': number;
      'rdfid': any;
      'datatype': any;
      'collection': boolean;
      'terminateFrame': () => void;
      'addSymbol': (type: any, uri: any) => void;
      'loadTriple': () => void;
      'isTripleToLoad': () => boolean;
      'addNode': (uri: any) => void;
      'addCollection': () => void;
      'addCollectionArc': () => void;
      'addBNode': (id: any) => void;
      'addArc': (uri: any) => void;
      'addLiteral': (value: any) => void;
    };
  }


  /**
   * Returns the serialized content of the given store.
   * 
   * @export
   * @param  target 
   * @param kb 
   * @param base 
   * @param contentType 
   * @param [callback] 
   * @returns {string}
   */
  export function serialize(target: NamedNode, kb: IndexedFormula, base: string, contentType: string, callback?: (err: Error, result: string) => void, options?: Object): string;

  /**
   * Class of the serializer. Allow the serialization of a store into an n3 string
   * 
   * @class Serializer
   */
  class Serializer {
    flags: any;
    base: any;
    namespaces: any;
    namespacesUsed: any;
    keywords: any;
    prefixchars: any;
    incoming: any;
    formulas: any;
    store: any;
    prefixes: {
      [name: string]: string;
    };
    defaultNamespace: any;
    predMap: {};
    validPrefix: any;
    forbidden1: any;
    forbidden3: any;
    constructor(store: IndexedFormula);
    setBase(base: any): this;
    setFlags(flags: any): this;
    toStr(x: any): any;
    fromStr(s: any): any;
    suggestPrefix(prefix: any, uri: any): void;
    suggestNamespaces(namespaces: any): this;
    checkIntegrity(): void;
    makeUpPrefix(uri: any): any;
    rootSubjects(sts: any): {
      roots: any[];
      subjects: {};
      rootsHash: {};
      incoming: {};
    };
    toN3(f: any): string;
    _notQNameChars: string;
    _notNameChars: string;
    explicitURI(uri: any): string;
    statementsToNTriples(sts: any): string;
    statementsToN3(sts: any): string;
    stringToN3(str: string, flags?: any): string;
    symbolToN3(x: any): any;
    writeStore(write: any): void;
    statementsToXML(sts: any): string;
    private atomicTermToN3(expr, stats?);
    private prefixDirectives();
    hexify(str: string): string;
    backslashUify(str: string): void;
    private subjectTree(subject, stats);
    private propertyTree(subject, stats);
    private objectTree(obj, stats, force?);
    private statementListToTree(statements);
    termToN3(expr: any, stats: any): any;
  }

  /**
   * @SPARQL: SPARQL text that is converted to a query object which is returned.
   * @testMode: testing flag. Prevents loading of sources.
   */
  export function SPARQLToQuery(SPARQL: any, testMode: any, kb: any): false | Query;

  /**
   * Statements class.
   * 
   * @export
   * @class Statement
   * @extends {Node}
   */
  export class Statement extends Node {
    subject: Node;
    predicate: Node;
    object: Node;
    why: any;
    constructor(subject: Nodeable, predicate: Nodeable, object: Nodeable, graph: Nodeable);
    graph: any;
    equals(other: any): any;
    substitute(bindings: any): Statement;
    toCanonical(): string;
    toNT(): string;
    toString(): string;
  }

  export function sparqlUpdateParser(str: string, kb: IndexedFormula, base: string): {};

  /**
   * Returns a new node from a string, a node or an array
   * 
   * @export
   * @param value 
   * @returns {Node} 
   */
  export function term(value?: string | Node | (string | Node | Object)[]): Node

  export class UpdateManager {
    store: IndexedFormula;
    ifps: {};
    fps: {};
    ns: any;
    patchControl: any[];
    constructor(store: any);
    patchControlFor(doc: any): any;
    editable(uri: any, kb: any): false | "LOCALFILE" | "SPARQL" | "DAV";
    anonymize(obj: any): any;
    anonymizeNT(stmt: any): string;
    _statement_bnodes(st: any): any[];
    _statement_array_bnodes(sts: any): any[];
    _cache_ifps(): void;
    _bnode_context2(x: any, source: any, depth: any): any;
    _bnode_context_1(x: any, source: any): any;
    _mentioned(x: any): boolean;
    _bnode_context(bnodes: any, doc: any): any[];
    _statement_context(st: any): any[];
    _context_where(context: any): string;
    _fire(uri: any, query: any, callback: any): void;
    update_statement(statement: any): {
      statement: any[];
      statementNT: string;
      where: string;
      set_object: (obj: any, callback: any) => void;
    };
    insert_statement(st: any, callback: any): void;
    delete_statement(st: any, callback: any): void;
    requestDownstreamAction(doc: any, action: any): void;
    clearUpstreamCount(doc: any): void;
    getUpdatesVia(doc: any): any;
    addDownstreamChangeListener(doc: any, listener: any): void;
    reloadAndSync(doc: any): void;
    setRefreshHandler(doc: any, handler: any): boolean;
    update(deletions: any, insertions: any, callback: any): any;
    put(doc: any, data: any, content_type: any, callback: any): void;
    reload(kb: any, doc: any, callback: any): void;
    oldReload(kb: any, doc: any, callback: any): void;
  }

  export class UpdatesSocket {
    parent: any;
    via: any;
    connected: boolean;
    pending: {};
    subscribed: {};
    socket: any;
    constructor(parent: any, via: any);
    _decode(q: any): any;
    _send(method: any, uri: any, data: any): any;
    _subscribe(uri: any): any;
    onClose(e: any): {};
    onError(e: any): void;
    onMessage(e: any): any;
    onOpen(e: any): any;
    subscribe(uri: any): any;
  }

  export class UpdatesVia {
    fetcher: any;
    graph: any;
    via: any;
    constructor(fetcher: any);
    onHeaders(d: any): boolean;
    onUpdate(uri: any, d: any): any;
    register(via: any, uri: any): any;
  }

  export let uri: {
    docpart: (uri: any) => any;
    document: (x: any) => NamedNode;
    hostpart: (u: any) => string;
    join: (given: any, base: any) => any;
    protocol: (uri: any) => any;
    refTo: (base: any, uri: any) => any;
  }

  export let Util: {
    uri: {
      docpart: (uri: any) => any;
      document: (x: any) => NamedNode;
      hostpart: (u: any) => string;
      join: (given: any, base: any) => any;
      protocol: (uri: any) => any;
      refTo: (base: any, uri: any) => any;
    }

    logger: {
      debug: (x: any) => void;
      warn: (x: any) => void;
      info: (x: any) => void;
      error: (x: any) => void;
      success: (x: any) => void;
      msg: (x: any) => void;
    }

    mediaTypeClass: (mediaType: any) => NamedNode;
    /**
     * Loads ontologies of the data we load (this is the callback from the kb to
     * the fetcher). s as `AJAR_handleNewTerm`
     */
    ajarHandleNewTerm: (kb: any, p: any, requestedBy: any) => void;
    /**
     * s as `ArrayIndexOf`.
     */
    ArrayIndexOf: (arr: any, item: any, index?: any) => any;
    /**
     * Adds callback ality to an object.
     * Callback s are indexed by a 'hook' string.
     * They return true if they want to be called again.
     * @method callbackify
     * @param obj {Object}
     * @param callbacks {Array<>}
     */
    callbackify: (obj: any, callbacks: any) => void;
    /**
     * Returns a DOM parser based on current runtime environment.
     * s as `DOMParserFactory`
     */
    DomParserFactory: () => any;
    domToString: (node: any, options: any) => string;
    dumpNode: (node: any, options?: any, selfClosing?: any, skipAttributes?: any) => string;
    /**
     * Returns a hashmap of HTTP headers and their values.
     * @@ Bug: Assumes that each header only occurs once.
     * Also note that a , in a header value is just the same as having two headers.
     */
    getHTTPHeaders: (xhr: any) => {};
    /**
     * Compares statements (heavy comparison for repeatable canonical ordering)
     */
    heavyCompare: (x: any, y: any, g: any, uriMap: any) => any;
    heavyCompareSPO: (x: any, y: any, g: any, uriMap: any) => any;
    /**
     * Defines a simple debugging 
     * @method output
     * @param o {String}
     */
    output: (o: any) => void;
    /**
     * Returns a DOM from parsex XML.
     */
    parseXML: (str: any, options?: any) => any;
    /**
     * Removes all statements equal to x from a
     */
    RdfArrayRemove: (a: any, x: any) => void;
    /**
     * C++, python style %s -> subs
     */
    stringTemplate: (base: any, subs: any) => string;
    stackString: (e: any) => string;
    /**
     * Finds the variables in a graph (shallow).
     * Note: UNUSED.
     */
    /**
     * Returns an XMLHttpRequest object for the appropriate current runtime
     * environment. s as `XMLHTTPFactory`
     */
    xhr: () => any;
  }


  /**
   * Variables are placeholders used in patterns to be matched.
   * In cwm they are symbols which are the formula's list of quantified variables.
   * In sparql they are not visibly URIs.  Here we compromise, by having
   * a common special base URI for variables. Their names are uris,
   * but the ? notation has an implicit base uri of 'varid:'
   * @class Variable
   */
  export class Variable extends Node {
    static termType: string;
    static classOrder: number;
    static isVar: number;
    base: any;
    uri: any;
    constructor(name?: string);
    equals(other: any): boolean;
    hashString(): string;
    substitute(bindings: {
      [name: string]: Node;
    }): any;
    toString(): string;
  }

  /**
   * Returns an unique id (for this instance of rdflib)
   * 
   * @export
   * @returns {number} 
   */
  export function NextId(): number

  /**
   * Returns a new store populated with the content of the provided NT string
   * 
   * @export
   * @param arg 
   * @returns {IndexedFormula} 
   */
  export function fromNT(NTstring: string): IndexedFormula

  /**
   * Returns a new (unique) blank node. 
   * 
   * @export
   * @param {string} [value] The id of the node (sensitive to the current instance)
   * @returns {BlankNode} 
   */
  export function blankNode(value?: string): BlankNode;

  /**
   * Returns a collection containing the given elements.
   * 
   * @export
   * @param {((Node | String | Object)[])} elements An array of element that will be included in this collection
   * @returns {Collection} 
   */
  export function collection(elements: (Node | String | Object)[]): Collection;

  /**
   * Returns the default graph object (to be used as a 4th arguments for quads)
   * 
   * @export
   * @returns {DefaultGraph} 
   */
  export function defaultGraph(): DefaultGraph;

  /**
   * Returns an instance of Fetcher bound to the given store
   * @param {IndexedFormula} store The store where the fetched data will be stored.
   * @param {number} [timeout] Maximum time the fetcher will wait for a response on an http request.
   * @param {boolean} [async] Flag for asynchronous behaviour. Default at true.
   * 
   * @memberOf Fetcher
   */
  export function fetcher(store: IndexedFormula, timeout?: number, async?: boolean): Fetcher;

  /**
   * Returns a new indexed formula(a triple store)
   * @export
   * @returns {IndexedFormula} 
   */
  export function graph(): IndexedFormula;

  /**
   * Returns a new literal for the given value
   * 
   * @export
   * @param {string} value Content of the literal term
   * @param {string} [lang] Language tag
   * @param {string} [dt] datatype tag
   * @returns {Literal} 
   */
  export function lit(value: string, lang?: string, dt?: string): Literal;

  /**
   * Returns a new literal for the given value
   * 
   * @export
   * @param {string} value 
   * @param [languageOrDatatype] 
   * @returns {Literal} 
   */
  export function literal(value: string, languageOrDatatype?: string | Node | Object): Literal;

  /**
   * Returns a new a named node from an iri
   * 
   * @export
   * @param iri An absolute iri (whitespaces not allowed) 
   * @returns {NamedNode} 
   */
  export function namedNode(iri: string): NamedNode;

  /**
   * Returns a new Statement
   * 
   * @export
   * @param subject 
   * @param predicate 
   * @param object 
   * @param [graph] Defaults to DefaultGraph
   * @returns {Statement} 
   */
  export function quad(subject: Nodeable, predicate: Nodeable, object: Nodeable, graph?: Nodeable): Statement;

  /**
   * Returns a new statement
   * 
   * @export
   * @param  subject 
   * @param  predicate 
   * @param  object 
   * @param {Formula} [graph] 
   * @returns {Statement} 
   */
  export function st(subject: Nodeable, predicate: Nodeable, object: Nodeable, graph?: Formula): Statement;

  /**
   * Returns a new statement
   * 
   * @export
   * @param subject 
   * @param predicate 
   * @param object 
   * @returns {Statement} 
   */
  export function triple(subject: Nodeable, predicate: Nodeable, object: Nodeable): Statement;

  /**
   * Returns a new variable. 
   * 
   * @export
   * @param [name] Optional id of the variable 
   * @returns {Variable} 
   */
  export function variable(name?: string): Variable;

  /**
   * Returns a new a named node from an iri
   * Alias for NamedNode
   * 
   * @export
   * @param iri An absolute iri (whitespaces not allowed) 
   * @returns {NamedNode} 
   */
  export function sym(iri: string): NamedNode
}
