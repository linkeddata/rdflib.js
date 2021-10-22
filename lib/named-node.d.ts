import Node from './node-internal';
import { NamedNodeTermType } from './types';
import { NamedNode as TFNamedNode } from './tf-types';
/**
 * A named (IRI) RDF node
 */
export default class NamedNode extends Node implements TFNamedNode {
    termType: typeof NamedNodeTermType;
    classOrder: number;
    /**
     * Create a named (IRI) RDF Node
     * @constructor
     * @param iri - The IRI for this node
     */
    constructor(iri: string);
    /**
     * Returns an $rdf node for the containing directory, ending in slash.
     */
    dir(): NamedNode | null;
    /**
     * Returns an NN for the whole web site, ending in slash.
     * Contrast with the "origin" which does NOT have a trailing slash
     */
    site(): NamedNode;
    /**
     * Creates the fetchable named node for the document.
     * Removes everything from the # anchor tag.
     */
    doc(): NamedNode;
    /**
     * Returns the URI including <brackets>
     */
    toString(): string;
    /** The local identifier with the document */
    id(): string;
    /** Alias for value, favored by Tim */
    get uri(): string;
    set uri(uri: string);
    /**
     * Creates a named node from the specified input value
     * @param value - An input value
     */
    static fromValue(value: any): any;
}
