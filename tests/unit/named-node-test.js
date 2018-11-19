'use strict'

import { expect } from 'chai'

import Term from '../../src/term'
import NamedNode from '../../src/named-node'

describe('NamedNode', () => {
  describe('constructor()', () => {
    it('should throw an error on spaces in the uri', () => {
      expect(() => { new NamedNode('https://url with spaces') }).to.throw(Error)
    })

    it('should throw an error on relative uri', () => {
      expect(() => { new NamedNode('./local') }).to.throw(Error)
    })

    it('should return a fresh object', () => {
      expect(new NamedNode('http://example.com/1').sI).to.be.undefined()
    })

    it('should return an existing instance if present', () => {
      const existing = Term.namedNodeByIRI('http://example.com/2')
      expect(new NamedNode('http://example.com/2').sI).to.equal(existing.sI)
    })
  })
})
