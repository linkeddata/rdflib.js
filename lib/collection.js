"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.fromValue = fromValue;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _blankNode = _interopRequireDefault(require("./blank-node"));
var _classOrder = _interopRequireDefault(require("./class-order"));
var _literal = _interopRequireDefault(require("./literal"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
var _terms = require("./utils/terms");
/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * Arrays return Collections.
 * Strings, numbers and booleans return Literals.
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
function fromValue(value) {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }
  if ((0, _terms.isTerm)(value)) {
    // a Node subclass or a Collection
    return value;
  }
  if (Array.isArray(value)) {
    return new Collection(value);
  }
  return _literal.default.fromValue(value);
}

/**
 * A collection of other RDF nodes
 *
 * Use generic T to control the contents of the array.
 */
class Collection extends _nodeInternal.default {
  constructor(initial) {
    super((_blankNode.default.nextId++).toString());
    (0, _defineProperty2.default)(this, "termType", _types.CollectionTermType);
    (0, _defineProperty2.default)(this, "classOrder", _classOrder.default.Collection);
    (0, _defineProperty2.default)(this, "closed", false);
    (0, _defineProperty2.default)(this, "compareTerm", _blankNode.default.prototype.compareTerm);
    /**
     * The nodes in this collection
     */
    (0, _defineProperty2.default)(this, "elements", []);
    (0, _defineProperty2.default)(this, "isVar", 0);
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
    return _blankNode.default.NTAnonymousNodePrefix + collection.id;
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
exports.default = Collection;
(0, _defineProperty2.default)(Collection, "termType", _types.CollectionTermType);