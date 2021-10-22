import { DataFactory } from './factory-types';
export { defaultGraphURI } from '../utils/default-graph-uri';
/** A basic internal RDFlib datafactory, which does not support Collections  */
declare const CanonicalDataFactory: DataFactory;
/** Contains the factory methods as defined in the spec, plus id */
export default CanonicalDataFactory;
