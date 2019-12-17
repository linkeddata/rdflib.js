import { expect } from 'chai'

import Factory from '../../../src/factories/canonical-data-factory';
import { Feature } from '../../../src/factories/factory-types'
import NamedNode from '../../../src/named-node'
import Literal from '../../../src/literal'
import DefaultGraph from '../../../src/default-graph'
import Empty from '../../../src/empty'

describe('data-factory', () => {
  it('supports id', () => { expect(Factory.supports[Feature.id]).to.be.true() })
  it('supports equalsMethod', () => { expect(Factory.supports[Feature.equalsMethod]).to.be.true() })
  it('does not supports collections', () => { expect(Factory.supports[Feature.collections]).to.be.false() })
  it('does not supports defaultGraphType', () => { expect(Factory.supports[Feature.defaultGraphType]).to.be.false() })
  it('does not supports identity', () => { expect(Factory.supports[Feature.identity]).to.be.false() })
  it('does not supports reversibleId', () => { expect(Factory.supports[Feature.reversibleId]).to.be.false() })

  describe('equals', () => {
    const uri = "https://w3.org/"
    const otherUri = "https://h3h3.org/"
    it('handles same NamedNodes', () => expect(Factory.namedNode(uri).equals(Factory.namedNode(uri))).to.be.true)
    it('handles different NamedNodes', () => expect(Factory.namedNode(uri).equals(Factory.namedNode(otherUri))).to.be.false)
  });

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
