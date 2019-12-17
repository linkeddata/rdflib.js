/* eslint-env mocha */
'use strict'

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import dirtyChai from 'dirty-chai'
import nock from 'nock'

import * as rdf from '../../src/index'
import NamedNode from '../../src/named-node'
import IndexedFormula from '../../src/store'
import CanonicalDataFactory from '../../src/factories/canonical-data-factory'

chai.use(sinonChai)
chai.use(dirtyChai)
const { expect } = chai
chai.should()

const { Fetcher, BlankNode } = rdf

describe('Fetcher', () => {
  after(() => {
    BlankNode.nextId = 0
  })

  describe('constructor', () => {
    it('should init a fetcher instance, with store', () => {
      let store = rdf.graph()
      let options = {
        timeout: 1000,
        fetch: {}
      }
      let fetcher = new Fetcher(store, options)

      expect(fetcher.store).to.equal(store)
      expect(fetcher.timeout).to.equal(options.timeout)
      expect(fetcher._fetch).to.equal(options.fetch)

      expect(fetcher.handlers.length).to.equal(Object.keys(Fetcher.HANDLERS).length)
    })
    it('should init a fetcher instance, making default store', () => {
      let options = {
        timeout: 1000,
        fetch: {}
      }
      let fetcher = new Fetcher()

      expect(fetcher.store.fetcher === fetcher).to.be.true()
    })
  })

  describe('saveResponseMetadata', () => {
    it('uses the datafactory', () => {
      let createdNodes = []
      const store = new IndexedFormula(undefined, {
        rdfFactory: {
          ...CanonicalDataFactory,
          namedNode: (value) => {
            createdNodes.push(value)
            return new NamedNode(value)
          }
        }
      })
      const fetcher = new Fetcher(store)
      const response = new Response(null, {
        headers: new Headers({
          'Content-Type': 'image/png'
        }),
        status: 200,
      })
      const options = {
        req: store.rdfFactory.blankNode(),
        resource: store.rdfFactory.namedNode('https://example.com/resource/1')
      }

      createdNodes = []
      fetcher.saveResponseMetadata(response, options)

      expect(createdNodes).to.include('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
      expect(createdNodes).to.include('http://www.w3.org/ns/iana/media-types/image/png#Resource')
      expect(store.holds(
        options.resource,
        store.rdfFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        store.rdfFactory.namedNode('http://www.w3.org/ns/iana/media-types/image/png#Resource')
      )).to.be.true()
    })
  })

  describe('nowOrWhenFetched 1', () => {
    let fetcher, docuri, rterm, options, userCallback

    beforeEach(() => {
      docuri = 'https://example.com/newdoc.ttl'
      rterm = rdf.namedNode('https://example.com/original.ttl')
      options = {}
      userCallback = () => {}

      fetcher = new Fetcher(rdf.graph())
    })

    it('should invoke userCallback with caught error', done => {
      let errorMessage = 'Some error'
      fetcher._fetch = sinon.stub().rejects(new Error(errorMessage))

      fetcher.nowOrWhenFetched(docuri, (ok, message) => {
        expect(ok).to.be.false()
        expect(message).to.include(errorMessage)
        done()
      })
    })

  })

  describe('nowOrWhenFetched 2', () => {
    let fetcher, docuri, rterm, options, userCallback

    beforeEach(() => {
      docuri = 'https://example.com/newdoc.ttl'
      rterm = rdf.namedNode('https://example.com/original.ttl')
      options = {}
      userCallback = () => {}

      fetcher = new Fetcher(rdf.graph())

      fetcher.load = sinon.stub().resolves({ ok: true, status: 200, statusText: "Dummy stub"})
    })

    it('nowOrWhenFetched(uri, userCallback)', done => {
      fetcher.nowOrWhenFetched(docuri, (ok, text, response) => {
        expect(fetcher.load).to.have.been.calledWith(docuri, {})
        expect(ok).to.be.true()
        expect(response.status).to.equal(200)
        done()
      })
    })

    it('nowOrWhenFetched(uri, options, userCallback)', done => {
      let options = {}
      fetcher.nowOrWhenFetched(docuri, options, (ok, text, response) => {
        expect(fetcher.load).to.have.been.calledWith(docuri, options)
        expect(ok).to.be.true()
        done()
      })
    })

    it('nowOrWhenFetched(uri, referringTerm, userCallback, options)', done => {
      userCallback = (ok) => {
        expect(fetcher.load).to.have.been.calledWith(docuri, { referringTerm: rterm })
        expect(ok).to.be.true()
        done()
      }
      fetcher.nowOrWhenFetched(docuri, rterm, userCallback, options)
    })

    it('nowOrWhenFetched(uri, undefined, userCallback, options)', done => {
      userCallback = (ok) => {
        expect(fetcher.load).to.have.been.calledWith(docuri, {})
        expect(ok).to.be.true()
        done()
      }
      fetcher.nowOrWhenFetched(docuri, undefined, userCallback, options)
    })

    it('nowOrWhenFetched(uri, referringTerm, userCallback)', done => {
      fetcher.nowOrWhenFetched(docuri, rterm, (ok) => {
        expect(fetcher.load).to.have.been.calledWith(docuri, { referringTerm: rterm })
        expect(ok).to.be.true()
        done()
      })
    })
  })

  describe('load', () => {
    // let fetcher, uri, options, xhr

    it('should load multiple docs')
  })

  describe('load', () => {
    let fetcher, uri, options

    beforeEach(() => {
      uri = 'https://example.com/newdoc.ttl'

      fetcher = new Fetcher(rdf.graph())
      options = fetcher.initFetchOptions(uri, {})

      fetcher._fetch = sinon.stub().resolves()
      fetcher.handleResponse = sinon.stub().resolves()
      sinon.spy(fetcher, 'handleError')
    })

    it('should fail for an unsupported uri protocol', () => {
      uri = 'tel:+1-816-555-1212'
      options = fetcher.initFetchOptions(uri, {})

      return fetcher.load(uri, options)
        .then(result => {}, err => {
          expect(err.message).to.include('Unsupported protocol')
          expect(fetcher.requested[uri]).to.equal('unsupported_protocol')
        })
    })

    it('should mark the uri as requested', () => {
      return fetcher.load(uri, options)
        .then(() => {
          expect(fetcher.requested[uri]).to.be.true()
        })
    })

    it('should save request metadata if noMeta is not set', () => {
      sinon.spy(fetcher, 'saveRequestMetadata')

      return fetcher.load(uri, options)
        .then(() => {
          expect(fetcher.saveRequestMetadata).to.have.been.called()
        })
    })

    it('should not save request metadata if noMeta is set', () => {
      sinon.spy(fetcher, 'saveRequestMetadata')

      options.noMeta = true

      return fetcher.load(uri, options)
        .then(() => {
          expect(fetcher.saveRequestMetadata).to.not.have.been.called()
        })
    })

    it('should use the proxy uri when appropriate', () => {
      let actualProxyURI = 'https://example.com/proxy?uri=whatever'
      let options = { actualProxyURI }
      fetcher.initFetchOptions = sinon.stub().returns(options)
      fetcher.saveRequestMetadata = sinon.stub()

      return fetcher.load(uri, options)
        .then(() => {
          expect(fetcher._fetch).to.have.been.calledWith(actualProxyURI, options)
        })
    })

    describe('force: false (undefined)', () => {
      it('should succeed with a no-op if the uri was previously fetched', () => {
        fetcher.getState = sinon.stub().withArgs(uri).returns('fetched')

        return fetcher.load(uri, options)
          .then(response => {
            expect(response.ok).to.be.true()
            expect(response.status).to.equal(200)
            expect(fetcher._fetch).to.not.have.been.called()
            expect(fetcher.handleError).to.not.have.been.called()
            expect(fetcher.requested[uri]).to.equal('done')
          })
      })

      it('should fail if the uri fetch previously failed', () => {
        fetcher.getState = sinon.stub().withArgs(uri).returns('failed')

        return fetcher.load(uri, options)
          .then(response => {}, error => {
            expect(error.message.includes('Previously failed:')).to.be.true()
            expect(fetcher._fetch).to.not.have.been.called()
            expect(fetcher.handleError).to.not.have.been.called()
          })
      })

      it('should not delete the uri from nonexistent list', () => {
        fetcher.nonexistent[uri] =  true

        return fetcher.load(uri, options)
          .then(() => {
            expect(fetcher.nonexistent[uri]).to.be.true()
          })
      })
    })

    describe('force: true', () => {
      it('should delete the uri from the nonexistent list', () => {
        options.force = true

        fetcher.nonexistent[uri] =  true

        return fetcher.load(uri, options)
          .then(() => {
            expect(fetcher.nonexistent[uri]).to.be.undefined()
          })
      })
    })
  })

  describe('load()', () => {
    let fetcher, uri, options, statusCode
    const errorMessage = 'An error has occurred'

    beforeEach(() => {
      uri = 'https://example.com/doc.ttl'

      fetcher = new Fetcher(rdf.graph())

      // No, this is internal function!
      options = fetcher.initFetchOptions(uri, {})
      nock('https://example.com').get('/doc.ttl').reply(400, errorMessage) // sets body not statusText
      // options = {}

      statusCode = 400
    })

    it('should return a result object on HTTP error', () => {
      return fetcher.load(uri, options)
        .then(result => {}, err => {
          expect(err.response.status).to.equal(statusCode)
        })
    })

    it('should add to status cache for GET operations', () => {
      return fetcher.load(uri, options)
        .then(result => {}, () => {
          expect(fetcher.requested[uri]).to.equal(statusCode)
        })
    })

    it('should add to status cache for HEAD operations', () => {
      options.method = 'HEAD'
      nock('https://example.com').head('/doc.ttl').reply(400)

      return fetcher.load(uri, options)
        .then(result => {}, () => {
          expect(fetcher.requested[uri]).to.equal(statusCode)
        })
    })

    it('should not add to status cache for non-GET operations', () => {
      options.method = 'PATCH'
      nock('https://example.com').patch('/doc.ttl').reply(400)
      delete fetcher.requested[uri]
      return fetcher.webOperation('PATCH', uri, options) // load() is not usable for PATCH
        .then(result => {}, () => {
          console.log('###### ' + fetcher.requested[uri])
          expect(fetcher.requested[uri]).to.not.exist()
        })
    })
  })

  describe('initFetchOptions', () => {
    let fetcher, uri, options

    beforeEach(() => {
      uri = 'https://example.com/newdoc.ttl'
      options = {}

      fetcher = new Fetcher(rdf.graph())
    })

    it('should set content type if passed in', () => {
      options.contentType = 'text/n3'

      options = fetcher.initFetchOptions(uri, options)

      expect(options.headers['content-type']).to.equal(options.contentType)
    })

    it('should set cache control headers when force: true', () => {
      options.force = true

      options = fetcher.initFetchOptions(uri, options)

      expect(options.cache).to.equal('no-cache')
    })

    it('should set the Accept header', () => {
      options = fetcher.initFetchOptions(uri, options)

      let expectedHeader = 'image/*;q=0.9, */*;q=0.1, application/rdf+xml;q=0.9, application/xhtml+xml, text/xml;q=0.5, application/xml;q=0.5, text/html;q=0.9, text/plain;q=0.5, text/n3;q=1.0, text/turtle;q=1'

      expect(options.headers['accept']).to.equal(expectedHeader)
    })
  })

  describe('offlineOverride', () => {
    it('should pass through the given uri in a node environment', () => {
      let uri = 'https://example.com/newdoc.ttl'

      expect(Fetcher.offlineOverride(uri)).to.equal(uri)
    })
  })

  describe('proxyIfNecessary', () => {
    it('should pass through the given uri in a node environment', () => {
      let uri = 'https://example.com/newdoc.ttl'

      expect(Fetcher.proxyIfNecessary(uri)).to.equal(uri)
    })
  })

  describe('setCredentials', () => {
    it('should work for empty options object', () => {
      let uri = 'http://example.com/newdoc2.ttl'
      let options = {}

      Fetcher.setCredentials(uri, options)
      expect(options.credentials).to.equal('include')
    })

    it('should work for withCredentials: true (legacy)', () => {
      let uri = 'http://example.com/newdoc2.ttl'
      let options = { withCredentials: true }

      Fetcher.setCredentials(uri, options)
      expect(options.credentials).to.equal('include')
    })

    it('should work for withCredentials:false (legacy)', () => {
      let uri = 'http://example.com/newdoc2.ttl'
      let options = { withCredentials: false }

      Fetcher.setCredentials(uri, options)
      expect(options.credentials).to.equal('omit')
    })

    it('should return true for an http uri with an override', () => {
      let uri = 'http://example.com/newdoc2.ttl'
      let options = { credentials: true }

      Fetcher.setCredentials(uri, options)
      expect(options.credentials).to.be.true()
    })

    it('should return false for an https uri with an override', () => {
      let uri = 'https://example.com/newdoc2.ttl'
      let options = { credentials: false }

      Fetcher.setCredentials(uri, options)
      expect(options.credentials).to.be.false()
    })
  })

  describe('guessContentType', () => {
    it('should return null if uri has no extension')

    it('should return null if unknown extension')

    it('it should return the content type for a known extension')
  })

  describe('normalizedContentType', () => {
    it('should return the forced content type if present')

    it('should try to guess content type if none returned in header')

    it('should try to guess content type for octet-stream generic type')

    it('should return the content type in the headers')

    it('should default to text/xml for file: protocol uris')

    it('should default to text/xml for chrome: protocol uris')
  })

  describe('handlerForContentType', () => {
    it('should return null when no contentType given')

    it('should return a handler instance if content type matches')

    it('should return null when no handler match is found')
  })

  describe('load nock tests', () => {
    let fetcher

    beforeEach(() => {
      fetcher = new Fetcher(rdf.graph())
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should return an error response on a 404', () => {
      nock('https://example.com').get('/notfound').reply(404)

      return fetcher.load('https://example.com/notfound')
        .then(res => {}, err => {
          expect(err.response.status).to.equal(404)
          expect(err.message).to.include('https://example.com/notfound')
          expect(err.message).to.include('Not Found')
        })
    })

    it('should load and parse RDF-XML', () => {
      let testXml = `<rdf:RDF
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns:n0="https://example.net/67890#"
 xmlns:n1="https://example.org/67890#">
    <rdf:Description rdf:about="https://example.net/67890#foo">
       <n0:bar rdf:resource="https://example.net/88888#baz"/>
    </rdf:Description>
    <rdf:Description rdf:about="https://example.org/67890#foo">
       <n1:bar rdf:resource="https://example.org/88888#baz"/>
    </rdf:Description>
</rdf:RDF>`

      nock('https://example.com').get('/test.xml')
        .reply(200, testXml, { 'Content-Type': 'application/rdf+xml' })

      return fetcher.load('https://example.com/test.xml')
        .then(res => {
          expect(res.status).to.equal(200)
          let kb = fetcher.store

          let match = kb.anyStatementMatching(
            kb.sym('https://example.net/67890#foo'),
            kb.sym('https://example.net/67890#bar')
          )

          expect(match.object.value).to.equal('https://example.net/88888#baz')
          expect(match.graph.value).to.equal('https://example.com/test.xml')
        })
    })

    it('should load and parse Turtle', () => {
      let testTurtle = `<https://example.net/67890#foo> <https://example.net/67890#bar> <https://example.net/88888#baz>.
<https://example.org/67890#foo> <https://example.org/67890#bar> <https://example.org/88888#baz>.`

      nock('https://example.com').get('/test.ttl')
        .reply(200, testTurtle)

      return fetcher.load('https://example.com/test.ttl')
        .then(res => {
          expect(res.status).to.equal(200)
          let kb = fetcher.store

          let match = kb.anyStatementMatching(
            kb.sym('https://example.net/67890#foo'),
            kb.sym('https://example.net/67890#bar')
          )

          expect(match.object.value).to.equal('https://example.net/88888#baz')
          expect(match.graph.value).to.equal('https://example.com/test.ttl')
        })
    })

    it('should load and parse N3', () => {
      let testN3 = `@prefix : <http://example.com/foo/vocab#>.
:building0 :bar 123, 78768.
:building1  :length 1.45e5 ;
    :created 2012-03-12 .
:building0 :connectsTo :building4 .`

      nock('https://example.com').get('/test.n3')
        .reply(200, testN3)

      return fetcher.load('https://example.com/test.n3')
        .then(res => {
          expect(res.status).to.equal(200)
          let kb = fetcher.store

          let match = kb.anyStatementMatching(
            kb.sym('http://example.com/foo/vocab#building0'),
            kb.sym('http://example.com/foo/vocab#connectsTo')
          )

          expect(match.object.value).to.equal('http://example.com/foo/vocab#building4')
        })
    })
  })

  describe('createContainer', () => {
    it('should invoke webOperation with the right options')
  })
})
