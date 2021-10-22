import { RdfJsDataFactory, NamedNode } from './tf-types';
/**
 * Gets a namespace for the specified namespace's URI
 * @param nsuri - The URI for the namespace
 * @param [factory] - The factory for creating named nodes with
 */
export default function Namespace(nsuri: string, factory?: RdfJsDataFactory): (ln: string) => NamedNode;
