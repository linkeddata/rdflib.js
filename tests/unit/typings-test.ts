
import Statement from '../../src/statement'
import Literal from '../../src/literal'
import { expect } from 'chai'

/**
 * These test do some assertions, but their main test is that they don't create compiler errors.
 */
describe('typings', () => {
  it('allows calling Literal.equal with non-literal', () => {
    const test = (): Statement => undefined as unknown as Statement

    const b = test()
    const c = new Literal("")

    expect(c.equals(b.object)).to.be.false()
  })
})
