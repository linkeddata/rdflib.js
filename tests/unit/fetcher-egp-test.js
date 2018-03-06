/* eslint-env mocha */
'use strict'

import chai from 'chai'
import nock from 'nock'
import rdf from '../../src/index'

const { expect } = chai
chai.should()
// get rid of @@ console logs
const noLog = () => undefined
// console.log = noLog
// console.warn = noLog
const oldConsoleLog = console.log

describe('Fetcher', () => {
  describe('nowOrWhenFetched', () => {
    let goodServer = 'http://localhost'
    let badServer = 'http://localhost999'

    it('should handle 200', done => {
      let path = '/200'
      const bodyText = '<html></html>'
      let c = nock(goodServer)
        .get(path)
        .reply(200, bodyText, {'Content-type': 'text/html'})
      ;
      console.log(c);
      c.on('request', function () { console.log(arguments); })
      c.on('replied', function () { console.log(arguments); })
      let kb = rdf.graph();
      console.log = noLog
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(goodServer + path), {force: true}, function (ok, status, resp) {
        console.log = oldConsoleLog;
        expect(ok).to.be.true;
        expect(status).to.equal(200);
        expect(resp.responseText.length).to.equal(bodyText.length)
        done();
      })
    })

    it('should handle 404', done => {
      let path = '/404'
      const bodyText = '<html></html>'
      nock(goodServer)
        .get(path)
        .reply(404)
      ;
      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(goodServer + path), {force: true}, function (ok, status, resp) {
        expect(ok).to.be.false;
        expect(status).to.equal(404);
        expect(resp.error).to.match(/404/)
        done();
      })
    })

    it('should handle dns error', done => {
      let path = '/200'
      const bodyText = '<html></html>'
      nock(goodServer)
        .get(path)
        .reply(404)
      ;
      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(badServer + path), {force: true}, function (ok, status, resp) {
        expect(ok).to.be.false;
        expect(status).to.equal(-1);
        expect(resp.error).to.match(/ENOTFOUND/)
        done();
      })
    })

    it('should handle nock failure', done => {
      let path = '/200'
      const bodyText = '<html></html>'
      nock(goodServer)
        .get(path)
        .reply(404)
      ;

      // Use up the nock path (note no .persistent() on nock).
      require('node-fetch')(goodServer + path).then(() => null);
      let kb = rdf.graph();
      let fetcher = rdf.fetcher(kb, {a:1})
      fetcher.nowOrWhenFetched(kb.sym(goodServer + path), {force: true}, function (ok, status, resp) {
        expect(ok).to.be.false;
        expect(status).to.equal(404);
        expect(resp.error).to.match(/404/)
        done();
      })
    })

  })

})
