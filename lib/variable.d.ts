import Node from './node-internal';
import { VariableTermType } from './types';
import { Variable as TFVariable } from './tf-types';
/**
* Variables are placeholders used in patterns to be matched.
* In cwm they are symbols which are the formula's list of quantified variables.
* In sparql they are not visibly URIs.  Here we compromise, by having
* a common special base URI for variables. Their names are uris,
* but the ? notation has an implicit base uri of 'varid:'
*/
export default class Variable extends Node implements TFVariable {
    termType: typeof VariableTermType;
    /** The base string for a variable's name */
    base: string;
    classOrder: number;
    isVar: number;
    /** The unique identifier of this variable */
    uri: string;
    /**
     * Initializes this variable
     * @param name The variable's name
     */
    constructor(name?: string);
    equals(other: any): boolean;
    hashString(): string;
    substitute(bindings: any): any;
    toString(): string;
    static toString(variable: any): string;
}
