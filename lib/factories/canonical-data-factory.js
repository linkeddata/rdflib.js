"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
Object.defineProperty(exports, "defaultGraphURI", {
  enumerable: true,
  get: function get() {
    return _defaultGraphUri.defaultGraphURI;
  }
});

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _blankNode = _interopRequireDefault(require("../blank-node"));

var _literal = _interopRequireDefault(require("../literal"));

var _namedNode = _interopRequireDefault(require("../named-node"));

var _statement = _interopRequireDefault(require("../statement"));

var _variable = _interopRequireDefault(require("../variable"));

var _types = require("../types");

var _defaultGraph2 = _interopRequireDefault(require("../default-graph"));

var _factoryTypes = require("./factory-types");

var _terms = require("../utils/terms");

var _defaultGraphUri = require("../utils/default-graph-uri");

var _supports;

/**
 * Gets the default graph
 */
var _defaultGraph = new _defaultGraph2.default();
/** A basic internal RDFlib datafactory, which does not support Collections  */


var CanonicalDataFactory = {
  supports: (_supports = {}, (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.collections, false), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.defaultGraphType, false), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.equalsMethod, true), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.identity, false), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.id, true), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.reversibleId, false), (0, _defineProperty2.default)(_supports, _factoryTypes.Feature.variableType, true), _supports),

  /**
   * Creates a new blank node
   * @param value - The blank node's identifier
   */
  blankNode: function blankNode(value) {
    return new _blankNode.default(value);
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

    if ((0, _terms.isQuad)(a) || (0, _terms.isQuad)(b)) {
      if ((0, _terms.isQuad)(a) && (0, _terms.isQuad)(b)) {
        return this.equals(a.subject, b.subject) && this.equals(a.predicate, b.predicate) && this.equals(a.object, b.object) && this.equals(a.graph, b.graph);
      }

      return false;
    }

    if ((0, _terms.isTerm)(a) && (0, _terms.isTerm)(b)) {
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

    if ((0, _terms.isQuad)(term)) {
      return this.quadToNQ(term);
    }

    switch (term.termType) {
      case _types.DefaultGraphTermType:
        return 'defaultGraph';

      case _types.VariableTermType:
        return _variable.default.toString(term);

      default:
        var nq = this.termToNQ(term);

        if (nq) {
          return nq;
        }

        throw new Error("Can't id term with type '".concat(term.termType, "'"));
    }
  },
  isQuad: function isQuad(obj) {
    return obj instanceof _statement.default;
  },

  /**
   * Creates a new literal node. Does some JS literal parsing for ease of use.
   * @param value - The lexical value
   * @param languageOrDatatype - Either the language or the datatype
   */
  literal: function literal(value, languageOrDatatype) {
    if (typeof value !== "string" && !languageOrDatatype) {
      return _literal.default.fromValue(value);
    }

    var strValue = typeof value === 'string' ? value : '' + value;

    if (typeof languageOrDatatype === 'string') {
      if (languageOrDatatype.indexOf(':') === -1) {
        return new _literal.default(strValue, languageOrDatatype);
      } else {
        return new _literal.default(strValue, null, this.namedNode(languageOrDatatype));
      }
    } else {
      return new _literal.default(strValue, null, languageOrDatatype);
    }
  },

  /**
   * Creates a new named node
   * @param value - The new named node
   */
  namedNode: function namedNode(value) {
    return new _namedNode.default(value);
  },

  /**
   * Creates a new statement
   * @param subject - The subject
   * @param predicate - The predicate
   * @param object - The object
   * @param graph - The containing graph
   */
  quad: function quad(subject, predicate, object, graph) {
    return new _statement.default(subject, predicate, object, graph || _defaultGraph);
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
      case _types.BlankNodeTermType:
        return '_:' + term.value;

      case _types.DefaultGraphTermType:
        return '';

      case _types.EmptyTermType:
        return '<http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>';

      case _types.LiteralTermType:
        return _literal.default.toNT(term);

      case _types.GraphTermType:
      case _types.NamedNodeTermType:
        return '<' + term.value + '>';

      case _types.CollectionTermType:
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
    return new _variable.default(name);
  }
};
/** Contains the factory methods as defined in the spec, plus id */

var _default = CanonicalDataFactory;
exports.default = _default;