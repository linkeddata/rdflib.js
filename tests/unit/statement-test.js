import { expect } from 'chai'

import NamedNode from '../../src/named-node'
import Statement from '../../src/statement'

describe('Statement', () => {
  it('can be constructed and serialized', () => {
    const serialized = '<http://example.com/btb> <http://xmlns.com/foaf/0.1/name> "Bob Builder" .'
    const statement = new Statement(
      new NamedNode('http://example.com/btb'),
      new NamedNode('http://xmlns.com/foaf/0.1/name'),
      'Bob Builder'
    )
    expect(statement.toString()).to.equal(serialized)
  })

  describe('constructor validation (issue #362)', () => {
    const s = new NamedNode('http://example.com/subject')
    const p = new NamedNode('http://example.com/predicate')
    const o = new NamedNode('http://example.com/object')

    it('throws when constructed without any terms', () => {
      expect(() => new Statement()).to.throw(Error, /subject/)
    })

    it('throws on a null or undefined subject', () => {
      expect(() => new Statement(null, p, o)).to.throw(Error, /subject/)
      expect(() => new Statement(undefined, p, o)).to.throw(Error, /subject/)
    })

    it('throws on a null or undefined predicate', () => {
      expect(() => new Statement(s, null, o)).to.throw(Error, /predicate/)
      expect(() => new Statement(s, undefined, o)).to.throw(Error, /predicate/)
    })

    it('throws on a null or undefined object', () => {
      expect(() => new Statement(s, p, null)).to.throw(Error, /object/)
      expect(() => new Statement(s, p, undefined)).to.throw(Error, /object/)
    })

    it('still defaults an omitted graph to the default graph', () => {
      const statement = new Statement(s, p, o)
      expect(statement.graph.termType).to.equal('DefaultGraph')
    })
  })
})
