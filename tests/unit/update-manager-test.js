/* eslint-env mocha */
'use strict'

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import dirtyChai from 'dirty-chai'
import nock from 'nock'
import * as rdf from '../../src/index'

const self = {err: ''}
const $rdf = rdf

chai.use(sinonChai)
chai.use(dirtyChai)
const { expect } = chai
chai.should()

const { Fetcher, BlankNode, UpdateManager} = rdf

const bar = $rdf.sym('https://example.com/test/foo#bar')
const p = $rdf.sym('https://example.com/test/foo#pred')

const baz = $rdf.sym('https://example.org/org/baz#baz')

const doc = bar.doc()
const doc1 = bar.doc()
const doc2 = baz.doc()

const meta = $rdf.sym('chrome://TheCurrentSession') // specific graph name for meta data
// const meta = store.fetcher.appNode // random graph name for meta data
const st1 = $rdf.st(bar, p, 111, doc)
const st2 = $rdf.st(bar, p, 222, doc1)
const st3 = $rdf.st(baz, p, 333, doc2)

const httpResultsText = `
@prefix httph: <http://www.w3.org/2007/ont/httph#> .
@prefix link: <http://www.w3.org/2007/ont/link#>.
 [] link:requestedURI "${doc.uri}", "${doc2.uri}"; link:response [ httph:accept-patch "text/n3 application/sparql-update" ].
 `

function loadMeta (store) {
  $rdf.parse(httpResultsText, store, meta.uri)
  console.log('Loaded metadata')
}

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

  const dummyLoad  = sinon.stub().resolves({ ok: true, status: 200, statusText: "Dummy stub 1"})

  describe('constructor no store', () => {
    it('should create a updater instance and new store and fecther', () => {
      let store = rdf.graph()
      let options = {
        timeout: 1000,
        fetch: {}
      }
      let updater = new UpdateManager()

      expect(updater.store).to.equal(updater.store.fetcher.store)
    })
  })


  describe('update', () => {
    let updater, docuri, rterm, options, userCallback, loadStub
    var loadStatus = 200

    beforeEach(() => {
      options = {}
      userCallback = () => {}

      updater = new UpdateManager()
      updater.store.fetcher.webOperation = sinon.stub().resolves({ ok: true, status: 200, statusText: "Dummy stub 1"})
      // updater.store.fetcher.load = sinon.stub().resolves({ ok: true, status: 200, statusText: "Dummy stub 2"})

      loadStub = sinon.stub(updater.store.fetcher, 'load')
       .callsFake( doc => {
         loadMeta(updater.store)
         return Promise.resolve({ ok: true, status: loadStatus, statusText: "Dummy stub 5"})
      })

    })

    it('Should patch an insert triple', done => {
      loadMeta(updater.store)
      updater.update([], [st1], (uri, ok, text) => {
        if (!ok) console.log(`update callback uri = ${uri}, ok = ${ok}, text = <<<${text}>>>` )
        // expect(updater.store.fetcher.load).to.have.been.calledWith(doc)
        expect(updater.store.fetcher.webOperation).to.have.been.called()
        expect(ok).to.be.true()
        done()
      })
    })

    it('Should patch an insert triple with no proior load', done => {
      updater.update([], [st1], (uri, ok, text) => {
        if (!ok) console.log(`update callback uri = ${uri}, ok = ${ok}, text = <<<${text}>>>` )
        expect(updater.store.fetcher.load).to.have.been.calledWith(doc)
        // expect(updater.store.fetcher.webOperation).to.have.been.called()
        expect(ok).to.be.true()
        done()
      })
    })

    it('Should patch an insert triple with proior load of nonexistent file', done => {
      loadStatus = 404
      updater.update([], [st1], (uri, ok, text) => {
        if (!ok) console.log(`update callback uri = ${uri}, ok = ${ok}, text = <<<${text}>>>` )
        expect(updater.store.fetcher.load).to.have.been.calledWith(doc)
        // expect(updater.store.fetcher.webOperation).to.have.been.called()
        expect(ok).to.be.true()
        done()
      })
    })


  })

  describe('updateMany', () => {
    const self = {err: ''}
    let updater, docuri, rterm, options, userCallback, loadStub
    var loadStatus = 200

    beforeEach(() => {
      options = {}
      userCallback = () => {}

      updater = new UpdateManager()
      updater.store.fetcher.webOperation = sinon.stub().resolves({ ok: true, status: 200, statusText: "Dummy stub 1"})
      // updater.store.fetcher.load = sinon.stub().resolves({ ok: true, status: 200, statusText: "Dummy stub 2"})

      loadStub = sinon.stub(updater.store.fetcher, 'load')
       .callsFake( doc => {
         loadMeta(updater.store)
         return Promise.resolve({ ok: true, status: loadStatus, statusText: "Dummy stub 5"})
      })

    })

    it('Should insert triples in more than one document', () => {
      loadMeta(updater.store)
      updater.updateMany([], [st1, st2, st3]).then(array => {
        expect(updater.store.fetcher.webOperation).to.have.been.called()
      })
    })

    it('Should remove triples in more than one document', done => {
      loadMeta(updater.store)
      updater.updateMany([], [st1, st2, st3])
      updater.updateMany([st1, st2, st3])
        .then(array => {
          expect(updater.store.fetcher.webOperation).to.have.been.called()
        })
        .then(() => done(), done)
    })
/*
    it('Should patch an insert triple with no proior load', done => {
      updater.update([], [st1], (uri, ok, text) => {
        if (!ok) console.log(`update callback uri = ${uri}, ok = ${ok}, text = <<<${text}>>>` )
        expect(updater.store.fetcher.load).to.have.been.calledWith(doc)
        // expect(updater.store.fetcher.webOperation).to.have.been.called()
        expect(ok).to.be.true()
        done()
      })
    })

    it('Should patch an insert triple with proior load of nonexistent file', done => {
      loadStatus = 404
      updater.update([], [st1], (uri, ok, text) => {
        if (!ok) console.log(`update callback uri = ${uri}, ok = ${ok}, text = <<<${text}>>>` )
        expect(updater.store.fetcher.load).to.have.been.calledWith(doc)
        // expect(updater.store.fetcher.webOperation).to.have.been.called()
        expect(ok).to.be.true()
        done()
      })
    })
*/

  })

  describe('editable', () => {
    const self = {err: ''}
    let updater, docuri, rterm, options, userCallback, loadStub
    var loadStatus = 200

    beforeEach(() => {
      options = {}
      userCallback = () => {}

      updater = new UpdateManager()
      updater.store.fetcher.webOperation = sinon.stub().resolves({ ok: true, status: 200, statusText: "Dummy stub 1"})
      updater.store.fetcher.load = sinon.stub().resolves({ ok: true, status: 200, statusText: "Dummy stub 2"})

    })

    it('Should detect a document is editable from metadata', () => {
      loadMeta(updater.store)
      expect(updater.editable(doc1)).to.equal('SPARQL')
    })

    it('Should not detect a document is editable from metadata after flush', () => {
      loadMeta(updater.store)
      updater.flagAuthorizationMetadata()
      expect(updater.editable(doc1)).to.equal(undefined)
    })

    it('Should not detect a document is editable from metadata after removeMetadata', () => {
      loadMeta(updater.store)
      updater.store.removeMetadata(doc1)
      expect(updater.editable(doc1)).to.equal(undefined)
    })

    it('Should not detect a document is editable from metadata after removeDocument', () => {
      loadMeta(updater.store)
      updater.store.removeDocument(doc1)
      expect(updater.editable(doc1)).to.equal(undefined)
    })

    it('Async version should detect a document is editable from metadata', async () => {
      loadMeta(updater.store)
      const result = await updater.checkEditable(doc1)
      expect(result).to.equal('SPARQL')
      expect(updater.editable(doc1)).to.equal('SPARQL')
    })

    it('Async version should not detect a document is editable from metadata after flush', async () => {
      loadMeta(updater.store)
      expect(updater.editable(doc1)).to.equal('SPARQL')
      updater.flagAuthorizationMetadata()
      const result = await updater.checkEditable(doc1)
      expect(result).to.equal(undefined)
    })
  })
})
