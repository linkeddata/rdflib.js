import { TFTerm } from "../types";

export function isTerm(obj) {
  return typeof obj === 'object'
    && obj !== null
    && 'termType' in obj
    && 'value' in obj
}

export function isStatement(obj) {
  return typeof obj === 'object' && obj !== null && 'subject' in obj
}

export function isStore(obj) {
  return typeof obj === 'object' && obj !== null && 'statements' in obj
}

export function isNamedNode(obj) {
  return isTerm(obj) && obj.termType === 'NamedNode'
}

export function termValue(node: TFTerm | string): string {
  if (typeof node === 'string') {
    return node
  }

  return node.value
}
