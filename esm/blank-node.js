import _defineProperty from "@babel/runtime/helpers/defineProperty";
import ClassOrder from './class-order';
import Node from './node-internal';
import { BlankNodeTermType } from './types';
/**
 * An RDF blank node is a Node without a URI
 * @link https://rdf.js.org/data-model-spec/#blanknode-interface
 */
export default class BlankNode extends Node {
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
    _defineProperty(this, "termType", BlankNodeTermType);
    _defineProperty(this, "classOrder", ClassOrder.BlankNode);
    /** Whether this is a blank node */
    _defineProperty(this, "isBlank", 1);
    /**
     * This type of node is a variable.
     *
     * Note that the existence of this property already indicates that it is a variable.
     */
    _defineProperty(this, "isVar", 1);
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
/**
 * The next unique identifier for blank nodes
 */
_defineProperty(BlankNode, "nextId", 0);
_defineProperty(BlankNode, "NTAnonymousNodePrefix", '_:');