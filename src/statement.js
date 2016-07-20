'use strict'
const term = require('./term')

class Statement {
  constructor (subject, predicate, object, graph) {
    this.subject = term(subject)
    this.predicate = term(predicate)
    this.object = term(object)
    this.why = graph  // property currently used by rdflib
    this.graph = graph  // rdfjs property
  }
  substitute (bindings) {
    return new Statement(
      this.subject.substitute(bindings),
      this.predicate.substitute(bindings),
      this.object.substitute(bindings),
      this.why)
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
