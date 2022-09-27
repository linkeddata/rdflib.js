import RdflibBlankNode from './blank-node'
import ClassOrder from './class-order'
import Literal from './literal'
import Node from './node-internal'
import {
  Bindings,
  CollectionTermType,
  FromValueReturns,
  ValueType
} from './types'
import Variable from './variable'
import { isTerm } from './utils/terms'
import { Term } from './tf-types'

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * Arrays return Collections.
 * Strings, numbers and booleans return Literals.
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
export function fromValue <T extends FromValueReturns<C> = any, C extends Node = any>(value: ValueType): T {
  if (typeof value === 'undefined' || value === null) {
    return value as T
  }

  if (isTerm(value)) {  // a Node subclass or a Collection
    return value as T
  }

  if (Array.isArray(value)) {
    return new Collection<C>(value) as T
  }

  return Literal.fromValue<any>(value)
}

/**
 * A collection of other RDF nodes
 *
 * Use generic T to control the contents of the array.
 */
export default class Collection<
  T extends Node = Node | RdflibBlankNode | Collection<any> | Literal | Variable
> extends Node implements Term {
  static termType: typeof CollectionTermType = CollectionTermType
  termType: typeof CollectionTermType = CollectionTermType

  classOrder = ClassOrder.Collection
  closed: boolean = false
  compareTerm = RdflibBlankNode.prototype.compareTerm
  /**
   * The nodes in this collection
   */
  elements: T[] = []
  isVar = 0

  constructor (initial?: ReadonlyArray<ValueType>) {
    super((RdflibBlankNode.nextId++).toString())

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
  append (element: T): number {
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
  shift (): T | undefined {
    return this.elements.shift()
  }

  /**
   * Creates a new Collection with the substituting bindings applied
   * @param bindings - The bindings to substitute
   */
  substitute (bindings: Bindings) {
    const elementsCopy = this.elements.map((ea) => ea.substitute(bindings))

    return new Collection(elementsCopy) as Collection<Node | Collection<any> | Literal | Variable>
  }

  toNT () {
    return Collection.toNT(this)
  }

  static toNT (collection) {
    // return '(' + collection.elements.map(x => x.toNT()).join(' ') + ')'
    // As lists are not in NT and toNT() must be a reversible function, we kludge it for a list
    return RdflibBlankNode.NTAnonymousNodePrefix + collection.id
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
  unshift (element: T): number {
    return this.elements.unshift(element)
  }
}
