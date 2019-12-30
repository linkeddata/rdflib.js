
import Statement from '../../src/statement'
import Literal from '../../src/literal'
import { expect } from 'chai'
import DataFactory from '../../src/factories/rdflib-data-factory'

const URI = 'https://example.com/subject'

/**
 * These test do some assertions, but their main test is that they don't create compiler errors.
 */
describe('typings', () => {
  it('allows calling Literal.equal with non-literal', () => {
    const test = (): Statement => ({}) as unknown as Statement

    const b = test()
    const c = new Literal("")

    expect(c.equals(b.object)).to.be.false()
  })

  it('allows S P O generation with the datafactory', () => {
    const s = DataFactory.namedNode(URI);
    const p = DataFactory.namedNode(URI);
    const o = DataFactory.namedNode(URI);
    const t = DataFactory.triple(s, p, o);
  })
})
