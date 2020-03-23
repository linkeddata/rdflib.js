import * as rdflib from '../..'
import { expect } from 'chai'

describe('rdflib exports', () => {
  it('exports a standalone st function', () => {
    const st = rdflib.st
    expect(st).to.be.an.instanceOf(Function);
    const triple = st('http://ex.org/s', 'http://ex.org/p', 'http://ex.org/o')
    expect(triple).to.exist
    expect(triple).to.have.property('subject')
    expect(triple).to.have.property('predicate')
    expect(triple).to.have.property('object')
    expect(triple.subject).to.have.property('value', 'http://ex.org/s')
    expect(triple.predicate).to.have.property('value', 'http://ex.org/p')
    expect(triple.object).to.have.property('value', 'http://ex.org/o')
  })
})
