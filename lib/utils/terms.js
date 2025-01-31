"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isBlankNode = isBlankNode;
exports.isCollection = isCollection;
exports.isGraph = isGraph;
exports.isLiteral = isLiteral;
exports.isNamedNode = isNamedNode;
exports.isPredicate = isPredicate;
exports.isQuad = isQuad;
exports.isRDFObject = isRDFObject;
exports.isRDFlibObject = isRDFlibObject;
exports.isRDFlibPredicate = isRDFlibPredicate;
exports.isRDFlibSubject = isRDFlibSubject;
exports.isStatement = isStatement;
exports.isStore = isStore;
exports.isSubject = isSubject;
exports.isTerm = isTerm;
exports.isVariable = isVariable;
var _types = require("../types");
/** TypeGuard for RDFLib Statements */
function isStatement(obj) {
  return typeof obj === 'object' && obj !== null && 'subject' in obj;
}

/** TypeGuard for RDFlib Stores */
function isStore(obj) {
  return typeof obj === 'object' && obj !== null && 'statements' in obj;
}

/** TypeGuard for RDFLib Collections */
function isCollection(obj) {
  return isTerm(obj) && obj.termType === _types.CollectionTermType;
}

/** TypeGuard for valid RDFlib Object types, also allows Collections, Graphs */
function isRDFlibObject(obj) {
  return obj && Object.prototype.hasOwnProperty.call(obj, 'termType') && (obj.termType === _types.NamedNodeTermType || obj.termType === _types.VariableTermType || obj.termType === _types.BlankNodeTermType || obj.termType === _types.CollectionTermType || obj.termType === _types.LiteralTermType || obj.termType === _types.GraphTermType);
}

/** TypeGuard for valid RDFlib Subject types, same as Object as RDFLib symmetrical.
*/
function isRDFlibSubject(obj) {
  return obj && Object.prototype.hasOwnProperty.call(obj, 'termType') && (obj.termType === _types.NamedNodeTermType || obj.termType === _types.VariableTermType || obj.termType === _types.BlankNodeTermType || obj.termType === _types.CollectionTermType || obj.termType === _types.LiteralTermType || obj.termType === _types.GraphTermType);
}

/** TypeGuard for valid RDF/JS spec Predicate types */
function isRDFlibPredicate(obj) {
  return isTerm(obj) && (obj.termType === _types.NamedNodeTermType || obj.termType === _types.BlankNodeTermType || obj.termType === _types.VariableTermType);
}

/** TypeGuard for RDFLib Variables */
function isVariable(obj) {
  return isTerm(obj) && obj.termType === _types.VariableTermType;
}

/** TypeGuard for RDF/JS spec Terms */
function isTerm(obj) {
  return typeof obj === 'object' && obj !== null && 'termType' in obj;
}

/** TypeGuard for RDF/JS spec Literals */
function isLiteral(value) {
  return value.termType === _types.LiteralTermType;
}

/** TypeGuard for RDF/JS spec Quads */
function isQuad(obj) {
  return typeof obj === "object" && obj !== null && 'subject' in obj && 'predicate' in obj && 'object' in obj;
}

/** TypeGuard for RDF/JS spec NamedNodes */
function isNamedNode(obj) {
  return isTerm(obj) && obj.termType === 'NamedNode';
}

/** TypeGuard for RDF/JS spec BlankNodes */
function isBlankNode(obj) {
  return isTerm(obj) && 'termType' in obj && obj.termType === 'BlankNode';
}

/** TypeGuard for valid RDF/JS spec Subject types */
function isSubject(obj) {
  return isTerm(obj) && (obj.termType === _types.NamedNodeTermType || obj.termType === _types.VariableTermType || obj.termType === _types.BlankNodeTermType);
}

/** TypeGuard for valid RDF/JS spec Predicate types */
function isPredicate(obj) {
  return isTerm(obj) && (obj.termType === _types.NamedNodeTermType || obj.termType === _types.VariableTermType);
}

/** TypeGuard for valid RDF/JS spec Object types */
function isRDFObject(obj) {
  return isTerm(obj) && (obj.termType === _types.NamedNodeTermType || obj.termType === _types.VariableTermType || obj.termType === _types.BlankNodeTermType || obj.termType === _types.LiteralTermType);
}

/** TypeGuard for valid RDF/JS Graph types */
function isGraph(obj) {
  return isTerm(obj) && (obj.termType === _types.NamedNodeTermType || obj.termType === _types.VariableTermType || obj.termType === _types.BlankNodeTermType || obj.termType === _types.DefaultGraphTermType);
}