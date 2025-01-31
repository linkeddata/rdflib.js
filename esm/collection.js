import _defineProperty from "@babel/runtime/helpers/defineProperty";
import RdflibBlankNode from './blank-node';
import ClassOrder from './class-order';
import Literal from './literal';
import Node from './node-internal';
import { CollectionTermType } from './types';
import { isTerm } from './utils/terms';
/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * Arrays return Collections.
 * Strings, numbers and booleans return Literals.
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
export function fromValue(value) {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }
  if (isTerm(value)) {
    // a Node subclass or a Collection
    return value;
  }
  if (Array.isArray(value)) {
    return new Collection(value);
  }
  return Literal.fromValue(value);
}

/**
 * A collection of other RDF nodes
 *
 * Use generic T to control the contents of the array.
 */
export default class Collection extends Node {
  constructor(initial) {
    super((RdflibBlankNode.nextId++).toString());
    _defineProperty(this, "termType", CollectionTermType);
    _defineProperty(this, "classOrder", ClassOrder.Collection);
    _defineProperty(this, "closed", false);
    _defineProperty(this, "compareTerm", RdflibBlankNode.prototype.compareTerm);
    /**
     * The nodes in this collection
     */
    _defineProperty(this, "elements", []);
    _defineProperty(this, "isVar", 0);
    if (initial && initial.length > 0) {
      initial.forEach(element => {
        this.elements.push(fromValue(element));
      });
    }
  }
  get id() {
    return this.value;
  }
  set id(value) {
    this.value = value;
  }

  /**
   * Appends an element to this collection
   * @param element - The new element
   */
  append(element) {
    return this.elements.push(element);
  }

  /**
   * Closes this collection
   */
  close() {
    this.closed = true;
    return this.closed;
  }

  /**
   * Removes the first element from the collection (and return it)
   */
  shift() {
    return this.elements.shift();
  }

  /**
   * Creates a new Collection with the substituting bindings applied
   * @param bindings - The bindings to substitute
   */
  substitute(bindings) {
    const elementsCopy = this.elements.map(ea => ea.substitute(bindings));
    return new Collection(elementsCopy);
  }
  toNT() {
    return Collection.toNT(this);
  }
  static toNT(collection) {
    // return '(' + collection.elements.map(x => x.toNT()).join(' ') + ')'
    // As lists are not in NT and toNT() must be a reversible function, we kludge it for a list
    return RdflibBlankNode.NTAnonymousNodePrefix + collection.id;
  }

  /**
   * Serializes the collection to a string.
   * Surrounded by (parentheses) and separated by spaces.
   */
  toString() {
    return '(' + this.elements.join(' ') + ')';
  }

  /**
   * Prepends the specified element to the collection's front
   * @param element - The element to prepend
   */
  unshift(element) {
    return this.elements.unshift(element);
  }
}
_defineProperty(Collection, "termType", CollectionTermType);