/**
 * @SPARQL: SPARQL text that is converted to a query object which is returned.
 * @testMode: testing flag. Prevents loading of sources.
 */
export default function SPARQLToQuery(SPARQL: any, testMode: any, kb: any): false | Query;
import { Query } from './query';
