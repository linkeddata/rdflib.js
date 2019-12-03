import NamedNode from './named-node'
import { TFDataFactory, TFNamedNode } from './tf-types'

/**
 * Gets a namespace for the specified namespace's URI
 * @param nsuri - The URI for the namespace
 * @param [factory] - The factory for creating named nodes with
 */
export default function Namespace (nsuri: string, factory?: TFDataFactory): (ln: string) => TFNamedNode {
  const dataFactory = factory || { namedNode: (value) => new NamedNode(value) as TFNamedNode }

  return function (ln: string): TFNamedNode {
    return dataFactory.namedNode(nsuri + (ln || ''))
  }
}
