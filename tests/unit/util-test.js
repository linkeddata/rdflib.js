import { expect } from 'chai'

import CanonicalDataFactory from '../../src/factories/canonical-data-factory'
import Literal from '../../src/literal'
import NamedNode from '../../src/named-node'
import Statement from '../../src/statement'
import { arrayToStatements } from '../../src/utils'
import {
  isBlankNode,
  isCollection,
  isNamedNode,
  isQuad,
  isRDFlibObject,
  isRDFObject,
  isStatement,
  isStore,
  isTerm,
  isVariable,
  isLiteral,
} from '../../src/utils/terms'
import IndexedFormula from '../../src/store'
import BlankNode from '../../src/blank-node'
import Collection from '../../src/collection'
import Variable from '../../src/variable'

describe('util', () => {
  describe('isTerm', () => {
    it('handles undefined', () => {
      expect(isTerm(undefined)).to.equal(false)
    })

    it('handles null', () => {
      expect(isTerm(null)).to.equal(false)
    })

    it('handles other objects', () => {
      expect(isTerm(1)).to.equal(false)
      expect(isTerm(true)).to.equal(false)
      expect(isTerm(NaN)).to.equal(false)
      expect(isTerm({})).to.equal(false)
      expect(isTerm([])).to.equal(false)
    })

    it('handles literals', () => {
      expect(isTerm(new Literal('test'))).to.equal(true)
    })

    it('handles namedNodes', () => {
      expect(isTerm(new NamedNode('https://example.com/test'))).to.equal(true)
    })

    it('handles blankNodes', () => {
      expect(isTerm(new BlankNode('test'))).to.equal(true)
    })
  })

  describe('isNamedNode', () => {
    it('handles prototype based objects', () => {
      const proto = {
        termType: 'NamedNode'
      }
      const obj = Object.create(proto)
      obj.value = ''
      expect(isNamedNode(obj)).to.equal(true)
    })

    it('handles NamedNode instances', () => {
      expect(isNamedNode(new NamedNode('http://example.org/'))).to.equal(true)
    })

    it('handles Literal instances', () => {
      expect(isNamedNode(new Literal('http://example.org/'))).to.equal(false)
    })

    it('handles plain objects', () => {
      expect(isNamedNode({ termType: 'NamedNode', value: '' })).to.equal(true)
    })

    it('handles prototype based objects', () => {
      const proto = {
        termType: 'NamedNode'
      }
      const obj = Object.create(proto)
      obj.value = ''
      expect(isNamedNode(obj)).to.equal(true)
    })

    it('handles plain objects', () => {
      expect(isNamedNode({ termType: 'NamedNode', value: '' })).to.equal(true)
    })
  })

  describe('isStatement', () => {
    it('handles Statement objects', () => {
      const t = new NamedNode('http://example.org')
      expect(isStatement(new Statement(t, t, t))).to.equal(true)
    })

    it('handles other objects', () => {
      const t = new NamedNode('http://example.org')
      expect(isStatement(t)).to.equal(false)
    })
  })

  describe('isStore', () => {
    it('handles IndexedFormula objects', () => {
      const t = new IndexedFormula()
      expect(isStore(t)).to.equal(true)
    })

    it('handles other objects', () => {
      expect(isStore(NaN)).to.equal(false)
    })
  })

  describe('isCollection', () => {
    it('handles Collection objects', () => {
      const t = new Collection()
      expect(isCollection(t)).to.equal(true)
    })

    it('handles other objects', () => {
      const t = new NamedNode('http://example.org')
      expect(isCollection(t)).to.equal(false)
    })
  })

  describe('isRDFlibObject', () => {
    it('handles Collection objects', () => {
      const t = new Collection()
      expect(isRDFlibObject(t)).to.equal(true)
    })

    it('handles NamedNode objects', () => {
      const t = new NamedNode('http://example.org')
      expect(isRDFlibObject(t)).to.equal(true)
    })

    it('handles Variable objects', () => {
      const t = new Variable()
      expect(isRDFlibObject(t)).to.equal(true)
    })

    it('handles BlankNode objects', () => {
      const t = new BlankNode()
      expect(isRDFlibObject(t)).to.equal(true)
    })

    it('handles Literal objects', () => {
      const t = new Literal()
      expect(isRDFlibObject(t)).to.equal(true)
    })

    it('handles other objects', () => {
      const t = {
        some: "object"
      }
      expect(isRDFlibObject(t)).to.equal(false)
    })
  })

  describe('isVariable', () => {
    it('handles Variable objects', () => {
      const t = new Variable()
      expect(isVariable(t)).to.equal(true)
    })

    it('handles other objects', () => {
      const t = new NamedNode('http://example.org')
      expect(isVariable(t)).to.equal(false)
      expect(isVariable(undefined)).to.equal(false)
      expect(isVariable(2)).to.equal(false)
      expect(isVariable({})).to.equal(false)
    })
  })

  describe('isLiteral', () => {
    it('handles Literal objects', () => {
      const t = new Literal()
      expect(isLiteral(t)).to.equal(true)
    })

    it('handles other objects', () => {
      const nn = new NamedNode('http://example.org')
      expect(isLiteral(nn)).to.equal(false)
      const v = new Variable('http://example.org')
      expect(isLiteral(v)).to.equal(false)
      const bn = new BlankNode('http://example.org')
      expect(isLiteral(bn)).to.equal(false)
    })
  })

  describe('isQuad', () => {
    it('handles Statement objects', () => {
      const t = new NamedNode('http://example.org')
      expect(isQuad(new Statement(t, t, t))).to.equal(true)
    })

    it('handles other objects', () => {
      const nn = new NamedNode('http://example.org')
      expect(isQuad(nn)).to.equal(false)
      const v = new Variable('http://example.org')
      expect(isQuad(v)).to.equal(false)
      const bn = new BlankNode('http://example.org')
      expect(isQuad(bn)).to.equal(false)
    })
  })

  describe('isBlankNode', () => {
    it('handles BlankNode objects', () => {
      const t = new BlankNode()
      expect(isBlankNode(t)).to.equal(true)
    })

    it('handles other objects', () => {
      const nn = new NamedNode('http://example.org')
      expect(isBlankNode(nn)).to.equal(false)
      const v = new Variable('http://example.org')
      expect(isBlankNode(v)).to.equal(false)
      const bn = new Literal('http://example.org')
      expect(isBlankNode(bn)).to.equal(false)
    })
  })

  describe('isObject', () => {
    it('handles BlankNode objects', () => {
      const t = new BlankNode()
      expect(isRDFObject(t)).to.equal(true)
    })

    it('handles Variable objects', () => {
      const t = new Variable()
      expect(isRDFObject(t)).to.equal(true)
    })

    it('handles Literal objects', () => {
      const t = new Literal()
      expect(isRDFObject(t)).to.equal(true)
    })

    it('handles NamedNode objects', () => {
      const t = new NamedNode("https://someurl.com")
      expect(isRDFObject(t)).to.equal(true)
    })

    it('handles other objects', () => {
      expect(isRDFObject(2)).to.equal(false)
      expect(isRDFObject({})).to.equal(false)
      expect(isRDFObject(undefined)).to.equal(false)
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
