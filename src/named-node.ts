'use strict'
import ClassOrder from './class-order'
import Node from './node-internal'
import { NamedNodeTermType, TermType, TFNamedNode } from './types'
import { termValue } from './utils/termValue'

/**
 * A named (IRI) RDF node
 */
export default class NamedNode extends Node implements TFNamedNode {
  static termType = TermType.NamedNode

  classOrder = ClassOrder.NamedNode
  termType: NamedNodeTermType = TermType.NamedNode

  /**
   * Create a named (IRI) RDF Node
   * @constructor
   * @param iri {String} - The IRI for this node
   */
  constructor (iri) {
    super(termValue(iri))

    if (!this.value) {
      throw new Error('Missing IRI for NamedNode')
    }

    if (!this.value.includes(':')) {
      throw new Error('NamedNode IRI "' + iri + '" must be absolute.')
    }

    if (this.value.includes(' ')) {
      var message = 'Error: NamedNode IRI "' + iri + '" must not contain unencoded spaces.'
      throw new Error(message)
    }
  }

  /**
   * Returns an $rdf node for the containing directory, ending in slash.
   */
  dir () {
     var str = this.value.split('#')[0]
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
     var str = this.value.split('#')[0]
     var p = str.indexOf('//')
     if (p < 0) throw new Error('This URI does not have a web site part (origin)')
     var q = str.indexOf('/', p+2)
     if (q < 0) {
       return new NamedNode(str.slice(0) + '/')   // Add slash to a bare origin
     } else {
       return new NamedNode(str.slice(0, q + 1))
     }
   }

  /**
   * Creates the fetchable named node for the document.
   * Removes everything from the # anchor tag.
   */
  doc () {
    if (this.value.indexOf('#') < 0) {
      return this
    } else {
      return new NamedNode(this.value.split('#')[0])
    }
  }

  /**
   * Returns the URI including <brackets>
   */
  toString () {
    return '<' + this.value + '>'
  }

  /** The local identifier with the document */
  id () {
    return this.value.split('#')[1]
  }

  /**
   * Legacy getter and setter alias, node.uri
   * @deprecated use {value}
   */
  get uri () {
    return this.value
  }

  set uri (uri) {
    this.value = uri
  }

  /**
   * Creates a named node from the specified input value
   * @param value - An input value
   */
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
