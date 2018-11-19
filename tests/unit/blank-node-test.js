'use strict'

import { expect } from 'chai'
import fs from 'fs'
import rdf from '../../src/index'

import BlankNode from '../../src/blank-node'
import Term from '../../src/term'

describe('BlankNode', () => {
  after(() => {
    BlankNode.nextId = 0
  })

  describe('constructor()', () => {
    it('should throw an error when passed a non-string id', () => {
      expect(() => { new BlankNode(1) }).to.throw(/Bad id argument to new blank node/)
    })

    it('should return a fresh object', () => {
      expect(new BlankNode('http://example.com/1#subresource').sI).to.be.undefined()
    })

    it('should return an existing instance if present', () => {
      const existing = Term.blankNodeByID('http://example.com/2#subresource')
      expect(new BlankNode('http://example.com/2#subresource').sI).to.equal(existing.sI)
    })
  })

  describe('serialize', () => {
    let input = fs.readFileSync('./tests/serialize/structures.n3', 'utf8')
    let kb = rdf.graph()
    let base = 'https://localhost/'
    let contentType = 'text/n3'
    rdf.parse(input, kb, base, contentType)

    console.log(kb.toString())

    let output = rdf.serialize(rdf.sym('https://localhost/'), kb)

    console.log(output)
  })
})
