import Store from './store';
import { NamedNode, Term } from './tf-types';
export declare function substituteInDoc(store: Store, x: Term, y: Term, doc?: NamedNode): void;
export declare function substituteNillsInDoc(store: Store, doc?: NamedNode): void;
/**
 * Convert lists reified as rdf:first, rest
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 * @param store - The quadstore
 * @param doc - The document in which the conversion is done
 */
export declare function convertFirstRestNil(store: Store, doc: NamedNode | undefined): void;
