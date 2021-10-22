import Formula from './formula';
import { ContentType } from './types';
declare type CallbackFunc = (error: any, kb: Formula | null) => void;
/**
 * Parse a string and put the result into the graph kb.
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 * @param str - The input string to parse
 * @param kb - The store to use
 * @param base - The base URI to use
 * @param contentType - The MIME content type string for the input - defaults to text/turtle
 * @param [callback] - The callback to call when the data has been loaded
 */
export default function parse(str: string, kb: Formula, base: string, contentType?: string | ContentType, callback?: CallbackFunc): void;
export {};
