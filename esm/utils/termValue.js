/** Retrieve the value of a term, or self if already a string. */
export function termValue(node) {
  if (typeof node === 'string') {
    return node;
  }
  return node.value;
}