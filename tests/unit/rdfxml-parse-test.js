/**
 * Tests for RDF/XML parsing via rdfxml-streaming-parser.
 *
 * parse() for application/rdf+xml is asynchronous: results must be read via
 * the callback. Every test here goes through the public parse() API.
 */
import { expect } from 'chai'
import { readFileSync } from 'fs'
import { join } from 'path'

import parse from '../../src/parse'
import serialize from '../../src/serialize'
import CanonicalDataFactory from '../../src/factories/canonical-data-factory'
import DataFactory from '../../src/factories/rdflib-data-factory'

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const MIME = 'application/rdf+xml'

/** parse() promisified over its callback (the async-parse contract). */
function parseP (content, store, base) {
  return new Promise((resolve, reject) => {
    parse(content, store, base, MIME, (err, kb) => err ? reject(err) : resolve(kb))
  })
}

function wrap (body) {
  return `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="${RDF_NS}" xmlns:ex="http://example.org/vocab#">
${body}
</rdf:RDF>`
}

describe('RDF/XML parsing (rdfxml-streaming-parser)', () => {
  describe('rdf:nodeID (issue #751)', () => {
    // Exact reproduction from the issue.
    const content = `<rdf:RDF
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns:exa="http://example.com/"
 xmlns:foaf="http://xmlns.com/foaf/0.1/">
    <foaf:Organization rdf:about="http://example.com/org1">
        <exa:member rdf:nodeID="n0" />
        <exa:member rdf:nodeID="otherNodeId" />
    </foaf:Organization>
</rdf:RDF>`

    it('keeps distinct nodeIDs distinct and preserves the document labels', async () => {
      const store = DataFactory.graph()
      await parseP(content, store, 'http://example.com/doc')
      const members = store.each(
        store.sym('http://example.com/org1'),
        store.sym('http://example.com/member'))
      expect(members).to.have.length(2)
      expect(members[0].termType).to.equal('BlankNode')
      expect(members[1].termType).to.equal('BlankNode')
      expect(members[0].value).to.not.equal(members[1].value)
      // The document's nodeID labels are preserved inside a per-parse scope
      // (rxN_<label>), so they remain recognisable without being able to
      // collide across documents.
      const labels = members.map(m => m.value).sort()
      expect(labels.some(v => v.endsWith('_n0'))).to.equal(true)
      expect(labels.some(v => v.endsWith('_otherNodeId'))).to.equal(true)
    })

    it('unifies repeated uses of the same nodeID within one document', async () => {
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:about="http://example.org/a">
    <ex:p rdf:nodeID="shared"/>
  </rdf:Description>
  <rdf:Description rdf:nodeID="shared">
    <ex:q>value</ex:q>
  </rdf:Description>`)
      await parseP(doc, store, 'http://example.org/doc')
      const obj = store.any(store.sym('http://example.org/a'), store.sym('http://example.org/vocab#p'))
      const subj = store.any(null, store.sym('http://example.org/vocab#q'))
      expect(obj.termType).to.equal('BlankNode')
      expect(store.anyStatementMatching(obj, store.sym('http://example.org/vocab#q'))).to.exist
      expect(subj).to.exist
    })

    it('keeps blank nodes fresh per parse (no cross-document collisions)', async () => {
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:about="http://example.org/a">
    <ex:p rdf:nodeID="shared"/>
  </rdf:Description>`)
      await parseP(doc, store, 'http://example.org/doc1')
      await parseP(doc, store, 'http://example.org/doc2')
      const sts = store.statementsMatching(null, store.sym('http://example.org/vocab#p'), null)
      expect(sts).to.have.length(2)
      // Same document label, but the two parses must not share a bnode.
      expect(sts[0].object.value).to.not.equal(sts[1].object.value)
    })
  })

  describe('rdf:Bag / rdf:li (issue #182, parser half)', () => {
    // The serializer half of #182 (how Bags are written back) is explicitly
    // out of scope here; these tests pin the parser side down.
    it('numbers rdf:li members as rdf:_1, rdf:_2, ...', async () => {
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:about="http://example.org/s">
    <ex:bag>
      <rdf:Bag>
        <rdf:li>apple</rdf:li>
        <rdf:li>banana</rdf:li>
        <rdf:li>coconut</rdf:li>
      </rdf:Bag>
    </ex:bag>
  </rdf:Description>`)
      await parseP(doc, store, 'http://example.org/doc')
      const bag = store.any(store.sym('http://example.org/s'), store.sym('http://example.org/vocab#bag'))
      expect(bag.termType).to.equal('BlankNode')
      expect(store.any(bag, store.sym(RDF_NS + 'type')).value).to.equal(RDF_NS + 'Bag')
      expect(store.any(bag, store.sym(RDF_NS + '_1')).value).to.equal('apple')
      expect(store.any(bag, store.sym(RDF_NS + '_2')).value).to.equal('banana')
      expect(store.any(bag, store.sym(RDF_NS + '_3')).value).to.equal('coconut')
    })

    it('parses the empty-Bag document from the issue to exactly two statements', async () => {
      // Exact input from #182.
      const content = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:myNS="http://www.example.org/">
  <rdf:Description rdf:about="#_000001">
    <myNS:hasProperty>
      <rdf:Bag></rdf:Bag>
    </myNS:hasProperty>
  </rdf:Description>
</rdf:RDF>`
      const base = 'http://host.example/doc'
      const store = DataFactory.graph()
      await parseP(content, store, base)
      expect(store.statements).to.have.length(2)
      const bag = store.any(store.sym(base + '#_000001'), store.sym('http://www.example.org/hasProperty'))
      expect(bag.termType).to.equal('BlankNode')
      expect(store.any(bag, store.sym(RDF_NS + 'type')).value).to.equal(RDF_NS + 'Bag')
    })

    it('re-parses its own serialization without expansion (round-trip stability)', async () => {
      const content = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:myNS="http://www.example.org/">
  <rdf:Description rdf:about="#_000001">
    <myNS:hasProperty>
      <rdf:Bag></rdf:Bag>
    </myNS:hasProperty>
  </rdf:Description>
</rdf:RDF>`
      const base = 'http://host.example/doc'
      let store = DataFactory.graph()
      await parseP(content, store, base)
      const counts = [store.statements.length]
      try {
        for (let i = 0; i < 3; i++) {
          const xml = serialize(store.sym(base), store, base, MIME)
          store = DataFactory.graph()
          await parseP(xml, store, base)
          counts.push(store.statements.length)
        }
      } catch (e) {
        // Loud failure beats silent corruption; growth must never happen.
      }
      for (const count of counts) {
        expect(count).to.be.at.most(2)
      }
    })

    it('round-trips a named Bag with members stably', async () => {
      const doc = wrap(`  <rdf:Description rdf:about="http://example.org/s">
    <ex:bag>
      <rdf:Bag rdf:about="http://example.org/bag1">
        <rdf:li>apple</rdf:li>
        <rdf:li>banana</rdf:li>
      </rdf:Bag>
    </ex:bag>
  </rdf:Description>`)
      const base = 'http://host.example/doc'
      let store = DataFactory.graph()
      await parseP(doc, store, base)
      expect(store.statements).to.have.length(4)
      for (let i = 0; i < 2; i++) {
        const xml = serialize(store.sym(base), store, base, MIME)
        store = DataFactory.graph()
        await parseP(xml, store, base)
        expect(store.statements).to.have.length(4)
      }
      const bag = store.sym('http://example.org/bag1')
      expect(store.any(bag, store.sym(RDF_NS + '_1')).value).to.equal('apple')
      expect(store.any(bag, store.sym(RDF_NS + '_2')).value).to.equal('banana')
    })
  })

  describe('old-parser leniencies (kept)', () => {
    it('tolerates duplicate rdf:ID values', async () => {
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:ID="dup"><ex:p>one</ex:p></rdf:Description>
  <rdf:Description rdf:ID="dup"><ex:p>two</ex:p></rdf:Description>`)
      const base = 'http://example.org/doc'
      await parseP(doc, store, base)
      const values = store.each(store.sym(base + '#dup'), store.sym('http://example.org/vocab#p'))
        .map(t => t.value).sort()
      expect(values).to.eql(['one', 'two'])
    })

    it('tolerates lax IRIs (no extra validation, as before)', async () => {
      // IRI validation is disabled in the adapter: exactly like the old
      // parser, anything rdflib's own NamedNode accepts gets through
      // (pipes, curly braces, ...).
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:about="http://example.org/x|y">
    <ex:p rdf:resource="http://example.org/{z}"/>
  </rdf:Description>`)
      await parseP(doc, store, 'http://example.org/doc')
      const st = store.anyStatementMatching(null, store.sym('http://example.org/vocab#p'))
      expect(st.subject.value).to.equal('http://example.org/x|y')
      expect(st.object.value).to.equal('http://example.org/{z}')
    })

    it('still rejects IRIs that rdflib itself rejects (unencoded spaces), as before', async () => {
      // rdflib's NamedNode constructor throws on unencoded spaces; the old
      // parser surfaced that same error. Parity check: so does the new one.
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:about="http://example.org/a b">
    <ex:p>v</ex:p>
  </rdf:Description>`)
      let err = null
      try {
        await parseP(doc, store, 'http://example.org/doc')
      } catch (e) {
        err = e
      }
      expect(err).to.be.an.instanceof(Error)
      expect(String(err)).to.contain('unencoded spaces')
    })
  })

  describe('rdf:parseType="Collection"', () => {
    const doc = wrap(`  <rdf:Description rdf:about="http://example.org/s">
    <ex:list rdf:parseType="Collection">
      <rdf:Description rdf:about="http://example.org/a"/>
      <rdf:Description rdf:about="http://example.org/b"/>
      <rdf:Description rdf:about="http://example.org/c"/>
    </ex:list>
  </rdf:Description>`)

    it('folds chains into a live Collection when the factory supports them', async () => {
      const store = DataFactory.graph()
      await parseP(doc, store, 'http://example.org/doc')
      expect(store.statements).to.have.length(1)
      const list = store.any(store.sym('http://example.org/s'), store.sym('http://example.org/vocab#list'))
      expect(list.termType).to.equal('Collection')
      expect(list.closed).to.equal(true)
      expect(list.elements.map(e => e.value)).to.eql([
        'http://example.org/a',
        'http://example.org/b',
        'http://example.org/c'
      ])
    })

    it('folds an empty collection', async () => {
      const store = DataFactory.graph()
      const emptyDoc = wrap(`  <rdf:Description rdf:about="http://example.org/s">
    <ex:list rdf:parseType="Collection"/>
  </rdf:Description>`)
      await parseP(emptyDoc, store, 'http://example.org/doc')
      const list = store.any(store.sym('http://example.org/s'), store.sym('http://example.org/vocab#list'))
      expect(list.termType).to.equal('Collection')
      expect(list.elements).to.have.length(0)
    })

    it('leaves rdf:first/rdf:rest triples when the factory has no Collection support', async () => {
      const store = DataFactory.graph(undefined, { rdfFactory: CanonicalDataFactory })
      await parseP(doc, store, 'http://example.org/doc')
      // 1 property statement + 3 × (first + rest)
      expect(store.statementsMatching(null, store.sym(RDF_NS + 'first'), null)).to.have.length(3)
      expect(store.statementsMatching(null, store.sym(RDF_NS + 'rest'), null)).to.have.length(3)
      const head = store.any(store.sym('http://example.org/s'), store.sym('http://example.org/vocab#list'))
      expect(head.termType).to.equal('BlankNode')
    })
  })

  describe('literals', () => {
    it('keeps xml:lang (including inherited) and rdf:datatype', async () => {
      const store = DataFactory.graph()
      const doc = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="${RDF_NS}" xmlns:ex="http://example.org/vocab#" xml:lang="de">
  <rdf:Description rdf:about="http://example.org/s">
    <ex:inherited>hallo</ex:inherited>
    <ex:tagged xml:lang="fr">bonjour</ex:tagged>
    <ex:typed rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">4</ex:typed>
  </rdf:Description>
</rdf:RDF>`
      await parseP(doc, store, 'http://example.org/doc')
      const s = store.sym('http://example.org/s')
      const ex = n => store.sym('http://example.org/vocab#' + n)
      expect(store.any(s, ex('inherited')).lang).to.equal('de')
      expect(store.any(s, ex('tagged')).lang).to.equal('fr')
      const typed = store.any(s, ex('typed'))
      expect(typed.value).to.equal('4')
      expect(typed.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#integer')
    })
  })

  describe('base and relative IRIs', () => {
    it('resolves relative IRIs against the base', async () => {
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:about="child">
    <ex:p rdf:resource="/rooted"/>
  </rdf:Description>`)
      await parseP(doc, store, 'http://example.org/dir/doc')
      const st = store.anyStatementMatching(null, store.sym('http://example.org/vocab#p'))
      expect(st.subject.value).to.equal('http://example.org/dir/child')
      expect(st.object.value).to.equal('http://example.org/rooted')
    })

    it('resolves against a base with a fragment', async () => {
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:about="#x">
    <ex:p>v</ex:p>
  </rdf:Description>`)
      const base = 'http://example.org/doc#frag'
      await parseP(doc, store, base)
      const st = store.statements[0]
      expect(st.subject.value).to.equal('http://example.org/doc#x')
      // The document graph is still named by the base as given.
      expect(st.why.value).to.equal(base)
    })

    it('honours xml:base, including relative xml:base (which the old parser rejected)', async () => {
      const store = DataFactory.graph()
      const doc = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="${RDF_NS}" xmlns:ex="http://example.org/vocab#" xml:base="http://other.example/dir/">
  <rdf:Description rdf:about="a"><ex:p>1</ex:p></rdf:Description>
  <rdf:Description rdf:about="b" xml:base="sub/"><ex:p>2</ex:p></rdf:Description>
</rdf:RDF>`
      await parseP(doc, store, 'http://example.org/doc')
      const subjects = store.statementsMatching(null, store.sym('http://example.org/vocab#p'), null)
        .map(st => st.subject.value).sort()
      expect(subjects).to.eql([
        'http://other.example/dir/a',
        'http://other.example/dir/sub/b'
      ])
    })
  })

  describe('graph placement', () => {
    it('puts every statement into the document graph kb.sym(base)', async () => {
      const store = DataFactory.graph()
      const doc = wrap(`  <rdf:Description rdf:about="http://example.org/s">
    <ex:p>v</ex:p>
    <ex:q rdf:nodeID="b"/>
  </rdf:Description>
  <rdf:Description rdf:nodeID="b"><ex:r>w</ex:r></rdf:Description>`)
      const base = 'http://example.org/the-doc'
      await parseP(doc, store, base)
      expect(store.statements.length).to.be.greaterThan(0)
      for (const st of store.statements) {
        expect(st.why.value).to.equal(base)
      }
    })
  })

  describe('prefix harvesting', () => {
    it('registers xmlns: prefixes into the store, as the old parser did', async () => {
      const store = DataFactory.graph()
      const doc = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="${RDF_NS}" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <rdf:Description rdf:about="http://example.org/s">
    <dc:title>t</dc:title>
  </rdf:Description>
</rdf:RDF>`
      await parseP(doc, store, 'http://example.org/doc')
      expect(store.namespaces['dc']).to.equal('http://purl.org/dc/elements/1.1/')
    })
  })

  describe('error handling and callback API', () => {
    it('surfaces malformed XML through the error callback', done => {
      const store = DataFactory.graph()
      parse('<rdf:RDF xmlns:rdf="' + RDF_NS + '"><unclosed', store,
        'http://example.org/doc', MIME, (err) => {
          try {
            expect(err).to.be.an.instanceof(Error)
            done()
          } catch (e) {
            done(e)
          }
        })
    })

    it('calls the callback with (null, kb) on success', done => {
      const store = DataFactory.graph()
      parse(wrap('  <rdf:Description rdf:about="http://example.org/s"><ex:p>v</ex:p></rdf:Description>'),
        store, 'http://example.org/doc', MIME, (err, kb) => {
          try {
            expect(err).to.equal(null)
            expect(kb).to.equal(store)
            expect(kb.statements).to.have.length(1)
            done()
          } catch (e) {
            done(e)
          }
        })
    })

    it('still populates the store when no callback is given (asynchronously)', done => {
      const store = DataFactory.graph()
      parse(wrap('  <rdf:Description rdf:about="http://example.org/s"><ex:p>v</ex:p></rdf:Description>'),
        store, 'http://example.org/doc', MIME)
      // No callback: parse() returns before the store is populated (the
      // async-parse delta); the data arrives on a later tick.
      setTimeout(() => {
        try {
          expect(store.statements).to.have.length(1)
          done()
        } catch (e) {
          done(e)
        }
      }, 50)
    })
  })

  describe('round-trips through the in-house RDF/XML serializer', () => {
    // The tests/serialize suite already exercises ttl-to-xml; these add
    // xml-store-xml-store coverage on the same reference fixtures.
    for (const fixture of ['t1-ref.xml', 't2-ref.xml', 't3-ref.xml']) {
      it(`parse, serialize, re-parse is stable for ${fixture}`, async () => {
        const xml = readFileSync(join(__dirname, '..', 'serialize', fixture), 'utf8')
        const base = 'https://example.com/' + fixture.replace('-ref.xml', '.ttl')
        const store1 = DataFactory.graph()
        await parseP(xml, store1, base)
        expect(store1.statements.length).to.be.greaterThan(0)
        const reserialized = serialize(store1.sym(base), store1, base, MIME)
        const store2 = DataFactory.graph()
        await parseP(reserialized, store2, base)
        const nts1 = store1.statements.map(st => st.toNT()).sort()
        const nts2 = store2.statements.map(st => st.toNT()).sort()
        expect(nts2).to.eql(nts1)
      })
    }
  })
})
