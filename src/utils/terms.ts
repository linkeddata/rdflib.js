import {
  ObjectType, CollectionTermType, NamedNodeTermType, VariableTermType, BlankNodeTermType, LiteralTermType, GraphTermType, DefaultGraphTermType,
} from '../types'
import Collection from '../collection'
import IndexedFormula from '../store'
import Statement from '../statement'
import {
  BlankNode,
  Quad_Graph,
  Literal,
  NamedNode,
  Quad_Object,
  Quad_Predicate,
  Quad,
  Quad_Subject,
  Term,
  Variable,
} from '../tf-types'

/** TypeGuard for RDFLib Statements */
export function isStatement(obj): obj is Statement {
  return typeof obj === 'object' && obj !== null && 'subject' in obj
}

/** TypeGuard for RDFlib Stores */
export function isStore(obj): obj is IndexedFormula {
  return typeof obj === 'object' && obj !== null && 'statements' in obj
}

/** TypeGuard for RDFLib Collections */
export function isCollection(obj: any): obj is Collection<any> {
  return isTerm(obj)
    && (obj as Term).termType === CollectionTermType
}

/** TypeGuard for valid RDFlib Object types, also allows Collections, Graphs */
export function isRDFlibObject(obj: any): obj is ObjectType {
  return obj && Object.prototype.hasOwnProperty.call(obj, 'termType') && (
    obj.termType === NamedNodeTermType ||
    obj.termType === VariableTermType ||
    obj.termType === BlankNodeTermType ||
    obj.termType === CollectionTermType ||
    obj.termType === LiteralTermType ||
    obj.termType === GraphTermType
  )
}

/** TypeGuard for valid RDFlib Subject types, same as Object as RDFLib symmetrical.
*/
export function isRDFlibSubject(obj: any): obj is ObjectType {
  return obj && Object.prototype.hasOwnProperty.call(obj, 'termType') && (
    obj.termType === NamedNodeTermType ||
    obj.termType === VariableTermType ||
    obj.termType === BlankNodeTermType ||
    obj.termType === CollectionTermType ||
    obj.termType === LiteralTermType ||
    obj.termType === GraphTermType
  )
}

/** TypeGuard for valid RDF/JS spec Predicate types */
export function isRDFlibPredicate(obj: any): obj is Quad_Predicate {
  return isTerm(obj) && (
    obj.termType === NamedNodeTermType ||
    obj.termType === BlankNodeTermType ||
    obj.termType === VariableTermType
  )
}

/** TypeGuard for RDFLib Variables */
export function isVariable(obj: any): obj is Variable {
  return isTerm(obj)
    && (obj as Term).termType === VariableTermType
}

/** TypeGuard for RDF/JS spec Terms */
export function isTerm(obj: any): obj is Term {
  return typeof obj === 'object'
    && obj !== null
    && 'termType' in obj
}

/** TypeGuard for RDF/JS spec Literals */
export function isLiteral(value: any): value is Literal {
  return (value as Term).termType === LiteralTermType
}

/** TypeGuard for RDF/JS spec Quads */
export function isQuad(obj: any): obj is Quad<any, any, any, any> {
  return typeof obj === "object" && obj !== null && (
    'subject' in obj
    && 'predicate' in obj
    && 'object' in obj
  )
}

/** TypeGuard for RDF/JS spec NamedNodes */
export function isNamedNode(obj: any): obj is NamedNode {
  return isTerm(obj) && obj.termType === 'NamedNode'
}

/** TypeGuard for RDF/JS spec BlankNodes */
export function isBlankNode(obj: any): obj is BlankNode {
  return isTerm(obj) && 'termType' in obj && obj.termType === 'BlankNode'
}

/** TypeGuard for valid RDF/JS spec Subject types */
export function isSubject(obj: any): obj is Quad_Subject {
  return isTerm(obj) && (
    obj.termType === NamedNodeTermType ||
    obj.termType === VariableTermType ||
    obj.termType === BlankNodeTermType
  )
}

/** TypeGuard for valid RDF/JS spec Predicate types */
export function isPredicate(obj: any): obj is Quad_Predicate {
  return isTerm(obj) && (
    obj.termType === NamedNodeTermType ||
    obj.termType === VariableTermType
  )
}

/** TypeGuard for valid RDF/JS spec Object types */
export function isRDFObject(obj: any): obj is Quad_Object {
  return isTerm(obj) && (
    obj.termType === NamedNodeTermType ||
    obj.termType === VariableTermType ||
    obj.termType === BlankNodeTermType ||
    obj.termType === LiteralTermType
  )
}

/** TypeGuard for valid RDF/JS Graph types */
export function isGraph(obj: any): obj is Quad_Graph {
  return isTerm(obj) && (
    obj.termType === NamedNodeTermType ||
    obj.termType === VariableTermType ||
    obj.termType === BlankNodeTermType ||
    obj.termType === DefaultGraphTermType
  )
}
