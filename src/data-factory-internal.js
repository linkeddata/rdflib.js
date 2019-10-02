import BlankNode from './blank-node'
import Literal from './literal'
import NamedNode from './named-node'
import Statement from './statement'
import Variable from './variable'

export const defaultGraphURI = 'chrome:theSession'

function blankNode (value) {
  return new BlankNode(value)
}

function defaultGraph () {
  return new NamedNode(defaultGraphURI)
}

/**
 * Generates a unique identifier for the object.
 *
 * Equivalent to {Term.hashString}
 */
function id (term) {
  if (!term) {
    return term
  }
  if (Object.prototype.hasOwnProperty.call(term, "id") && typeof term.id === "function") {
    return term.id()
  }
  if (Object.prototype.hasOwnProperty.call(term, "hashString")) {
    return term.hashString()
  }

  switch (term.termType) {
    case "NamedNode":
      return '<' + term.value + '>'
    case "BlankNode":
      return '_:' + term.value
    case "Literal":
      return Literal.toNT(term)
    case "Variable":
      return Variable.toString(term)
    default:
      return undefined
  }
}

function literal (value, languageOrDatatype) {
  if (typeof value !== "string" && !languageOrDatatype) {
    return Literal.fromValue(value)
  }

  const strValue = typeof value === 'string' ? value : '' + value
  if (typeof languageOrDatatype === 'string') {
    if (languageOrDatatype.indexOf(':') === -1) {
      return new Literal(strValue, languageOrDatatype)
    } else {
      return new Literal(strValue, null, namedNode(languageOrDatatype))
    }
  } else {
    return new Literal(strValue, null, languageOrDatatype)
  }
}
function namedNode (value) {
  return new NamedNode(value)
}
function quad (subject, predicate, object, graph) {
  graph = graph || defaultGraph()
  return new Statement(subject, predicate, object, graph)
}
function variable (name) {
  return new Variable(name)
}

/** Contains the factory methods as defined in the spec, plus id */
export default {
  blankNode,
  defaultGraph,
  literal,
  namedNode,
  quad,
  variable,
  id,
  supports: {
    COLLECTIONS: false,
    DEFAULT_GRAPH_TYPE: true,
    EQUALS_METHOD: true,
    NODE_LOOKUP: false,
    VARIABLE_TYPE: true,
  }
}
