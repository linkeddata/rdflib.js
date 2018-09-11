/* eslint-env mocha */
'use strict'

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import dirtyChai from 'dirty-chai'
import nock from 'nock'
import rdf from '../../src/index'

chai.use(sinonChai)
chai.use(dirtyChai)
const { expect } = chai
chai.should()

const { Fetcher, BlankNode, UpdateManager} = rdf

describe('UpdateManager', () => {
  after(() => {
    BlankNode.nextId = 0
  })

  describe('constructor', () => {
    it('should init a updater instance', () => {
      let store = rdf.graph()
      let options = {
        timeout: 1000,
        fetch: {}
      }
      let fetcher = new Fetcher(store)
      let updater = new UpdateManager(store)

      expect(updater.store).to.equal(store)
      expect(fetcher.store).to.equal(store)
    })
  })

  describe('constructor no store', () => {
    it('should create a updater instance', () => {
      let store = rdf.graph()
      let options = {
        timeout: 1000,
        fetch: {}
      }
      let updater = new UpdateManager()

      //expect(updater.store).to

      expect(updater.store).to.equal(updater.store.fetcher.store)
    })
  })

  describe('patch 1', () => {
    let updater, docuri, rterm, options, userCallback

    beforeEach(() => {
      docuri = 'https://example.com/newdoc.ttl'
      rterm = rdf.namedNode('https://example.com/original.ttl')
      options = {}
      userCallback = () => {}

      updater = new UpdateManager(rdf.graph())
    })

    it('should invoke userCallback with caught error', done => {
      let errorMessage = 'Some error'
      updater._fetch = sinon.stub().rejects(new Error(errorMessage))

      updater.nowOrWhenFetched(docuri, (ok, message) => {
        expect(ok).to.be.false()
        expect(message).to.include(errorMessage)
        done()
      })
    })
  })
})
