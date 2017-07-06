/* eslint-env mocha */
'use strict'

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import dirtyChai from 'dirty-chai'

chai.use(sinonChai)
chai.use(dirtyChai)
const { expect } = chai
chai.should()

import rdf from '../../src/index'

const { Fetcher, BlankNode } = rdf

describe('Fetcher', () => {
  after(() => {
    BlankNode.nextId = 0
  })

  describe('constructor()', () => {
    it('should init a fetcher instance', () => {
      let store = rdf.graph()
      let fetcher = new Fetcher(store)

      expect(fetcher.store).to.equal(store)
      expect(fetcher.handlers.length).to.equal(Object.keys(Fetcher.HANDLERS).length)
    })
  })

  describe('nowOrWhenFetched()', () => {
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

  describe('load()', () => {
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
})
