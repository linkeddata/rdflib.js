import { expect } from 'chai'

import parse from '../../src/parse'
import Literal from '../../src/literal'
import DataFactory from '../../src/factories/rdflib-data-factory'

const XSD = 'http://www.w3.org/2001/XMLSchema#'
const base = 'https://example.org/doc'

/**
 * The opt-in `canonicalize` parse option: a transition aid that restores the
 * parse-time lexical normalisation rdflib ≤2 applied to boolean and numeric
 * literals, for consumers that still compare literals by one canonical
 * spelling. Off by default — lexical forms are preserved as found.
 */
describe('parse() `canonicalize` option', () => {
  function parseDoc (content, options, contentType = 'text/turtle') {
    const kb = DataFactory.graph()
    parse(content, kb, base, contentType, options)
    return kb
  }

  function objectByDatatype (kb, localDatatype) {
    const matches = kb.statements
      .map((st) => st.object)
      .filter((o) => o.termType === 'Literal' && o.datatype.value === XSD + localDatatype)
    expect(matches).to.have.length(1)
    return matches[0]
  }

  const doc = `<#s> <#p> true, 12.0, 3.141e0 .`

  describe('off (the default): lexical forms are preserved', () => {
    for (const options of [undefined, { canonicalize: false }]) {
      it(`keeps the source spelling with options ${JSON.stringify(options)}`, () => {
        const kb = parseDoc(doc, options)
        expect(objectByDatatype(kb, 'boolean').value).to.equal('true')
        expect(objectByDatatype(kb, 'decimal').value).to.equal('12.0')
        expect(objectByDatatype(kb, 'double').value).to.equal('3.141e0')
      })
    }
  })

  describe('on: booleans and numerics get the rdflib ≤2 canonical forms', () => {
    it('canonicalizes `true`/`12.0`/`3.141e0` to `1`/`12`/`3.141`', () => {
      const kb = parseDoc(doc, { canonicalize: true })
      expect(objectByDatatype(kb, 'boolean').value).to.equal('1')
      expect(objectByDatatype(kb, 'decimal').value).to.equal('12')
      expect(objectByDatatype(kb, 'double').value).to.equal('3.141')
    })

    it('makes canonically-constructed literals match parsed data again (store comparison)', () => {
      const s = DataFactory.namedNode(`${base}#s`)
      const p = DataFactory.namedNode(`${base}#p`)

      // Without the flag the 2.x-idiom lookups miss…
      const plain = parseDoc(doc)
      expect(plain.holds(s, p, Literal.fromBoolean(true))).to.equal(false)
      expect(plain.holds(s, p, new Literal('12', null, DataFactory.namedNode(XSD + 'decimal')))).to.equal(false)

      // …with it they hit, as they did on rdflib ≤2 parses.
      const canonical = parseDoc(doc, { canonicalize: true })
      expect(canonical.holds(s, p, Literal.fromBoolean(true))).to.equal(true)
      expect(canonical.holds(s, p, new Literal('12', null, DataFactory.namedNode(XSD + 'decimal')))).to.equal(true)
      expect(canonical.holds(s, p, new Literal('3.141', null, DataFactory.namedNode(XSD + 'double')))).to.equal(true)
    })

    it('normalises integer sign and leading-zero decoration exactly (no precision loss)', () => {
      const kb = parseDoc(`<#s> <#a> +05 . <#s> <#b> -0 . <#s> <#c> 042 .
        <#s> <#d> 12345678901234567890123 .`, { canonicalize: true })
      const value = (local) => kb.any(kb.sym(`${base}#s`), kb.sym(`${base}#${local}`)).value
      expect(value('a')).to.equal('5')
      expect(value('b')).to.equal('0')
      expect(value('c')).to.equal('42')
      expect(value('d')).to.equal('12345678901234567890123') // beyond 2^53: digits kept exact
    })

    it('also canonicalizes quoted typed literals', () => {
      const kb = parseDoc(`<#s> <#p> "true"^^<${XSD}boolean>, "012"^^<${XSD}integer> .`,
        { canonicalize: true })
      expect(objectByDatatype(kb, 'boolean').value).to.equal('1')
      expect(objectByDatatype(kb, 'integer').value).to.equal('12')
    })

    it('leaves ill-typed lexical forms, the double specials and other datatypes alone', () => {
      const kb = parseDoc(`<#s> <#p> "maybe"^^<${XSD}boolean>, "abc"^^<${XSD}integer>,
        "INF"^^<${XSD}double>, "0.0000001"^^<${XSD}decimal>, "12.0", "true"@en,
        "2020-01-01"^^<${XSD}date> .`, { canonicalize: true })
      const values = kb.statements.map((st) => st.object.value).sort()
      expect(values).to.eql([
        '0.0000001', // String(Number) would be "1e-7", outside xsd:decimal's lexical space
        '12.0', // plain string, not numeric
        '2020-01-01',
        'INF',
        'abc',
        'maybe',
        'true',
      ])
    })

    it('applies across the Turtle family (text/n3)', () => {
      const kb = parseDoc(`<#s> <#p> true, 12.0 .`, { canonicalize: true }, 'text/n3')
      expect(objectByDatatype(kb, 'boolean').value).to.equal('1')
      expect(objectByDatatype(kb, 'decimal').value).to.equal('12')
    })

    it('can be passed alongside a callback (6th positional argument)', (done) => {
      const kb = DataFactory.graph()
      parse(doc, kb, base, 'text/turtle', (error, resultKb) => {
        try {
          expect(error).to.equal(null)
          expect(objectByDatatype(resultKb, 'boolean').value).to.equal('1')
          done()
        } catch (e) {
          done(e)
        }
      }, { canonicalize: true })
    })
  })
})
