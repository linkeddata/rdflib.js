import {
  ObjectType,
  TermType
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
    && (obj as Term).termType === TermType.Collection
}

/** TypeGuard for valid RDFlib Object types, also allows Collections */
export function isRDFlibObject(obj: any): obj is ObjectType {
  return obj && Object.prototype.hasOwnProperty.call(obj, 'termType') && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable ||
    obj.termType === TermType.BlankNode ||
    obj.termType === TermType.Collection ||
    obj.termType === TermType.Literal
  )
}

/** TypeGuard for RDFLib Variables */
export function isVariable(obj: any): obj is Variable {
  return isTerm(obj)
    && (obj as Term).termType === TermType.Variable
}

/** TypeGuard for RDF/JS TaskForce Terms */
export function isTerm(obj: any): obj is Term {
  return typeof obj === 'object'
    && obj !== null
    && 'termType' in obj
}

/** TypeGuard for RDF/JS TaskForce Literals */
export function isLiteral(value: any): value is Literal {
  return (value as Term).termType === TermType.Literal
}

/** TypeGuard for RDF/JS TaskForce Quads */
export function isQuad(obj: any): obj is Quad<any, any, any, any> {
  return typeof obj === "object" && obj !== null && (
    'subject' in obj
    && 'predicate' in obj
    && 'object' in obj
  )
}

/** TypeGuard for RDF/JS TaskForce NamedNodes */
export function isNamedNode(obj: any): obj is NamedNode {
  return isTerm(obj) && obj.termType === 'NamedNode'
}

/** TypeGuard for RDF/JS TaskForce BlankNodes */
export function isBlankNode(obj: any): obj is BlankNode {
  return isTerm(obj) && 'termType' in obj && obj.termType === 'BlankNode'
}

/** TypeGuard for valid RDFJS Taskforce Subject types */
export function isSubject(obj: any): obj is Quad_Subject {
  return isTerm(obj) && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable ||
    obj.termType === TermType.BlankNode
  )
}

/** TypeGuard for valid RDFJS Taskforce Predicate types */
export function isPredicate(obj: any): obj is Quad_Predicate {
  return isTerm(obj) && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable
  )
}

/** TypeGuard for valid RDFJS Taskforce Object types */
export function isRDFObject(obj: any): obj is Quad_Object {
  return isTerm(obj) && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable ||
    obj.termType === TermType.BlankNode ||
    obj.termType === TermType.Literal
  )
}

/** TypeGuard for valid RDFJS Graph types */
export function isGraph(obj: any): obj is Quad_Graph {
  return isTerm(obj) && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable ||
    obj.termType === TermType.BlankNode ||
    obj.termType === TermType.DefaultGraph
  )
}
