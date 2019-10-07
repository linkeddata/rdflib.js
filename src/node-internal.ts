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
  isVar!: boolean | 1 | 0;

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

  // /**
  //  * Creates an RDF Node from a native javascript value.
  //  * RDF Nodes are returned unchanged, undefined returned as itself.
  //  * @method fromValue
  //  * @param value - Any native Javascript value
  //  */
  // static fromValue (value: ValueType | null): Node | Literal | undefined | null | Collection {
  //   if (typeof value === 'undefined' || value === null) {
  //     return value
  //   }
  //   const isNode = Object.prototype.hasOwnProperty.call(value, 'termType')
  //   if (isNode) {  // a Node subclass or a Collection
  //     // @ts-ignore
  //     return value
  //   }
  //   if (Array.isArray(value)) {
  //     return new Collection(value)
  //   }
  //   return Literal.fromValue(value)
  // }

  // /**
  //  * Gets the javascript object equivalent to a node
  //  * @param term The RDF node
  //  */
  // static toJS (term: Node | Literal) {
  //   if (term.elements) {
  //     return term.elements.map(Node.toJS) // Array node (not standard RDFJS)
  //   }
  //   // Node remains Node
  //   if (!term.hasOwnProperty('dataType')) {
  //     return term
  //   }
  //   const literalTerm = term as Literal
  //   // if (!Object.prototype.hasOwnProperty.call(term, 'dataType')) return term // Objects remain objects
  //   if (literalTerm.datatype.sameTerm(ns.xsd('boolean'))) {
  //     return literalTerm.value === '1'
  //   }
  //   if (literalTerm.datatype.sameTerm(ns.xsd('dateTime')) ||
  //     literalTerm.datatype.sameTerm(ns.xsd('date'))) {
  //     return new Date(literalTerm.value)
  //   }
  //   if (
  //     literalTerm.datatype.sameTerm(ns.xsd('integer')) ||
  //     literalTerm.datatype.sameTerm(ns.xsd('float')) ||
  //     literalTerm.datatype.sameTerm(ns.xsd('decimal'))
  //   ) {
  //     let z = Number(literalTerm.value)
  //     return Number(literalTerm.value)
  //   }
  //   return literalTerm.value
  // }
}
