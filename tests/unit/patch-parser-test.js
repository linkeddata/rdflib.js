/* eslint-env mocha */
import { expect } from 'chai'

import sparqlUpdateParser from '../../src/patch-parser'
import IndexedFormula from '../../src/store'

describe('sparqlUpdateParser', () => {
  it('parses a basic SPARQL UPDATE query', () => {
    const query = `
      DELETE {
        <#me> <http://xmlns.com/foaf/0.1/givenName> ?name.
      }
      INSERT {
        <#me> <http://xmlns.com/foaf/0.1/givenName> "Ruben".
      }
      WHERE {
        <#me> <http://xmlns.com/foaf/0.1/lastName> "Verborgh".
      }`
    const store = new IndexedFormula()
    const baseUri = 'https://ruben.verborgh.org/profile/'

    const result = sparqlUpdateParser(query, store, baseUri)

    expect(result.delete.statements.map(termValues)).to.eql([
      {
        subject: "https://ruben.verborgh.org/profile/#me",
        predicate: "http://xmlns.com/foaf/0.1/givenName",
        object: "name",
      },
    ])
    expect(result.insert.statements.map(termValues)).to.eql([
      {
        subject: "https://ruben.verborgh.org/profile/#me",
        predicate: "http://xmlns.com/foaf/0.1/givenName",
        object: "Ruben",
      },
    ])
    expect(result.where.statements.map(termValues)).to.eql([
      {
        subject: "https://ruben.verborgh.org/profile/#me",
        predicate: "http://xmlns.com/foaf/0.1/lastName",
        object: "Verborgh",
      },
    ])
  })
})

function termValues({ subject, predicate, object }) {
  return {
    subject: subject.value,
    predicate: predicate.value,
    object: object.value,
  }
}
