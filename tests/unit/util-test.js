/* eslint-env mocha */
import { expect } from 'chai'

import CanonicalDataFactory from '../../src/data-factory-internal'
import Literal from '../../src/literal'
import NamedNode from '../../src/named-node'
import Statement from '../../src/statement'
import { arrayToStatements } from '../../src/utils'
import { isNamedNode, isStatement, isTFTerm } from '../../src/utils/terms'

describe('util', () => {
  describe('isTFTerm', () => {
    it('handles undefined', () => {
      expect(isNamedNode(undefined)).to.be.false()
    })

    it('handles null', () => {
      expect(isNamedNode(null)).to.be.false()
    })

    it('handles other objects', () => {
      expect(isNamedNode(1)).to.be.false()
      expect(isNamedNode(true)).to.be.false()
      expect(isNamedNode(NaN)).to.be.false()
      expect(isNamedNode({})).to.be.false()
    })

    it ('handles literals', () => {
      expect(isTFTerm(new Literal('test'))).to.be.true()
    });
  })

  describe('isNamedNode', () => {
    it('handles prototype based objects', () => {
      const proto = {
        termType: 'NamedNode'
      }
      const obj = Object.create(proto)
      obj.value = ''
      expect(isNamedNode(obj)).to.be.true()
    })

    it('handles NamedNode instances', () => {
      expect(isNamedNode(new NamedNode('http://example.org/'))).to.be.true()
    })

    it('handles plain objects', () => {
      expect(isNamedNode({ termType: 'NamedNode', value: '' })).to.be.true()
    })
  })

  describe('isStatement', () => {
    it ('handles Statement objects', () => {
      const t = new NamedNode('http://example.org')
      expect(isStatement(new Statement(t, t, t))).to.be.true()
    })
  })

  describe('arrayToStatements', () => {
    it('converts an array to statements', () => {
      const first = CanonicalDataFactory.blankNode()
      const statements = arrayToStatements(
        CanonicalDataFactory,
        first,
        ["a", "b", "c"].map((d) => CanonicalDataFactory.literal(d))
      )

      expect(statements).to.have.length(6)
    })
  })
})
