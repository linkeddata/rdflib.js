'use strict'
import BlankNode from './blank-node'
import ClassOrder from './class-order'
import Literal from "./literal";
import Node from './node-internal'
import { TermType } from './types';
import Variable from "./variable";

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
export function fromValue <T extends Node = any>(value) {
  if (typeof value === 'undefined' || value === null) {
    return value
  }
  const isNode = value && value.termType
  if (isNode) {  // a Node subclass or a Collection
    return value
  }

  if (Array.isArray(value)) {
    return new Collection<T>(value)
  }

  return Literal.fromValue(value)
}

/**
 * A collection of other RDF nodes
 *
 * Use generic T to control the contents of the array.
 */
export default class Collection<T extends Node = Node | BlankNode | Collection<any> | Literal | Variable> extends Node {
  static termType = TermType.Collection

  classOrder = ClassOrder.Collection
  closed: boolean = false
  compareTerm = BlankNode.prototype.compareTerm
  /**
   * The nodes in this collection
   */
  elements: T[] = []
  isVar = 0
  termType = TermType.Collection

  constructor (initial?) {
    super((BlankNode.nextId++).toString())

    if (initial && initial.length > 0) {
      initial.forEach(element => {
        this.elements.push(fromValue<T>(element))
      })
    }
  }

  public get id (): string {
    return this.value
  }

  public set id (value) {
    this.value = value
  }

  /**
   * Appends an element to this collection
   * @param element - The new element
   */
  append (element): number {
    return this.elements.push(element)
  }

  /**
   * Closes this collection
   */
  close (): boolean {
    this.closed = true
    return this.closed
  }

  /**
   * Removes the first element from the collection (and return it)
   */
  shift () {
    return this.elements.shift()
  }

  /**
   * Gets a new Collection with the substituting bindings applied
   * @param bindings - The bindings to substitute
   */
  substitute (bindings) {
    const elementsCopy = this.elements.map(function (ea) {
      ea.substitute(bindings)
    })

    return new Collection(elementsCopy)
  }

  toNT () {
    return Collection.toNT(this)
  }

  static toNT (collection) {
    return BlankNode.NTAnonymousNodePrefix + collection.id
  }

  /**
   * Serializes the collection to a string.
   * Surrounded by (parentheses) and separated by spaces.
   */
  toString () {
    return '(' + this.elements.join(' ') + ')'
  }

  /**
   * Prepends the specified element to the collection's front
   * @param element - The element to prepend
   */
  unshift (element) {
    return this.elements.unshift(element)
  }
}
