import { TFTerm } from '../types'

/** Retrieve the value of a term, or self if already a string. */
export function termValue (node: TFTerm | string): string {
  if (typeof node === 'string') {
    return node
  }

  return node.value
}
