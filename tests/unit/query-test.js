/* eslint-env mocha */
'use strict'

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import dirtyChai from 'dirty-chai'
import nock from 'nock'
import * as rdf from '../../src/index'

chai.use(sinonChai)
chai.use(dirtyChai)
const { expect } = chai
chai.should()

const { IndexedFormula, NamedNode, BlankNode, Variable } = rdf

describe('Query', () => {
  after(() => {
    BlankNode.nextId = 0
  })

  describe('basic queries', () => {
    let options, userCallback, doneCallback

    const x = new Variable('x')
    const y = new Variable('y')
    const z = new Variable('z')

    const knows = rdf.sym('http://xmlns.com/foaf/0.1/knows')
    const age = rdf.sym('http://xmlns.com/foaf/0.1/age')

    const alice = NamedNode.fromValue('https://example.com/alice#i')
    const aliceDoc = NamedNode.fromValue('https://example.com/alice')
    const bob = NamedNode.fromValue('https://example.com/bob#me')
    const bobDoc = bob.doc()

    const kb = rdf.graph()

    // Alice's profile asserts she is 21 qnd she knows Bob
    kb.add(alice, age, 21, aliceDoc)
    kb.add(alice, knows, bob, aliceDoc)

    // Bob's profile asserts Alice 25 and they know each other
    kb.add(alice, age, 25, bobDoc)
    kb.add(bob, age, 30, bobDoc)
    kb.add(bob, knows, alice, bobDoc)
    kb.add(alice, knows, bob, bobDoc)
/*
    beforeEach(() => {
      options = {}
      userCallback = (bindings) => {}
    })
*/
    it('should find a value only in the given document 1', done => {
      var result = null

      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, age, x, aliceDoc))

      kb.query(query, (bindings) => {
        // console.log('bindings', bindings)
        expect(bindings['?x'].value).to.equal('21') // Should only get Alice's documents value
        result = bindings['?x'].value
      }, null, () => { // fetcher, done callback
        expect(result).to.equal('21')
        done()
      })
    })

    it('should find a value only in the given document 2 ', done => {
      var result = null

      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, age, x, bobDoc))

      kb.query(query, (bindings) => {
        // console.log('bobdoc bindings', bindings)
        expect(bindings['?x'].value).to.equal('25') // Should only get Alice's documents value
        result = bindings['?x'].value
        //done()
      }, null, () => { // fetcher, done callback
        expect(result).to.equal('25')
        done()
      })
    })

    it('should find both values 3', done => {
      var result = []

      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, age, x, y))

      kb.query(query, (bindings) => {
        result.push(bindings['?x'].value)
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result.join(',')).to.equal('21,25')
        done()
      })
    })

    it('should find both values 4', done => {
      var result = []
      var query = new rdf.Query()

      query.pat.add(rdf.st(alice, age, x, undefined))

      kb.query(query, (bindings) => {
        console.log('both bindings 4)', bindings)
        result.push(bindings['?x'].value)
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result.join(',')).to.equal('21,25')
        done()
      })
    })

    it('should find all values 5', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(y, age, x, z))
      kb.query(query, (bindings) => {
        result.push(bindings['?x'].value)
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result.join(',')).to.equal('21,25,30')
        done()
      })
    })

    it('should do two line query with explicit doc', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, knows, y, z))
      query.pat.add(rdf.st(y, age, x, z))
      kb.query(query, (bindings) => {
        result.push(bindings['?x'].value)
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result.join(',')).to.equal('30')
        done()
      })
    })

    it('should do two line query with implicit doc', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, knows, y))
      query.pat.add(rdf.st(y, age, x))
      kb.query(query, (bindings) => {
        result.push(bindings['?x'].value)
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result.join(',')).to.equal('30,30') // Two statements to bind y
        done()
      })
    })

    const a = rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    const vegetarian = rdf.sym('http://xmlns.com/foaf/0.1/Vegetarian')
    const profile = rdf.sym('http://xmlns.com/foaf/0.1/personalProfile')

    kb.add(alice, profile, aliceDoc, aliceDoc)
    kb.add(bob, profile, aliceDoc, bobDoc)
    kb.add(alice, a, vegetarian, aliceDoc)
    kb.add(bob, a, vegetarian, aliceDoc) // we disregard non-self-assertion

    it('should involve statements about the document', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(x, profile, y, y))
      query.pat.add(rdf.st(x, a, vegetarian, y))
      kb.query(query, (bindings) => {
        result.push(bindings['?x'].value)
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result.join(',')).to.equal('https://example.com/alice#i') // Two statements to bind y
        done()
      })
    })

    it('should find a loop', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(x, knows, y))
      query.pat.add(rdf.st(y, knows, x))
      kb.query(query, (bindings) => {
        result[(bindings['?x'].value)] = true
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result[alice.uri]).to.be.true()
        expect(result[bob.uri]).to.be.true()
        done()
      })
    })

  })
})
/////////////////////////////////////////////////

describe('Synchronous Query', () => {
  after(() => {
    BlankNode.nextId = 0
  })

  describe('basic queries', () => {
    let options, userCallback, doneCallback

    const x = new Variable('x')
    const y = new Variable('y')
    const z = new Variable('z')

    const knows = rdf.sym('http://xmlns.com/foaf/0.1/knows')
    const age = rdf.sym('http://xmlns.com/foaf/0.1/age')

    const alice = NamedNode.fromValue('https://example.com/alice#i')
    const aliceDoc = NamedNode.fromValue('https://example.com/alice')
    const bob = NamedNode.fromValue('https://example.com/bob#me')
    const bobDoc = bob.doc()

    const kb = rdf.graph()

    // Alice's profile asserts she is 21 qnd she knows Bob
    kb.add(alice, age, 21, aliceDoc)
    kb.add(alice, knows, bob, aliceDoc)

    // Bob's profile asserts Alice 25 and they know each other
    kb.add(alice, age, 25, bobDoc)
    kb.add(bob, age, 30, bobDoc)
    kb.add(bob, knows, alice, bobDoc)
    kb.add(alice, knows, bob, bobDoc)
/*
    beforeEach(() => {
      options = {}
      userCallback = (bindings) => {}
    })
*/
    it('should find a value only in the given document 1', done => {
      var result = null

      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, age, x, aliceDoc))

      var result = kb.querySync(query)
      var bindings = result[0]
      expect (result.length).to.equal(1)
      expect(bindings['?x'].value).to.equal('21') // Should only get Alice's documents value
      done()

    })

    it('should find a value only in the given document 2 ', done => {
      var result = null

      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, age, x, bobDoc))

      var result = kb.querySync(query)
      var bindings = result[0]
      expect (result.length).to.equal(1)
      expect(bindings['?x'].value).to.equal('25') // Should only get Alice's documents value
      done()

    })

    it('should find both values 3', done => {
      var result = []

      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, age, x, y))

      result = kb.querySync(query)
      result = result.map(bindings => bindings['?x'].value)
      result.sort()
      expect(result.join(',')).to.equal('21,25')
      done()

    })

    it('should find both values 4', done => {
      var result = []
      var query = new rdf.Query()

      query.pat.add(rdf.st(alice, age, x, undefined))

      result = kb.querySync(query)
      result = result.map(bindings => bindings['?x'].value)
      result.sort()
      expect(result.join(',')).to.equal('21,25')
      done()
    })

    it('should find all values 5', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(y, age, x, z))

      result = kb.querySync(query)
      result = result.map(bindings => bindings['?x'].value)

      result.sort()
      expect(result.join(',')).to.equal('21,25,30')
      done()

    })

    it('should do two line query with explicit doc', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, knows, y, z))
      query.pat.add(rdf.st(y, age, x, z))

      result = kb.querySync(query)
      result = result.map(bindings => bindings['?x'].value)

      result.sort()
      expect(result.join(',')).to.equal('30')
      done()
    })

    it('should do two line query with implicit doc', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, knows, y))
      query.pat.add(rdf.st(y, age, x))

      result = kb.querySync(query)
      result = result.map(bindings => bindings['?x'].value)

      result.sort()
      expect(result.join(',')).to.equal('30,30')
      done()
    })

    const a = rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    const vegetarian = rdf.sym('http://xmlns.com/foaf/0.1/Vegetarian')
    const profile = rdf.sym('http://xmlns.com/foaf/0.1/personalProfile')

    kb.add(alice, profile, aliceDoc, aliceDoc)
    kb.add(bob, profile, aliceDoc, bobDoc)
    kb.add(alice, a, vegetarian, aliceDoc)
    kb.add(bob, a, vegetarian, aliceDoc) // we disregard non-self-assertion

    it('should involve statements about the document', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(x, profile, y, y))
      query.pat.add(rdf.st(x, a, vegetarian, y))
      kb.query(query, (bindings) => {
        result.push(bindings['?x'].value)
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result.join(',')).to.equal('https://example.com/alice#i') // Two statements to bind y
        done()
      })
    })

    it('should find a loop', done => {
      var result = []
      var query = new rdf.Query()
      query.pat.add(rdf.st(x, knows, y))
      query.pat.add(rdf.st(y, knows, x))
      kb.query(query, (bindings) => {
        result[(bindings['?x'].value)] = true
      }, null, () => { // fetcher, done callback
        result.sort()
        expect(result[alice.uri]).to.be.true()
        expect(result[bob.uri]).to.be.true()
        done()
      })
    })

  })
})
