import Formula from './formula';
import { ContentType } from './types';
import IndexedFormula from './store';
import { BlankNode, NamedNode } from './tf-types';
/**
 * Serialize to the appropriate format
 */
export default function serialize(
/** The graph or nodes that should be serialized */
target: Formula | NamedNode | BlankNode, 
/** The store */
kb?: IndexedFormula, base?: unknown, 
/**
 * The mime type.
 * Defaults to Turtle.
 */
contentType?: string | ContentType, callback?: (err: Error | undefined | null, result?: string | null) => any, options?: {
    /**
     * A string of letters, each of which set an options
     * e.g. `deinprstux`
     */
    flags: string;
}): string | undefined;
