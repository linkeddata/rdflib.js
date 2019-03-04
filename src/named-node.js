'use strict'
const ClassOrder = require('./class-order')
const Term = require('./term')

/**
 * @class NamedNode
 * @extends Term
 */
class NamedNode extends Term {
  /**
   * @constructor
   * @param iri {String}
   */
  constructor (iri) {
    super()
    this.termType = NamedNode.termType

    if (iri && iri.termType === NamedNode.termType) {  // param is a named node
      iri = iri.value
    }

    if (!iri) {
      throw new Error('Missing IRI for NamedNode')
    }

    if (!iri.includes(':')) {
      throw new Error('NamedNode IRI "' + iri + '" must be absolute.')
    }

    if (iri.includes(' ')) {
      var message = 'Error: NamedNode IRI "' + iri + '" must not contain unencoded spaces.'
      throw new Error(message)
    }

    const existing = Term.nsMap[iri]
    if (existing) {
      return existing
    }

    this.value = iri
  }
  /**
   * Returns an $rdf node for the containing directory, ending in slash.
   */
   dir () {
     var str = this.uri.split('#')[0]
     var p = str.slice(0, -1).lastIndexOf('/')
     var q = str.indexOf('//')
     if ((q >= 0 && p < q + 2) || p < 0) return null
     return Term.namedNodeByIRI(str.slice(0, p + 1))
   }
   /**
    * Returns an NN for the whole web site, ending in slash.
    * Contrast with the "origin" which does NOT have a trailing slash
    */
   site () {
     var str = this.uri.split('#')[0]
     var p = str.indexOf('//')
     if (p < 0) throw new Error('This URI does not have a web site part (origin)')
     var q = str.indexOf('/', p+2)
     if (q < 0) throw new Error('This URI does not have a web site part. (origin)')
     return Term.namedNodeByIRI(str.slice(0, q + 1))
   }
  doc () {
    if (this.uri.indexOf('#') < 0) {
      return this
    } else {
      return Term.namedNodeByIRI(this.uri.split('#')[0])
    }
  }

  generateString () {
     return '<' + this.uri + '>'
  }

  /**
   * Legacy getter and setter alias, node.uri
   */
  get uri () {
    return this.value
  }
  set uri (uri) {
    this.value = uri
  }
  static fromValue (value) {
    return Term.namedNodeByIRI(value)
  }
}
NamedNode.termType = 'NamedNode'
NamedNode.prototype.classOrder = ClassOrder['NamedNode']
NamedNode.prototype.isVar = 0

module.exports = NamedNode
