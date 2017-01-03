/* eslint-env mocha */
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
})
