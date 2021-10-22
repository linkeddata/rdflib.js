import Fetcher from './fetcher';
import { RdfJsDataFactory, Quad, Quad_Subject, Term } from './tf-types';
/** RDF/JS spec Typeguards */
/**
 * Loads ontologies of the data we load (this is the callback from the kb to
 * the fetcher).
 */
export declare function AJAR_handleNewTerm(kb: {
    fetcher: Fetcher;
}, p: any, requestedBy: any): any;
export declare const appliedFactoryMethods: string[];
/**
 * Expands an array of Terms to a set of statements representing the rdf:list.
 * @param rdfFactory - The factory to use
 * @param subject - The iri of the first list item.
 * @param data - The terms to expand into the list.
 * @return The {data} as a set of statements.
 */
export declare function arrayToStatements(rdfFactory: RdfJsDataFactory, subject: Quad_Subject, data: Term[]): Quad[];
export declare function ArrayIndexOf(arr: any, item: any, i?: number): number;
