import BlankNode from './blank-node'
import Literal from './literal'
import NamedNode from './named-node'
import Statement from './statement'
import Variable from './variable'
import {
  TFNamedNode,
  SubjectType,
  PredicateType,
  ObjectType,
  GraphType,
  TermType,
  TFTerm,
} from './types'
import { defaultGraphNode } from './utils/default-graph-uri'
import { DataFactory, DefaultFactoryTypes, Feature } from './data-factory-type'
import Node from './node-internal'
import Collection from './collection'

export { defaultGraphURI } from './utils/default-graph-uri'

/**
 * Gets the default graph
 */
export function defaultGraph(): NamedNode {
  return defaultGraphNode
}

/** The internal RDFlib datafactory, which uses Collections  */
const CanonicalDataFactory: DataFactory<
  DefaultFactoryTypes & Collection & Variable
> = {

  supports: {
    [Feature.collections]: false,
    [Feature.defaultGraphType]: true,
    [Feature.equalsMethod]: true,
    [Feature.identity]: false,
    [Feature.id]: true,
    [Feature.reversibleId]: false,
    [Feature.variableType]: true,
  },


  /**
   * Creates a new blank node
   * @param value The blank node's identifier
   */
  blankNode(value?: string): BlankNode {
    return new BlankNode(value)
  },

  defaultGraph,

  /**
   * Generates a uniquely identifiably idempotent string for the given {term}.
   *
   * Equivalent to {Term.hashString}
   *
   * @example Use this to associate data with a term in an object
   *   { obj[id(term)] = "myData" }
   */
  id (term: TFTerm): string {
    if (!term) {
      return term
    }
    if (typeof term === "object" && term !== null && "id" in term && typeof term['id'] === "function") {
      return (term as NamedNode).id()
    }
    if (Object.prototype.hasOwnProperty.call(term, "hashString")) {
      return (term as Node).hashString()
    }

    switch (term.termType) {
      case TermType.BlankNode:
        return '_:' + term.value
      case TermType.Collection:
        return Collection.toNT(term)
      case TermType.DefaultGraph:
        return 'defaultGraph'
      case TermType.Empty:
        return '()'
      case TermType.Literal:
        return Literal.toNT(term as Literal)
      case TermType.NamedNode:
        return '<' + term.value + '>'
      case TermType.Variable:
        return Variable.toString(term)
      default:
        throw new Error(`Can't id term with type '${term.termType}', add 'id' on your instance to override`)
    }
  },

  /**
   * Creates a new literal node
   * @param value The lexical value
   * @param languageOrDatatype Either the language or the datatype
   */
  literal(
    value: string,
    languageOrDatatype?: string | TFNamedNode
  ): Literal {
    if (typeof value !== "string" && !languageOrDatatype) {
      return Literal.fromValue(value) as Literal
    }

    const strValue = typeof value === 'string' ? value : '' + value
    if (typeof languageOrDatatype === 'string') {
      if (languageOrDatatype.indexOf(':') === -1) {
        return new Literal(strValue, languageOrDatatype)
      } else {
        return new Literal(strValue, null, this.namedNode(languageOrDatatype))
      }
    } else {
      return new Literal(strValue, null, languageOrDatatype)
    }
  },

  /**
   * Creates a new named node
   * @param value The new named node
   */
  namedNode(value: string): NamedNode {
    return new NamedNode(value)
  },

  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   * @param graph The containing graph
   */
  quad(
    subject: TFTerm | SubjectType,
    predicate: TFTerm | PredicateType,
    object: TFTerm | ObjectType,
    graph?: TFTerm | GraphType
  ): Statement {
    graph = graph || defaultGraph()
    return new Statement(subject, predicate, object, graph)
  },

  /**
   * Creates a new variable
   * @param name The name for the variable
   */
  variable(name?: string): Variable {
    return new Variable(name)
  },
}

/** Contains the factory methods as defined in the spec, plus id */
export default CanonicalDataFactory
