import RDFlibNamedNode from './named-node';
/**
 * Gets a namespace for the specified namespace's URI
 * @param nsuri - The URI for the namespace
 * @param [factory] - The factory for creating named nodes with
 */
export default function Namespace(nsuri, factory) {
  const dataFactory = factory || {
    namedNode: value => new RDFlibNamedNode(value)
  };
  return function (ln) {
    return dataFactory.namedNode(nsuri + (ln || ''));
  };
}