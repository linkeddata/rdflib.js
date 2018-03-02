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

const { Fetcher, BlankNode } = rdf

describe('Fetcher', () => {
  describe('nowOrWhenFetched', () => {
    let fetcher, docuri, rterm, options, userCallback

    it('should invoke userCallback with caught error', done => {
nock('http://localhost')
  // .persist() // 
  .get('/asdf')
  .reply(200, '<html></html>', {'Content-type': 'text/html'})
;
// require('node-fetch')(uri).then(handle);
let kb = rdf.graph();
let fetcher = rdf.fetcher(kb, {a:1})
const uri = 'http://localhost/asdf'
  fetcher.nowOrWhenFetched(kb.sym(uri), {force: true}, function (ok, status, resp) {
    if (ok)
      console.dir(resp.status + ' ' + resp.statusText + ' ' + resp.responseText.length + ' characters')
    else
      console.log("Failed: " + status + ", status: " + resp.error)
    if (ok)
      done();
    return 7;
  })
    })

  })

})
