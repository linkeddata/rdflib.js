'use strict'

import { expect } from 'chai'
import fs from 'fs'
import * as rdf from '../../src/index'

import BlankNode from '../../src/blank-node'

describe('BlankNode', () => {
  after(() => {
    BlankNode.nextId = 0
  })

  describe('constructor()', () => {
    it('should throw an error when passed a non-string id', () => {
      expect(() => { new BlankNode(1) }).to.throw(/Bad id argument to new blank node/)
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
