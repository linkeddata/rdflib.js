import Node from './node-internal';
import IndexedFormula from './store';
import { BlankNodeTermType } from './types';
import { BlankNode as TFBlankNode } from './tf-types';
/**
 * An RDF blank node is a Node without a URI
 * @link https://rdf.js.org/data-model-spec/#blanknode-interface
 */
export default class BlankNode extends Node implements TFBlankNode {
    termType: typeof BlankNodeTermType;
    /**
     * The next unique identifier for blank nodes
     */
    static nextId: number;
    static NTAnonymousNodePrefix: '_:';
    private static getId;
    classOrder: number;
    /** Whether this is a blank node */
    isBlank: number;
    /**
     * This type of node is a variable.
     *
     * Note that the existence of this property already indicates that it is a variable.
     */
    isVar: number;
    /**
     * Initializes this node
     * @param [id] The identifier for the blank node
     */
    constructor(id?: string | unknown);
    /**
     * The identifier for the blank node
     */
    get id(): string;
    set id(value: string);
    compareTerm(other: BlankNode): number;
    /**
     * Gets a copy of this blank node in the specified formula
     * @param formula The formula
     */
    copy(formula: IndexedFormula): BlankNode;
    toCanonical(): string;
    toString(): string;
}
