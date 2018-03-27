/* eslint-env mocha */
'use strict'

import chai from 'chai'
import nock from 'nock'
import rdf from '../../src/index'

const { expect } = chai
chai.should()

describe('Fetcher', () => {
  describe('nowOrWhenFetched', () => {
    let goodServer = 'http://localhost'
    let badServer = 'http://localhost999'

    it('should handle 200', done => {
      let path = '/200'
      const bodyText = '<html></html>'
      let c = nock(goodServer).get(path)
          .reply(200, bodyText, {'Content-type': 'text/html'})

      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(goodServer + path), {force: true}, trywrap(done, function (ok, statusOrErrorText, resp) {
        expect(ok).to.be.true
        expect(statusOrErrorText).to.equal(200)
        expect(resp.responseText.length).to.equal(bodyText.length)
      }))
    })

    it('should handle 404', done => {
      let path = '/404'
      const bodyText = '<html></html>'
      nock(goodServer).get(path).reply(404)

      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(goodServer + path), {force: true}, trywrap(done, function (ok, statusOrErrorText, resp) {
        expect(ok).to.be.false
        expect(statusOrErrorText).to.include(404)
        expect(resp.error).to.match(/404/)
      }))
    })

    it('should handle dns error', done => {
      let path = '/200'
      const bodyText = '<html></html>'
      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(badServer + path), {force: true}, trywrap(done, function (ok, statusOrErrorText, resp) {
        expect(ok).to.be.false
        expect(statusOrErrorText).to.include(999);
        expect(resp.error).to.match(/ENOTFOUND/)
      }))
    })

    it('should handle nock failure', done => {
      let path = '/200'
      const bodyText = '<html></html>'
      nock(goodServer).get(path).reply(404)

      // Use up the nock path (note no .persistent() on nock).
      require('node-fetch')(goodServer + path).then(() => null);
      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(goodServer + path), {force: true}, trywrap(done, function (ok, statusOrErrorText, resp) {
        expect(ok).to.be.false;
        expect(statusOrErrorText).to.match(/Nock: No match for request/);
        expect(resp.status).to.equal(999)
      }))
    })

  })

  /** Wrap call to f in a try/catch which calls (mocha) done.
   * Assumes done() with no arguments implies no try failure.
   */
  function trywrap (done, f) {
    return function () {
      try {
        f.apply(null, arguments);
        done();
      } catch (e) {
        done(e);
      }
    }
  }

})

