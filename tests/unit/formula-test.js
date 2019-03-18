/* eslint-env mocha */
import { expect } from 'chai'

import BlankNode from '../../src/blank-node'
import Literal from '../../src/literal'
import NamedNode from '../../src/named-node'
import Namespace from '../../src/namespace'
import Formula from '../../src/formula'

const alice = new NamedNode('https://alice.example.com/profile#alice')
const doc = alice.doc()
const bob = new NamedNode('https://bob.example.com/profile#me')
const charlie = new NamedNode('https://charlie.example.com/profile#me')
const foaf = new Namespace('http://xmlns.com/foaf/0.1/')
const knows = foaf('knows')
const age = foaf('age')

describe('Formula', () => {
  it('can be constructed and serialized', () => {
    ;[
      {
        s: new  NamedNode('http://example.com/btb'),
        p: new NamedNode('http://xmlns.com/foaf/0.1/name'),
        o: 'Builder',
        expected: '{<http://example.com/btb> <http://xmlns.com/foaf/0.1/name> "Builder" .}'
      }, {
        s: new BlankNode(),
        p: new NamedNode('http://xmlns.com/foaf/0.1/firstname'),
        o: 'Bob',
        expected: '{_:n0 <http://xmlns.com/foaf/0.1/firstname> "Bob" .}'
      }, {
        s: new NamedNode('http://example.com/btb'),
        p: new NamedNode('http://xmlns.com/foaf/0.1/lastname'),
        o: new Literal('Builder', 'en'),
        expected: '{<http://example.com/btb> <http://xmlns.com/foaf/0.1/lastname> "Builder"@en .}'
      }, {
        s: new NamedNode('http://example.com/btb'),
        p: new NamedNode('http://example.org/vocab#shoeSize'),
        o: new Literal('30', void 0, (new Namespace('http://www.w3.org/2001/XMLSchema#'))('integer')),
        expected: '{<http://example.com/btb> <http://example.org/vocab#shoeSize> "30"^^<http://www.w3.org/2001/XMLSchema#integer> .}'
      }
    ].map(data => {
      const { s, p, o, expected } = data
      const kb = new Formula()
      kb.add(s, p, o)
      expect(kb.toNT()).to.equal(expected)
    })
  })

  describe('Formula', () => {
    it('can find all terms with each', () => {
      const kb = new Formula()
      const doc = alice.doc()
      kb.add(alice, knows, bob, doc)
      kb.add(alice, knows, charlie, doc)
      kb.add(alice, age, 21)
      let friends = kb.each(alice, knows)
      expect(friends.length).to.equal(2)
    })

    it('can find one terms with any()', () => {
      const kb = new Formula()
      const doc = alice.doc()
      kb.add(alice, knows, bob, doc)
      kb.add(alice, knows, charlie, doc)
      kb.add(alice, age, 21)
      let x = kb.any(alice, age)
      expect(x.value).to.equal("21")
    })

    it('can find one terms with anyValue()', () => {
      const kb = new Formula()
      const doc = alice.doc()
      kb.add(alice, knows, bob, doc)
      kb.add(alice, knows, charlie, doc)
      kb.add(alice, age, 21)
      let s = kb.anyValue(alice, age)
      expect(s).to.equal("21")
    })

    it('can find one true boolean with anyJS()', () => {
      const kb = new Formula()
      const doc = alice.doc()
      kb.add(alice, age, true, doc)
      let n = kb.anyJS(alice, age)
      expect(typeof n).to.equal('boolean')
      expect(n).to.equal(true)
    })
    it('can find one false boolean with anyJS()', () => {
      const kb = new Formula()
      const doc = alice.doc()
      kb.add(alice, age, false, doc)
      let n = kb.anyJS(alice, age)
      expect(typeof n).to.equal('boolean')
      expect(n).to.equal(false)
    })
    it('can find one string with anyJS()', () => {
      const kb = new Formula()
      kb.add(alice, age, "21", doc)
      let n = kb.anyJS(alice, age)
      expect(typeof n).to.equal('string')
      expect(n).to.equal("21")
    })
    it('can find one integer with anyJS()', () => {
      const kb = new Formula()
      const doc = alice.doc()
      kb.add(alice, age, 21, doc)
      let n = kb.anyJS(alice, age)
      expect(n).to.equal(21)
    })
    it('can find one float with anyJS()', () => {
      const kb = new Formula()
      const doc = alice.doc()
      kb.add(alice, age, 21.6574e-2, doc)
      let n = kb.anyJS(alice, age)
      expect(n).to.equal(21.6574e-2)
    })
    it('can find one date with anyJS()', () => {
      const kb = new Formula()
      kb.add(alice, age, new Date('2000-10-10'), doc)
      let d = kb.anyJS(alice, age)
      expect(d instanceof Date).to.equal(true)
      expect(d.toISOString()).to.equal('2000-10-10T00:00:00.000Z')
    })
  })

})
