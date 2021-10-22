/* eslint-env mocha */
import { expect } from 'chai'
import NamedNode from '../../src/named-node'
import Namespace from '../../src/namespace'

describe('Namespace', () => {
  it('defaults to a factory', () => {
    const ns = Namespace("http://example.com/")
    const term = ns('term')

    expect(term).to.have.property("termType")
    expect(term).to.have.property("value")
    expect(term.equals(new NamedNode("http://example.com/term"))).to.be.true()
  })

  it('allows custom factories', () => {
    let called = false
    const factory = {
      namedNode: (value) => {
        called = true
        return new NamedNode(value)
      }
    }

    const ns = Namespace("http://example.com/", factory)

    expect(called).to.be.false()
    const term = ns('term')
    expect(called).to.be.true()
    expect(term.equals(new NamedNode("http://example.com/term"))).to.be.true()
  })
})
