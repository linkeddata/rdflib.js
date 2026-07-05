import { expect } from 'chai'

import * as rdf from '../../src/index'

// The N3Parser class itself was removed in rdflib 3.0 (replaced by N3.js);
// a deprecated stub export remains so that legacy call sites fail with an
// actionable message instead of "undefined is not a constructor".
describe('N3Parser deprecation stub', () => {
  it('is still exported', () => {
    expect(rdf.N3Parser).to.be.an.instanceOf(Function)
  })

  it('throws a descriptive pointer to parse() when constructed', () => {
    expect(() => new rdf.N3Parser())
      .to.throw('N3Parser was removed in rdflib 3.0; use parse(text, store, base, contentType) or the n3 package directly')
  })

  it('throws the same pointer when called as a plain function', () => {
    expect(() => rdf.N3Parser())
      .to.throw('N3Parser was removed in rdflib 3.0; use parse(text, store, base, contentType) or the n3 package directly')
  })
})
