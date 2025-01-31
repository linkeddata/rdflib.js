"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
/**
 * The superclass of all RDF Statement objects, that is
 * NamedNode, Literal, BlankNode, etc.
 * Should not be instantiated directly.
 * Also called Term.
 * @link https://rdf.js.org/data-model-spec/#term-interface
 * @class Node
 */
class Node {
  constructor(value) {
    /** The type of node */
    (0, _defineProperty2.default)(this, "termType", void 0);
    /** The class order for this node */
    (0, _defineProperty2.default)(this, "classOrder", void 0);
    /** The node's value */
    (0, _defineProperty2.default)(this, "value", void 0);
    this.value = value;
  }

  /**
   * Creates the substituted node for this one, according to the specified bindings
   * @param bindings - Bindings of identifiers to nodes
   */
  substitute(bindings) {
    return this;
  }

  /**
   * Compares this node with another
   * @see {equals} to check if two nodes are equal
   * @param other - The other node
   */
  compareTerm(other) {
    if (this.classOrder < other.classOrder) {
      return -1;
    }
    if (this.classOrder > other.classOrder) {
      return +1;
    }
    if (this.value < other.value) {
      return -1;
    }
    if (this.value > other.value) {
      return +1;
    }
    return 0;
  }

  /**
   * Compares whether the two nodes are equal
   * @param other The other node
   */
  equals(other) {
    if (!other) {
      return false;
    }
    return this.termType === other.termType && this.value === other.value;
  }

  /**
   * Creates a hash for this node
   * @deprecated use {rdfFactory.id} instead if possible
   */
  hashString() {
    return this.toCanonical();
  }

  /**
   * Compares whether this node is the same as the other one
   * @param other - Another node
   */
  sameTerm(other) {
    return this.equals(other);
  }

  /**
   * Creates a canonical string representation of this node
   */
  toCanonical() {
    return this.toNT();
  }

  /**
   * Creates a n-triples string representation of this node
   */
  toNT() {
    return this.toString();
  }

  /**
   * Creates a n-quads string representation of this node
   */
  toNQ() {
    return this.toNT();
  }

  /**
   * Creates a string representation of this node
   */
  toString() {
    throw new Error('Node.toString() is abstract - see the subclasses instead');
  }
}
exports.default = Node;
// Specified in './node.ts' to prevent circular dependency
(0, _defineProperty2.default)(Node, "fromValue", void 0);
// Specified in './node.ts' to prevent circular dependency
(0, _defineProperty2.default)(Node, "toJS", void 0);