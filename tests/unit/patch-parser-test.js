import { expect } from 'chai'

import sparqlUpdateParser from '../../src/patch-parser'
import IndexedFormula from '../../src/store'

const PATCH_NS = 'http://www.w3.org/ns/pim/patch#'

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

  // Characterization of the legacy output contract: server-side consumers
  // (NSS, and code reading the patch model out of the kb) depend on these
  // shapes, so the sparqljs-backed parser must keep producing them.
  describe('output contract (characterization)', () => {
    const query = `
      DELETE { <#me> <http://xmlns.com/foaf/0.1/givenName> ?name. }
      INSERT { <#me> <http://xmlns.com/foaf/0.1/givenName> "Ruben". }
      WHERE { <#me> <http://xmlns.com/foaf/0.1/lastName> "Verborgh". }`
    const baseUri = 'https://ruben.verborgh.org/profile/card'

    it('invents a #query node on the document', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(query, store, baseUri)
      expect(result.query.termType).to.equal('NamedNode')
      expect(result.query.value).to.equal(baseUri + '#query')
    })

    it('returns formula subgraphs whose statements carry the document as graph', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(query, store, baseUri)
      for (const kind of ['where', 'insert', 'delete']) {
        expect(result[kind].termType).to.equal('Graph')
        expect(result[kind].statements).to.have.length(1)
        expect(result[kind].statements[0].why.value).to.equal(baseUri)
      }
    })

    it('adds query patch:where|insert|delete statements to the kb', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(query, store, baseUri)
      for (const kind of ['where', 'insert', 'delete']) {
        const sts = store.statementsMatching(result.query, store.sym(PATCH_NS + kind))
        expect(sts, kind).to.have.length(1)
        expect(sts[0].object).to.equal(result[kind])
      }
    })

    it('produces Variable terms for ?variables and shares them between clauses', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(query, store, baseUri)
      const deleted = result.delete.statements[0].object
      const where = result.where.statements[0].object
      expect(deleted.termType).to.equal('Variable')
      expect(deleted.value).to.equal('name')
      expect(where.termType).to.equal('Literal')
    })
  })

  describe('compatibility with legacy patch shapes', () => {
    const baseUri = 'https://example.org/doc'

    it('accepts clauses in any order, including legacy WHERE-first', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(`
        WHERE { <#me> <http://xmlns.com/foaf/0.1/lastName> "Verborgh". }
        DELETE { <#me> <http://xmlns.com/foaf/0.1/givenName> ?name. }
        INSERT { <#me> <http://xmlns.com/foaf/0.1/givenName> "Ruben". }`,
        store, baseUri)
      expect(result.where.statements.map(termValues)).to.eql([{
        subject: baseUri + '#me',
        predicate: 'http://xmlns.com/foaf/0.1/lastName',
        object: 'Verborgh',
      }])
      expect(result.delete.statements[0].object.termType).to.equal('Variable')
      expect(result.insert.statements[0].object.value).to.equal('Ruben')
    })

    it('parses INSERT DATA and DELETE DATA operations separated by semicolons', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(
        'DELETE DATA { <#s> <#p> "old" . } ; INSERT DATA { <#s> <#p> "new" . }',
        store, baseUri)
      expect(result.delete.statements.map(termValues)).to.eql([
        { subject: baseUri + '#s', predicate: baseUri + '#p', object: 'old' }])
      expect(result.insert.statements.map(termValues)).to.eql([
        { subject: baseUri + '#s', predicate: baseUri + '#p', object: 'new' }])
      expect(result.where).to.equal(undefined)
      expect(store.statementsMatching(result.query, store.sym(PATCH_NS + 'where'))).to.have.length(0)
    })

    it('accepts N3-style @prefix directives (normalized to PREFIX)', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .
        INSERT DATA { <#me> foaf:name "Tim" . }`, store, baseUri)
      expect(result.insert.statements.map(termValues)).to.eql([
        { subject: baseUri + '#me', predicate: 'http://xmlns.com/foaf/0.1/name', object: 'Tim' }])
    })

    it('accepts SPARQL PREFIX declarations (#651)', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(`PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        INSERT DATA { <#me> foaf:name "Tim" . }`, store, baseUri)
      expect(result.insert.statements.map(termValues)).to.eql([
        { subject: baseUri + '#me', predicate: 'http://xmlns.com/foaf/0.1/name', object: 'Tim' }])
    })

    it('accepts lowercase keywords', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(
        'insert data { <#s> <#p> "v" . }', store, baseUri)
      expect(result.insert.statements.map(termValues)).to.eql([
        { subject: baseUri + '#s', predicate: baseUri + '#p', object: 'v' }])
    })

    it('returns just the query node for an empty patch', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser('  \n # nothing here\n', store, baseUri)
      expect(Object.keys(result)).to.eql(['query'])
      expect(store.statements).to.have.length(0)
    })

    it('accepts a patch of only a WHERE clause', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(
        'WHERE { <#s> <#p> ?o . }', store, baseUri)
      expect(result.where.statements).to.have.length(1)
      expect(result.insert).to.equal(undefined)
      expect(result.delete).to.equal(undefined)
    })
  })

  describe('term handling', () => {
    const baseUri = 'https://example.org/doc'

    it('preserves blank node identity within a patch', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(
        'INSERT DATA { <#s> <#p> _:b0 . _:b0 <#q> "v" . }', store, baseUri)
      const sts = result.insert.statements
      expect(sts).to.have.length(2)
      expect(sts[0].object.termType).to.equal('BlankNode')
      expect(sts[1].subject.termType).to.equal('BlankNode')
      expect(sts[0].object.equals(sts[1].subject)).to.equal(true)
    })

    it('parses typed and language-tagged literals', () => {
      const store = new IndexedFormula()
      const result = sparqlUpdateParser(
        `INSERT DATA { <#s> <#p> "5"^^<http://www.w3.org/2001/XMLSchema#integer> ;
                            <#q> "hi"@en . }`, store, baseUri)
      const sts = result.insert.statements
      expect(sts).to.have.length(2)
      expect(sts[0].object.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#integer')
      expect(sts[0].object.value).to.equal('5')
      expect(sts[1].object.language).to.equal('en')
      expect(sts[1].object.value).to.equal('hi')
    })
  })

  describe('base IRI handling', () => {
    it('resolves against the document part when the base has a fragment (U7 regression)', () => {
      // A fragment must not take part in resolution: with base
      // <https://example.org/doc#section>, <#s> is <https://example.org/doc#s>
      // and the invented query node lives on the document, not the fragment.
      const store = new IndexedFormula()
      const result = sparqlUpdateParser('INSERT DATA { <#s> <#p> "v" . }',
        store, 'https://example.org/doc#section')
      expect(result.query.value).to.equal('https://example.org/doc#query')
      expect(result.insert.statements.map(termValues)).to.eql([
        { subject: 'https://example.org/doc#s', predicate: 'https://example.org/doc#p', object: 'v' }])
      expect(result.insert.statements[0].why.value).to.equal('https://example.org/doc')
    })
  })

  describe('error reporting', () => {
    const baseUri = 'https://example.org/doc'

    it('throws a clear error on unknown top-level syntax', () => {
      const store = new IndexedFormula()
      expect(() => sparqlUpdateParser('SELECT * WHERE { ?s ?p ?o }', store, baseUri))
        .to.throw(/Patch syntax failure in <https:\/\/example\.org\/doc>.*Unknown syntax/s)
    })

    it('throws a clear error on an unterminated clause group', () => {
      const store = new IndexedFormula()
      expect(() => sparqlUpdateParser('INSERT DATA { <#s> <#p> "v" .', store, baseUri))
        .to.throw(/no matching '}'/)
    })

    it('throws a clear error on invalid clause contents', () => {
      const store = new IndexedFormula()
      expect(() => sparqlUpdateParser('INSERT DATA { this is not rdf }', store, baseUri))
        .to.throw(/Patch syntax failure/)
    })

    it('rejects blank nodes in DELETE templates, as SPARQL requires', () => {
      const store = new IndexedFormula()
      expect(() => sparqlUpdateParser(
        'DELETE { <#s> <#p> _:b } WHERE { <#s> <#p> ?o }', store, baseUri))
        .to.throw(/Patch syntax failure/)
    })

    it('rejects GRAPH blocks inside clauses', () => {
      const store = new IndexedFormula()
      expect(() => sparqlUpdateParser(
        'INSERT DATA { GRAPH <#g> { <#s> <#p> "v" } }', store, baseUri))
        .to.throw(/Patch syntax failure|basic graph patterns/)
    })

    it('rejects property paths in WHERE clauses', () => {
      const store = new IndexedFormula()
      expect(() => sparqlUpdateParser(
        'DELETE { <#s> <#p> ?o } WHERE { <#s> <#p>/<#q> ?o }', store, baseUri))
        .to.throw(/property paths|Patch syntax failure/)
    })
  })
})

function termValues({ subject, predicate, object }) {
  return {
    subject: subject.value,
    predicate: predicate.value,
    object: object.value,
  }
}
