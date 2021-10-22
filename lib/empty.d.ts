import Node from './node-internal';
import { EmptyTermType } from './types';
import { Term } from './tf-types';
/**
* An empty node
*/
export default class Empty extends Node implements Term {
    termType: typeof EmptyTermType;
    constructor();
    toString(): string;
}
