/* eslint-env mocha */
import { expect } from 'chai'

import Literal from '../../src/literal'
import XSD from '../../src/xsd'

describe('Literal', () => {
  describe('fromValue', () => {
    describe('for numbers', () => {
      it('detects integers', () => {
        expect(Literal.fromValue(0)).to.eql(new Literal('0', null, XSD.integer))
        expect(Literal.fromValue(1)).to.eql(new Literal('1', null, XSD.integer))
        expect(Literal.fromValue(Number.MAX_SAFE_INTEGER))
          .to.eql(new Literal(Number.MAX_SAFE_INTEGER.toString(), null, XSD.integer))
        expect(Literal.fromValue(Number.MIN_SAFE_INTEGER))
          .to.eql(new Literal(Number.MIN_SAFE_INTEGER.toString(), null, XSD.integer))
      })

      it('detects decimals', () => {
        expect(Literal.fromValue(1.1)).to.eql(new Literal('1.1', null, XSD.decimal))
      })

      it('detects doubles', () => {
        expect(Literal.fromValue(Number.MAX_SAFE_INTEGER + 1))
          .to.eql(new Literal((Number.MAX_SAFE_INTEGER + 1).toString(), null, XSD.double))
        expect(Literal.fromValue(Number.MIN_SAFE_INTEGER - 1))
          .to.eql(new Literal((Number.MIN_SAFE_INTEGER - 1).toString(), null, XSD.double))
        expect(Literal.fromValue(Number.MAX_VALUE))
          .to.eql(new Literal(Number.MAX_VALUE.toString(), null, XSD.double))
        expect(Literal.fromValue(-Number.MAX_VALUE))
          .to.eql(new Literal((-Number.MAX_VALUE).toString(), null, XSD.double))
        expect(Literal.fromValue(Number.MIN_VALUE))
          .to.eql(new Literal(Number.MIN_VALUE.toString(), null, XSD.double))
      })
    })

    it('detects string values', () => {
      expect(Literal.fromValue('foo')).to.eql(new Literal('foo', null, null))
    })

    it('detects boolean values', () => {
      expect(Literal.fromValue(true)).to.eql(new Literal('1', null, XSD.boolean))
      expect(Literal.fromValue(false)).to.eql(new Literal('0', null, XSD.boolean))
    })

    it('constructs a literal representing a date value', () => {
      const date = new Date(Date.UTC(2010, 5, 10, 1, 2, 3))
      expect(Literal.fromValue(date))
        .to.eql(new Literal('2010-06-10T01:02:03Z', null, XSD.dateTime))
    })
  })

  describe('toNT', () => {
    describe('for strings', () => {
      it('serializes strings with no language', () => {
        const node = Literal.fromValue('foo')
        expect(node.toNT()).to.equal('"foo"')
      })

      it('serializes strings with a language', () => {
        const node = new Literal('foo', 'en')
        expect(node.toNT()).to.equal('"foo"@en')
      })
    })

    describe('for numbers', () => {
      it('serializes integers', () => {
        const node = Literal.fromValue(1)
        expect(node.toNT()).to.equal('"1"^^<http://www.w3.org/2001/XMLSchema#integer>')
      })

      it('serializes decimals', () => {
        const node = Literal.fromValue(1.5)
        expect(node.toNT()).to.equal('"1.5"^^<http://www.w3.org/2001/XMLSchema#decimal>')
      })

      it('serializes doubles', () => {
        const largeDouble = Number.MAX_VALUE
        const node = Literal.fromValue(largeDouble)
        expect(node.toNT()).to.equal(`"${largeDouble.toString()}"^^<http://www.w3.org/2001/XMLSchema#double>`)
      })
    })

    it('serializes boolean values', () => {
      expect(Literal.fromValue(true).toNT()).to.equal('"1"^^<http://www.w3.org/2001/XMLSchema#boolean>')
      expect(Literal.fromValue(false).toNT()).to.equal('"0"^^<http://www.w3.org/2001/XMLSchema#boolean>')
    })

    it('serializes date values', () => {
      const date = new Date(Date.UTC(2010, 5, 10, 1, 2, 3))
      expect(Literal.fromValue(date).toNT())
        .to.equal('"2010-06-10T01:02:03Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>')
    })
  })

  describe('copy', () => {
    it('creates an identical copy of a node', () => {
      const node = Literal.fromValue('foo')
      expect(node).to.eql(node.copy())
    })
  })

  describe('equals', () => {
    it('compares termType, value, language, and datatype', () => {
      const a = new Literal('hello world', 'en', XSD.langString)
      const b = new Literal('', '', null)
      expect(a.equals(b)).to.be.false()
      expect(b.equals(a)).to.be.false()
      b.value = 'hello world'
      expect(a.equals(b)).to.be.false()
      expect(b.equals(a)).to.be.false()
      b.language = 'en'
      expect(a.equals(b)).to.be.false()
      expect(b.equals(a)).to.be.false()
      b.datatype = XSD.langString
      expect(a.equals(b)).to.be.true()
      expect(b.equals(a)).to.be.true()
    })
  })
})
