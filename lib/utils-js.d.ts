export function mediaTypeClass(mediaType: any): NamedNode;
export function linkRelationProperty(relation: any): NamedNode;
/**
 * Adds callback functionality to an object.
 * Callback functions are indexed by a 'hook' string.
 * They return true if they want to be called again.
 * @method callbackify
 * @param obj {Object}
 * @param callbacks {Array<string>}
 */
export function callbackify(obj: any, callbacks: Array<string>): void;
/**
 * Returns a DOM parser based on current runtime environment.
 */
export function DOMParserFactory(): any;
export function domToString(node: any, options: any): string;
export function dumpNode(node: any, options: any, selfClosing: any, skipAttributes: any): string;
export function dtstamp(): string;
/**
 * Compares statements (heavy comparison for repeatable canonical ordering)
 */
export function heavyCompare(x: any, y: any, g: any, uriMap: any): any;
export function heavyCompareSPO(x: any, y: any, g: any, uriMap: any): any;
/**
 * Defines a simple debugging function
 * @method output
 * @param o {String}
 */
export function output(o: string): void;
/**
 * Returns a DOM from parsed XML.
 */
export function parseXML(str: any, options: any): Document;
/**
 * Removes all statements equal to x from a
 */
export function RDFArrayRemove(a: any, x: any): void;
export function string_startswith(str: any, pref: any): boolean;
export function stackString(e: any): string;
import NamedNode from './named-node';
import log from './log';
import * as uri from './uri';
export namespace string {
    export { stringTemplate as template };
}
/**
 * C++, python style %s -> subs
 */
declare function stringTemplate(base: any, subs: any): string;
export { log, uri };
