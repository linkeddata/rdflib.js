import {
  ObjectType,
  TermType
} from '../types'
import Collection from '../collection'
import IndexedFormula from '../store'
import Statement from '../statement'
import NamedNode from '../named-node'
import Variable from '../variable'
import {
  TFBlankNode,
  TFGraph,
  TFLiteral, TFNamedNode,
  TFObject,
  TFPredicate,
  Quad,
  TFSubject, Term
} from '../tf-types'

export function isStatement(obj): obj is Statement {
  return typeof obj === 'object' && obj !== null && 'subject' in obj
}

/** TypeGuard for RDF/JS TaskForce Stores */
export function isStore(obj): obj is IndexedFormula {
  return typeof obj === 'object' && obj !== null && 'statements' in obj
}

export function isNamedNode(obj): obj is NamedNode {
  return isTerm(obj) && obj.termType === 'NamedNode'
}

/** TypeGuard for RDFLib Collections */
export function isCollection(obj: any): obj is Collection<any> {
  return isTerm(obj)
    && (obj as Term).termType === TermType.Collection
}

/** TypeGuard for valid RDFlib Object types, also allows Collections */
export function isRDFObject (obj: any): obj is ObjectType {
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
export function isTerm (obj: any): obj is Term {
  return typeof obj === 'object'
    && obj !== null
    && 'termType' in obj
}

/** TypeGuard for RDF/JS TaskForce Literals */
export function isTFLiteral (value: any): value is TFLiteral {
  return (value as Term).termType === TermType.Literal
}

/** TypeGuard for RDF/JS TaskForce Quads */
export function isQuad (obj: any): obj is Quad<any, any, any, any> {
  return typeof obj === "object" && obj !== null && (
    'subject' in obj
    && 'predicate' in obj
    && 'object' in obj
  )
}

/** TypeGuard for RDF/JS TaskForce NamedNodes */
export function isTFNamedNode (obj: any): obj is TFNamedNode {
  return isTerm(obj) && 'termType' in obj && obj.termType === 'NamedNode'
}

/** TypeGuard for RDF/JS TaskForce BlankNodes */
export function isTFBlankNode (obj: any): obj is TFBlankNode {
  return isTerm(obj) && 'termType' in obj && obj.termType === 'BlankNode'
}

/** TypeGuard for valid RDFJS Taskforce Subject types */
export function isTFSubject (obj: any): obj is TFSubject {
  return isTerm(obj) && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable ||
    obj.termType === TermType.BlankNode
  )
}

/** TypeGuard for valid RDFJS Taskforce Predicate types */
export function isTFPredicate (obj: any): obj is TFPredicate {
  return isTerm(obj) && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable
  )
}

/** TypeGuard for valid RDFJS Taskforce Object types */
export function isTFObject (obj: any): obj is TFObject {
  return isTerm(obj) && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable ||
    obj.termType === TermType.BlankNode ||
    obj.termType === TermType.Literal
  )
}

/** TypeGuard for valid RDFJS Graph types */
export function isTFGraph (obj: any): obj is TFGraph {
  return isTerm(obj) && (
    obj.termType === TermType.NamedNode ||
    obj.termType === TermType.Variable ||
    obj.termType === TermType.BlankNode ||
    obj.termType === TermType.DefaultGraph
  )
}
