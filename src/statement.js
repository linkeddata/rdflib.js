'use strict'
const term = require('./term')

class Statement {
  constructor (subject, predicate, object, graph) {
    this.subject = term(subject)
    this.predicate = term(predicate)
    this.object = term(object)
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
    return new Statement(
      this.subject.substitute(bindings),
      this.predicate.substitute(bindings),
      this.object.substitute(bindings),
      this.why)
  }
  toCanonical () {
    return this.toNT()
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
