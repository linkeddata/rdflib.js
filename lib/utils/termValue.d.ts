import { Term } from '../tf-types';
/** Retrieve the value of a term, or self if already a string. */
export declare function termValue(node: Term | string): string;
