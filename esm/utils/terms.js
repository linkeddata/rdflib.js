import { CollectionTermType, NamedNodeTermType, VariableTermType, BlankNodeTermType, LiteralTermType, GraphTermType, DefaultGraphTermType } from '../types';
/** TypeGuard for RDFLib Statements */
export function isStatement(obj) {
  return typeof obj === 'object' && obj !== null && 'subject' in obj;
}

/** TypeGuard for RDFlib Stores */
export function isStore(obj) {
  return typeof obj === 'object' && obj !== null && 'statements' in obj;
}

/** TypeGuard for RDFLib Collections */
export function isCollection(obj) {
  return isTerm(obj) && obj.termType === CollectionTermType;
}

/** TypeGuard for valid RDFlib Object types, also allows Collections, Graphs */
export function isRDFlibObject(obj) {
  return obj && Object.prototype.hasOwnProperty.call(obj, 'termType') && (obj.termType === NamedNodeTermType || obj.termType === VariableTermType || obj.termType === BlankNodeTermType || obj.termType === CollectionTermType || obj.termType === LiteralTermType || obj.termType === GraphTermType);
}

/** TypeGuard for valid RDFlib Subject types, same as Object as RDFLib symmetrical.
*/
export function isRDFlibSubject(obj) {
  return obj && Object.prototype.hasOwnProperty.call(obj, 'termType') && (obj.termType === NamedNodeTermType || obj.termType === VariableTermType || obj.termType === BlankNodeTermType || obj.termType === CollectionTermType || obj.termType === LiteralTermType || obj.termType === GraphTermType);
}

/** TypeGuard for valid RDF/JS spec Predicate types */
export function isRDFlibPredicate(obj) {
  return isTerm(obj) && (obj.termType === NamedNodeTermType || obj.termType === BlankNodeTermType || obj.termType === VariableTermType);
}

/** TypeGuard for RDFLib Variables */
export function isVariable(obj) {
  return isTerm(obj) && obj.termType === VariableTermType;
}

/** TypeGuard for RDF/JS spec Terms */
export function isTerm(obj) {
  return typeof obj === 'object' && obj !== null && 'termType' in obj;
}

/** TypeGuard for RDF/JS spec Literals */
export function isLiteral(value) {
  return value.termType === LiteralTermType;
}

/** TypeGuard for RDF/JS spec Quads */
export function isQuad(obj) {
  return typeof obj === "object" && obj !== null && 'subject' in obj && 'predicate' in obj && 'object' in obj;
}

/** TypeGuard for RDF/JS spec NamedNodes */
export function isNamedNode(obj) {
  return isTerm(obj) && obj.termType === 'NamedNode';
}

/** TypeGuard for RDF/JS spec BlankNodes */
export function isBlankNode(obj) {
  return isTerm(obj) && 'termType' in obj && obj.termType === 'BlankNode';
}

/** TypeGuard for valid RDF/JS spec Subject types */
export function isSubject(obj) {
  return isTerm(obj) && (obj.termType === NamedNodeTermType || obj.termType === VariableTermType || obj.termType === BlankNodeTermType);
}

/** TypeGuard for valid RDF/JS spec Predicate types */
export function isPredicate(obj) {
  return isTerm(obj) && (obj.termType === NamedNodeTermType || obj.termType === VariableTermType);
}

/** TypeGuard for valid RDF/JS spec Object types */
export function isRDFObject(obj) {
  return isTerm(obj) && (obj.termType === NamedNodeTermType || obj.termType === VariableTermType || obj.termType === BlankNodeTermType || obj.termType === LiteralTermType);
}

/** TypeGuard for valid RDF/JS Graph types */
export function isGraph(obj) {
  return isTerm(obj) && (obj.termType === NamedNodeTermType || obj.termType === VariableTermType || obj.termType === BlankNodeTermType || obj.termType === DefaultGraphTermType);
}