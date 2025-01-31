import BlankNode from '../blank-node';
import Literal from '../literal';
import NamedNode from '../named-node';
import Statement from '../statement';
import Variable from '../variable';
import { EmptyTermType, DefaultGraphTermType, VariableTermType, BlankNodeTermType, LiteralTermType, NamedNodeTermType, CollectionTermType, GraphTermType } from '../types';
import DefaultGraph from '../default-graph';
import { Feature } from './factory-types';
import { isQuad, isTerm } from '../utils/terms';
export { defaultGraphURI } from '../utils/default-graph-uri';

/**
 * Gets the default graph
 */
const defaultGraph = new DefaultGraph();

/** A basic internal RDFlib datafactory, which does not support Collections  */
const CanonicalDataFactory = {
  supports: {
    [Feature.collections]: false,
    [Feature.defaultGraphType]: false,
    [Feature.equalsMethod]: true,
    [Feature.identity]: false,
    [Feature.id]: true,
    [Feature.reversibleId]: false,
    [Feature.variableType]: true
  },
  /**
   * Creates a new blank node
   * @param value - The blank node's identifier
   */
  blankNode(value) {
    return new BlankNode(value);
  },
  defaultGraph: () => defaultGraph,
  /**
   * Compares to (rdf) objects for equality.
   */
  equals(a, b) {
    if (a === b || !a || !b) {
      return true;
    }
    if (isQuad(a) || isQuad(b)) {
      if (isQuad(a) && isQuad(b)) {
        return this.equals(a.subject, b.subject) && this.equals(a.predicate, b.predicate) && this.equals(a.object, b.object) && this.equals(a.graph, b.graph);
      }
      return false;
    }
    if (isTerm(a) && isTerm(b)) {
      return this.id(a) === this.id(b);
    }
    return false;
  },
  /**
   * Generates a uniquely identifiably *idempotent* string for the given {term}.
   *
   * Equivalent to [[Term.hashString]]
   *
   * @example Use this to associate data with a term in an object
   *   { obj[id(term)] = "myData" }
   */
  id(term) {
    if (!term) {
      return 'undefined';
    }
    if (isQuad(term)) {
      return this.quadToNQ(term);
    }
    switch (term.termType) {
      case DefaultGraphTermType:
        return 'defaultGraph';
      case VariableTermType:
        return Variable.toString(term);
      default:
        const nq = this.termToNQ(term);
        if (nq) {
          return nq;
        }
        throw new Error(`Can't id term with type '${term.termType}'`);
    }
  },
  isQuad(obj) {
    return obj instanceof Statement;
  },
  /**
   * Creates a new literal node. Does some JS literal parsing for ease of use.
   * @param value - The lexical value
   * @param languageOrDatatype - Either the language or the datatype
   */
  literal(value, languageOrDatatype) {
    if (typeof value !== "string" && !languageOrDatatype) {
      return Literal.fromValue(value);
    }
    const strValue = typeof value === 'string' ? value : '' + value;
    if (typeof languageOrDatatype === 'string') {
      if (languageOrDatatype.indexOf(':') === -1) {
        return new Literal(strValue, languageOrDatatype);
      } else {
        return new Literal(strValue, null, this.namedNode(languageOrDatatype));
      }
    } else {
      return new Literal(strValue, null, languageOrDatatype);
    }
  },
  /**
   * Creates a new named node
   * @param value - The new named node
   */
  namedNode(value) {
    return new NamedNode(value);
  },
  /**
   * Creates a new statement
   * @param subject - The subject
   * @param predicate - The predicate
   * @param object - The object
   * @param graph - The containing graph
   */
  quad(subject, predicate, object, graph) {
    return new Statement(subject, predicate, object, graph || defaultGraph);
  },
  /**
   * Creates a new statement
   * @param subject - The subject
   * @param predicate - The predicate
   * @param object - The object
   * @param graph - The containing graph
   */
  triple(subject, predicate, object, graph) {
    return this.quad(subject, predicate, object, graph);
  },
  quadToNQ(q) {
    return `${this.termToNQ(q.subject)} ${this.termToNQ(q.predicate)} ${this.termToNQ(q.object)} ${this.termToNQ(q.graph)} .`;
  },
  /** Stringify a {term} to n-quads serialization. */
  termToNQ(term) {
    switch (term.termType) {
      case BlankNodeTermType:
        return '_:' + term.value;
      case DefaultGraphTermType:
        return '';
      case EmptyTermType:
        return '<http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>';
      case LiteralTermType:
        return Literal.toNT(term);
      case GraphTermType:
      case NamedNodeTermType:
        return '<' + term.value + '>';
      case CollectionTermType:
        return '(' + term.elements.map(t => this.termToNQ(t)).join(' ') + ')';
      default:
        throw new Error(`Can't serialize nonstandard term type (was '${term.termType}')`);
    }
  },
  /** Convert an rdf object (term or quad) to n-quads serialization. */
  toNQ(term) {
    if (this.isQuad(term)) {
      return this.quadToNQ(term);
    }
    return this.termToNQ(term);
  },
  /**
   * Creates a new variable
   * @param name - The name for the variable
   */
  variable(name) {
    return new Variable(name);
  }
};

/** Contains the factory methods as defined in the spec, plus id */
export default CanonicalDataFactory;