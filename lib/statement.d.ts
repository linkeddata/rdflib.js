import { Bindings, GraphType, ObjectType, PredicateType, SubjectType } from './types';
import { Quad, DefaultGraph } from './tf-types';
/** A Statement represents an RDF Triple or Quad. */
export default class Statement<S extends SubjectType = SubjectType, P extends PredicateType = PredicateType, O extends ObjectType = ObjectType, G extends GraphType = GraphType> implements Quad<S, P, O, G | DefaultGraph> {
    /** The subject of the triple.  What the Statement is about. */
    subject: S;
    /** The relationship which is asserted between the subject and object */
    predicate: P;
    /** The thing or data value which is asserted to be related to the subject */
    object: O;
    /**
     * The graph param is a named node of the document in which the triple when
     *  it is stored on the web.
     */
    graph: G | DefaultGraph;
    /**
     * Construct a new statement
     *
     * @param subject - The subject of the triple.  What the fact is about
     * @param predicate - The relationship which is asserted between the subject and object
     * @param object - The thing or data value which is asserted to be related to the subject
     * @param {NamedNode} graph - The document where the triple is or was or will be stored on the web.
     *
     * The graph param is a named node of the document in which the triple when it is stored
     *  on the web. It exists because when you have read data from various places in the web,
     *  the “graph” tells you _why_ you have the triple. (At the moment, it is just the
     *  document, in future it could be an inference step)
     *
     * When you do UpdateManager.update() then the graph’s of all the statements must be the same,
     *  and give the document you are patching. In future, we may have a more
     *  powerful update() which can update more than one document.
     */
    constructor(subject: S, predicate: P, object: O, graph?: G | DefaultGraph);
    /** Alias for graph, favored by Tim */
    get why(): DefaultGraph | G;
    set why(g: DefaultGraph | G);
    /**
     * Checks whether two statements are the same
     * @param other - The other statement
     */
    equals(other: Quad): boolean;
    /**
     * Creates a statement with the bindings substituted
     * @param bindings The bindings
     */
    substitute(bindings: Bindings): Statement;
    /** Creates a canonical string representation of this statement. */
    toCanonical(): string;
    /** Creates a n-triples string representation of this statement */
    toNT(): string;
    /** Creates a n-quads string representation of this statement */
    toNQ(): string;
    /** Creates a string representation of this statement */
    toString(): string;
}
