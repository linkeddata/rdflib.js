'use strict'

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import nock from 'nock'
import * as rdf from '../../src/index'

const self = {err: ''}
const $rdf = rdf

chai.use(sinonChai)
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
  // console.log('Loaded metadata')
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
        expect(updater.store.fetcher.webOperation).to.have.been.calledOnce
        expect(ok).to.equal(true)
        done()
      })
    })

    it('Should patch an insert triple with no proior load', done => {
      updater.update([], [st1], (uri, ok, text) => {
        if (!ok) console.log(`update callback uri = ${uri}, ok = ${ok}, text = <<<${text}>>>` )
        expect(updater.store.fetcher.load).to.have.been.calledWith(doc)
        // expect(updater.store.fetcher.webOperation).to.have.been.called()
        expect(ok).to.equal(true)
        done()
      })
    })

    it('Should patch an insert triple with proior load of nonexistent file', done => {
      loadStatus = 404
      updater.update([], [st1], (uri, ok, text) => {
        if (!ok) console.log(`update callback uri = ${uri}, ok = ${ok}, text = <<<${text}>>>` )
        expect(updater.store.fetcher.load).to.have.been.calledWith(doc)
        // expect(updater.store.fetcher.webOperation).to.have.been.called()
        expect(ok).to.equal(true)
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
          expect((updater.store.fetcher.webOperation).callCount).to.equal(4)
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

  describe('update_statement', () => {
    it('set_object should use the anonymize method of the UpdateManager (issue #231)', done => {
      const updater = new UpdateManager()
      updater.store.fetcher.webOperation = sinon.stub().resolves({ ok: true, status: 200, statusText: 'Dummy stub' })
      loadMeta(updater.store)
      updater.store.add(st1)

      const handle = updater.update_statement(st1)
      // Before the fix this threw synchronously: `this.anonymize is not a function`
      handle.set_object($rdf.literal('999'), (uri, ok, text) => {
        try {
          expect(ok).to.equal(true)
          expect(updater.store.fetcher.webOperation).to.have.been.calledOnce
          const [method, patchUri, options] = updater.store.fetcher.webOperation.firstCall.args
          expect(method).to.equal('PATCH')
          expect(patchUri).to.equal(doc.uri)
          expect(options.body).to.include('DELETE DATA')
          expect(options.body).to.include('INSERT DATA')
          expect(options.body).to.include('"999"')
          done()
        } catch (e) { done(e) }
      })
    })
  })

  describe('update() error propagation (issue #479)', () => {
    let updater

    beforeEach(() => {
      updater = new UpdateManager()
      updater.store.fetcher.webOperation = sinon.stub().resolves({ ok: true, status: 200, statusText: 'Dummy stub' })
    })

    it('promise form should reject when the metadata load fails (e.g. unauthorized)', async () => {
      const err = new Error('Fetcher: unauthorized')
      err.status = 401
      err.response = { status: 401 }
      sinon.stub(updater.store.fetcher, 'load').rejects(err)

      let rejection
      try {
        await updater.update([], [st1])
      } catch (e) {
        rejection = e
      }
      expect(rejection).to.be.instanceOf(Error)
      expect(rejection.message).to.include("Can't get updatability status")
    })

    it('callback form should report failure when the load error carries no response object', done => {
      // Network-level failures have no `.response`; this used to crash inside the
      // rejection handler and swallow the error, so update() never settled.
      const err = new Error('Fetcher: network failure')
      err.status = 999
      sinon.stub(updater.store.fetcher, 'load').rejects(err)

      updater.update([], [st1], (uri, ok, body) => {
        try {
          expect(ok).to.equal(false)
          expect(body).to.include("Can't get updatability status")
          done()
        } catch (e) { done(e) }
      })
    })
  })

  describe('update() loads metadata then retries once (issue #250)', () => {
    let updater

    beforeEach(() => {
      updater = new UpdateManager()
      updater.store.fetcher.webOperation = sinon.stub().resolves({ ok: true, status: 200, statusText: 'Dummy stub' })
    })

    it('should retry after a 404 rejection from load (nonexistent resources are creatable)', done => {
      const err404 = new Error('Fetcher: not found')
      err404.status = 404
      const loadStub = sinon.stub(updater.store.fetcher, 'load').callsFake(() => {
        loadMeta(updater.store) // headers of the failed request still supply editability metadata
        return Promise.reject(err404)
      })

      updater.update([], [st1], (uri, ok, body) => {
        try {
          expect(ok).to.equal(true)
          expect(loadStub).to.have.been.calledOnce
          expect(updater.store.fetcher.webOperation).to.have.been.calledOnce
          done()
        } catch (e) { done(e) }
      })
    })

    it('should load only once and fail helpfully if metadata is still missing', done => {
      // load succeeds but yields no editability metadata: no retry loop, helpful error
      const loadStub = sinon.stub(updater.store.fetcher, 'load')
        .resolves({ ok: true, status: 200, statusText: 'Dummy stub' })

      updater.update([], [st1], (uri, ok, body) => {
        try {
          expect(ok).to.equal(false)
          expect(loadStub).to.have.been.calledOnce
          expect(body).to.include("still can't figure out what editing protocol")
          done()
        } catch (e) { done(e) }
      })
    })

    it('promise form should reject helpfully if metadata is still missing after the load', async () => {
      sinon.stub(updater.store.fetcher, 'load')
        .resolves({ ok: true, status: 200, statusText: 'Dummy stub' })

      let rejection
      try {
        await updater.update([], [st1])
      } catch (e) {
        rejection = e
      }
      expect(rejection).to.be.instanceOf(Error)
      expect(rejection.message).to.include("still can't figure out what editing protocol")
    })
  })
})
