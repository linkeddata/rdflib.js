/* eslint-env mocha */
import { expect } from 'chai'

import IndexedFormula from '../../src/store'
import NamedNode from '../../src/named-node'
import DataFactory from '../../src/data-factory'

describe('IndexedFormula', () => {
  const s1 = NamedNode.fromValue('https://example.com/subject1')
  const p1 = NamedNode.fromValue('https://example.com/predicate1')
  const o1 = NamedNode.fromValue('https://example.com/object1')
  const triple1 = DataFactory.triple(s1, p1, o1)

  const s2 = NamedNode.fromValue('https://example.com/subject2')
  const p2 = NamedNode.fromValue('https://example.com/predicate2')
  const o2 = NamedNode.fromValue('https://example.com/object2')
  const triple2 = DataFactory.triple(s2, p2, o2)

  const s3 = NamedNode.fromValue('https://example.com/subject3')
  const p3 = NamedNode.fromValue('https://example.com/predicate3')
  const o3 = NamedNode.fromValue('https://example.com/object3')
  const triple3 = DataFactory.triple(s3, p3, o3)

  const triple4 = DataFactory.triple(s1, p2, o3)

  describe('match', () => {
    it('when given no arguments returns all statements', () => {
      const kb = new IndexedFormula()
      const triples = [ triple1, triple2, triple3 ]
      kb.addAll(triples)
      expect(kb.length).to.equal(3)
      expect(kb.match()).to.eql(triples)
    })

    it('matches on subject', () => {
      let kb = new IndexedFormula()
      kb.addAll([ triple1, triple2, triple3, triple4 ])
      let s = NamedNode.fromValue('https://example.com/subject1')
      let matches = kb.match(s)
      expect(matches.length).to.equal(2)
      matches.sort()
      expect(matches[0].subject).to.eql(s1)
      expect(matches[1].subject).to.eql(s1)
    })

    it('matches on predicate', () => {
      let kb = new IndexedFormula()
      kb.addAll([ triple1, triple2, triple3, triple4 ])
      let p = NamedNode.fromValue('https://example.com/predicate2')
      let matches = kb.match(null, p)
      expect(matches.length).to.equal(2)
      matches.sort()
      expect(matches[0].predicate).to.eql(p2)
      expect(matches[1].predicate).to.eql(p2)
    })

    it('matches on subject and object', () => {
      let kb = new IndexedFormula()
      kb.addAll([ triple1, triple2, triple3, triple4 ])
      let matches = kb.match(
        NamedNode.fromValue('https://example.com/subject1'),
        null,
        NamedNode.fromValue('https://example.com/object1')
      )
      expect(matches.length).to.equal(1)
      expect(matches[0].subject).to.eql(s1)
      expect(matches[0].object).to.eql(o1)
    })
  })

  describe('add', () => {
    it ('works with arrays', () => {
      const store = new IndexedFormula()
      store.add([
        triple1,
        triple2,
      ])

      expect(store.statements.length).to.eq(2)
      expect(store.holds(s1, p1, o1)).to.be.true()
      expect(store.holds(s2, p2, o2)).to.be.true()
    })

    it ('works with statements', () => {
      const store = new IndexedFormula()
      store.add(triple1)

      expect(store.statements.length).to.eq(1)
      expect(store.holds(s1, p1, o1)).to.be.true()
    })

    it ('works with stores', () => {
      const store0 = new IndexedFormula()
      store0.add([triple1, triple2])

      const store = new IndexedFormula()
      store.add(store0)

      expect(store.statements.length).to.eq(2)
      expect(store.holds(s1, p1, o1)).to.be.true()
      expect(store.holds(s2, p2, o2)).to.be.true()
    })

    it ('works with terms as separate arguments', () => {
      const store = new IndexedFormula()
      store.add(s1, p1, o1)

      expect(store.statements.length).to.eq(1)
      expect(store.holds(triple1)).to.be.true()
    })

    it('calls the data callback', () => {
      let callbackCount = 0
      let callbackArgs = undefined
      const store = new IndexedFormula(
        undefined,
        { dataCallback: (...args) => {
          callbackCount++
          callbackArgs = args
        } }
      )
      const defaultGraph = store.rdfFactory.defaultGraph()

      expect(callbackCount).to.eq(0)
      store.add(triple1)

      expect(callbackCount).to.eq(1)
      expect(callbackArgs[0].subject).to.eq(s1)
      expect(callbackArgs[0].predicate).to.eq(p1)
      expect(callbackArgs[0].object).to.eq(o1)
      expect(callbackArgs[0].graph.termType).to.eq(defaultGraph.termType)
      expect(callbackArgs[0].graph.value).to.eq(defaultGraph.value)
    })

    it('skips the data callback when the statement is already present', () => {
      let callbackCount = 0
      const store = new IndexedFormula(
        undefined,
        { dataCallback: () => {
            callbackCount++
          } }
      )
      store.add(triple1)
      callbackCount = 0
      store.add(triple1)

      expect(callbackCount).to.eq(0)
    })
  })
})
