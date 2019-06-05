'use strict'
const ClassOrder = require('./class-order')
const Node = require('./node')

/**
 * @class NamedNode
 * @extends Node
 */
class NamedNode extends Node {
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
     return new NamedNode(str.slice(0, p + 1))
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
     if (q < 0) {
       return new NamedNode(str.slice(0) + '/')   // Add slash to a bare origin
     } else {
       return new NamedNode(str.slice(0, q + 1))
     }
   }
  doc () {
    if (this.uri.indexOf('#') < 0) {
      return this
    } else {
      return new NamedNode(this.uri.split('#')[0])
    }
  }
  toString () {
    return '<' + this.uri + '>'
  }

  /* The local identifier with the document
  */
  id () {
    return this.uri.split('#')[1]
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
    if (typeof value === 'undefined' || value === null) {
      return value
    }
    const isNode = value && value.termType
    if (isNode) {
      return value
    }
    return new NamedNode(value)
  }
}
NamedNode.termType = 'NamedNode'
NamedNode.prototype.classOrder = ClassOrder['NamedNode']
NamedNode.prototype.isVar = 0

module.exports = NamedNode
