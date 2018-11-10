'use strict'
const Node = require('./node')

class Term extends Node {
  /**
   * Assigns an index number and adds a BlankNode instance to the indices
   * @private
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
   * @private
   * @param lit The Literal instance to register
   * @return {Literal} The updated Literal instance
   */
  static addLit(lit) {
    if (lit.sI) {
      throw new Error(`Literal ${lit} already registered`)
    }

    lit.sI = ++this.termIndex
    const dtIndex = (lit.datatype || require('./xsd').string).sI
    if (!this.litMap[dtIndex]) {
      this.litMap[dtIndex] = []
    }
    if (lit.language) {
      if (!this.litMap[dtIndex][lit.value]) {
        this.litMap[dtIndex][lit.value] = []
      }
      this.termMap[lit.sI] = this.litMap[dtIndex][lit.value][lit.language] = lit
    } else {
      this.termMap[lit.sI] = this.litMap[dtIndex][lit.value] = lit
    }

    return lit
  }

  /**
   * Assigns an index number and adds a NamedNode instance to the indices
   * @private
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
   * @param lang? {string} The language of the literal (will force datatype xsd:langString)
   * @param datatype? {NamedNode} The IRI of the datatype
   * @return {Literal} The resolved or created Literal
   */
  static literalByValue(value, lang = undefined, datatype) {
    const strValue = value.toString()
    let fromMap
    // Language strings need an additional index layer
    if (lang) {
      const langStringIndex = require('./xsd').langString.sI
      if (!this.litMap[langStringIndex]) {
        this.litMap[langStringIndex] = []
      }
      if (!this.litMap[langStringIndex][strValue]) {
        this.litMap[langStringIndex][strValue] = []
      }
      fromMap = this.litMap[langStringIndex][strValue][lang]
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
   * Retrieve a term (NamedNode, BlankNode or Literal) by its store index
   * @param sI {integer} The store index of the term
   * @return {BlankNode|NamedNode|Literal|undefined}
   */
  static termByStoreIndex(sI) {
    return this.termMap[sI]
  }


  equals (other) {
    return other === this
  }

  hashString () {
    return this.sI
  }

  sameTerm (other) {
    return other === this
  }

  generateString () {
    return `${this.value}`
  }

  toString () {
    if (!this.string) {
      this.string = this.generateString()
    }

    return this.string
  }
}

/**
 * Running counter which assigns ids
 * @type {number}
 */
Term.termIndex = 0

/**
 * Maps terms to their (integer) index
 * @type {Array<BlankNode | NamedNode>}
 */
Term.termMap = []

/**
 * Maps IRIs to their NamedNode counterparts
 * @type {Object<string, NamedNode>}
 */
Term.nsMap = {}

/**
 * Maps blank ids to their BlankNode counterparts
 * @type {Object<string, BlankNode>}
 */
Term.bnMap = {}

/**
 * Maps literals to their Literal counterparts
 * @type {Array<Array<Literal|Array<Literal>>>}
 */
Term.litMap = []

module.exports = Term
