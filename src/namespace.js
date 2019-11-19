import NamedNode from './named-node'

export default function Namespace (nsuri, factory) {
  const dataFactory = factory || { namedNode: (value) => new NamedNode(value) }

  return function (ln) {
    return dataFactory.namedNode(nsuri + (ln || ''))
  }
}
