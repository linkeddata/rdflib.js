import Collection from './collection';
import RDFlibNamedNode from './named-node';
import Namespace from './namespace';
import Node from './node-internal';
import Statement from './statement';
import { Bindings, GraphTermType } from './types';
import Variable from './variable';
import { Indexable, TFIDFactoryTypes } from './factories/factory-types';
import { RdfJsDataFactory, Quad_Graph, Quad_Object, Quad_Predicate, Quad, Quad_Subject, Term } from './tf-types';
import Fetcher from './fetcher';
import BlankNode from './blank-node';
import NamedNode from './named-node';
export interface FormulaOpts {
    dataCallback?: (q: Quad) => void;
    dataRemovalCallback?: (q: Quad) => void;
    rdfArrayRemove?: (arr: Quad[], q: Quad) => void;
    rdfFactory?: RdfJsDataFactory;
}
interface BooleanMap {
    [uri: string]: boolean;
}
interface MembersMap {
    [uri: string]: Quad;
}
interface UriMap {
    [uri: string]: string;
}
/**
 * A formula, or store of RDF statements
 */
export default class Formula extends Node {
    statements: Array<Statement>;
    constraints: ReadonlyArray<any>;
    initBindings: ReadonlyArray<any>;
    optional: ReadonlyArray<any>;
    termType: typeof GraphTermType;
    classOrder: number;
    /**
     * The accompanying fetcher instance.
     *
     * Is set by the fetcher when initialized.
     */
    fetcher?: Fetcher;
    isVar: number;
    /**
     * A namespace for the specified namespace's URI
     * @param nsuri The URI for the namespace
     */
    ns: typeof Namespace;
    /** The factory used to generate statements and terms */
    rdfFactory: any;
    /**
     * Initializes this formula
     * @constructor
     * @param statements - Initial array of statements
     * @param constraints - initial array of constraints
     * @param initBindings - initial bindings used in Query
     * @param optional - optional
     * @param opts
     * @param opts.rdfFactory - The rdf factory that should be used by the store
  */
    constructor(statements?: Array<Statement>, constraints?: ReadonlyArray<any>, initBindings?: ReadonlyArray<any>, optional?: ReadonlyArray<any>, opts?: FormulaOpts);
    /** Add a statement from its parts
     * @param subject - the first part of the statement
     * @param predicate - the second part of the statement
     * @param object - the third part of the statement
     * @param graph - the last part of the statement
     */
    add(subject: Quad_Subject | Quad | Quad[], predicate?: Quad_Predicate, object?: Term | string, graph?: Quad_Graph): Statement | null | this | number;
    /** Add a statment object
     * @param {Statement} statement - An existing constructed statement to add
     */
    addStatement(statement: Quad): Statement | null | this | number;
    /**
     * Shortcut for adding blankNodes
     * @param [id]
     */
    bnode(id?: string): BlankNode;
    /**
     * Adds all the statements to this formula
     * @param statements - A collection of statements
     */
    addAll(statements: Quad[]): void;
    /** Follow link from one node, using one wildcard, looking for one
    *
    * For example, any(me, knows, null, profile)  - a person I know accoring to my profile .
    * any(me, knows, null, null)  - a person I know accoring to anything in store .
    * any(null, knows, me, null)  - a person who know me accoring to anything in store .
    *
    * @param s - A node to search for as subject, or if null, a wildcard
    * @param p - A node to search for as predicate, or if null, a wildcard
    * @param o - A node to search for as object, or if null, a wildcard
    * @param g - A node to search for as graph, or if null, a wildcard
    * @returns A node which match the wildcard position, or null
    */
    any(s?: Quad_Subject | null, p?: Quad_Predicate | null, o?: Quad_Object | null, g?: Quad_Graph | null): Node | null;
    /**
     * Gets the value of a node that matches the specified pattern
     * @param s The subject
     * @param p The predicate
     * @param o The object
     * @param g The graph that contains the statement
     */
    anyValue(s?: Quad_Subject | null, p?: Quad_Predicate | null, o?: Quad_Object | null, g?: Quad_Graph | null): string | void;
    /**
     * Gets the first JavaScript object equivalent to a node based on the specified pattern
     * @param s The subject
     * @param p The predicate
     * @param o The object
     * @param g The graph that contains the statement
     */
    anyJS(s?: Quad_Subject | null, p?: Quad_Predicate | null, o?: Quad_Object | null, g?: Quad_Graph | null): any;
    /**
     * Gets the first statement that matches the specified pattern
     */
    anyStatementMatching(s?: Quad_Subject | null, p?: Quad_Predicate | null, o?: Quad_Object | null, g?: Quad_Graph | null): Statement | undefined;
    /**
     * Returns a unique index-safe identifier for the given term.
     *
     * Falls back to the rdflib hashString implementation if the given factory doesn't support id.
     */
    id(term: TFIDFactoryTypes): Indexable;
    /**
     * Search the Store
     * This is really a teaching method as to do this properly you would use IndexedFormula
     *
     * @param s - A node to search for as subject, or if null, a wildcard
     * @param p - A node to search for as predicate, or if null, a wildcard
     * @param o - A node to search for as object, or if null, a wildcard
     * @param g - A node to search for as graph, or if null, a wildcard
     * @param justOne - flag - stop when found one rather than get all of them?
     * @returns {Array<Node>} - An array of nodes which match the wildcard position
     */
    statementsMatching<JustOne extends boolean = false>(s?: Quad_Subject | null, p?: Quad_Predicate | null, o?: Quad_Object | null, g?: Quad_Graph | null, justOne?: boolean): Statement[];
    /**
     * Finds the types in the list which have no *stored* subtypes
     * These are a set of classes which provide by themselves complete
     * information -- the other classes are redundant for those who
     * know the class DAG.
     * @param types A map of the types
     */
    bottomTypeURIs(types: any): any;
    /** Creates a new collection */
    collection(): Collection;
    /** Follow links from one node, using one wildcard.
    *
    * For example, each(me, knows, null, profile)  - people I know accoring to my profile .
    * each(me, knows, null, null)  - people I know accoring to anything in store .
    * each(null, knows, me, null)  - people who know me accoring to anything in store .
    *
    * @param s - A node to search for as subject, or if null, a wildcard
    * @param p - A node to search for as predicate, or if null, a wildcard
    * @param o - A node to search for as object, or if null, a wildcard
    * @param g - A node to search for as graph, or if null, a wildcard
    * @returns {Array<Node>} - An array of nodes which match the wildcard position
    */
    each(s?: Quad_Subject | null, p?: Quad_Predicate | null, o?: Quad_Object | null, g?: Quad_Graph | null): Node[];
    /**
     * Test whether this formula is equals to {other}
     * @param other - The other formula
     */
    equals(other: Formula): boolean;
    /**
     * For thisClass or any subclass, anything which has it is its type
     * or is the object of something which has the type as its range, or subject
     * of something which has the type as its domain
     * We don't bother doing subproperty (yet?)as it doesn't seeem to be used
     * much.
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * @return a hash of URIs
     */
    findMembersNT(thisClass: any): MembersMap;
    /**
     * For thisClass or any subclass, anything which has it is its type
     * or is the object of something which has the type as its range, or subject
     * of something which has the type as its domain
     * We don't bother doing subproperty (yet?)as it doesn't seeem to be used
     * much.
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * @param subject - A named node
     */
    findMemberURIs(subject: Node): UriMap;
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a superclass
     * Returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */
    findSubClassesNT(subject: Node): {
        [uri: string]: boolean;
    };
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a subclass
     * @param {RDFlibNamedNode} subject - The thing whose classes are to be found
     * @returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */
    findSuperClassesNT(subject: Node): {
        [uri: string]: boolean;
    };
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * todo: This will loop is there is a class subclass loop (Sublass loops are
     * not illegal)
     * @param {RDFlibNamedNode} subject - The thing whose classes are to be found
     * @returns a hash table where key is NT of type and value is statement why we think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */
    findTypesNT(subject: any): {
        [uri: string]: boolean;
    };
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * todo: This will loop is there is a class subclass loop (Sublass loops are
     * not illegal)
     * Returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     * @param subject - A subject node
     */
    findTypeURIs(subject: Quad_Subject): UriMap;
    /** Trace statements which connect directly, or through bnodes
     *
     * @param subject - The node to start looking for statments
     * @param doc - The document to be searched, or null to search all documents
     * @returns an array of statements, duplicate statements are suppresssed.
     */
    connectedStatements(subject: Quad_Subject, doc: Quad_Graph, excludePredicateURIs?: ReadonlyArray<string>): Statement[];
    /**
     * Creates a new empty formula
     *
     * @param _features - Not applicable, but necessary for typing to pass
     */
    formula(_features?: ReadonlyArray<string>): Formula;
    /**
     * Transforms an NTriples string format into a Node.
     * The blank node bit should not be used on program-external values; designed
     * for internal work such as storing a blank node id in an HTML attribute.
     * This will only parse the strings generated by the various toNT() methods.
     */
    fromNT(str: any): any;
    /** Returns true if this formula holds the specified statement(s) */
    holds(s: any | any[], p?: any, o?: any, g?: any): boolean;
    /**
     * Returns true if this formula holds the specified {statement}
     */
    holdsStatement(statement: any): boolean;
    /**
     * Used by the n3parser to generate list elements
     * @param values - The values of the collection
     * @param context - The store
     * @return {BlankNode|Collection} - The term for the statement
     */
    list(values: any, context: any): any;
    /**
     * Transform a collection of NTriple URIs into their URI strings
     * @param t - Some iterable collection of NTriple URI strings
     * @return A collection of the URIs as strings
     * todo: explain why it is important to go through NT
     */
    NTtoURI(t: any): {};
    /**
     * Serializes this formula
     * @param base - The base string
     * @param contentType - The content type of the syntax to use
     * @param provenance - The provenance URI
     * @param options  - options to pass to the serializer, as defined in serialize method
     */
    serialize(base: any, contentType: any, provenance: any, options?: any): string | undefined;
    /**
     * Creates a new formula with the substituting bindings applied
     * @param bindings - The bindings to substitute
     */
    substitute<T extends Node = Formula>(bindings: Bindings): T;
    sym(uri: string, name?: any): NamedNode;
    /**
     * Gets the node matching the specified pattern. Throws when no match could be made.
     * @param s - The subject
     * @param p - The predicate
     * @param o - The object
     * @param g - The graph that contains the statement
     */
    the(s?: Quad_Subject | null, p?: Quad_Predicate | null, o?: Quad_Object | null, g?: Quad_Graph | null): Node | null | undefined;
    /**
     * RDFS Inference
     * These are hand-written implementations of a backward-chaining reasoner
     * over the RDFS axioms.
     * @param seeds - A hash of NTs of classes to start with
     * @param predicate - The property to trace though
     * @param inverse - Trace inverse direction
     */
    transitiveClosure(seeds: BooleanMap, predicate: Quad_Predicate, inverse?: boolean): {
        [uri: string]: boolean;
    };
    /**
     * Finds the types in the list which have no *stored* supertypes
     * We exclude the universal class, owl:Things and rdf:Resource, as it is
     * information-free.
     * @param types - The types
     */
    topTypeURIs(types: {
        [id: string]: string | RDFlibNamedNode;
    }): {
        [id: string]: string | RDFlibNamedNode;
    };
    /**
     * Serializes this formula to a string
     */
    toString(): string;
    /**
     * Gets a new variable
     * @param name - The variable's name
     */
    variable(name: string): Variable;
    /**
     * Gets the number of statements in this formula that matches the specified pattern
     * @param s - The subject
     * @param p - The predicate
     * @param o - The object
     * @param g - The graph that contains the statement
     */
    whether(s?: Quad_Subject | null, p?: Quad_Predicate | null, o?: Quad_Object | null, g?: Quad_Graph | null): number;
}
export {};
