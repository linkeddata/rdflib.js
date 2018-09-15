'use strict'
const Node = require('./node')

class Statement {
  /* Construct a new statment
  **
  ** @param {Term} subject - The subject of the triple.  What the efact is about
  ** @ param {Term} predciate - The relationship which is assrted between the subject and object
  ** @param {Term} object - The thing or data value which is asserted to be related to the subject
  ** @param {NamedNode} why - The document where thr triple is or was or will be stored on the web.
  **
  ** The why param is a named node of the document in which the triple when
  ** it is stored on the web.
  ** It is called “why” because when you have read data from varou slaces the
  **  “why” tells you why you have the triple. (At the moment, it is just the
  ** document, in future it could be an inference step). When you do
  ** UpdateManager.update() then the why’s of all the statmemts must be the same,
  ** and give the document you are patching. In future, we may have a more
  ** powerful update() which can update more than one docment.
  */
  constructor (subject, predicate, object, graph) {
    this.subject = Node.fromValue(subject)
    this.predicate = Node.fromValue(predicate)
    this.object = Node.fromValue(object)
    this.why = graph  // property currently used by rdflib
  }
  get graph () {
    return this.why
  }
  set graph (g) {
    this.why = g
  }
  equals (other) {
    return other.subject.equals(this.subject) && other.predicate.equals(this.predicate) &&
      other.object.equals(this.object) && other.graph.equals(this.graph)
  }
  substitute (bindings) {
    const y = new Statement(
      this.subject.substitute(bindings),
      this.predicate.substitute(bindings),
      this.object.substitute(bindings),
      this.why.substitute(bindings)) // 2016
    console.log('@@@ statement substitute:' + y)
    return y
  }
  toCanonical () {
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
  toNT () {
    return [this.subject.toNT(), this.predicate.toNT(),
      this.object.toNT()].join(' ') + ' .'
  }
  toString () {
    return this.toNT()
  }
}

module.exports = Statement
