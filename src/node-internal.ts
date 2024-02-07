import { ValueType, Bindings, FromValueReturns, TermType } from './types'
import { Term } from './tf-types'

/**
 * The superclass of all RDF Statement objects, that is
 * NamedNode, Literal, BlankNode, etc.
 * Should not be instantiated directly.
 * Also called Term.
 * @link https://rdf.js.org/data-model-spec/#term-interface
 * @class Node
 */
export default abstract class Node {
  // Specified in './node.ts' to prevent circular dependency
  static fromValue: <T extends FromValueReturns>(value: ValueType) => T
  // Specified in './node.ts' to prevent circular dependency
  static toJS: (term: any) => Date | Number | string | boolean | object | Array<Date | Number | string | boolean | object>;

  /** The type of node */
  termType!: TermType;

  /** The class order for this node */
  classOrder!: number;

  /** The node's value */
  value: string;

  protected constructor(value: string) {
    this.value = value
  }

  /**
   * Creates the substituted node for this one, according to the specified bindings
   * @param bindings - Bindings of identifiers to nodes
   */
  substitute <T extends Node = Node>(bindings: Bindings): T {
    return this as unknown as T
  }

  /**
   * Compares this node with another
   * @see {equals} to check if two nodes are equal
   * @param other - The other node
   */
  compareTerm (other: Node): number {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.value < other.value) {
      return -1
    }
    if (this.value > other.value) {
      return +1
    }
    return 0
  }

  /**
   * Compares whether the two nodes are equal
   * @param other The other node
   */
  equals (other: Term | null | undefined): boolean {
    if (!other) {
      return false
    }
    return (this.termType === other.termType) &&
      (this.value === other.value)
  }

  /**
   * Creates a hash for this node
   * @deprecated use {rdfFactory.id} instead if possible
   */
  hashString (): string {
    return this.toCanonical()
  }

  /**
   * Compares whether this node is the same as the other one
   * @param other - Another node
   */
  sameTerm(other: Node): boolean {
    return this.equals(other)

  }

  /**
   * Creates a canonical string representation of this node
   */
  toCanonical (): string {
    return this.toNT()
  }

  /**
   * Creates a n-triples string representation of this node
   */
  toNT (): string {
    return this.toString()
  }

  /**
   * Creates a n-quads string representation of this node
   */
  toNQ (): string {
    return this.toNT();
  }

  /**
   * Creates a string representation of this node
   */
  toString (): string {
    throw new Error('Node.toString() is abstract - see the subclasses instead')
  }
}
