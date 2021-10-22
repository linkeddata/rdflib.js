'use strict'

import { expect } from 'chai'

import NamedNode from '../../src/named-node'

describe('NamedNode', () => {
  describe('constructor()', () => {
    it('should throw an error on spaces in the uri', () => {
      expect(() => { new NamedNode('https://url with spaces') }).to.throw(Error)
    })

    it('should throw an error on relative uri', () => {
      expect(() => { new NamedNode('./local') }).to.throw(Error)
    })
  })
})
