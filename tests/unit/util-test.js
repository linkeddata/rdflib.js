/* eslint-env mocha */
import { expect } from 'chai'

import CanonicalDataFactory from '../../src/data-factory-internal'
import { arrayToStatements } from '../../src/util'

describe('util', () => {
  describe('arrayToStatements', () => {
    it('converts an array to statements', () => {
      const first = CanonicalDataFactory.blankNode()
      const statements = arrayToStatements(
        CanonicalDataFactory,
        first,
        ["a", "b", "c"].map((d) => CanonicalDataFactory.literal(d))
      )

      expect(statements).to.have.length(6)
    })
  })
})
