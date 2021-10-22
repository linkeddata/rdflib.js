import _defineProperty from "@babel/runtime/helpers/defineProperty";

var _supports;

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

var _defaultGraph = new DefaultGraph();
/** A basic internal RDFlib datafactory, which does not support Collections  */


var CanonicalDataFactory = {
  supports: (_supports = {}, _defineProperty(_supports, Feature.collections, false), _defineProperty(_supports, Feature.defaultGraphType, false), _defineProperty(_supports, Feature.equalsMethod, true), _defineProperty(_supports, Feature.identity, false), _defineProperty(_supports, Feature.id, true), _defineProperty(_supports, Feature.reversibleId, false), _defineProperty(_supports, Feature.variableType, true), _supports),

  /**
   * Creates a new blank node
   * @param value - The blank node's identifier
   */
  blankNode: function blankNode(value) {
    return new BlankNode(value);
  },
  defaultGraph: function defaultGraph() {
    return _defaultGraph;
  },

  /**
   * Compares to (rdf) objects for equality.
   */
  equals: function equals(a, b) {
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
  id: function id(term) {
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
        var nq = this.termToNQ(term);

        if (nq) {
          return nq;
        }

        throw new Error("Can't id term with type '".concat(term.termType, "'"));
    }
  },
  isQuad: function isQuad(obj) {
    return obj instanceof Statement;
  },

  /**
   * Creates a new literal node. Does some JS literal parsing for ease of use.
   * @param value - The lexical value
   * @param languageOrDatatype - Either the language or the datatype
   */
  literal: function literal(value, languageOrDatatype) {
    if (typeof value !== "string" && !languageOrDatatype) {
      return Literal.fromValue(value);
    }

    var strValue = typeof value === 'string' ? value : '' + value;

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
  namedNode: function namedNode(value) {
    return new NamedNode(value);
  },

  /**
   * Creates a new statement
   * @param subject - The subject
   * @param predicate - The predicate
   * @param object - The object
   * @param graph - The containing graph
   */
  quad: function quad(subject, predicate, object, graph) {
    return new Statement(subject, predicate, object, graph || _defaultGraph);
  },

  /**
   * Creates a new statement
   * @param subject - The subject
   * @param predicate - The predicate
   * @param object - The object
   * @param graph - The containing graph
   */
  triple: function triple(subject, predicate, object, graph) {
    return this.quad(subject, predicate, object, graph);
  },
  quadToNQ: function quadToNQ(q) {
    return "".concat(this.termToNQ(q.subject), " ").concat(this.termToNQ(q.predicate), " ").concat(this.termToNQ(q.object), " ").concat(this.termToNQ(q.graph), " .");
  },

  /** Stringify a {term} to n-quads serialization. */
  termToNQ: function termToNQ(term) {
    var _this = this;

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
        return '(' + term.elements.map(function (t) {
          return _this.termToNQ(t);
        }).join(' ') + ')';

      default:
        throw new Error("Can't serialize nonstandard term type (was '".concat(term.termType, "')"));
    }
  },

  /** Convert an rdf object (term or quad) to n-quads serialization. */
  toNQ: function toNQ(term) {
    if (this.isQuad(term)) {
      return this.quadToNQ(term);
    }

    return this.termToNQ(term);
  },

  /**
   * Creates a new variable
   * @param name - The name for the variable
   */
  variable: function variable(name) {
    return new Variable(name);
  }
};
/** Contains the factory methods as defined in the spec, plus id */

export default CanonicalDataFactory;