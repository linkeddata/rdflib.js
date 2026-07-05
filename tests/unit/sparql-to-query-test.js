'use strict'

import { expect } from 'chai'
import * as rdf from '../../src/index'

const { SPARQLToQuery } = rdf

describe('SPARQLToQuery', () => {
  describe('structural mapping onto Query.pat / Query.vars', () => {
    it('maps a basic SELECT query', () => {
      const kb = rdf.graph()
      const q = SPARQLToQuery(
        'SELECT ?s ?o WHERE { ?s <http://xmlns.com/foaf/0.1/knows> ?o . }', true, kb)
      expect(q.vars.map(v => v.termType)).to.eql(['Variable', 'Variable'])
      expect(q.vars.map(v => v.value)).to.eql(['s', 'o'])
      expect(q.vars.map(v => v.label)).to.eql(['s', 'o'])
      expect(q.pat.statements).to.have.length(1)
      const st = q.pat.statements[0]
      expect(st.subject.termType).to.equal('Variable')
      expect(st.predicate.value).to.equal('http://xmlns.com/foaf/0.1/knows')
      expect(st.object.termType).to.equal('Variable')
      // the same variable object is reused across the query
      expect(st.subject).to.equal(q.vars[0])
    })

    it('expands prefixed names and the "a" keyword', () => {
      const kb = rdf.graph()
      const q = SPARQLToQuery(`PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        SELECT ?s WHERE { ?s a foaf:Person . }`, true, kb)
      const st = q.pat.statements[0]
      expect(st.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
      expect(st.object.value).to.equal('http://xmlns.com/foaf/0.1/Person')
    })

    it('declares rdf: and rdfs: prefixes by default, like the old parser', () => {
      const kb = rdf.graph()
      const q = SPARQLToQuery('SELECT ?s WHERE { ?s rdf:type ?o . }', true, kb)
      expect(q.pat.statements[0].predicate.value)
        .to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    })

    it('populates query.vars from the pattern for SELECT *', () => {
      const kb = rdf.graph()
      const q = SPARQLToQuery('SELECT * WHERE { ?s ?p ?o . }', true, kb)
      expect(q.vars.map(v => v.value)).to.eql(['s', 'p', 'o'])
    })

    it('maps OPTIONAL groups onto the optional formula list', () => {
      const kb = rdf.graph()
      const q = SPARQLToQuery(`SELECT ?s ?age WHERE {
          ?s <http://ex.org/p> ?o .
          OPTIONAL { ?s <http://ex.org/age> ?age . }
        }`, true, kb)
      expect(q.pat.statements).to.have.length(1)
      expect(q.pat.optional).to.have.length(1)
      const opt = q.pat.optional[0]
      expect(opt.statements).to.have.length(1)
      expect(opt.statements[0].predicate.value).to.equal('http://ex.org/age')
      // optional shares the variable instances of the main pattern
      expect(opt.statements[0].subject).to.equal(q.pat.statements[0].subject)
    })

    it('maps FILTER (?x = constant) onto an equality constraint', () => {
      const kb = rdf.graph()
      const q = SPARQLToQuery(
        'SELECT ?s WHERE { ?s <http://ex.org/p> ?o . FILTER ( ?o = "x" ) }', true, kb)
      const constraint = q.pat.constraints['?o']
      expect(constraint).to.be.an('object')
      expect(constraint.describe('?o')).to.equal('?o = "x"')
      expect(constraint.test(kb.literal('x'))).to.equal(true)
      expect(constraint.test(kb.literal('y'))).to.equal(false)
    })

    it('maps FILTER > and < onto real comparisons', () => {
      // The old parser silently turned > and < into equality tests
      const kb = rdf.graph()
      const q = SPARQLToQuery(
        'SELECT ?s WHERE { ?s <http://ex.org/age> ?age . FILTER ( ?age > 21 ) }', true, kb)
      const constraint = q.pat.constraints['?age']
      expect(constraint.test(kb.literal('25'))).to.equal(true)
      expect(constraint.test(kb.literal('21'))).to.equal(false)
      expect(constraint.test(kb.literal('7'))).to.equal(false)

      const q2 = SPARQLToQuery(
        'SELECT ?s WHERE { ?s <http://ex.org/age> ?age . FILTER ( ?age < 21 ) }', true, kb)
      expect(q2.pat.constraints['?age'].test(kb.literal('7'))).to.equal(true)
      expect(q2.pat.constraints['?age'].test(kb.literal('25'))).to.equal(false)
    })

    it('maps FILTER regex(?x, "pattern") onto a regex constraint', () => {
      const kb = rdf.graph()
      const q = SPARQLToQuery(
        'SELECT ?s WHERE { ?s <http://ex.org/p> ?name . FILTER regex(?name, "^Ali") }', true, kb)
      const constraint = q.pat.constraints['?name']
      expect(constraint.test(kb.literal('Alice'))).to.equal(true)
      expect(constraint.test(kb.literal('Bob'))).to.equal(false)
    })

    it('supports regex flags', () => {
      const kb = rdf.graph()
      const q = SPARQLToQuery(
        'SELECT ?s WHERE { ?s <http://ex.org/p> ?name . FILTER regex(?name, "^ali", "i") }', true, kb)
      expect(q.pat.constraints['?name'].test(kb.literal('Alice'))).to.equal(true)
    })
  })

  describe('running parsed queries against a store', () => {
    it('answers a SELECT query over the store', () => {
      const kb = rdf.graph()
      const doc = rdf.sym('https://example.com/data')
      kb.add(rdf.sym('https://example.com/alice#i'),
        rdf.sym('http://xmlns.com/foaf/0.1/name'), rdf.lit('Alice'), doc)
      kb.add(rdf.sym('https://example.com/bob#me'),
        rdf.sym('http://xmlns.com/foaf/0.1/name'), rdf.lit('Bob'), doc)

      const q = SPARQLToQuery(`PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        SELECT ?who WHERE { ?who foaf:name "Alice" . }`, true, kb)
      const results = kb.querySync(q)
      expect(results).to.have.length(1)
      expect(results[0]['?who'].value).to.equal('https://example.com/alice#i')
    })

    it('does not require the trailing dot the spec makes optional (#459)', () => {
      const kb = rdf.graph()
      kb.add(kb.sym('https://example.com/A'), kb.sym('https://example.com/foo'), 'bar')

      const q = SPARQLToQuery(
        'SELECT ?nodeA ?nodeB WHERE { ?nodeA <https://example.com/foo> ?nodeB }', true, kb)
      expect(q.pat.statements).to.have.length(1) // old parser silently produced none
      const results = kb.querySync(q)
      expect(results).to.have.length(1)
      expect(results[0]['?nodeB'].value).to.equal('bar')
    })

    it('runs the exact CONSTRUCT WHERE repro of #459 as a binding query', () => {
      const kb = rdf.graph()
      kb.add(kb.sym('https://example.com/A'), kb.sym('https://example.com/foo'), 'bar')

      const q = SPARQLToQuery('CONSTRUCT WHERE { ?nodeA ?edge ?nodeB }', true, kb)
      expect(q.vars.map(v => v.value)).to.eql(['nodeA', 'edge', 'nodeB'])
      const results = kb.querySync(q)
      expect(results).to.have.length(1)
      expect(results[0]['?nodeA'].value).to.equal('https://example.com/A')
      expect(results[0]['?nodeB'].value).to.equal('bar')
    })

    it('handles parenthesized IRIs (#308)', () => {
      const kb = rdf.graph()
      const pred = kb.sym('http://www.example.com/Using_Business_Organisation_(L4)')
      kb.add(kb.sym('http://ex.org/doc#subject'), pred, 'Data')

      const q = SPARQLToQuery(`SELECT * WHERE {
          ?s <http://www.example.com/Using_Business_Organisation_(L4)> ?o .
        }`, true, kb)
      expect(q.pat.statements[0].predicate.value).to.equal(pred.value)
      const results = kb.querySync(q)
      expect(results).to.have.length(1)
      expect(results[0]['?o'].value).to.equal('Data')
    })

    it('applies FILTER constraints when matching', () => {
      const kb = rdf.graph()
      const age = kb.sym('http://xmlns.com/foaf/0.1/age')
      kb.add(kb.sym('http://ex.org/#alice'), age, kb.literal('21'))
      kb.add(kb.sym('http://ex.org/#bob'), age, kb.literal('30'))

      const q = SPARQLToQuery(`SELECT ?s WHERE {
          ?s <http://xmlns.com/foaf/0.1/age> ?age . FILTER ( ?age > 25 )
        }`, true, kb)
      const results = kb.querySync(q)
      expect(results).to.have.length(1)
      expect(results[0]['?s'].value).to.equal('http://ex.org/#bob')
    })
  })

  describe('error reporting for unsupported SPARQL', () => {
    const cases = [
      ['ASK queries', 'ASK { ?s ?p ?o }', /ASK queries are not supported/],
      ['DESCRIBE queries', 'DESCRIBE <http://ex.org/x>', /DESCRIBE queries are not supported/],
      ['update operations', 'INSERT DATA { <http://ex.org/s> <http://ex.org/p> "v" }', /only SPARQL queries are supported/],
      ['UNION', 'SELECT ?s WHERE { { ?s <http://ex.org/a> ?o } UNION { ?s <http://ex.org/b> ?o } }', /'UNION' construct is not supported/],
      ['property paths', 'SELECT ?s WHERE { ?s <http://ex.org/a>/<http://ex.org/b> ?o }', /property paths are not supported/],
      ['FROM clauses', 'SELECT ?s FROM <http://ex.org/g> WHERE { ?s ?p ?o }', /FROM clauses are not supported/],
      ['SELECT expressions', 'SELECT (COUNT(?s) AS ?n) WHERE { ?s ?p ?o }', /SELECT expressions|aggregates/],
      ['solution modifiers', 'SELECT ?s WHERE { ?s ?p ?o } LIMIT 5', /solution modifiers/],
      ['unsupported FILTER operators', 'SELECT ?s WHERE { ?s ?p ?o . FILTER ( ?o != "x" ) }', /FILTER operator '!=' is not supported/],
      ['syntax errors', 'SELECT WHERE ?s { }', /could not parse the query/],
    ]
    for (const [name, query, message] of cases) {
      it(`throws a clear error for ${name}`, () => {
        const kb = rdf.graph()
        expect(() => SPARQLToQuery(query, true, kb)).to.throw(message)
      })
    }

    it('mentions the supported subset in errors', () => {
      const kb = rdf.graph()
      expect(() => SPARQLToQuery('ASK { ?s ?p ?o }', true, kb))
        .to.throw(/supported subset is: SELECT/)
    })
  })
})
