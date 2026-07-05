import { expect } from 'chai'

import { blankNode, graph, lit, literal, st, sym, Collection, Serializer, serialize } from '../../src/index'
import parse from '../../src/parse'
import statementsToN3js from '../../src/n3-writer'

// The line formats (N-Triples, N-Quads) and TriG are serialized by the
// N3.js Writer through the adapter in src/n3-writer.ts; these tests pin the
// adapter seams: term mapping, Collection unfolding, graph handling, and the
// serialize() dispatch.
describe('N3.js writer adapter', () => {
  const doc = sym('https://example.org/doc')

  describe('N-Triples', () => {
    it('writes blank nodes with the _: prefix', () => {
      const kb = graph()
      kb.add(blankNode('b1'), sym('https://example.org/p'), sym('https://example.org/o'), doc)
      const result = serialize(doc, kb, null, 'application/n-triples')
      expect(result).to.equal('_:b1 <https://example.org/p> <https://example.org/o> .\n')
    })

    it('omits the datatype of xsd:string literals and keeps language tags', () => {
      const kb = graph()
      kb.add(sym('https://example.org/s'), sym('https://example.org/p'), lit('plain'), doc)
      kb.add(sym('https://example.org/s'), sym('https://example.org/q'), lit('hallo', 'de'), doc)
      const result = serialize(doc, kb, null, 'application/n-triples')
      expect(result).to.contain('<https://example.org/p> "plain" .\n')
      expect(result).to.contain('<https://example.org/q> "hallo"@de .\n')
    })

    it('always quotes numeric literals with their datatype (valid N-Triples)', () => {
      const kb = graph()
      kb.add(sym('https://example.org/s'), sym('https://example.org/p'),
        literal('42', sym('http://www.w3.org/2001/XMLSchema#integer')), doc)
      const result = serialize(doc, kb, null, 'application/n-triples')
      expect(result).to.equal(
        '<https://example.org/s> <https://example.org/p> "42"^^<http://www.w3.org/2001/XMLSchema#integer> .\n')
    })

    it('escapes quotes, backslashes and newlines in literals', () => {
      const kb = graph()
      kb.add(sym('https://example.org/s'), sym('https://example.org/p'),
        lit('a "quoted" \\ line\nbreak'), doc)
      const result = serialize(doc, kb, null, 'application/n-triples')
      expect(result).to.equal(
        '<https://example.org/s> <https://example.org/p> "a \\"quoted\\" \\\\ line\\nbreak" .\n')
    })

    it('unfolds nested collections into rdf:first/rest chains that round-trip (#749)', () => {
      const kb = graph()
      const inner = new Collection([lit('x'), lit('y')])
      const outer = new Collection([sym('https://example.org/a'), inner])
      kb.add(sym('https://example.org/s'), sym('https://example.org/p'), outer, doc)
      const nt = serialize(doc, kb, null, 'application/n-triples')

      // Every line is a triple ending in ' .'; the chain uses first/rest/nil
      expect(nt).to.contain('<http://www.w3.org/1999/02/22-rdf-syntax-ns#first>')
      expect(nt).to.contain('<http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>')

      // Reparsing folds the chains back into the same nested Collection
      const kb2 = graph()
      parse(nt, kb2, 'https://example.org/doc', 'text/turtle')
      const objects = kb2.statementsMatching(sym('https://example.org/s'), sym('https://example.org/p'), null)
      expect(objects).to.have.length(1)
      const parsed = objects[0].object
      expect(parsed.termType).to.equal('Collection')
      expect(parsed.elements).to.have.length(2)
      expect(parsed.elements[0].value).to.equal('https://example.org/a')
      expect(parsed.elements[1].termType).to.equal('Collection')
      expect(parsed.elements[1].elements.map(e => e.value)).to.eql(['x', 'y'])
    })
  })

  describe('N-Quads', () => {
    it('writes the statement graph', () => {
      const kb = graph()
      kb.add(sym('https://example.org/s'), sym('https://example.org/p'), sym('https://example.org/o'), doc)
      const result = serialize(null, kb, null, 'application/n-quads')
      expect(result).to.equal(
        '<https://example.org/s> <https://example.org/p> <https://example.org/o> <https://example.org/doc> .\n')
    })

    it('writes default-graph statements in triple form, as the spec requires (#561)', () => {
      const result = statementsToN3js([
        st(sym('https://example.org/s'), sym('https://example.org/p'), lit('v'))
      ], 'application/n-quads')
      expect(result).to.equal('<https://example.org/s> <https://example.org/p> "v" .\n')
    })
  })

  describe('TriG', () => {
    it('serialize() supports application/trig and the output re-parses to the same quads', () => {
      const kb = graph()
      const g1 = sym('https://example.org/g1')
      const g2 = sym('https://example.org/g2')
      kb.add(sym('https://example.org/s'), sym('https://example.org/p'), lit('in g1'), g1)
      kb.add(sym('https://example.org/s'), sym('https://example.org/p'), lit('in g2'), g2)
      kb.add(sym('https://example.org/s'), sym('https://example.org/q'), sym('https://example.org/o'), g2)

      const trig = serialize(null, kb, 'https://example.org/', 'application/trig')
      expect(trig).to.contain('{')

      const kb2 = graph()
      parse(trig, kb2, 'https://example.org/', 'application/trig')
      expect(kb2.statements).to.have.length(3)
      for (const statement of kb.statements) {
        expect(
          kb2.statementsMatching(statement.subject, statement.predicate, statement.object, statement.graph),
          statement.toNT()
        ).to.have.length(1)
      }
    })

    it('declares only the namespace prefixes the statements use', () => {
      const kb = graph()
      kb.setPrefixForURI('ex', 'https://example.org/')
      kb.setPrefixForURI('unused', 'https://unused.example/')
      kb.add(sym('https://example.org/s'), sym('https://example.org/p'), lit('v'), doc)
      const trig = serialize(null, kb, 'https://example.org/', 'application/trig')
      expect(trig).to.contain('@prefix ex:')
      expect(trig).to.not.contain('unused')
    })
  })

  describe('Serializer#statementsToNTriples compatibility delegate', () => {
    it('produces N-Triples by default and N-Quads with the q flag', () => {
      const statement = st(sym('https://example.org/s'), sym('https://example.org/p'), lit('v'), doc)
      const kb = graph()
      kb.add(statement)

      const sz = Serializer(kb)
      expect(sz.statementsToNTriples(kb.statements)).to.equal(
        '<https://example.org/s> <https://example.org/p> "v" .\n')

      sz.setFlags('q')
      expect(sz.statementsToNTriples(kb.statements)).to.equal(
        '<https://example.org/s> <https://example.org/p> "v" <https://example.org/doc> .\n')
    })
  })

  it('rejects content types it does not understand', () => {
    expect(() => statementsToN3js([], 'text/unknown'))
      .to.throw('unsupported content type')
  })
})
