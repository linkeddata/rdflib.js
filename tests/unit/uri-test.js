/* eslint-env mocha */
import { expect } from 'chai'

import * as uri from '../../src/uri'

describe('uri', () => {
  const testData = [
    ['foo:xyz', 'bar:abc', 'bar:abc'],
    ['http://example/x/y/z', 'http://example/x/abc', '../abc'],
    ['http://example2/x/y/z', 'http://example/x/abc', 'http://example/x/abc'],
    ['http://ex/x/y/z', 'http://ex/x/r', '../r'],
    ['http://ex/x/y', 'http://ex/x/q/r', 'q/r'],
    ['http://ex/x/y', 'http://ex/x/q/r#s', 'q/r#s'],
    ['http://ex/x/y', 'http://ex/x/q/r#s/t', 'q/r#s/t'],
    ['http://ex/x/y', 'ftp://ex/x/q/r', 'ftp://ex/x/q/r'],
    ['http://ex/x/y', 'http://ex/x/y', ''],
    ['http://ex/x/y/', 'http://ex/x/y/', ''],
    ['http://ex/x/y/pdq', 'http://ex/x/y/pdq', ''],
    ['http://ex/x/y/', 'http://ex/x/y/z/', 'z/'],
    ['file:/swap/test/animal.rdf', 'file:/swap/test/animal.rdf#Animal', '#Animal'],
    ['file:/e/x/y/z', 'file:/e/x/abc', '../abc'],
    ['file:/example2/x/y/z', 'file:/example/x/abc', '/example/x/abc'],
    ['file:/ex/x/y/z', 'file:/ex/x/r', '../r'],
    ['file:/ex/x/y/z', 'file:/r', '/r'],
    ['file:/ex/x/y', 'file:/ex/x/q/r', 'q/r'],
    ['file:/ex/x/y', 'file:/ex/x/q/r#s', 'q/r#s'],
    ['file:/ex/x/y', 'file:/ex/x/q/r#', 'q/r#'],
    ['file:/ex/x/y', 'file:/ex/x/q/r#s/t', 'q/r#s/t'],
    ['file:/ex/x/y', 'ftp://ex/x/q/r', 'ftp://ex/x/q/r'],
    ['file:/ex/x/y', 'file:/ex/x/y', ''],
    ['file:/ex/x/y/', 'file:/ex/x/y/', ''],
    ['file:/ex/x/y/pdq', 'file:/ex/x/y/pdq', ''],
    ['file:/ex/x/y/', 'file:/ex/x/y/z/', 'z/'],
    ['file:/devel/WWW/2000/10/swap/test/reluri-1.n3', 'file://meetings.example.com/cal#m1', 'file://meetings.example.com/cal#m1'],
    ['file:/home/connolly/w3ccvs/WWW/2000/10/swap/test/reluri-1.n3', 'file://meetings.example.com/cal#m1', 'file://meetings.example.com/cal#m1'],
    ['file:/some/dir/foo', 'file:/some/dir/#blort', './#blort'],
    ['file:/some/dir/foo', 'file:/some/dir/#', './#'],
    ['http://example/x/y%2Fz', 'http://example/x/abc', 'abc'],
    ['http://example/x/y/z', 'http://example/x%2Fabc', '/x%2Fabc'],
    ['http://example/x/y%2Fz', 'http://example/x%2Fabc', '/x%2Fabc'],
    ['http://example/x%2Fy/z', 'http://example/x%2Fy/abc', 'abc'],
    ['http://example/x/abc.efg', 'http://example/x/', './'],
    ['http://www.w3.org/People/Berners-Lee/card.rdf', 'http://www.w3.org/2002/01/tr-automation/tr.rdf', '/2002/01/tr-automation/tr.rdf'],
    ['http://example.com/', 'http://example.com/', ''],
    ['http://example.com/.meta.n3', 'http://example.com/.meta.n3', '']
  ]

  describe('join', () => {
    it('can join uris', () => {
      testData.map(data => {
        const [ base, abs, rel ] = data
        expect(uri.join(rel, base)).to.equal(abs)
      })
    })
  })

  describe('refTo', () => {
    it('can derive the ref from one URI to another', () => {
      testData.map(data => {
        const [ base, abs, rel ] = data
        expect(uri.refTo(base, abs)).to.equal(rel)
      })
    })
  })
})
