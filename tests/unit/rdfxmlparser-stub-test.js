import { expect } from 'chai'

import * as rdf from '../../src/index'

// The RDFParser class itself was removed in rdflib 3.0 (replaced by
// rdfxml-streaming-parser behind src/rdfxml-adapter.ts); a deprecated stub
// export remains so that legacy call sites fail with an actionable message
// instead of "undefined is not a constructor".
describe('RDFParser deprecation stub', () => {
  it('is still exported', () => {
    expect(rdf.RDFParser).to.be.an.instanceOf(Function)
  })

  it('throws a descriptive pointer to parse() when constructed', () => {
    expect(() => new rdf.RDFParser())
      .to.throw("RDFParser was removed in rdflib 3.0; use parse(text, store, base, 'application/rdf+xml', callback) instead")
  })

  it('throws the same pointer when called as a plain function', () => {
    expect(() => rdf.RDFParser())
      .to.throw("RDFParser was removed in rdflib 3.0; use parse(text, store, base, 'application/rdf+xml', callback) instead")
  })
})
