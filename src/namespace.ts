import RDFlibNamedNode from './named-node'
import { RdfJsDataFactory, NamedNode } from './tf-types'

/**
 * Gets a namespace for the specified namespace's URI
 * @param nsuri - The URI for the namespace
 * @param [factory] - The factory for creating named nodes with
 */
export default function Namespace (nsuri: string, factory?: RdfJsDataFactory): (ln: string) => NamedNode {
  const dataFactory = factory || { namedNode: (value) => new RDFlibNamedNode(value) as NamedNode }

  return function (ln: string): NamedNode {
    return dataFactory.namedNode(nsuri + (ln || ''))
  }
}
