"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

/**
 * The superclass of all RDF Statement objects, that is
 * NamedNode, Literal, BlankNode, etc.
 * Should not be instantiated directly.
 * Also called Term.
 * @link https://rdf.js.org/data-model-spec/#term-interface
 * @class Node
 */
var Node = /*#__PURE__*/function () {
  // Specified in './node.ts' to prevent circular dependency
  // Specified in './node.ts' to prevent circular dependency

  /** The type of node */

  /** The class order for this node */

  /** The node's value */
  function Node(value) {
    (0, _classCallCheck2.default)(this, Node);
    (0, _defineProperty2.default)(this, "termType", void 0);
    (0, _defineProperty2.default)(this, "classOrder", void 0);
    (0, _defineProperty2.default)(this, "value", void 0);
    this.value = value;
  }
  /**
   * Creates the substituted node for this one, according to the specified bindings
   * @param bindings - Bindings of identifiers to nodes
   */


  (0, _createClass2.default)(Node, [{
    key: "substitute",
    value: function substitute(bindings) {
      console.log('@@@ node substitute' + this);
      return this;
    }
    /**
     * Compares this node with another
     * @see {equals} to check if two nodes are equal
     * @param other - The other node
     */

  }, {
    key: "compareTerm",
    value: function compareTerm(other) {
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

  }, {
    key: "equals",
    value: function equals(other) {
      if (!other) {
        return false;
      }

      return this.termType === other.termType && this.value === other.value;
    }
    /**
     * Creates a hash for this node
     * @deprecated use {rdfFactory.id} instead if possible
     */

  }, {
    key: "hashString",
    value: function hashString() {
      return this.toCanonical();
    }
    /**
     * Compares whether this node is the same as the other one
     * @param other - Another node
     */

  }, {
    key: "sameTerm",
    value: function sameTerm(other) {
      return this.equals(other);
    }
    /**
     * Creates a canonical string representation of this node
     */

  }, {
    key: "toCanonical",
    value: function toCanonical() {
      return this.toNT();
    }
    /**
     * Creates a n-triples string representation of this node
     */

  }, {
    key: "toNT",
    value: function toNT() {
      return this.toString();
    }
    /**
     * Creates a n-quads string representation of this node
     */

  }, {
    key: "toNQ",
    value: function toNQ() {
      return this.toNT();
    }
    /**
     * Creates a string representation of this node
     */

  }, {
    key: "toString",
    value: function toString() {
      throw new Error('Node.toString() is abstract - see the subclasses instead');
    }
  }]);
  return Node;
}();

exports.default = Node;
(0, _defineProperty2.default)(Node, "fromValue", void 0);
(0, _defineProperty2.default)(Node, "toJS", void 0);