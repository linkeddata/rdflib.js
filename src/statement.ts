import { Bindings, ValueType } from './types'
import Literal from './literal'
import Node from './node-internal'
import Collection from './collection'

/** A Statement represents an RDF Triple or Quad. */
export default class Statement {
  /** The subject of the triple.  What the Statement is about. */
  subject: Node;

  /** The relationship which is asserted between the subject and object */
  predicate: Node;

  /** The thing or data value which is asserted to be related to the subject */
  object: Node | Literal | Collection;

  /**
   * The why param is a named node of the document in which the triple when
   *  it is stored on the web.
   */
  why: Node;

  /**
   * Construct a new Triple Statment
   *
   * @param subject - The subject of the triple. What the Statement is about.
   * @param predicate - The relationship which is asserted between the subject and object.
   * @param object - The thing or data value which is asserted to be related to the subject.
   * @param why - The document where the triple is or was or will be stored on the web.
   *   The why param is a named node of the document in which the triple when
   *   it is stored on the web.
   *   It is called “why” because when you have read data from varou slaces the
   *    “why” tells you why you have the triple. (At the moment, it is just the
   *   document, in future it could be an inference step). When you do
   *   UpdateManager.update() then the why’s of all the statmemts must be the same,
   *   and give the document you are patching. In future, we may have a more
   *   powerful update() which can update more than one docment.
  */
  constructor (
    subject: Node,
    predicate: Node,
    object: Node | ValueType,
    why,
  ) {
    this.subject = Node.fromValue(subject) as Node
    this.predicate = Node.fromValue(predicate) as Node
    this.object = Node.fromValue(object) as Node
    this.why = why  // property currently used by rdflib
  }

  /**
   * The graph param is a named node of the document in which the triple is stored on the web.
   */
  get graph (): Node {
    return this.why
  }

  set graph (g) {
    this.why = g
  }

  /**
   * Gets whether two statements are the same
   * @param other The other statement
   */
  equals (other: Statement): boolean {
    return (
      other.subject.equals(this.subject) &&
      other.predicate.equals(this.predicate) &&
      other.object.equals(this.object as Literal) &&
      other.graph.equals(this.graph)
    )
  }

  /**
   * Gets this statement with the bindings substituted
   * @param bindings The bindings
   */
  substitute (bindings: Bindings): Statement {
    const y = new Statement(
      this.subject.substitute(bindings),
      this.predicate.substitute(bindings),
      this.object.substitute(bindings) as Node,
      this.why.substitute(bindings)) // 2016
    console.log('@@@ statement substitute:' + y)
    return y
  }

  /**
   * Gets the canonical string representation of this statement
   */
  toCanonical (): string {
    let terms = [
      this.subject.toCanonical(),
      this.predicate.toCanonical(),
      this.object.toCanonical()
    ]
    if (this.graph && this.graph.termType !== 'DefaultGraph') {
        terms.push(this.graph.toCanonical())
    }
    return terms.join(' ') + ' .'
  }

  /**
   * Gets the n-triples string representation of this statement
   */
  toNT (): string {
    return [this.subject.toNT(), this.predicate.toNT(),
      this.object.toNT()].join(' ') + ' .'
  }

  /**
   * Gets the string representation of this statement
   */
  toString (): string {
    return this.toNT()
  }
}
