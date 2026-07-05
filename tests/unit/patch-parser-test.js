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

  it('binds ?variables in clauses to Variable terms', () => {
    const store = new IndexedFormula()
    const result = sparqlUpdateParser(
      'WHERE { <#me> <http://xmlns.com/foaf/0.1/givenName> ?name. }',
      store, 'https://example.org/profile/')
    expect(result.where.statements[0].object.termType).to.eql('Variable')
    expect(result.where.statements[0].object.value).to.eql('name')
  })

  it('accepts @prefix directives between clauses', () => {
    const store = new IndexedFormula()
    const result = sparqlUpdateParser(
      `@prefix foaf: <http://xmlns.com/foaf/0.1/>.
       INSERT DATA { <#me> foaf:nick "jw". }`,
      store, 'https://example.org/profile/')
    expect(result.insert.statements.map(termValues)).to.eql([
      {
        subject: 'https://example.org/profile/#me',
        predicate: 'http://xmlns.com/foaf/0.1/nick',
        object: 'jw',
      },
    ])
  })

  it('accepts SPARQL-style PREFIX declarations without a trailing dot (#651)', () => {
    const store = new IndexedFormula()
    const result = sparqlUpdateParser(
      `PREFIX foaf: <http://xmlns.com/foaf/0.1/>
       DELETE DATA { <#me> foaf:nick "jw". }`,
      store, 'https://example.org/profile/')
    expect(result.delete.statements.map(termValues)).to.eql([
      {
        subject: 'https://example.org/profile/#me',
        predicate: 'http://xmlns.com/foaf/0.1/nick',
        object: 'jw',
      },
    ])
  })

  it('allows semicolons between clauses and braces inside string literals', () => {
    const store = new IndexedFormula()
    const result = sparqlUpdateParser(
      'INSERT { <#s> <#p> "curly } brace". } ; WHERE { <#s> <#q> "x". }',
      store, 'https://example.org/doc')
    expect(result.insert.statements[0].object.value).to.eql('curly } brace')
    expect(result.where.statements[0].object.value).to.eql('x')
  })

  it('records the clauses on the target store under the patch vocabulary', () => {
    const store = new IndexedFormula()
    const base = 'https://example.org/doc'
    const result = sparqlUpdateParser('WHERE { <#s> <#q> "x". }', store, base)
    const st = store.statementsMatching(
      store.sym(base + '#query'),
      store.sym('http://www.w3.org/ns/pim/patch#where'),
      null)
    expect(st).to.have.length(1)
    expect(st[0].object).to.equal(result.where)
  })

  it('resolves the clauses when the base URI carries a fragment', () => {
    // Regression: the query node is written as <#query> in the generated N3,
    // which RFC 3986 resolves by *replacing* any fragment on the base — but
    // the lookup sym used to be built as `base + '#query'`. With a
    // fragment-bearing base the two silently diverged and the returned patch
    // lost its insert/delete/where clauses.
    const store = new IndexedFormula()
    const result = sparqlUpdateParser(
      `DELETE { <#me> <http://xmlns.com/foaf/0.1/nick> "old". }
       INSERT { <#me> <http://xmlns.com/foaf/0.1/nick> "new". }
       WHERE  { <#me> <http://xmlns.com/foaf/0.1/nick> "old". }`,
      store, 'https://example.org/profile/card#me')

    expect(result.query.value).to.eql('https://example.org/profile/card#query')
    expect(result.delete.statements.map(termValues)).to.eql([
      {
        subject: 'https://example.org/profile/card#me',
        predicate: 'http://xmlns.com/foaf/0.1/nick',
        object: 'old',
      },
    ])
    expect(result.insert.statements.map(termValues)).to.eql([
      {
        subject: 'https://example.org/profile/card#me',
        predicate: 'http://xmlns.com/foaf/0.1/nick',
        object: 'new',
      },
    ])
    expect(result.where.statements.map(termValues)).to.eql([
      {
        subject: 'https://example.org/profile/card#me',
        predicate: 'http://xmlns.com/foaf/0.1/nick',
        object: 'old',
      },
    ])
  })

  it('throws a descriptive error on unknown top-level syntax', () => {
    const store = new IndexedFormula()
    expect(() => sparqlUpdateParser('FROBNICATE { <#a> <#b> <#c>. }', store, 'https://example.org/doc'))
      .to.throw(/Unknown syntax/)
  })
})

function termValues({ subject, predicate, object }) {
  return {
    subject: subject.value,
    predicate: predicate.value,
    object: object.value,
  }
}
