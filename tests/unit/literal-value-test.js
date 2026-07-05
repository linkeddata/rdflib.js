import { expect } from 'chai'

import { isTrue, literalToBoolean, literalToNumber } from '../../src/utils/literalValue'
import Literal from '../../src/literal'
import NamedNode from '../../src/named-node'
import XSD from '../../src/xsd'
import parse from '../../src/parse'
import DataFactory from '../../src/factories/rdflib-data-factory'

const XSDNS = 'http://www.w3.org/2001/XMLSchema#'
const base = 'https://example.org/doc'

const boolLit = (lexical) => new Literal(lexical, null, XSD.boolean)
const typedLit = (lexical, localName) => new Literal(lexical, null, new NamedNode(XSDNS + localName))

/**
 * Value-space reads of typed literals. The parsers preserve the source
 * lexical form, so consumers must compare boolean/numeric literals in
 * value space; these helpers are the supported way to do that.
 */
describe('value-space literal helpers', () => {
  describe('literalToBoolean', () => {
    it('maps every valid xsd:boolean lexical form (truth table)', () => {
      expect(literalToBoolean(boolLit('true'))).to.equal(true)
      expect(literalToBoolean(boolLit('1'))).to.equal(true)
      expect(literalToBoolean(boolLit('false'))).to.equal(false)
      expect(literalToBoolean(boolLit('0'))).to.equal(false)
    })

    it('collapses surrounding whitespace, per the XSD whitespace facet', () => {
      expect(literalToBoolean(boolLit(' true '))).to.equal(true)
      expect(literalToBoolean(boolLit('\tfalse\n'))).to.equal(false)
    })

    it('returns undefined for ill-typed lexical forms', () => {
      expect(literalToBoolean(boolLit('yes'))).to.equal(undefined)
      expect(literalToBoolean(boolLit('TRUE'))).to.equal(undefined)
      expect(literalToBoolean(boolLit(''))).to.equal(undefined)
    })

    it('returns undefined for literals of other datatypes', () => {
      expect(literalToBoolean(new Literal('true'))).to.equal(undefined) // xsd:string
      expect(literalToBoolean(new Literal('true', 'en'))).to.equal(undefined) // langString
      expect(literalToBoolean(typedLit('1', 'integer'))).to.equal(undefined)
    })

    it('returns undefined for non-literals and missing terms', () => {
      expect(literalToBoolean(new NamedNode('https://example.org/true'))).to.equal(undefined)
      expect(literalToBoolean(null)).to.equal(undefined)
      expect(literalToBoolean(undefined)).to.equal(undefined)
    })

    it('is the value-space inverse of Literal.fromBoolean', () => {
      expect(literalToBoolean(Literal.fromBoolean(true))).to.equal(true)
      expect(literalToBoolean(Literal.fromBoolean(false))).to.equal(false)
    })
  })

  describe('isTrue', () => {
    it('is true exactly for true boolean literals', () => {
      expect(isTrue(boolLit('true'))).to.equal(true)
      expect(isTrue(boolLit('1'))).to.equal(true)
      expect(isTrue(boolLit('false'))).to.equal(false)
      expect(isTrue(boolLit('0'))).to.equal(false)
    })

    it('is false for anything that is not a true boolean literal', () => {
      expect(isTrue(boolLit('yes'))).to.equal(false)
      expect(isTrue(new Literal('true'))).to.equal(false)
      expect(isTrue(new NamedNode('https://example.org/x'))).to.equal(false)
      expect(isTrue(null)).to.equal(false)
      expect(isTrue(undefined)).to.equal(false)
    })

    it('reads a stored `true` back from a parsed document (the solid-ui pattern)', () => {
      // Serialized pods hold `true` (rdflib's own serializer emits it),
      // which parses back as `"true"`, not the `"1"` old checks expect
      const kb = DataFactory.graph()
      parse(`<#s> <#p> true . <#s> <#q> false .`, kb, base, 'text/turtle')
      const s = kb.sym(`${base}#s`)
      expect(kb.anyValue(s, kb.sym(`${base}#p`))).to.equal('true') // lexical form preserved...
      expect(isTrue(kb.any(s, kb.sym(`${base}#p`)))).to.equal(true) // ...but value space reads fine
      expect(isTrue(kb.any(s, kb.sym(`${base}#q`)))).to.equal(false)
      expect(isTrue(kb.any(s, kb.sym(`${base}#missing`)))).to.equal(false)
    })
  })

  describe('literalToNumber', () => {
    it('reads integers', () => {
      expect(literalToNumber(typedLit('12', 'integer'))).to.equal(12)
      expect(literalToNumber(typedLit('+5', 'integer'))).to.equal(5)
      expect(literalToNumber(typedLit('-7', 'integer'))).to.equal(-7)
      expect(literalToNumber(typedLit('012', 'integer'))).to.equal(12)
    })

    it('reads decimals', () => {
      expect(literalToNumber(typedLit('12.0', 'decimal'))).to.equal(12)
      expect(literalToNumber(typedLit('3.14', 'decimal'))).to.equal(3.14)
      expect(literalToNumber(typedLit('.5', 'decimal'))).to.equal(0.5)
      expect(literalToNumber(typedLit('-0.25', 'decimal'))).to.equal(-0.25)
    })

    it('reads doubles and floats, including the specials', () => {
      expect(literalToNumber(typedLit('3.141e0', 'double'))).to.equal(3.141)
      expect(literalToNumber(typedLit('1E3', 'double'))).to.equal(1000)
      expect(literalToNumber(typedLit('2.5', 'float'))).to.equal(2.5)
      expect(literalToNumber(typedLit('INF', 'double'))).to.equal(Infinity)
      expect(literalToNumber(typedLit('-INF', 'double'))).to.equal(-Infinity)
      expect(Number.isNaN(literalToNumber(typedLit('NaN', 'double')))).to.equal(true)
    })

    it('reads the derived integer types', () => {
      expect(literalToNumber(typedLit('42', 'int'))).to.equal(42)
      expect(literalToNumber(typedLit('42', 'long'))).to.equal(42)
      expect(literalToNumber(typedLit('42', 'nonNegativeInteger'))).to.equal(42)
    })

    it('returns undefined for lexical forms outside the datatype', () => {
      expect(literalToNumber(typedLit('abc', 'integer'))).to.equal(undefined)
      expect(literalToNumber(typedLit('1.5', 'integer'))).to.equal(undefined)
      expect(literalToNumber(typedLit('1e3', 'decimal'))).to.equal(undefined) // no exponent in xsd:decimal
      expect(literalToNumber(typedLit('INF', 'decimal'))).to.equal(undefined)
      expect(literalToNumber(typedLit('', 'integer'))).to.equal(undefined)
      expect(literalToNumber(typedLit('0x10', 'integer'))).to.equal(undefined)
    })

    it('returns undefined for non-numeric datatypes, non-literals and missing terms', () => {
      expect(literalToNumber(new Literal('12'))).to.equal(undefined) // xsd:string
      expect(literalToNumber(boolLit('1'))).to.equal(undefined)
      expect(literalToNumber(new NamedNode('https://example.org/12'))).to.equal(undefined)
      expect(literalToNumber(null)).to.equal(undefined)
      expect(literalToNumber(undefined)).to.equal(undefined)
    })

    it('compares parsed numerics in value space regardless of source spelling', () => {
      const kb = DataFactory.graph()
      parse(`<#s> <#a> 12 . <#s> <#b> 12.0 . <#s> <#c> 1.2e1 .`, kb, base, 'text/turtle')
      const s = kb.sym(`${base}#s`)
      for (const p of ['a', 'b', 'c']) {
        expect(literalToNumber(kb.any(s, kb.sym(`${base}#${p}`)))).to.equal(12)
      }
    })
  })

  describe('Literal.toBoolean / Literal.toNumber', () => {
    it('expose the helpers as statics, mirroring fromBoolean/fromNumber', () => {
      expect(Literal.toBoolean(boolLit('true'))).to.equal(true)
      expect(Literal.toBoolean(boolLit('0'))).to.equal(false)
      expect(Literal.toBoolean(null)).to.equal(undefined)
      expect(Literal.toNumber(typedLit('12.0', 'decimal'))).to.equal(12)
      expect(Literal.toNumber(Literal.fromNumber(3.5))).to.equal(3.5)
      expect(Literal.toNumber(undefined)).to.equal(undefined)
    })
  })
})
