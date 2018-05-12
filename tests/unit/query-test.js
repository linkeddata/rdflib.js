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

const { IndexedFormula, NamedNode, BlankNode, Variable } = rdf

describe('Query', () => {
  after(() => {
    BlankNode.nextId = 0
  })

  describe('basic queries', () => {
    let options, userCallback, doneCallback

    const x = new Variable('x')
    // const y = new Variable('y')
    // const z = new Variable('z')
    // const w = new Variable('w')

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

    beforeEach(() => {
      options = {}
      userCallback = (bindings) => {}
    })

    it('should find a value only in the given document ', done => {
      var result = null

      var query = new rdf.Query()
      query.pat.add(rdf.st(alice, age, x, aliceDoc))

      kb.query(query, (bindings) => {
        // console.log('bindings', bindings)
        expect(bindings['?x'].value).to.equal('21') // Should only get Alice's documents value
        result = bindings['?x'].value
        //done()
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
        console.log('bindings', bindings)
        expect(bindings['?x'].value).to.equal('25') // Should only get Alice's documents value
        result = bindings['?x'].value
        //done()
      }, null, () => { // fetcher, done callback
        expect(result).to.equal('25')
        done()
      })
    })
  })
})
