import RDFlibNamedNode from './named-node';
/**
 * Gets the document part of an URI
 * @param uri The URI
 */
export declare function docpart(uri: string): string;
/**
 * Gets the document part of an URI as a named node
 * @param x - The URI
 */
export declare function document(x: string): RDFlibNamedNode;
/**
 * Gets the hostname in an URI
 * @param u The URI
 */
export declare function hostpart(u: string): string;
/**
 * Joins an URI with a base
 * @param given - The relative part
 * @param base - The base URI
 */
export declare function join(given: string, base: string): string;
/**
 * Gets the protocol part of an URI
 * @param uri The URI
 */
export declare function protocol(uri: string): string | null;
/**
 * Gets a relative uri
 * @param base The base URI
 * @param uri The absolute URI
 */
export declare function refTo(base: string, uri: string): string;
