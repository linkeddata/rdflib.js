'use strict'
import ClassOrder from './class-order'
import Node from './node-internal'
import { TermType } from './types'

export default class BlankNode extends Node {
  static termType = TermType.BlankNode
  static NTAnonymousNodePrefix = '_:'
  /** The next unique identifier for blank nodes */
  static nextId = 0

  private static getId (id: string | unknown): string {
    if (id) {
      if (typeof id !== 'string') {
        console.log('Bad blank id:', id)
        throw new Error('Bad id argument to new blank node: ' + id)
      }

      if (id.includes('#')) {
        // Is a URI with hash fragment
        let fragments = id.split('#')
        return fragments[fragments.length - 1]
      }

      return id
    }

    return 'n' + BlankNode.nextId++
  }

  classOrder = ClassOrder.BlankNode
  /** Whether this is a blank node */
  isBlank = 1
  /**
   * This type of node is a variable.
   *
   * Note that the existence of this property already indicates that it is a variable.
   */
  isVar = 1
  termType = BlankNode.termType

  /**
   * Initializes this node
   * @param [id] - The identifier for the blank node
   */
  constructor (id?: string | unknown) {
    super(BlankNode.getId(id))
  }

  /**
   * The identifier for the blank node
   * @deprecated use {value} instead.
   */
  public get id (): string {
    return this.value
  }

  public set id (value: string) {
    this.value = value
  }

  compareTerm (other) {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.id < other.id) {
      return -1
    }
    if (this.id > other.id) {
      return +1
    }
    return 0
  }

  copy (formula) { // depends on the formula
    var bnodeNew = new BlankNode()
    formula.copyTo(this, bnodeNew)
    return bnodeNew
  }

  toCanonical () {
    return '_:' + this.value
  }

  toString () {
    return BlankNode.NTAnonymousNodePrefix + this.id
  }
}
