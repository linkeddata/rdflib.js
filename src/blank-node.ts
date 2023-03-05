import ClassOrder from './class-order'
import Node from './node-internal'
import IndexedFormula from './store'
import { BlankNodeTermType } from './types'
import { BlankNode as TFBlankNode } from './tf-types'

/**
 * An RDF blank node is a Node without a URI
 * @link https://rdf.js.org/data-model-spec/#blanknode-interface
 */
export default class BlankNode extends Node implements TFBlankNode {
  termType: typeof BlankNodeTermType = BlankNodeTermType;
  /**
   * The next unique identifier for blank nodes
   */
  static nextId: number = 0;
  static NTAnonymousNodePrefix: '_:' = '_:'

  private static getId (id: string | unknown): string {
    if (id) {
      if (typeof id !== 'string') {
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
  isBlank: number = 1
  /**
   * This type of node is a variable.
   *
   * Note that the existence of this property already indicates that it is a variable.
   */
  isVar = 1

  /**
   * Initializes this node
   * @param [id] The identifier for the blank node
   */
  constructor (id?: string | unknown) {
    super(BlankNode.getId(id))
  }

  /**
   * The identifier for the blank node
   */
  public get id (): string {
    return this.value
  }

  public set id (value: string) {
    this.value = value
  }

  compareTerm (other: BlankNode): number {
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

  /**
   * Gets a copy of this blank node in the specified formula
   * @param formula The formula
   */
  copy (formula: IndexedFormula): BlankNode { // depends on the formula
    var bnodeNew = new BlankNode()
    formula.copyTo(this, bnodeNew)
    return bnodeNew
  }

  toCanonical () {
    return BlankNode.NTAnonymousNodePrefix + this.value
  }

  toString () {
    return BlankNode.NTAnonymousNodePrefix + this.id
  }
}
