import RdflibBlankNode from './blank-node';
import Literal from './literal';
import Node from './node-internal';
import { Bindings, CollectionTermType, FromValueReturns, ValueType } from './types';
import Variable from './variable';
import { Term } from './tf-types';
/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * Arrays return Collections.
 * Strings, numbers and booleans return Literals.
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
export declare function fromValue<T extends FromValueReturns<C> = any, C extends Node = any>(value: ValueType): T;
/**
 * A collection of other RDF nodes
 *
 * Use generic T to control the contents of the array.
 */
export default class Collection<T extends Node = Node | RdflibBlankNode | Collection<any> | Literal | Variable> extends Node implements Term {
    static termType: typeof CollectionTermType;
    termType: typeof CollectionTermType;
    classOrder: number;
    closed: boolean;
    compareTerm: (other: RdflibBlankNode) => number;
    /**
     * The nodes in this collection
     */
    elements: T[];
    isVar: number;
    constructor(initial?: ReadonlyArray<ValueType>);
    get id(): string;
    set id(value: string);
    /**
     * Appends an element to this collection
     * @param element - The new element
     */
    append(element: T): number;
    /**
     * Closes this collection
     */
    close(): boolean;
    /**
     * Removes the first element from the collection (and return it)
     */
    shift(): T | undefined;
    /**
     * Creates a new Collection with the substituting bindings applied
     * @param bindings - The bindings to substitute
     */
    substitute(bindings: Bindings): Collection<Node | Collection<any> | Literal | Variable>;
    toNT(): string;
    static toNT(collection: any): string;
    /**
     * Serializes the collection to a string.
     * Surrounded by (parentheses) and separated by spaces.
     */
    toString(): string;
    /**
     * Prepends the specified element to the collection's front
     * @param element - The element to prepend
     */
    unshift(element: T): number;
}
