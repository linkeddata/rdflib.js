/* eslint-env mocha */
import { expect } from 'chai'
import CanonicalDataFactory from '../../src/factories/canonical-data-factory'
import Formula from '../../src/formula'

import IndexedFormula from '../../src/store'
import NamedNode from '../../src/named-node'
import { RDFArrayRemove } from '../../src/utils-js'
import DataFactory from '../../src/factories/rdflib-data-factory'
import parse from '../../src/parse'
import serialize from '../../src/serialize'

describe('IndexedFormula', () => {
  const g0 = NamedNode.fromValue('https://example.com/graph0')

  const s1 = NamedNode.fromValue('https://example.com/subject1')
  const p1 = NamedNode.fromValue('https://example.com/predicate1')
  const o1 = NamedNode.fromValue('https://example.com/object1')
  const triple1 = DataFactory.triple(s1, p1, o1)

  const s2 = NamedNode.fromValue('https://example.com/subject2')
  const p2 = NamedNode.fromValue('https://example.com/predicate2')
  const o2 = NamedNode.fromValue('https://example.com/object2')
  const triple2 = DataFactory.triple(s2, p2, o2)

  const s3 = NamedNode.fromValue('https://example.com/subject3')
  const p3 = NamedNode.fromValue('https://example.com/predicate3')
  const o3 = NamedNode.fromValue('https://example.com/object3')
  const triple3 = DataFactory.triple(s3, p3, o3)

  const triple4 = DataFactory.triple(s1, p2, o3)

  describe('constructor', () => {
    it ('initializes empty', () => {
      const store = new IndexedFormula()

      expect(store.statements).to.have.length(0)
      expect(Object.values(store.subjectIndex)).to.have.length(0)
      expect(Object.values(store.predicateIndex)).to.have.length(0)
      expect(Object.values(store.objectIndex)).to.have.length(0)
      expect(Object.values(store.whyIndex)).to.have.length(0)

      expect(store.namespaces).to.eql({})
      expect(store.rdfArrayRemove).to.eq(RDFArrayRemove)
      expect(store.rdfFactory).to.eq(CanonicalDataFactory)
    });

    it ('has referential index integrity', () => {
      const store = new IndexedFormula()

      expect(store.subjectIndex).to.equal(store.index[0])
      expect(store.predicateIndex).to.equal(store.index[1])
      expect(store.objectIndex).to.equal(store.index[2])
      expect(store.whyIndex).to.equal(store.index[3])
    })
  });

  describe('match', () => {
    it('when given no arguments returns all statements', () => {
      const kb = new IndexedFormula()
      const triples = [ triple1, triple2, triple3 ]
      kb.addAll(triples)
      expect(kb.length).to.equal(3)
      expect(kb.match()).to.eql(triples)
    })

    it('matches on subject', () => {
      let kb = new IndexedFormula()
      kb.addAll([ triple1, triple2, triple3, triple4 ])
      let s = NamedNode.fromValue('https://example.com/subject1')
      let matches = kb.match(s)
      expect(matches.length).to.equal(2)
      matches.sort()
      expect(matches[0].subject).to.eql(s1)
      expect(matches[1].subject).to.eql(s1)
    })

    it('matches on predicate', () => {
      let kb = new IndexedFormula()
      kb.addAll([ triple1, triple2, triple3, triple4 ])
      let p = NamedNode.fromValue('https://example.com/predicate2')
      let matches = kb.match(null, p)
      expect(matches.length).to.equal(2)
      matches.sort()
      expect(matches[0].predicate).to.eql(p2)
      expect(matches[1].predicate).to.eql(p2)
    })

    it('matches on subject and object', () => {
      let kb = new IndexedFormula()
      kb.addAll([ triple1, triple2, triple3, triple4 ])
      let matches = kb.match(
        NamedNode.fromValue('https://example.com/subject1'),
        null,
        NamedNode.fromValue('https://example.com/object1')
      )
      expect(matches.length).to.equal(1)
      expect(matches[0].subject).to.eql(s1)
      expect(matches[0].object).to.eql(o1)
    })
  })

  describe('addStatement', () => {
    it ('is not inherited', () => {
      const store = new IndexedFormula()
      expect(store.addStatement).not.to.eq(Formula.prototype.addStatement)
    })

    it ('is indexed', () => {
      const store = new IndexedFormula()
      store.addStatement(triple1)

      expect(Object.values(store.subjectIndex)).to.have.length(1)
      expect(Object.values(store.predicateIndex)).to.have.length(1)
      expect(Object.values(store.objectIndex)).to.have.length(1)
      expect(Object.values(store.whyIndex)).to.have.length(1)
    })
  })

  describe('add', () => {
    it ('sets the proper indices', () => {
      const store = new IndexedFormula()
      store.add(triple1)

      expect(store.statements).to.have.length(1)

      expect(Object.values(store.subjectIndex)).to.have.length(1)
      expect(Object.values(store.predicateIndex)).to.have.length(1)
      expect(Object.values(store.objectIndex)).to.have.length(1)
      expect(Object.values(store.whyIndex)).to.have.length(1)

      expect(store.subjectIndex[store.rdfFactory.id(triple1.subject)]).to.have.length(1)
      expect(store.predicateIndex[store.rdfFactory.id(triple1.predicate)]).to.have.length(1)
      expect(store.objectIndex[store.rdfFactory.id(triple1.object)]).to.have.length(1)
      expect(store.whyIndex[store.rdfFactory.id(triple1.why)]).to.have.length(1)
    })

    it ('works with arrays', () => {
      const store = new IndexedFormula()
      store.add([
        triple1,
        triple2,
      ])

      expect(store.statements.length).to.eq(2)
      expect(store.holds(s1, p1, o1)).to.be.true()
      expect(store.holds(s2, p2, o2)).to.be.true()
    })

    it ('works with statements', () => {
      const store = new IndexedFormula()
      store.add(triple1)

      expect(store.statements.length).to.eq(1)
      expect(store.holds(s1, p1, o1)).to.be.true()
    })

    it ('works with stores', () => {
      const store0 = new IndexedFormula()
      store0.add([triple1, triple2])

      const store = new IndexedFormula()
      store.add(store0)

      expect(store.statements.length).to.eq(2)
      expect(store.holds(s1, p1, o1)).to.be.true()
      expect(store.holds(s2, p2, o2)).to.be.true()
    })

    it ('works with terms as separate arguments', () => {
      const store = new IndexedFormula()
      store.add(s1, p1, o1)

      expect(store.statements.length).to.eq(1)
      expect(store.holds(triple1)).to.be.true()
    })

    it('calls the data callback', () => {
      let callbackCount = 0
      let callbackArgs = undefined
      const store = new IndexedFormula(
        undefined,
        { dataCallback: (...args) => {
          callbackCount++
          callbackArgs = args
        } }
      )
      const defaultGraph = store.rdfFactory.defaultGraph()

      expect(callbackCount).to.eq(0)
      store.add(triple1)

      expect(callbackCount).to.eq(1)
      expect(callbackArgs[0].subject).to.eq(s1)
      expect(callbackArgs[0].predicate).to.eq(p1)
      expect(callbackArgs[0].object).to.eq(o1)
      expect(callbackArgs[0].graph.termType).to.eq(defaultGraph.termType)
      expect(callbackArgs[0].graph.value).to.eq(defaultGraph.value)
    })

    it('skips the data callback when the statement is already present', () => {
      let callbackCount = 0
      const store = new IndexedFormula(
        undefined,
        { dataCallback: () => {
            callbackCount++
          } }
      )
      store.add(triple1)
      callbackCount = 0
      store.add(triple1)

      expect(callbackCount).to.eq(0)
    })

    it('keeps the why if given', () => {
      const store = new IndexedFormula()
      store.add(s1, s2, s3, g0)

      expect(store.statements[0].graph).to.eq(g0)
    })

    it('defaults why to the fetcher if present', () => {
      const store = new IndexedFormula()
      store.fetcher = {}
      store.fetcher.appNode = g0
      store.add(s1, s2, s3)

      expect(store.statements[0].graph).to.eq(g0)
    })

    it('defaults why to the factory otherwise', () => {
      const store = new IndexedFormula()
      store.add(s1, s2, s3)

      expect(store.statements[0].graph).to.eq(store.rdfFactory.defaultGraph())
    })
  })

  describe('remove', () => {
    it ('works with arrays', () => {
      const store = new IndexedFormula()
      store.add([triple1, triple2])
      expect(store.statements.length).to.eq(2)

      store.remove([
        triple1,
        triple2,
      ])

      expect(store.statements.length).to.eq(0)
      expect(store.holds(s1, p1, o1)).to.be.false()
      expect(store.holds(s2, p2, o2)).to.be.false()
    })

    it ('works with statements', () => {
      const store = new IndexedFormula()
      store.add(triple1)
      expect(store.statements.length).to.eq(1)
      store.remove(triple1)

      expect(store.statements.length).to.eq(0)
      expect(store.holds(s1, p1, o1)).to.be.false()
    })

    it ('works with stores', () => {
      const store0 = new IndexedFormula()
      store0.add([triple1, triple2])

      const store = new IndexedFormula()
      store.add([triple1, triple2])
      expect(store.statements.length).to.eq(2)
      store.remove(store0)

      expect(store.statements.length).to.eq(0)
      expect(store.holds(s1, p1, o1)).to.be.false()
      expect(store.holds(s2, p2, o2)).to.be.false()
    })
  });

  describe('removeStatement', () => {
    it('removes a statement', () => {
      const store = new IndexedFormula()
      store.addStatement(triple1)

      expect(store.statements).to.have.length(1)
      store.removeStatement(triple1)
      expect(store.statements).to.have.length(0)
    })

    it('throws when removing unknown statement', () => {
      const store = new IndexedFormula()
      try {
        store.removeStatement(triple1)
        expect(true).to.be.false()
      } catch (e) {
        expect(e.message).to.include('RDFArrayRemove: Array did not contain')
      }
    })
  })

  describe('removeMany', () => {
    it ('removes matching statements', () => {
      const store = new IndexedFormula()
      store.add([triple1, triple2, triple4])
      expect(store.statements.length).to.eq(3)
      store.removeMany(triple1.subject, null, null, null)

      expect(store.statements.length).to.eq(1)
      expect(store.holds(s2, p2, o2)).to.be.true()
    })

    it ('removes a limited number of matching statements', () => {
        const store = new IndexedFormula()
        store.add([triple1, triple2, triple4])
        expect(store.statements.length).to.eq(3)
        store.removeMany(triple1.subject, null, null, null, 1)

        expect(store.statements.length).to.eq(2)
    })
  });

  describe('removeMatches', () => {
      it ('removes matching statements', () => {
          const store = new IndexedFormula()
          store.add([triple2, triple3, triple4])
          expect(store.statements.length).to.eq(3)
          store.removeMatches(null, null, triple3.object, null)

          expect(store.statements.length).to.eq(1)
          expect(store.holds(s2, p2, o2)).to.be.true()
      })
      it ('does the same as remove of matches', () => {
          const store0 = new IndexedFormula()
          store0.add([triple2, triple3, triple4])
          const store1 = new IndexedFormula()
          store1.add([triple2, triple3, triple4])
          store0.remove(store0.match(null, null, triple3.object, null))
          store1.removeMatches(null, null, triple3.object, null)

          expect(store0.holdsStatement(store1)).to.be.true()
          expect(store1.holdsStatement(store0)).to.be.true()
      })
  });
  describe('removeDocument', () => {
    const store = new IndexedFormula()
    const meta = store.sym('chrome://TheCurrentSession')
    const prefixes = `@prefix : <#>.
    @prefix http: <http://www.w3.org/2007/ont/http#>.
    @prefix httph: <http://www.w3.org/2007/ont/httph#>.
    @prefix tabont: <http://www.w3.org/2007/ont/link#>.
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
    @prefix pro: <https://bob.localhost:8443/profile/>.
    @prefix tur: <http://www.w3.org/ns/iana/media-types/text/turtle#>.

    pro:card a tabont:Document, tabont:RDFDocument, tur:Resource.

`
    const metaContent = prefixes + `
    [
      rdfs:label "[0:16:34]  Request for https://bob.localhost:8443/profile/card";
      tabont:requestedURI "https://bob.localhost:8443/profile/card";
      tabont:response
              [
                  http:status 200;
                  http:statusText "OK";
                  httph:accept-patch
                      "text/n3, application/sparql-update, application/sparql-update-single-match";
                  httph:accept-post "*/*";
                  httph:accept-put "*/*";
                  httph:access-control-allow-credentials "true";
                  httph:access-control-expose-headers
                      "Authorization, User, Location, Link, Vary, Last-Modified, ETag, Accept-Patch, Accept-Post, Accept-Put, Updates-Via, Allow, WAC-Allow, Content-Length, WWW-Authenticate, MS-Author-Via, X-Powered-By";
                  httph:allow "OPTIONS, HEAD, GET, PATCH, POST, PUT, DELETE";
                  httph:connection "keep-alive";
                  httph:content-type "text/turtle";
                  httph:date "Thu, 08 Feb 2024 23:16:35 GMT";
                  httph:keep-alive "timeout=5";
                  httph:link
                    '<card.acl>; rel=\"acl\", <card.meta>; rel=\"describedBy\", <http://www.w3.org/ns/ldp#Resource>; rel=\"type\"';
                  httph:ms-author-via "SPARQL";
                  httph:transfer-encoding "chunked";
                  httph:updates-via "wss://bob.localhost:8443";
                  httph:vary "Accept, Authorization, Origin";
                  httph:wac-allow 'user=\"read write append control\",public=\"read\"';
                  httph:x-powered-by "solid-server/5.7.9-beta"
              ];
      tabont:status
              ( "[0:16:35.259] N3 parsed: 13 triples in 26 lines."
              "[0:16:35.259] Done." )
  ].
  `
    const voidDoc = `@prefix : <#>.

`

    it ('removeMetada', () => {
      parse(metaContent, store, meta.value, 'text/turtle')
      store.removeMetadata(store.sym('https://bob.localhost:8443/profile/card'))
      expect(serialize(meta, store, meta.uri)).to.eql(voidDoc)
    })
    it ('removeDocument', () => {
      parse(metaContent, store, meta.value, 'text/turtle')
      const doc = store.sym('https://bob.localhost:8443/profile/card')
      const docContent = `
      @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.

      <#test> <#value> [ rdf:first 1; rdf:rest [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ]]] .
`
      parse(docContent, store, doc.uri, 'text/turtle')
      console.log(serialize(null, store, meta.uri))
      store.removeDocument(store.sym('https://bob.localhost:8443/profile/card'))
      expect(serialize(meta, store, null)).to.eql(voidDoc)
      expect(serialize(doc, store, doc.uri)).to.eql(voidDoc)
    })
  })
})
