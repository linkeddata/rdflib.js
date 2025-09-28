import { defaultGraphURI } from './factories/canonical-data-factory';
import Formula, { FormulaOpts } from './formula';
import Node from './node';
import Variable from './variable';
import { Query } from './query';
import UpdateManager from './update-manager';
import { Bindings } from './types';
import Statement from './statement';
import NamedNode from './named-node';
import Fetcher from './fetcher';
import { Quad_Graph, NamedNode as TFNamedNode, Quad_Object, Quad_Predicate, Quad, Quad_Subject, Term } from './tf-types';
import BlankNode from './blank-node';
type FeaturesType = Array<('sameAs' | 'InverseFunctionalProperty' | 'FunctionalProperty')> | undefined;
export { defaultGraphURI };
/**
 * Indexed Formula aka Store
 */
export default class IndexedFormula extends Formula {
    /**
     * An UpdateManager initialised to this store
     */
    updater?: UpdateManager;
    /**
     * Dictionary of namespace prefixes
     */
    namespaces: {
        [key: string]: string;
    };
    /** Map of iri predicates to functions to call when adding { s type X } */
    classActions: {
        [k: string]: Function[];
    };
    /** Map of iri predicates to functions to call when getting statement with {s X o} */
    propertyActions: {
        [k: string]: Function[];
    };
    /** Redirect to lexically smaller equivalent symbol */
    redirections: any[];
    /** Reverse mapping to redirection: aliases for this */
    aliases: any[];
    /** Redirections we got from HTTP */
    HTTPRedirects: Statement[];
    /** Array of statements with this X as subject */
    subjectIndex: Statement[];
    /** Array of statements with this X as predicate */
    predicateIndex: Statement[];
    /** Array of statements with this X as object */
    objectIndex: Statement[];
    /** Array of statements with X as provenance */
    whyIndex: Statement[];
    index: [
        Statement[],
        Statement[],
        Statement[],
        Statement[]
    ];
    features: FeaturesType;
    static handleRDFType: Function;
    _universalVariables?: NamedNode[];
    _existentialVariables?: BlankNode[];
    /** Function to remove quads from the store arrays with */
    private rdfArrayRemove;
    /** Callbacks which are triggered after a statement has been added to the store */
    private dataCallbacks;
    /** Callbacks which are triggered after a statement has been removed from the store */
    private dataRemovalCallbacks;
    /**
     * Creates a new formula
     * @param features - What sort of automatic processing to do? Array of string
     * @param features.sameAs - Smush together A and B nodes whenever { A sameAs B }
     * @param opts
     * @param [opts.rdfFactory] - The data factory that should be used by the store
     * @param [opts.rdfArrayRemove] - Function which removes statements from the store
     * @param [opts.dataCallback] - Callback when a statement is added to the store, will not trigger when adding duplicates
     */
    constructor(features?: FeaturesType, opts?: FormulaOpts);
    /**
     * Gets the URI of the default graph
     */
    static get defaultGraphURI(): string;
    /**
     * Gets this graph with the bindings substituted
     * @param bindings The bindings
     */
    substitute<T extends Node = IndexedFormula>(bindings: Bindings): T;
    /**
     * Add a callback which will be triggered after a statement has been added to the store.
     * @param cb
     */
    addDataCallback(cb: (q: Quad) => void): void;
    addDataRemovalCallback(cb: (q: Quad) => void): void;
    /**
     * Apply a set of statements to be deleted and to be inserted
     *
     * @param patch - The set of statements to be deleted and to be inserted
     * @param target - The name of the document to patch
     * @param patchCallback - Callback to be called when patching is complete
     */
    applyPatch(patch: {
        delete?: ReadonlyArray<Statement>;
        patch?: ReadonlyArray<Statement>;
        where?: any;
    }, target: TFNamedNode, patchCallback: (errorString?: string) => void): void;
    /**
     * N3 allows for declaring blank nodes, this function enables that support
     *
     * @param x The blank node to be declared, supported in N3
     */
    declareExistential(x: BlankNode): BlankNode;
    /**
     * @param features
     */
    initPropertyActions(features: FeaturesType): void;
    /** @deprecated Use {add} instead */
    addStatement(st: Quad): number;
    /**
     * Adds a triple (quad) to the store.
     *
     * @param subj - The thing about which the fact a relationship is asserted.
     *        Also accepts a statement or an array of Statements.
     * @param pred - The relationship which is asserted
     * @param obj - The object of the relationship, e.g. another thing or a value. If passed a string, this will become a literal.
     * @param why - The document in which the triple (S,P,O) was or will be stored on the web
     * @returns The statement added to the store, or the store
     */
    add(subj: Quad_Subject | Quad | Quad[] | Statement | Statement[], pred?: Quad_Predicate, obj?: Term | string, why?: Quad_Graph): Statement | null | this | number;
    /**
     * Returns the symbol with canonical URI as smushed
     * @param term - An RDF node
     */
    canon(term?: Term): Node;
    /**
     * Checks this formula for consistency
     */
    check(): void;
    /**
     * Checks a list of statements for consistency
     * @param sts - The list of statements to check
     * @param from - An index with the array ['subject', 'predicate', 'object', 'why']
     */
    checkStatementList(sts: ReadonlyArray<Quad>, from?: number): boolean | void;
    /**
     * Closes this formula (and return it)
     */
    close(): IndexedFormula;
    compareTerms(u1: Term, u2: Term): number;
    /**
     * replaces @template with @target and add appropriate triples
     * removes no triples by default and is a one-direction replication
     * @param template node to copy
     * @param target node to copy to
     * @param flags Whether or not to do a two-directional copy and/or delete triples
     */
    copyTo(template: Quad_Subject, target: Quad_Subject, flags?: Array<('two-direction' | 'delete')>): void;
    /**
     * Simplify graph in store when we realize two identifiers are equivalent
     * We replace the bigger with the smaller.
     * @param u1in The first node
     * @param u2in The second node
     */
    equate(u1in: Term, u2in: Term): boolean;
    /**
     * Creates a new empty indexed formula
     * Only applicable for IndexedFormula, but TypeScript won't allow a subclass to override a property
     * @param features The list of features
     */
    formula(features: FeaturesType): IndexedFormula;
    /**
     * Returns the number of statements contained in this IndexedFormula.
     * (Getter proxy to this.statements).
     * Usage:
     *    ```
     *    var kb = rdf.graph()
     *    kb.length  // -> 0
     *    ```
     * @returns {Number}
     */
    get length(): number;
    /**
     * Returns any quads matching the given arguments.
     * Standard RDFJS spec method for Source objects, implemented as an
     * alias to `statementsMatching()`
     * @param subject The subject
     * @param predicate The predicate
     * @param object The object
     * @param graph The graph that contains the statement
     */
    match(subject?: Quad_Subject | null, predicate?: Quad_Predicate | null, object?: Quad_Object | null, graph?: Quad_Graph | null): Quad[];
    /**
     * Find out whether a given URI is used as symbol in the formula
     * @param uri The URI to look for
     */
    mentionsURI(uri: string): boolean;
    /**
     * Existentials are BNodes - something exists without naming
     * @param uri An URI
     */
    newExistential(uri: string): Term;
    /**
     * Adds a new property action
     * @param pred the predicate that the function should be triggered on
     * @param action the function that should trigger
     */
    newPropertyAction(pred: Quad_Predicate, action: (store: IndexedFormula, subject: Quad_Subject, predicate: Quad_Predicate, object: Quad_Object) => boolean): boolean;
    /**
     * Creates a new universal node
     * Universals are Variables
     * @param uri An URI
     */
    newUniversal(uri: string): TFNamedNode;
    variable(name: string): Variable;
    /**
     * Find an unused id for a file being edited: return a symbol
     * (Note: Slow iff a lot of them -- could be O(log(k)) )
     * @param doc A document named node
     */
    nextSymbol(doc: TFNamedNode): TFNamedNode;
    /**
     * Query this store asynchronously, return bindings in callback
     *
     * @param myQuery The query to be run
     * @param callback Function to call when bindings
     * @param Fetcher | null  If you want the query to do link following
     * @param onDone OBSOLETE - do not use this // @@ Why not ?? Called when query complete
     */
    query(myQuery: Query, callback: (bindings: Bindings) => void, fetcher?: Fetcher | null, onDone?: () => void): void;
    /**
     * Query this store synchronously and return bindings
     *
     * @param myQuery The query to be run
     */
    querySync(myQuery: Query): any[];
    /**
     * Removes one or multiple statement(s) from this formula
     * @param st - A Statement or array of Statements to remove
     */
    remove(st: Quad | Quad[]): IndexedFormula;
    /**
     * Removes all statements in a doc, along with the related metadata including request/response/status
     * @param doc - The document / graph
     */
    removeDocument(doc: Quad_Graph): IndexedFormula;
    removeMetadata(doc: Quad_Graph): IndexedFormula;
    /**
     * Remove all statements matching args (within limit) *
     * @param subj The subject
     * @param pred The predicate
     * @param obj The object
     * @param why The graph that contains the statement
     * @param limit The number of statements to remove
     */
    removeMany(subj?: Quad_Subject | null, pred?: Quad_Predicate | null, obj?: Quad_Object | null, why?: Quad_Graph | null, limit?: number): void;
    /**
     * Remove all matching statements
     * @param subject The subject
     * @param predicate The predicate
     * @param object The object
     * @param graph The graph that contains the statement
     */
    removeMatches(subject?: Quad_Subject | null, predicate?: Quad_Predicate | null, object?: Quad_Object | null, graph?: Quad_Graph | null): IndexedFormula;
    /**
     * Remove a particular statement object from the store
     *
     * @param st - a statement which is already in the store and indexed.
     *        Make sure you only use this for these.
     *        Otherwise, you should use remove() above.
     */
    removeStatement(st: Quad): IndexedFormula;
    /**
     * Removes statements
     * @param sts The statements to remove
     */
    removeStatements(sts: ReadonlyArray<Quad>): IndexedFormula;
    /**
     * Replace big with small, obsoleted with obsoleting.
     */
    replaceWith(big: Quad_Subject, small: Quad_Subject): boolean;
    /**
     * Return all equivalent URIs by which this is known
     * @param x A named node
     */
    allAliases(x: NamedNode): NamedNode[];
    /**
     * Compare by canonical URI as smushed
     * @param x A named node
     * @param y Another named node
     */
    sameThings(x: NamedNode, y: NamedNode): boolean;
    setPrefixForURI(prefix: string, nsuri: string): void;
    /** Search the Store
     *
     * ALL CONVENIENCE LOOKUP FUNCTIONS RELY ON THIS!
     * @param subj - A node to search for as subject, or if null, a wildcard
     * @param pred - A node to search for as predicate, or if null, a wildcard
     * @param obj - A node to search for as object, or if null, a wildcard
     * @param why - A node to search for as graph, or if null, a wildcard
     * @param justOne - flag - stop when found one rather than get all of them?
     * @returns An array of nodes which match the wildcard position
     */
    statementsMatching(subj?: Quad_Subject | null, pred?: Quad_Predicate | null, obj?: Quad_Object | null, why?: Quad_Graph | null, justOne?: boolean): Statement[];
    /**
     * A list of all the URIs by which this thing is known
     * @param term
     */
    uris(term: Quad_Subject): string[];
    serialize(base: any, contentType: any, provenance: any, options?: any): string | undefined;
}
