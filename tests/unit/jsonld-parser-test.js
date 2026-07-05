import { expect } from 'chai'

import parse from '../../src/parse'
import jsonldParser from '../../src/jsonldparser'
import CanonicalDataFactory from '../../src/factories/canonical-data-factory'
import DataFactory from '../../src/factories/rdflib-data-factory'

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const XSD_NS = 'http://www.w3.org/2001/XMLSchema#'
const JSONLD_MIME = 'application/ld+json'
const BASE = 'https://www.example.org/abc/def'

/** A store whose factory supports Collections (the rdflib default) */
function collectionStore () {
  return DataFactory.graph()
}

/** A store without Collection support: lists stay as raw first/rest quads */
function canonicalStore () {
  return DataFactory.graph(undefined, { rdfFactory: CanonicalDataFactory })
}

describe('JSON-LD parser (jsonld.toRDF)', () => {
  describe('doc-graph placement', () => {
    it('puts default-graph quads in the document graph named by base', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/subject',
        'http://example.com/predicate': { '@id': 'http://example.com/object' }
      }), store, BASE)

      expect(store.statements).to.have.length(1)
      expect(store.statements[0].why.termType).to.equal('NamedNode')
      expect(store.statements[0].why.value).to.equal(BASE)
    })

    it('accepts a NamedNode as base, like the previous parser', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/subject',
        'http://example.com/predicate': 'value'
      }), store, store.sym(BASE))

      expect(store.statements).to.have.length(1)
      expect(store.statements[0].why.value).to.equal(BASE)
    })
  })

  describe('named graphs (regression: the old walker crashed on @graph)', () => {
    const doc = {
      '@id': 'http://example.com/graphs/g1',
      '@graph': [{
        '@id': 'http://example.com/a',
        'http://example.com/p': { '@id': 'http://example.com/b' }
      }],
      'http://example.com/meta': 'about the graph'
    }

    it('parses without throwing and places quads in their named graph', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify(doc), store, BASE)

      expect(store.statements).to.have.length(2)

      const meta = store.statementsMatching(store.sym('http://example.com/graphs/g1'))[0]
      expect(meta.object.value).to.equal('about the graph')
      // Top-level statements stay in the doc graph
      expect(meta.why.value).to.equal(BASE)

      const inner = store.statementsMatching(store.sym('http://example.com/a'))[0]
      expect(inner.object.value).to.equal('http://example.com/b')
      // ... while @graph contents get the named graph as `why`
      expect(inner.why.termType).to.equal('NamedNode')
      expect(inner.why.value).to.equal('http://example.com/graphs/g1')
    })

    it('surfaces named-graph docs through parse() with a callback', done => {
      const store = collectionStore()
      parse(JSON.stringify(doc), store, BASE, JSONLD_MIME, (err, kb) => {
        try {
          expect(err).to.equal(null)
          expect(kb.statements).to.have.length(2)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  describe('@json literals (regression: the old walker crashed on @json)', () => {
    it('produces a literal with the rdf:JSON datatype', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/s',
        'http://example.com/config': { '@value': { a: [1, 2] }, '@type': '@json' }
      }), store, BASE)

      expect(store.statements).to.have.length(1)
      const object = store.statements[0].object
      expect(object.termType).to.equal('Literal')
      expect(object.datatype.value).to.equal(RDF_NS + 'JSON')
      expect(JSON.parse(object.value)).to.deep.equal({ a: [1, 2] })
    })
  })

  describe('native JSON values (regression: wrong datatypes before)', () => {
    let store
    before(async () => {
      store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/s',
        'http://example.com/bool': true,
        'http://example.com/int': 42,
        'http://example.com/double': 1.5,
        'http://example.com/string': 'plain'
      }), store, BASE)
    })

    const objectOf = property =>
      store.statementsMatching(undefined, store.sym('http://example.com/' + property))[0].object

    it('maps true to "true"^^xsd:boolean (canonical lexical form)', () => {
      const o = objectOf('bool')
      expect(o.value).to.equal('true')
      expect(o.datatype.value).to.equal(XSD_NS + 'boolean')
    })

    it('maps 42 to "42"^^xsd:integer', () => {
      const o = objectOf('int')
      expect(o.value).to.equal('42')
      expect(o.datatype.value).to.equal(XSD_NS + 'integer')
    })

    it('maps 1.5 to "1.5E0"^^xsd:double (canonical lexical form)', () => {
      const o = objectOf('double')
      expect(o.value).to.equal('1.5E0')
      expect(o.datatype.value).to.equal(XSD_NS + 'double')
    })

    it('maps JSON strings to xsd:string literals', () => {
      const o = objectOf('string')
      expect(o.value).to.equal('plain')
      expect(o.datatype.value).to.equal(XSD_NS + 'string')
    })

    it('keeps language-tagged values as language literals', async () => {
      const langStore = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/s',
        'http://example.com/label': { '@value': 'Die Königin', '@language': 'de' }
      }), langStore, BASE)
      const o = langStore.statements[0].object
      expect(o.language).to.equal('de')
      expect(o.value).to.equal('Die Königin')
    })
  })

  describe('base IRI handling', () => {
    it('resolves relative IRIs against the base', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': '../#me',
        'http://example.com/knows': { '@id': 'other' }
      }), store, BASE)

      const st = store.statements[0]
      expect(st.subject.value).to.equal('https://www.example.org/#me')
      expect(st.object.value).to.equal('https://www.example.org/abc/other')
    })

    it('resolves relative IRIs against a base that carries a fragment', async () => {
      const store = collectionStore()
      const fragmentBase = 'https://www.example.org/dir/doc#frag'
      await jsonldParser(JSON.stringify({
        '@id': '#me',
        'http://example.com/knows': { '@id': 'other' }
      }), store, fragmentBase)

      const st = store.statements[0]
      expect(st.subject.value).to.equal('https://www.example.org/dir/doc#me')
      expect(st.object.value).to.equal('https://www.example.org/dir/other')
      // The doc graph keeps the base exactly as given (rdflib convention)
      expect(st.why.value).to.equal(fragmentBase)
    })
  })

  describe('blank nodes are fresh per parse (regression: cross-document conflation)', () => {
    it('never conflates blank nodes from two documents parsed into one store', async () => {
      const store = collectionStore()
      // Both docs make jsonld.js emit the label _:b0 internally; the label
      // must not be copied into the store verbatim
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/a',
        'http://example.com/p': { 'http://example.com/q': 'first doc' }
      }), store, 'https://www.example.org/doc1')
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/b',
        'http://example.com/p': { 'http://example.com/q': 'second doc' }
      }), store, 'https://www.example.org/doc2')

      const inner = store.statementsMatching(undefined, store.sym('http://example.com/q'))
      expect(inner).to.have.length(2)
      expect(inner[0].subject.termType).to.equal('BlankNode')
      expect(inner[1].subject.termType).to.equal('BlankNode')
      expect(inner[0].subject.value).to.not.equal(inner[1].subject.value)
    })

    it('keeps blank node identity consistent within one parse', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/a',
        'http://example.com/p': { 'http://example.com/q': 'inner' }
      }), store, BASE)

      const outer = store.statementsMatching(store.sym('http://example.com/a'))[0]
      const inner = store.statementsMatching(undefined, store.sym('http://example.com/q'))[0]
      expect(outer.object.termType).to.equal('BlankNode')
      expect(outer.object.value).to.equal(inner.subject.value)
    })
  })

  describe('@list handling', () => {
    const listDoc = {
      '@context': {
        list: { '@id': 'https://example.org/ns#listProp', '@container': '@list' }
      },
      '@id': 'http://example.com/s',
      list: ['a', 42, { '@id': 'http://example.com/item' }]
    }

    it('folds @list into a Collection when the factory supports them', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify(listDoc), store, BASE)

      expect(store.statements).to.have.length(1)
      const collection = store.statements[0].object
      expect(collection.termType).to.equal('Collection')
      expect(collection.elements).to.have.length(3)
      expect(collection.elements[0].value).to.equal('a')
      expect(collection.elements[1].value).to.equal('42')
      expect(collection.elements[1].datatype.value).to.equal(XSD_NS + 'integer')
      expect(collection.elements[2].termType).to.equal('NamedNode')
      expect(collection.elements[2].value).to.equal('http://example.com/item')
    })

    it('folds nested @lists into nested Collections', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/s',
        'http://example.com/list': { '@list': ['a', { '@list': ['x', 'y'] }, 'b'] }
      }), store, BASE)

      expect(store.statements).to.have.length(1)
      const outer = store.statements[0].object
      expect(outer.termType).to.equal('Collection')
      expect(outer.elements).to.have.length(3)
      expect(outer.elements[0].value).to.equal('a')
      const nested = outer.elements[1]
      expect(nested.termType).to.equal('Collection')
      expect(nested.elements.map(e => e.value)).to.deep.equal(['x', 'y'])
      expect(outer.elements[2].value).to.equal('b')
    })

    it('folds an empty @list into an empty Collection', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/s',
        'http://example.com/list': { '@list': [] }
      }), store, BASE)

      expect(store.statements).to.have.length(1)
      const collection = store.statements[0].object
      expect(collection.termType).to.equal('Collection')
      expect(collection.elements).to.have.length(0)
    })

    it('emits raw first/rest quads when the factory does not support Collections', async () => {
      const store = canonicalStore()
      await jsonldParser(JSON.stringify(listDoc), store, BASE)

      // 3 x (rdf:first + rdf:rest) + the referencing statement
      expect(store.statements).to.have.length(7)
      const first = store.statementsMatching(undefined, store.sym(RDF_NS + 'first'))
      expect(first).to.have.length(3)
    })

    it('leaves non-well-formed first/rest structures as raw triples', async () => {
      const store = collectionStore()
      // A hand-built node that looks list-like but carries an extra property:
      // folding must not touch it (and must not throw, unlike convertFirstRestNil)
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/s',
        'http://example.com/almostList': {
          [RDF_NS + 'first']: 'a',
          [RDF_NS + 'rest']: { '@id': RDF_NS + 'nil' },
          'http://example.com/extra': 'not a list'
        }
      }), store, BASE)

      const ref = store.statementsMatching(store.sym('http://example.com/s'))[0]
      expect(ref.object.termType).to.equal('BlankNode')
      expect(store.statementsMatching(undefined, store.sym(RDF_NS + 'first'))).to.have.length(1)
      expect(store.statementsMatching(undefined, store.sym('http://example.com/extra'))).to.have.length(1)
    })
  })

  describe('remote @context refusal (SSRF protection)', () => {
    const remoteCtxDoc = JSON.stringify({
      '@context': 'https://remote.example/context.jsonld',
      '@id': 'http://example.com/s',
      name: 'Jane'
    })

    it('rejects with an error naming the context URL and the opt-in', async () => {
      const store = collectionStore()
      try {
        await jsonldParser(remoteCtxDoc, store, BASE)
        throw new Error('should have rejected')
      } catch (err) {
        expect(err.message).to.contain('Refused to fetch remote @context')
        expect(err.message).to.contain('https://remote.example/context.jsonld')
        expect(err.message).to.contain('documentLoader')
        expect(err.contextUrl).to.equal('https://remote.example/context.jsonld')
      }
      expect(store.statements).to.have.length(0)
    })

    it('surfaces the refusal through parse()\'s error callback', done => {
      const store = collectionStore()
      parse(remoteCtxDoc, store, BASE, JSONLD_MIME, (err, kb) => {
        try {
          expect(err).to.be.instanceOf(Error)
          expect(err.message).to.contain('Refused to fetch remote @context')
          expect(err.message).to.contain('https://remote.example/context.jsonld')
          expect(kb.statements).to.have.length(0)
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('resolves remote contexts when a documentLoader is injected', async () => {
      const store = collectionStore()
      const requested = []
      const documentLoader = async (url) => {
        requested.push(url)
        return {
          documentUrl: url,
          document: {
            '@context': {
              name: 'http://xmlns.com/foaf/0.1/name',
              link: { '@id': 'http://example.com/link', '@type': '@id' }
            }
          },
          contextUrl: null
        }
      }

      // ericprud's integration case 4 (#391): remote context, relative resolution
      await jsonldParser(JSON.stringify({
        '@context': 'https://remote.example/context.jsonld',
        '@id': '#me',
        name: 'Jane',
        link: 'other'
      }), store, BASE, { documentLoader })

      expect(requested).to.deep.equal(['https://remote.example/context.jsonld'])
      const me = store.sym('https://www.example.org/abc/def#me')
      const name = store.statementsMatching(me, store.sym('http://xmlns.com/foaf/0.1/name'))[0]
      expect(name.object.value).to.equal('Jane')
      const link = store.statementsMatching(me, store.sym('http://example.com/link'))[0]
      expect(link.object.termType).to.equal('NamedNode')
      expect(link.object.value).to.equal('https://www.example.org/abc/other')
    })

    it('threads the documentLoader through parse()', done => {
      const store = collectionStore()
      const documentLoader = async (url) => ({
        documentUrl: url,
        document: { '@context': { name: 'http://xmlns.com/foaf/0.1/name' } },
        contextUrl: null
      })
      const doc = JSON.stringify({
        '@context': 'https://remote.example/context.jsonld',
        '@id': 'http://example.com/s',
        name: 'Jane'
      })
      parse(doc, store, BASE, JSONLD_MIME, (err, kb) => {
        try {
          expect(err).to.equal(null)
          const name = kb.statementsMatching(undefined, kb.sym('http://xmlns.com/foaf/0.1/name'))[0]
          expect(name.object.value).to.equal('Jane')
          done()
        } catch (e) {
          done(e)
        }
      }, { documentLoader })
    })
  })

  describe('#391 integration cases (ericprud)', () => {
    it('1. embedded @context', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@context': { name: 'http://xmlns.com/foaf/0.1/name' },
        '@id': 'http://example.com/jane',
        name: 'Jane Doe'
      }), store, BASE)

      expect(store.statements).to.have.length(1)
      expect(store.statements[0].predicate.value).to.equal('http://xmlns.com/foaf/0.1/name')
      expect(store.statements[0].object.value).to.equal('Jane Doe')
    })

    it('2. api-supplied context (options.expandContext)', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'http://example.com/jane',
        name: 'Jane Doe'
      }), store, BASE, {
        expandContext: { name: 'http://xmlns.com/foaf/0.1/name' }
      })

      expect(store.statements).to.have.length(1)
      expect(store.statements[0].predicate.value).to.equal('http://xmlns.com/foaf/0.1/name')
      expect(store.statements[0].object.value).to.equal('Jane Doe')
    })

    it('3. api-supplied base', async () => {
      const store = collectionStore()
      await jsonldParser(JSON.stringify({
        '@id': 'jane',
        'http://xmlns.com/foaf/0.1/name': 'Jane Doe'
      }), store, 'https://base.example/dir/')

      expect(store.statements[0].subject.value).to.equal('https://base.example/dir/jane')
    })

    // 4. remote context with relative resolution: covered in the
    // 'remote @context refusal' block above (injected documentLoader case)
  })

  describe('error shapes', () => {
    it('rejects on invalid JSON with the JSON.parse error', async () => {
      const store = collectionStore()
      try {
        await jsonldParser('this is not JSON', store, BASE)
        throw new Error('should have rejected')
      } catch (err) {
        expect(err.message).to.contain('Unexpected token')
      }
    })

    it('rejects on valid JSON that is invalid JSON-LD', async () => {
      const store = collectionStore()
      try {
        await jsonldParser(JSON.stringify({ '@id': 5 }), store, BASE)
        throw new Error('should have rejected')
      } catch (err) {
        expect(err.message).to.contain('Invalid JSON-LD syntax')
      }
    })
  })

  describe('parse() API compatibility', () => {
    const doc = JSON.stringify({
      '@id': 'http://example.com/s',
      'http://example.com/p': 'value'
    })

    it('works with a callback', done => {
      const store = collectionStore()
      parse(doc, store, BASE, JSONLD_MIME, (err, kb) => {
        try {
          expect(err).to.equal(null)
          expect(kb.statements).to.have.length(1)
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('works without a callback (fills the store asynchronously)', async () => {
      const store = collectionStore()
      parse(doc, store, BASE, JSONLD_MIME)
      // parse() stays sync for JSON-LD; completion is only observable async
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(store.statements).to.have.length(1)
    })

    it('jsonldParser resolves to the store', async () => {
      const store = collectionStore()
      const result = await jsonldParser(doc, store, BASE)
      expect(result).to.equal(store)
    })
  })
})
