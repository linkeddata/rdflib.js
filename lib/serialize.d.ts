import Formula from './formula';
import { ContentType } from './types';
import { BlankNode, NamedNode } from './tf-types';
/**
 * Serialize to the appropriate format
 */
export default function serialize(
/** The graph or nodes that should be serialized */
target: Formula | NamedNode | BlankNode | null, 
/** The store */
kb: Formula, base?: unknown, 
/**
 * The mime type.
 * Defaults to Turtle.
 */
contentType?: string | ContentType, callback?: (err: Error | undefined | null, result?: string) => any, options?: {
    /**
     * A string of letters, each of which set an options
     * e.g. `deinprstux`
     */
    flags?: string;
    /**
     * A set of [prefix, uri] pairs that define namespace prefixes
     */
    namespaces?: Record<string, string>;
}): string | undefined;
