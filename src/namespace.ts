import NamedNode from './named-node'

/**
 * Gets a namespace for the specified namespace's URI
 * @param nsuri - The URI for the namespace
 * @param [factory] - The factory for creating named nodes with
 */
export default function Namespace (nsuri: string, factory?) {
  const dataFactory = factory || { namedNode: (value) => new NamedNode(value) }

  return function (ln: string) {
    return dataFactory.namedNode(nsuri + (ln || ''))
  }
}
