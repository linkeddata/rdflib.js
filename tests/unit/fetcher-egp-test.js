/* eslint-env mocha */
'use strict'

import chai from 'chai'
import nock from 'nock'
import * as rdf from '../../src/index'

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
        expect(ok).to.be.true()
        expect(resp.status).to.equal(200)
        expect(statusOrErrorText).to.equal('OK')
        expect(resp.responseText.length).to.equal(bodyText.length)
      }))
    })

    it('should handle 404', done => {
      let path = '/404'
      const bodyText = '<html></html>'
      nock(goodServer).get(path).reply(404)

      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
/*
      fetcher.nowOrWhenFetched(kb.sym(goodServer + path), {force: true}, function (ok, statusOrErrorText, resp) {
        console.log('@@@@@@ resp is ' + resp)
        expect(ok).to.be.false
        expect(statusOrErrorText).to.include(404)
        expect(resp.status).to.match(/404/)
        done()
      })
*/
      fetcher.nowOrWhenFetched(kb.sym(goodServer + path), {force: true}, trywrap(done, function (ok, statusOrErrorText, resp) {
        console.log('@@@@@@ ok is ' + ok)
        console.log('@@@@@@ statusOrErrorText is ' + statusOrErrorText)
        console.log('@@@@@@ resp is ' + resp)
        console.log('@@@@@@ resp.status is ' + resp.status)

        expect(ok).to.be.false()
        expect(statusOrErrorText).to.include(404)
        expect(resp.status).to.match(/404/)
      }))

    })

    it('should handle dns error', done => {
      let path = '/200'
      const bodyText = '<html></html>'
      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(badServer + path), {force: true}, trywrap(done, function (ok, statusOrErrorText, resp) {
        expect(ok).to.be.false()
        expect(statusOrErrorText).to.match(/ENOTFOUND/);
        expect(resp.status).to.equal(999)
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
        done('trywrap ' + e);
      }
    }
  }

})
