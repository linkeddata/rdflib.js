/* eslint-env mocha */
'use strict'

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import dirtyChai from 'dirty-chai'
import rdf from '../../src/index'
import { XMLHttpRequest } from 'xmlhttprequest'

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
    it('should init a fetcher instance', () => {
      let store = rdf.graph()
      let fetcher = new Fetcher(store)

      expect(fetcher.store).to.equal(store)
      expect(fetcher.handlers.length).to.equal(Object.keys(Fetcher.HANDLERS).length)
    })
  })

  describe('nowOrWhenFetched', () => {
    let fetcher, docuri, rterm, options, userCallback

    beforeEach(() => {
      docuri = 'https://example.com/newdoc.ttl'
      rterm = rdf.namedNode('https://example.com/original.ttl')
      options = {}
      userCallback = () => {}

      fetcher = new Fetcher(rdf.graph())

      fetcher.requestURI = sinon.stub()
    })

    it('nowOrWhenFetched(uri, userCallback)', () => {
      fetcher.nowOrWhenFetched(docuri, userCallback)

      expect(fetcher.requestURI).to.have.been
        .calledWith(docuri, undefined, {}, userCallback)
    })

    it('accepts NamedNode docuri', () => {
      fetcher.nowOrWhenFetched(rdf.namedNode(docuri), userCallback)

      expect(fetcher.requestURI).to.have.been
        .calledWith(docuri, undefined, {}, userCallback)
    })

    it('nowOrWhenFetched(uri, options, userCallback)', () => {
      fetcher.nowOrWhenFetched(docuri, options, userCallback)

      expect(fetcher.requestURI).to.have.been
        .calledWith(docuri, undefined, options, userCallback)
    })

    it('nowOrWhenFetched(uri, options, userCallback) with referingTerm', () => {
      options.referingTerm = rterm
      fetcher.nowOrWhenFetched(docuri, options, userCallback)

      expect(fetcher.requestURI).to.have.been
        .calledWith(docuri, rterm, options, userCallback)
    })

    it('nowOrWhenFetched(uri, referringTerm, userCallback, options)', () => {
      fetcher.nowOrWhenFetched(docuri, rterm, userCallback, options)

      expect(fetcher.requestURI).to.have.been
        .calledWith(docuri, rterm, options, userCallback)
    })

    it('nowOrWhenFetched(uri, undefined, userCallback, options)', () => {
      fetcher.nowOrWhenFetched(docuri, undefined, userCallback, options)

      expect(fetcher.requestURI).to.have.been
        .calledWith(docuri, undefined, options, userCallback)
    })

    it('nowOrWhenFetched(uri, referringTerm, userCallback)', () => {
      fetcher.nowOrWhenFetched(docuri, rterm, userCallback)

      expect(fetcher.requestURI).to.have.been
        .calledWith(docuri, rterm, { referingTerm: rterm }, userCallback)
    })
  })

  describe('load', () => {
    let fetcher, uri, options, xhr

    beforeEach(() => {
      uri = 'https://example.com/newdoc.ttl'
      options = {}
      xhr = {}

      fetcher = new Fetcher(rdf.graph())
      fetcher.requestURI = (uri, rterm, opts, cb) => { cb(true, null, xhr) }
      sinon.spy(fetcher, 'requestURI')
    })

    it('should load multiple docs', () => {
      let uris = [
        'https://example.com/doc1', 'https://example.com/doc2'
      ]

      return fetcher.load(uris, options)
        .then(docs => {
          expect(fetcher.requestURI).to.have.been.calledWith(uris[0], undefined, options)
          expect(fetcher.requestURI).to.have.been.calledWith(uris[1], undefined, options)
          expect(docs).to.eql([ xhr, xhr ])
        })
    })

    it('should resolve with the xhr from requestURI callback', () => {
      options.referingTerm = 'https://example.com/original.ttl'

      return fetcher.load(uri, options)
        .then(result => {
          expect(fetcher.requestURI).to.have.been.calledWith(uri, options.referingTerm, options)
          expect(result).to.equal(xhr)
        })
    })

    it('should reject with error from requestURI callback', done => {
      fetcher.requestURI = (uri, rterm, opts, cb) => { cb(false, 'Error message') }

      fetcher.load(uri, options)
        .catch(err => {
          expect(err.message).to.equal('Error message')
          done()
        })
    })
  })

  describe('requestURI', () => {
    let fetcher, uri, options, rterm

    beforeEach(() => {
      uri = 'https://example.com/newdoc.ttl'
      options = {}

      fetcher = new Fetcher(rdf.graph())

      let xhr = new XMLHttpRequest()
      xhr.open = sinon.stub()
      xhr.send = sinon.stub()
      xhr.setRequestHeader = sinon.stub()

      fetcher.xhr = sinon.stub().returns(xhr)
      sinon.spy(fetcher, 'failFetch')
    })

    it('should fail for an unsupported uri protocol', done => {
      uri = 'tel:+1-816-555-1212'

      fetcher.requestURI(uri, rterm, options, (ok, message) => {
        expect(ok).to.be.false()
        expect(message).to.equal('Unsupported protocol')
        done()
      })
    })

    describe('force: false', () => {
      it('should succeed with a no-op if the uri was previously fetched', done => {
        fetcher.getState = sinon.stub().withArgs(uri).returns('fetched')

        fetcher.requestURI(uri, rterm, options, (ok, message, xhr) => {
          expect(ok).to.be.true()
          expect(message).to.be.undefined()
          expect(xhr).to.be.undefined()
          done()
        })
      })

      it('should fail if the uri fetch previously failed', done => {
        fetcher.getState = sinon.stub().withArgs(uri).returns('failed')

        fetcher.requestURI(uri, rterm, options, (ok, message) => {
          expect(ok).to.be.false()
          expect(message.startsWith('Previously failed.')).to.be.true()
          done()
        })
      })
    })

    describe('force: true', () => {
      it('should not succeed with a no-op if the uri was previously fetched', () => {
        options.force = true
        fetcher.getState = sinon.stub().withArgs(uri).returns('fetched')

        let userCallback = sinon.stub()

        let xhr = fetcher.requestURI(uri, rterm, options, userCallback)

        expect(xhr.send).to.have.been.called()
        expect(userCallback).to.not.have.been.called()
        expect(fetcher.failFetch).to.not.have.been.called()
      })

      it('should not fail if the uri fetch previously failed', () => {
        options.force = true
        fetcher.getState = sinon.stub().withArgs(uri).returns('failed')

        let userCallback = sinon.stub()

        let xhr = fetcher.requestURI(uri, rterm, options, userCallback)

        expect(xhr.send).to.have.been.called()
        expect(userCallback).to.not.have.been.called()
        expect(fetcher.failFetch).to.not.have.been.called()
      })

      it('should set cache control headers', () => {
        options.force = true

        let xhr = fetcher.requestURI(uri, rterm, options)

        expect(xhr.setRequestHeader).to.have.been.calledWith('Cache-control', 'no-cache')
        expect(fetcher.failFetch).to.not.have.been.called()
      })
    })

    it('should return with a no-op if if the uri is already being requested', () => {
      fetcher.getState = sinon.stub().withArgs(uri).returns('requested')

      let userCallback = sinon.stub()

      let result = fetcher.requestURI(uri, rterm, options, userCallback)

      expect(result).to.be.undefined()
      expect(userCallback).to.not.have.been.called()
    })

    it('should open the xhr request', () => {
      let xhr = fetcher.requestURI(uri, rterm, options)

      expect(xhr.open).to.have.been.calledWith('GET', uri, fetcher.async)
      expect(fetcher.failFetch).to.not.have.been.called()
    })

    it('should send the xhr request', () => {
      let xhr = fetcher.requestURI(uri, rterm, options)

      expect(xhr.send).to.have.been.calledWith(null)
      expect(fetcher.failFetch).to.not.have.been.called()
    })

    it('should set the Accept header', () => {
      let xhr = fetcher.requestURI(uri, rterm, options)

      let expectedHeader = 'image/*;q=0.9, */*;q=0.1, application/rdf+xml;q=0.9, application/xhtml+xml, text/xml;q=0.5, application/xml;q=0.5, text/html;q=0.9, text/plain;q=0.5, text/n3;q=1.0, text/turtle;q=1'

      expect(xhr.setRequestHeader).to.have.been.calledWith('Accept', expectedHeader)
    })

    it('should add the userCallback to the fetchCallbacks list', () => {
      sinon.spy(fetcher, 'addFetchCallback')
      let userCallback = sinon.stub()

      fetcher.requestURI(uri, rterm, options, userCallback)

      expect(fetcher.addFetchCallback).to.have.been.calledWith(uri, userCallback)
      expect(fetcher.failFetch).to.not.have.been.called()
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

  describe('withCredentials', () => {
    it('should return true for an https uri', () => {
      let uri = 'https://example.com/newdoc.ttl'

      expect(Fetcher.withCredentials(uri)).to.be.true()
    })

    it('should return false for an http uri with no override', () => {
      let uri = 'http://example.com/newdoc2.ttl'

      expect(Fetcher.withCredentials(uri)).to.be.false()
    })

    it('should return true for an http uri with an override', () => {
      let uri = 'http://example.com/newdoc2.ttl'
      let options = { withCredentials: true }

      expect(Fetcher.withCredentials(uri, options)).to.be.true()
    })
  })
})
