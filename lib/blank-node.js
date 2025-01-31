"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classOrder = _interopRequireDefault(require("./class-order"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
/**
 * An RDF blank node is a Node without a URI
 * @link https://rdf.js.org/data-model-spec/#blanknode-interface
 */
class BlankNode extends _nodeInternal.default {
  static getId(id) {
    if (id) {
      if (typeof id !== 'string') {
        throw new Error('Bad id argument to new blank node: ' + id);
      }
      if (id.includes('#')) {
        // Is a URI with hash fragment
        let fragments = id.split('#');
        return fragments[fragments.length - 1];
      }
      return id;
    }
    return 'n' + BlankNode.nextId++;
  }
  /**
   * Initializes this node
   * @param [id] The identifier for the blank node
   */
  constructor(id) {
    super(BlankNode.getId(id));
    (0, _defineProperty2.default)(this, "termType", _types.BlankNodeTermType);
    (0, _defineProperty2.default)(this, "classOrder", _classOrder.default.BlankNode);
    /** Whether this is a blank node */
    (0, _defineProperty2.default)(this, "isBlank", 1);
    /**
     * This type of node is a variable.
     *
     * Note that the existence of this property already indicates that it is a variable.
     */
    (0, _defineProperty2.default)(this, "isVar", 1);
  }

  /**
   * The identifier for the blank node
   */
  get id() {
    return this.value;
  }
  set id(value) {
    this.value = value;
  }
  compareTerm(other) {
    if (this.classOrder < other.classOrder) {
      return -1;
    }
    if (this.classOrder > other.classOrder) {
      return +1;
    }
    if (this.id < other.id) {
      return -1;
    }
    if (this.id > other.id) {
      return +1;
    }
    return 0;
  }

  /**
   * Gets a copy of this blank node in the specified formula
   * @param formula The formula
   */
  copy(formula) {
    // depends on the formula
    var bnodeNew = new BlankNode();
    formula.copyTo(this, bnodeNew);
    return bnodeNew;
  }
  toCanonical() {
    return BlankNode.NTAnonymousNodePrefix + this.value;
  }
  toString() {
    return BlankNode.NTAnonymousNodePrefix + this.id;
  }
}
exports.default = BlankNode;
/**
 * The next unique identifier for blank nodes
 */
(0, _defineProperty2.default)(BlankNode, "nextId", 0);
(0, _defineProperty2.default)(BlankNode, "NTAnonymousNodePrefix", '_:');