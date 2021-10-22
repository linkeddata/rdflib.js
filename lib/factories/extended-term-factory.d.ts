import Collection from '../collection';
import { ValueType } from '../types';
import { DataFactory } from './factory-types';
interface CollectionFactory extends DataFactory {
    collection(elements: ReadonlyArray<ValueType>): Collection;
}
/**
 * Data factory which also supports Collections
 *
 * Necessary for preventing circular dependencies.
 */
declare const ExtendedTermFactory: CollectionFactory;
export default ExtendedTermFactory;
