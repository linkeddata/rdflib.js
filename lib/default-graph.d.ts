import Node from './node-internal';
import { DefaultGraphTermType } from './types';
import { DefaultGraph as TFDefaultGraph } from './tf-types';
/** The RDF default graph */
export default class DefaultGraph extends Node implements TFDefaultGraph {
    value: '';
    termType: typeof DefaultGraphTermType;
    uri: string;
    constructor();
    toCanonical(): "";
    toString(): string;
}
export declare function isDefaultGraph(object: any): object is DefaultGraph;
