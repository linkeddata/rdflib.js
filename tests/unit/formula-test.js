/* eslint-env mocha */
import { expect } from 'chai'

import BlankNode from '../../src/blank-node'
import Literal from '../../src/literal'
import NamedNode from '../../src/named-node'
import Namespace from '../../src/namespace'
import Formula from '../../src/formula'

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
})
