/**
 * This function will match a pattern to the current Store
 *
 * The callback function is called whenever a match is found
 * When fetcher is supplied this will be called to load from the web
 * any new nodes as they are discovered.  This will cause the query to traverse the
 * graph of linked data, sometimes called "Link Following Query"
 *
 * @param myQuery - a knowledgebase containing a pattern to use as query
 * @param callback - whenever the pattern in myQuery is met this is called with
 *  the new bindings as parameter
 * @param fetcher? - If and only if,  you want link following, give a fetcher
 *                which has been created for the quadstore being queried.
 * @param onDone -  callback when query finished
 */
export function indexedFormulaQuery(myQuery: any, callback: any, fetcher: any, onDone: any): void;
/**
 * Query class, for tracking queries the user has in the UI.
 */
export class Query {
    constructor(name: any, id: any);
    pat: IndexedFormula;
    vars: any[];
    name: any;
    id: any;
}
import IndexedFormula from './store';
