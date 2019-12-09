import { Term } from '../tf-types'

/** Retrieve the value of a term, or self if already a string. */
export function termValue (node: Term | string): string {
  if (typeof node === 'string') {
    return node
  }

  return node.value
}
