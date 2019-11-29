import BlankNode from './blank-node'
import Collection from './collection'
import DefaultGraph from './default-graph'
import Empty from './empty'
import NamedNode from './named-node'
import Node from './node-internal'
import IndexedFormula from './store'
import Variable from './variable'

/** A Statement represents an RDF Triple or Quad. */
export default class Statement {
  /** The subject of the triple.  What the Statement is about. */
  subject: NamedNode | BlankNode | Variable

  /** The relationship which is asserted between the subject and object */
  predicate: NamedNode | Variable

  /** The thing or data value which is asserted to be related to the subject */
  object: NamedNode | BlankNode | Collection | Empty | Variable

  /**
   * The graph param is a named node of the document in which the triple when
   *  it is stored on the web.
   */
  graph: NamedNode | DefaultGraph | IndexedFormula


  /**
   * Construct a new statement
   *
   * @param subject - The subject of the triple.  What the fact is about
   * @param predicate - The relationship which is asserted between the subject and object
   * @param object - The thing or data value which is asserted to be related to the subject
   * @param {NamedNode} graph - The document where the triple is or was or will be stored on the web.
   *
   * The graph param is a named node of the document in which the triple when it is stored
   *  on the web. It exists because when you have read data from various places in the web,
   *  the “graph” tells you _why_ you have the triple. (At the moment, it is just the
   *  document, in future it could be an inference step)
   *
   * When you do UpdateManager.update() then the graph’s of all the statements must be the same,
   *  and give the document you are patching. In future, we may have a more
   *  powerful update() which can update more than one document.
   */
  constructor (subject, predicate, object, graph) {
    this.subject = Node.fromValue(subject)
    this.predicate = Node.fromValue(predicate)
    this.object = Node.fromValue(object)
    this.graph = graph  // property currently used by rdflib
  }

  /** @deprecated use {graph} instead */
  get why () {
    return this.graph
  }

  set why (g) {
    this.graph = g
  }

  /**
   * Checks whether two statements are the same
   * @param other - The other statement
   */
  equals (other): boolean {
    return other.subject.equals(this.subject) && other.predicate.equals(this.predicate) &&
      other.object.equals(this.object) && other.graph.equals(this.graph)
  }

  /**
   * Creates a statement with the bindings substituted
   * @param bindings - The bindings
   */
  substitute (bindings): Statement {
    const y = new Statement(
      this.subject.substitute(bindings),
      this.predicate.substitute(bindings),
      this.object.substitute(bindings),
      this.graph.substitute(bindings)) // 2016
    console.log('@@@ statement substitute:' + y)
    return y
  }

  /** Creates a canonical string representation of this statement. */
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

  /** Creates a n-triples string representation of this statement */
  toNT (): string {
    return [
      this.subject.toNT(),
      this.predicate.toNT(),
      this.object.toNT(),
    ].join(' ') + ' .'
  }

  /** Creates a n-quads string representation of this statement */
  toNQ (): string {
    return [
      this.subject.toNT(),
      this.predicate.toNT(),
      this.object.toNT(),
      this.graph.toNT(),
    ].join(' ') + ' .'
  }

  /** Creates a string representation of this statement */
  toString (): string {
    return this.toNT()
  }
}
