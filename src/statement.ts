import Node from './node-internal'
import {
  Bindings,
  GraphType,
  ObjectType,
  PredicateType,
  SubjectType,
  DefaultGraphTermType,
} from './types'
import { defaultGraphNode } from './utils/default-graph-uri'
import { Quad_Graph, Quad_Object, Quad_Predicate, Quad, Quad_Subject, Term } from './tf-types'

/** A Statement represents an RDF Triple or Quad. */
export default class Statement implements Quad<SubjectType, PredicateType, ObjectType, GraphType> {
  /** The subject of the triple.  What the Statement is about. */
  subject: SubjectType

  /** The relationship which is asserted between the subject and object */
  predicate: PredicateType

  /** The thing or data value which is asserted to be related to the subject */
  object: ObjectType

  /**
   * The graph param is a named node of the document in which the triple when
   *  it is stored on the web.
   */
  graph: GraphType

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
  constructor (
    subject: Quad_Subject | Term,
    predicate: Quad_Predicate | Term,
    object: Quad_Object | Term,
    graph?: Quad_Graph | Term,
  ) {
    this.subject = Node.fromValue(subject)
    this.predicate = Node.fromValue(predicate)
    this.object = Node.fromValue(object)
    this.graph = graph == undefined ? defaultGraphNode : Node.fromValue(graph) // property currently used by rdflib
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
  equals (other: Quad): boolean {
    return (
      other.subject.equals(this.subject) &&
      other.predicate.equals(this.predicate) &&
      other.object.equals(this.object) &&
      other.graph.equals(this.graph)
    )
  }

  /**
   * Creates a statement with the bindings substituted
   * @param bindings The bindings
   */
  substitute (bindings: Bindings): Statement {
    const y = new Statement(
      this.subject.substitute(bindings),
      this.predicate.substitute(bindings),
      this.object.substitute(bindings),
      this.graph.substitute<GraphType>(bindings),
    ) // 2016
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
    if (this.graph && this.graph.termType !== DefaultGraphTermType) {
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
