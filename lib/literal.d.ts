import RDFlibNamedNode from './named-node';
import Node from './node-internal';
import { FromValueReturns, LiteralTermType, ValueType } from './types';
import { Literal as TFLiteral, Term } from './tf-types';
/**
 * An RDF literal, containing some value which isn't expressed as an IRI.
 * @link https://rdf.js.org/data-model-spec/#literal-interface
 */
export default class Literal extends Node implements TFLiteral {
    termType: typeof LiteralTermType;
    classOrder: number;
    /**
     * The literal's datatype as a named node
     */
    datatype: RDFlibNamedNode;
    isVar: number;
    /**
     * The language for the literal
     */
    language: string;
    /**
     * Initializes a literal
     * @param value - The literal's lexical value
     * @param language - The language for the literal. Defaults to ''.
     * @param datatype - The literal's datatype as a named node. Defaults to xsd:string.
     */
    constructor(value: string, language?: string | null, datatype?: any);
    /**
     * Gets a copy of this literal
     */
    copy(): Literal;
    /**
     * Gets whether two literals are the same
     * @param other The other statement
     */
    equals(other: Term | null | undefined): boolean;
    /**
     * The language for the literal
     * @deprecated use {language} instead
     */
    get lang(): string;
    set lang(language: string);
    toNT(): string;
    /** Serializes a literal to an N-Triples string */
    static toNT(literal: Literal): string;
    toString(): string;
    /**
     * Builds a literal node from a boolean value
     * @param value - The value
     */
    static fromBoolean(value: boolean): Literal;
    /**
     * Builds a literal node from a date value
     * @param value The value
     */
    static fromDate(value: Date): Literal;
    /**
     * Builds a literal node from a number value
     * @param value - The value
     */
    static fromNumber(value: number): Literal;
    /**
     * Builds a literal node from an input value
     * @param value - The input value
     */
    static fromValue<T extends FromValueReturns>(value: ValueType): T;
}
