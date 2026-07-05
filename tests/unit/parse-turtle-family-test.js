import { expect } from 'chai'

import parse from '../../src/parse'
import DataFactory from '../../src/factories/rdflib-data-factory'
import CanonicalDataFactory from '../../src/factories/canonical-data-factory'

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const XSD = 'http://www.w3.org/2001/XMLSchema#'

/**
 * Tests for the Turtle-family formats parsed by the N3.js parser
 * (text/turtle, text/n3, application/n-triples, application/n-quads,
 * application/trig).
 *
 * These cover spec-conformance cases that rdflib's historical hand-rolled
 * parser did not handle, plus the Notation3 model mapping (formulae,
 * variables, quantifiers). See the "Closes #…" list on the migration PR.
 */
describe('Turtle-family parsing via N3.js', () => {
  const base = 'https://example.org/doc'

  function parseTtl(content, contentType = 'text/turtle', rdfFactory = undefined) {
    const store = rdfFactory ? DataFactory.graph(undefined, { rdfFactory }) : DataFactory.graph()
    parse(content, store, base, contentType)
    return store
  }

  describe('#214 — single-quoted long (multi-line) literals', () => {
    it("parses '''…''' the same as \"\"\"…\"\"\"", () => {
      const store = parseTtl(`<${base}#s> <${base}#p> '''line one\nline two''' .`)
      expect(store.statements).to.have.length(1)
      expect(store.statements[0].object.termType).to.equal('Literal')
      expect(store.statements[0].object.value).to.equal('line one\nline two')
    })
  })

  describe('#494 — 8-bit / astral \\U unicode escapes', () => {
    it('decodes \\U0001F60A to the correct astral code point (not \\uF60A)', () => {
      const store = parseTtl(`<${base}#s> <${base}#p> "emoji \\U0001F60A end" .`)
      const value = store.statements[0].object.value
      expect(value).to.equal('emoji \u{1F60A} end')
      expect(value.codePointAt(6).toString(16)).to.equal('1f60a')
    })

    it('decodes \\U escapes inside IRIs', () => {
      const store = parseTtl(`<${base}#s> <${base}#p> <http://example.org/\\U0001F4A9> .`)
      expect(store.statements[0].object.value).to.equal('http://example.org/\u{1F4A9}')
    })
  })

  describe('#626 — SPARQL-style PREFIX / BASE directives', () => {
    it('accepts case-insensitive PREFIX', () => {
      const store = parseTtl(`PREFIX ex: <http://ex/>\nex:s ex:p ex:o .`)
      expect(store.statements[0].subject.value).to.equal('http://ex/s')
      expect(store.statements[0].object.value).to.equal('http://ex/o')
    })

    it('accepts SPARQL-style BASE', () => {
      const store = parseTtl(`BASE <http://ex/>\n<s> <p> <o> .`)
      expect(store.statements[0].subject.value).to.equal('http://ex/s')
    })
  })

  describe('#329 — Turtle 1.1 conformance samples', () => {
    it('parses bareword booleans as xsd:boolean', () => {
      const store = parseTtl(`<${base}#s> <${base}#p> true .`)
      expect(store.statements[0].object.value).to.equal('true')
      expect(store.statements[0].object.datatype.value).to.equal(`${XSD}boolean`)
    })

    it('preserves numeric lexical forms (decimal/double)', () => {
      const store = parseTtl(`<${base}#s> <${base}#d> 12.0 ; <${base}#f> 3.141e0 .`, 'text/turtle', CanonicalDataFactory)
      const byPred = p => store.statements.find(s => s.predicate.value === `${base}#${p}`).object
      expect(byPred('d').value).to.equal('12.0')
      expect(byPred('d').datatype.value).to.equal(`${XSD}decimal`)
      expect(byPred('f').value).to.equal('3.141e0')
      expect(byPred('f').datatype.value).to.equal(`${XSD}double`)
    })

    it('decodes numeric IRI escapes', () => {
      const store = parseTtl(`<${base}#s> <${base}#p> <http://example.org/\\u00E9> .`)
      expect(store.statements[0].object.value).to.equal('http://example.org/é')
    })
  })

  describe('empty-prefix (:) auto-binding preserved (rdflib leniency)', () => {
    it('resolves `:name` against <base#> even without an @prefix : declaration', () => {
      const store = parseTtl(`<${base}#s> :p :o .`)
      expect(store.statements[0].predicate.value).to.equal(`${base}#p`)
      expect(store.statements[0].object.value).to.equal(`${base}#o`)
    })

    it('does not leak a synthetic `:` prefix onto the store when undeclared', () => {
      const store = parseTtl(`<${base}#s> :p :o .`)
      expect(store.namespaces['']).to.equal(undefined)
    })

    it('an explicit @prefix : declaration still wins and is registered', () => {
      const store = parseTtl(`@prefix : <http://other/> .\n:s :p :o .`)
      expect(store.statements[0].subject.value).to.equal('http://other/s')
      expect(store.namespaces['']).to.equal('http://other/')
    })
  })

  describe('collections still reconstructed into Collection terms', () => {
    it('folds ( … ) into a Collection with a collection-supporting factory', () => {
      const store = parseTtl(`<${base}#s> <${base}#p> ( "a" "b" "c" ) .`)
      const first = store.statements.find(s => s.predicate.value === `${base}#p`)
      expect(first.object.termType).to.equal('Collection')
      expect(first.object.elements.map(e => e.value)).to.eql(['a', 'b', 'c'])
    })

    it('leaves first/rest triples when the factory lacks collection support', () => {
      const store = parseTtl(`<${base}#s> <${base}#p> ( "a" "b" ) .`, 'text/turtle', CanonicalDataFactory)
      expect(store.statementsMatching(null, DataFactory.namedNode(`${RDF}rest`), DataFactory.namedNode(`${RDF}nil`)).length).to.equal(1)
    })
  })

  describe('application/n-triples', () => {
    it('parses and attributes triples to the document graph', () => {
      const store = parseTtl(`<http://a/s> <http://a/p> "x" .`, 'application/n-triples')
      expect(store.statements).to.have.length(1)
      expect(store.statements[0].object.value).to.equal('x')
      expect(store.statements[0].why.value).to.equal(base)
    })
  })

  describe('application/n-quads', () => {
    it('keeps the named graph and files default-graph triples under the document', () => {
      const store = parseTtl(
        `<http://a/s> <http://a/p> <http://a/o> <http://a/g> .\n<http://a/s2> <http://a/p2> <http://a/o2> .`,
        'application/n-quads'
      )
      const named = store.statements.find(s => s.subject.value === 'http://a/s')
      const dflt = store.statements.find(s => s.subject.value === 'http://a/s2')
      expect(named.why.value).to.equal('http://a/g')
      expect(dflt.why.value).to.equal(base)
    })
  })

  describe('application/trig', () => {
    it('parses named graphs and the default graph', () => {
      const store = parseTtl(
        `@prefix : <http://ex/> .\n:g { :s :p :o }\n:s2 :p2 :o2 .`,
        'application/trig'
      )
      const named = store.statements.find(s => s.subject.value === 'http://ex/s')
      const dflt = store.statements.find(s => s.subject.value === 'http://ex/s2')
      expect(named.why.value).to.equal('http://ex/g')
      expect(dflt.why.value).to.equal(base)
    })
  })

  describe('text/n3 — Notation3 via N3.js, mapped onto rdflib\'s model', () => {
    const IMPLIES = 'http://www.w3.org/2000/10/swap/log#implies'
    const SAME_AS = 'http://www.w3.org/2002/07/owl#sameAs'

    function parseN3(content) {
      const store = DataFactory.graph()
      parse(content, store, base, 'text/n3')
      return store
    }

    it('builds Formula terms for { … } => { … }', () => {
      const store = parseN3(`@prefix : <#>. { :a :b :c } => { :d :e :f }.`)
      expect(store.statements).to.have.length(1)
      const st = store.statements[0]
      expect(st.predicate.value).to.equal(IMPLIES)
      expect(st.subject.termType).to.equal('Graph')
      expect(st.object.termType).to.equal('Graph')
      expect(st.subject.statements).to.have.length(1)
      expect(st.subject.statements[0].subject.value).to.equal(`${base}#a`)
      expect(st.subject.statements[0].why.value).to.equal(base)
      expect(st.object.statements[0].object.value).to.equal(`${base}#f`)
    })

    it('reverses <= into log:implies, like the legacy parser', () => {
      const store = parseN3(`@prefix : <#>. { :p :q :r } <= { :s :t :u }.`)
      const st = store.statements[0]
      expect(st.predicate.value).to.equal(IMPLIES)
      // the right-hand side of <= is the antecedent
      expect(st.subject.statements[0].subject.value).to.equal(`${base}#s`)
      expect(st.object.statements[0].subject.value).to.equal(`${base}#p`)
    })

    it('maps = to owl:sameAs', () => {
      const store = parseN3(`@prefix : <#>. :x = :y.`)
      expect(store.statements[0].predicate.value).to.equal(SAME_AS)
    })

    it('keeps distinct formula pairs distinct (no duplicate-suppression mixups)', () => {
      const store = parseN3(`@prefix : <#>. { :a :b :c } => { :d :e :f }. { :g :h :i } => { :j :k :l }.`)
      expect(store.statements).to.have.length(2)
    })

    it('parses an empty formula {} as an empty Formula term', () => {
      const store = parseN3(`@prefix : <#>. :a :b {}.`)
      expect(store.statements[0].object.termType).to.equal('Graph')
      expect(store.statements[0].object.statements).to.have.length(0)
    })

    it('handles nested formulae with lists and variables inside', () => {
      const store = parseN3(
        `@prefix : <#>. { :v :in (1 2). ?w :q :u. } => { :done :is :true }.`)
      expect(store.statements).to.have.length(1)
      const antecedent = store.statements[0].subject
      expect(antecedent.termType).to.equal('Graph')
      const list = antecedent.statements.find(s => s.predicate.value === `${base}#in`).object
      expect(list.termType).to.equal('Collection')
      expect(list.elements.map(e => e.value)).to.eql(['1', '2'])
      const varSt = antecedent.statements.find(s => s.predicate.value === `${base}#q`)
      expect(varSt.subject.termType).to.equal('Variable')
      expect(varSt.subject.value).to.equal('w')
    })

    it('registers @forAll as universals and @forSome as existentials, keeping the terms', () => {
      const store = parseN3(`@prefix : <#>. @forAll :u. @forSome :v. :u :knows :v.`)
      expect(store.statements).to.have.length(1)
      expect(store.statements[0].subject.termType).to.equal('NamedNode')
      expect((store._universalVariables || []).map(v => v.value)).to.eql([`${base}#u`])
      expect((store._existentialVariables || []).map(v => v.value)).to.eql([`${base}#v`])
    })

    it('scopes @forSome declared inside a formula to that formula', () => {
      const store = parseN3(`@prefix : <#>. { @forSome :v. :v :p :o. } => { :x :y :z }.`)
      const antecedent = store.statements[0].subject
      expect((antecedent._existentialVariables || []).map(v => v.value)).to.eql([`${base}#v`])
      expect(store._existentialVariables || []).to.have.length(0)
    })

    it('keeps document-labelled blank nodes whole across [ … ] property lists', () => {
      // N3.js's n3 mode mis-scopes `_:c` when it is mentioned inside a
      // [ … ] property list (it applies the graph label as a prefix); the
      // adapter repairs the label so both mentions are the same node.
      const store = parseN3(`@prefix : <#>. _:c :p 1. [ :q _:c ] :r 2.`)
      const direct = store.statements.find(s => s.predicate.value === `${base}#p`).subject
      const nested = store.statements.find(s => s.predicate.value === `${base}#q`).object
      expect(direct.termType).to.equal('BlankNode')
      expect(nested.termType).to.equal('BlankNode')
      expect(nested.value).to.equal(direct.value)
    })

    it('rejects the retired cwm-era `is … of` syntax with a loud error (documented gap)', () => {
      // The legacy parser expanded `:a is :spouse of :b` to `:b :spouse :a`.
      // That syntax was dropped from the N3 CG spec and N3.js rejects it;
      // rewrite such documents as inverse triples.
      const store = DataFactory.graph()
      expect(() => parse(`@prefix : <http://ex/> .\n:a is :spouse of :b .`, store, base, 'text/n3'))
        .to.throw(/Unexpected "is"/)
    })

    it('rejects the retired bareword date syntax with a loud error (documented gap)', () => {
      // The legacy parser turned bareword `2026-07-01` into an xsd:date
      // literal; that was never standard Turtle/N3. Quote the literal instead.
      const store = DataFactory.graph()
      expect(() => parse(`@prefix : <http://ex/> .\n:a :b 2026-07-01 .`, store, base, 'text/n3'))
        .to.throw()
    })

    it('rejects @keywords with a loud error (documented gap)', () => {
      const store = DataFactory.graph()
      expect(() => parse(`@keywords a.\n<#x> a <#Type>.`, store, base, 'text/n3'))
        .to.throw()
    })
  })

  describe('RDF-star quoted triples', () => {
    it('reports a descriptive error (rdflib has no term type for them)', () => {
      const store = DataFactory.graph()
      expect(() => parse(`<< <http://x/a> <http://x/b> <http://x/c> >> <http://x/p> <http://x/o> .`, store, base, 'text/turtle'))
        .to.throw(/cannot represent Quad terms/)
    })
  })

  describe('#352 — boolean barewords inside collections', () => {
    it('produces proper Literal terms with termType inside Collection elements', () => {
      const store = parseTtl(`<${base}#s> <${base}#p> ( true false ) .`)
      const col = store.statements[0].object
      expect(col.termType).to.equal('Collection')
      col.elements.forEach(el => {
        expect(el.termType).to.equal('Literal')
        expect(el.datatype.value).to.equal(`${XSD}boolean`)
      })
      expect(col.elements.map(e => e.value)).to.eql(['true', 'false'])
    })
  })

  describe('nested collections', () => {
    it('folds ( 1 ( 2 3 ) () ) into nested Collection terms', () => {
      const store = parseTtl(`<${base}#s> <${base}#p> ( 1 ( 2 3 ) ( ) ) .`)
      const col = store.statements[0].object
      expect(col.termType).to.equal('Collection')
      expect(col.elements).to.have.length(3)
      expect(col.elements[0].value).to.equal('1')
      expect(col.elements[1].termType).to.equal('Collection')
      expect(col.elements[1].elements.map(e => e.value)).to.eql(['2', '3'])
      expect(col.elements[2].termType).to.equal('Collection')
      expect(col.elements[2].elements).to.have.length(0)
    })

    it('folds explicitly-reified first/rest chains, as the legacy parser did', () => {
      const store = parseTtl(
        `@prefix rdf: <${RDF}>. <#t> <#v> [ rdf:first 1; rdf:rest [ rdf:first 2; rdf:rest rdf:nil ]].`)
      const st = store.statements.find(s => s.predicate.value === `${base}#v`)
      expect(st.object.termType).to.equal('Collection')
      expect(st.object.elements.map(e => e.value)).to.eql(['1', '2'])
    })

    it('turns a lone rdf:nil into an empty Collection, as the legacy parser did', () => {
      const store = parseTtl(`@prefix rdf: <${RDF}>. <#t> <#v> rdf:nil .`)
      const st = store.statements.find(s => s.predicate.value === `${base}#v`)
      expect(st.object.termType).to.equal('Collection')
      expect(st.object.elements).to.have.length(0)
    })
  })
})
