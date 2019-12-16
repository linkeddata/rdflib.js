import { expect } from 'chai'

import Factory from '../../../src/factories/extended-term-factory';
import { Feature } from '../../../src/factories/factory-types'
import Collection from '../../../src/collection'

/**
 * @ignore
 * Inherits from CanonicalDataFactory (internal), so we only have to test the added features
 * e.g. Collection
 */
describe('extended-term-factory', () => {
  it('supports collections', () => { expect(Factory.supports[Feature.collections]).to.be.true() })
  it('supports equalsMethod', () => { expect(Factory.supports[Feature.equalsMethod]).to.be.true() })
  it('supports id', () => { expect(Factory.supports[Feature.id]).to.be.true() })
  it('does not supports identity', () => { expect(Factory.supports[Feature.identity]).to.be.false() })
  it('does not supports defaultGraphType', () => { expect(Factory.supports[Feature.defaultGraphType]).to.be.false() })
  it('does not supports reversibleId', () => { expect(Factory.supports[Feature.reversibleId]).to.be.false() })

  describe('id', () => {
    it('handles collections', () => {
      expect(Factory.id(new Collection([
        Factory.literal('1'),
        Factory.namedNode('http://example.com/'),
      ]))).to.equal('( "1", <http://example.com/> )')
    })
  })

  describe('termToNQ', () => {
    it('handles collections', () => {
      const c = new Collection([ '1', '2' ])
      expect(Factory.termToNQ(c)).to.equal(`_:${c.id}`)
    })
  });
})
