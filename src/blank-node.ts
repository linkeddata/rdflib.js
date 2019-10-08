import ClassOrder from './class-order'
import Node from './node-internal'
import { IndexedFormula } from './index';

/**
 * An RDF blank node is a Node without a URI
 * @link https://rdf.js.org/data-model-spec/#blanknode-interface
 */
export default class BlankNode extends Node {

  static termType: 'BlankNode';

  /**
   * The identifier for the blank node
   */
  id: string;

  /**
   * Whether this is a blank node
   */
  isBlank: boolean;

  /**
   * The next unique identifier for blank nodes
   */
  static nextId: number;
  static NTAnonymousNodePrefix: string;

  /**
   * Initializes this node
   * @param id The identifier for the blank node
   */
  constructor (id?: string) {
    super()
    this.termType = BlankNode.termType
    this.isBlank = true

    if (id) {
      if (typeof id !== 'string') {
        console.log('Bad blank id:', id)
        throw new Error('Bad id argument to new blank node: ' + id)
      }
      if (id.includes('#')) {
        // Is a URI with hash fragment
        let fragments = id.split('#')
        id = fragments[fragments.length - 1]
      }
      this.id = id
      // this.id = '' + BlankNode.nextId++
    } else {
      this.id = 'n' + BlankNode.nextId++
    }

    this.value = this.id
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
    return '_:' + this.value
  }

  toString () {
    return BlankNode.NTAnonymousNodePrefix + this.id
  }
}

BlankNode.nextId = 0
BlankNode.termType = 'BlankNode'
BlankNode.NTAnonymousNodePrefix = '_:'
BlankNode.prototype.classOrder = ClassOrder['BlankNode']
BlankNode.prototype.isBlank = true
BlankNode.prototype.isVar = true
