'use strict'

/**
 * The superclass of all RDF Statement objects, that is
 * NamedNode, Literal, BlankNode, etc.
 * @class Node
 */
class Node {
  /**
   * Assigns an index number and adds a BlankNode instance to the indices
   * @internal
   * @param bn The BlankNode instance to register
   * @return {BlankNode} The updated BlankNode instance
   */
  static addBn(bn) {
    if (bn.sI) {
      throw new Error(`BlankNode ${bn} already registered`)
    }

    bn.sI = ++this.termIndex
    this.termMap[bn.sI] = this.bnMap[bn.value] = bn

    return bn
  }

  /**
   * Assigns an index number and adds a Literal instance to the indices
   * @internal
   * @param lit The Literal instance to register
   * @return {Literal} The updated Literal instance
   */
  static addLit(lit) {
    if (lit.sI) {
      throw new Error(`Literal ${lit} already registered`)
    }

    lit.sI = ++this.termIndex
    const dtIndex = (lit.datatype || require('./xsd').string).sI
    if (lit.language) {
      if (!this.litMap[dtIndex][lit.value]) {
        this.litMap[dtIndex][lit.value] = []
      }
      this.termMap[lit.sI] = this.litMap[dtIndex][lit.value][lit.language] = lit
    } else {
      if (!this.litMap[dtIndex]) {
        this.litMap[dtIndex] = []
      }
      this.termMap[lit.sI] = this.litMap[dtIndex][lit.value] = lit
    }

    return lit
  }

  /**
   * Assigns an index number and adds a NamedNode instance to the indices
   * @internal
   * @param nn {NamedNode} The NamedNode instance to register
   * @param ln? {string} Property accessor-friendly string representation.
   * @return {NamedNode} The updated NamedNode instance
   */
  static addNN(nn, ln) {
    if (nn.sI) {
      throw new Error(`NamedNode ${nn} already registered`)
    }

    nn.sI = ++this.termIndex
    nn.term = ln
    this.termMap[nn.sI] = this.nsMap[nn.value] = nn

    return nn
  }

  /**
   * Retrieve or create a BlankNode by its ID
   * @param id? {string} The ID of the blank node
   * @return {BlankNode} The resolved or created BlankNode
   */
  static blankNodeByID(id) {
    const fromMap = this.bnMap[id]
    if (fromMap !== undefined) {
      return fromMap
    }
    const BlankNode = require('./blank-node')
    return this.addBn(new BlankNode(id))
  }

  /**
   * Retrieve or create a Literal by its datatype, value, and language
   * @param value {Object} The value of the literal
   * @param datatype? {NamedNode} The IRI of the datatype
   * @param lang? {any} The language of the literal (will force datatype xsd:langString)
   * @return {Literal} The resolved or created Literal
   */
  static literalByValue(value, lang = undefined, datatype) {
    const strValue = value.toString()
    let fromMap
    // Language strings need an additional index layer
    if (lang) {
      if (!this.litMap[require('./xsd').langString.sI][strValue]) {
        this.litMap[require('./xsd').langString.sI][strValue] = []
      }
      fromMap = this.litMap[require('./xsd').langString.sI][strValue][lang.sI]
    } else {
      const dtIndex = (datatype || require('./xsd').string).sI
      fromMap = this.litMap[dtIndex] && this.litMap[dtIndex][strValue]
    }

    if (fromMap) {
      return fromMap
    }

    const Literal = require('./literal')
    return this.addLit(new Literal(strValue, lang, datatype))
  }

  /**
   * Retrieve or create a NamedNode by its IRI
   * @param iri {string} The IRI of the blank node
   * @param ln {string} Property accessor-friendly string representation.
   * @return {NamedNode} The resolved or created NamedNode
   */
  static namedNodeByIRI(iri, ln = undefined) {
    if (iri && iri.termType) {
      iri = iri.value
    }

    const fromMap = this.nsMap[iri]
    if (fromMap !== undefined) {
      return fromMap
    }

    const NamedNode = require('./named-node')
    return this.addNN(new NamedNode(iri), ln)
  }

  /**
   * Retrieve a NamedNode by its store index
   * @param sI {integer} The store index of the NamedNode
   * @return {NamedNode | undefined}
   */
  static namedNodeByStoreIndex(sI) {
    const term = this.termMap[sI]
    if (!term) {
      return undefined
    }
    if (term.termType === "NamedNode") {
      return term
    }

    return undefined
  }

  /**
   * Retrieve a node (named or blank) by its store index
   * @param sI {integer} The store index of the NamedNode
   * @return {BlankNode|NamedNode|undefined}
   */
  static nodeByStoreIndex(sI) {
    return this.termMap[sI]
  }

  substitute (bindings) {
    console.log('@@@ node substitute' + this)
    return this
  }
  compareTerm (other) {
    if (this.classOrder < other.classOrder) {
      return -1
    }
    if (this.classOrder > other.classOrder) {
      return +1
    }
    if (this.value < other.value) {
      return -1
    }
    if (this.value > other.value) {
      return +1
    }
    return 0
  }
  equals (other) {
    if (!other) {
      return false
    }

    return this === other
  }
  hashString () {
    return this.toCanonical()
  }
  sameTerm (other) {
    return this.equals(other)
  }
  toCanonical () {
    return this.toNT()
  }
  toNT () {
    return this.toString()
  }
  toString () {
    throw new Error('Node.toString() is abstract - see the subclasses instead')
  }
}
module.exports = Node

/**
 * Running counter which assigns ids
 * @type {number}
 */
Node.termIndex = 0

/**
 * Maps terms to their (integer) index
 * @type {Array<BlankNode | NamedNode>}
 */
Node.termMap = []

/**
 * Maps IRIs to their NamedNode counterparts
 * @type {Object<string, NamedNode>}
 */
Node.nsMap = {}

/**
 * Maps blank ids to their BlankNode counterparts
 * @type {Object<string, BlankNode>}
 */
Node.bnMap = {}

/**
 * Maps literals to their Literal counterparts
 * @type {Array<Array<Literal|Array<Literal>>>}
 */
Node.litMap = []
// Define an additional index layer required for langStrings, saving an additional access run-time
Node.litMap[require('./xsd').langString.sI] = []

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * @method fromValue
 * @static
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
Node.fromValue = function fromValue (value) {
  const Collection = require('./collection')
  const Literal = require('./literal')
  const NamedNode = require('./named-node')
  if (typeof value === 'undefined' || value === null) {
    return value
  }
  const isNode = value && value.termType
  if (isNode) {  // a Node subclass or a Collection
    return value
  }
  if (Array.isArray(value)) {
    return new Collection(value)
  }
  return Literal.fromValue(value)
}

Node.toJS = function fromJS (term) {
  const ns = require('./ns')
  if (term.elements) {
    return term.elements.map(Node.toJS) // Array node (not standard RDFJS)
  }
  if (!term.datatype) return term // Objects remain objects
  if (term.datatype === ns.xsd('boolean')) {
    return term.value === '1'
  }
  if (term.datatype === ns.xsd('dateTime') ||
    term.datatype === ns.xsd('date')) {
    return new Date(term.value)
  }
  if ([ns.xsd('integer'), ns.xsd('float'), ns.xsd('decimal')].includes(term.datatype)) {
    return Number(term.value)
  }
  return term.value
}
