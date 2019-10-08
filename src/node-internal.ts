import { ValueType, Bindings } from './types'
import Collection from './collection'
import Literal from './literal'

/**
 * The superclass of all RDF Statement objects, that is
 * NamedNode, Literal, BlankNode, etc.
 * Also called Term.
 * @link https://rdf.js.org/data-model-spec/#term-interface
 * @class Node
 */
export default abstract class Node {
  /**
   * The nodes in this collection
   */
  elements!: Node[];

  /**
   * The type of node
   */
  termType!: string;

  /**
   * Whether this node is a variable
   */
  isVar!: boolean;

  /**
   * The class order for this node
   */
  classOrder!: number;

  /**
   * The node's value
   */
  value!: string;

  // Specified in './node.ts' to prevent circulur dependency
  static fromValue: (value: ValueType | null) => Node | Literal | undefined | null | Collection

  // Specified in './node.ts' to prevent circulur dependency
  static toJS: (term: Node | Literal) => any

  /**
   * Gets the substituted node for this one, according to the specified bindings
   * @param bindings Bindings of identifiers to nodes
   */
  substitute (bindings: Bindings): Node {
    console.log('@@@ node substitute' + this)
    return this
  }

  /**
   * Compares this node with another
   * @param term The other node
   */
  compareTerm (other: Node): number {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.value && this.value < other.value) {
      return -1
    }
    if (this.value && this.value > other.value) {
      return +1
    }
    return 0
  }

  /**
   * Gets whether the two nodes are equal
   * @param other The other node
   */
  equals (other: Node): boolean {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) &&
      (this.value === other.value)
  }

  /**
   * Gets a hash for this node
   */
  hashString (): string {
    return this.toCanonical()
  }

  /**
   * Gets whether this node is the same as the other one
   * @param other Another node
   */
  sameTerm(other: Node): boolean {
    return this.equals(other)
  }

  /**
   * Gets the canonical string representation of this node
   */
  toCanonical (): string {
    return this.toNT()
  }

  /**
   * Gets the n-triples string representation of this node
   */
  toNT (): string {
    return this.toString()
  }

  /**
   * Gets the string representation of this node
   */
  toString (): string {
    throw new Error('Node.toString() is abstract - see the subclasses instead')
  }
}
