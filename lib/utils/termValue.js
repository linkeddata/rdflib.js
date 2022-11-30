"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.termValue = termValue;
/** Retrieve the value of a term, or self if already a string. */
function termValue(node) {
  if (typeof node === 'string') {
    return node;
  }
  return node.value;
}