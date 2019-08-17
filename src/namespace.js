import NamedNode from './named-node'

export default function Namespace (nsuri) {
  return function (ln) {
    return new NamedNode(nsuri + (ln || ''))
  }
}
