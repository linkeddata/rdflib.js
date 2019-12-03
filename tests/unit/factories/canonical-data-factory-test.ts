import { expect } from 'chai'

import Factory from '../../../src/factories/canonical-data-factory';
import { Feature } from '../../../src/factories/factory-types'
import NamedNode from '../../../src/named-node'
import Literal from '../../../src/literal'
import DefaultGraph from '../../../src/default-graph'
import Empty from '../../../src/empty'

describe('data-factory', () => {
  describe('DataFactory', () => {
    describe('#supports', () => {
      it('collections', () => { expect(Factory.supports[Feature.collections]).to.be.false() })
      it('defaultGraphType', () => { expect(Factory.supports[Feature.defaultGraphType]).to.be.false() })
      it('equalsMethod', () => { expect(Factory.supports[Feature.equalsMethod]).to.be.true() })
      it('identity', () => { expect(Factory.supports[Feature.identity]).to.be.false() })
      it('id', () => { expect(Factory.supports[Feature.id]).to.be.true() })
      it('reversibleId', () => { expect(Factory.supports[Feature.reversibleId]).to.be.false() })
    })

    describe('equals', () => {});

    describe('id', () => {
      it('handles default graph', () => expect(Factory.id(new DefaultGraph())).to.equal('defaultGraph'))
    });

    describe('isQuad', () => {});

    describe('literal', () => {
      const plain = Factory.literal('s')
      it('keeps the value', () => expect(plain.value).to.equal('s'))
      it('creates a literal', () => expect(plain).to.be.instanceOf(Literal))
      it('defaults to string', () => expect(plain.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#string'))

      const integer = Factory.literal('23', Factory.namedNode('http://www.w3.org/2001/XMLSchema#integer'))
      it('keeps the datatype', () => expect(integer.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#integer'))

      const langString = Factory.literal('s', 'en')
      it('sets a language', () => expect(langString.language).to.equal('en'))
      it('sets a language', () => expect(langString.datatype.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString'))
    });

    describe('namedNode', () => {
      it('creates a named node', () => expect(Factory.namedNode('about:config')).to.be.instanceOf(NamedNode))
      it('preserves the value', () => expect(Factory.blankNode('http://example.com/').value).to.equal('http://example.com/'))
    });

    describe('quad', () => {});

    describe('quadToNQ', () => {});

    describe('termToNQ', () => {
      it('handles blank nodes', () => expect(Factory.termToNQ(Factory.blankNode('g123'))).to.equal('_:g123'))
      it('handles default graph', () => expect(Factory.termToNQ(new DefaultGraph())).to.equal(''))
      it('handles the empty collection', () => expect(Factory.termToNQ(new Empty())).to.equal('<http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>'))
      it('handles literals', () => expect(Factory.termToNQ(Factory.literal('text with "quotes"'))).to.equal('"text with \\"quotes\\""'))
      it('handles named nodes', () => expect(Factory.termToNQ(Factory.namedNode('http://example.com/'))).to.equal('<http://example.com/>'))
    });

    describe('toNQ', () => {});

    describe('variable', () => {});
  })
})
