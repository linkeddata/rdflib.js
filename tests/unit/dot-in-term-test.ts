import { expect } from 'chai'
import { graph, serialize, st, sym } from '../../src/index'
import parse from '../../src/parse'

describe('terms containing dots', () => {
  describe('parse', () => {
    it('parses prefixed local name with dot without consuming statement terminator', (done) => {
      const ttl = `@prefix ex: <http://example.com/> .
ex:subject.example ex:pred ex:obj .
`
      const kb = graph()
      const base = 'https://example.net/doc'
      parse(ttl, kb, base, 'text/turtle', (err) => {
        if (err) return done(err)
        expect(kb.statements).to.have.length(1)
        const s = kb.statements[0]
        expect(s.subject.equals(sym('http://example.com/subject.example'))).to.equal(true)
        expect(s.predicate.equals(sym('http://example.com/pred'))).to.equal(true)
        expect(s.object.equals(sym('http://example.com/obj'))).to.equal(true)
        done()
      })
    })

    it('parses [] :loves []. style with trailing dot', (done) => {
      const ttl = `@prefix : <#> .
[] :loves [] .
`
      const kb = graph()
      const base = 'https://example.net/doc'
      parse(ttl, kb, base, 'text/turtle', (err) => {
        if (err) return done(err)
        expect(kb.statements).to.have.length(1)
        done()
      })
    })
  })

  describe('serialize', () => {
  it('keeps absolute IRIs with dots in angle brackets (no fake qname)', () => {
      const doc = sym('https://example.net/doc')
      const kb = graph()
      kb.add(st(
        sym('https://subject.example'),
        sym('https://predicate.example'),
        sym('https://object.example'),
        doc
      ))
      const result = serialize(doc, kb, null, 'text/turtle')
  expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> <https://object.example>.

`)
    })

    it('abbreviates to qname when local part has a non-trailing dot', () => {
      const doc = sym('https://example.net/doc')
      const kb = graph()
      kb.setPrefixForURI('ex', 'http://example.com/')
      kb.add(st(
        sym('http://example.com/subject.example'),
        sym('http://example.com/p'),
        sym('http://example.com/o'),
        doc
      ))
      const result = serialize(doc, kb, null, 'text/turtle')
      expect(result).to.contain('ex:subject.example')
      expect(result).to.not.contain('<http://example.com/subject.example>')
    })

    it('does not abbreviate when local part ends with a dot', () => {
      const doc = sym('https://example.net/doc')
      const kb = graph()
      kb.setPrefixForURI('ex', 'http://example.com/')
      kb.add(st(
        sym('http://example.com/subject.'),
        sym('http://example.com/p'),
        sym('http://example.com/o'),
        doc
      ))
      const result = serialize(doc, kb, null, 'text/turtle')
      expect(result).to.contain('<http://example.com/subject.>')
      expect(result).to.not.contain('ex:subject.')
    })

    it("honors flag 'o' to avoid dotted local qnames", () => {
      const doc = sym('https://example.net/doc')
      const kb = graph()
      kb.setPrefixForURI('ex', 'http://example.com/')
      kb.add(st(
        sym('http://example.com/file.name'),
        sym('http://example.com/p'),
        sym('http://example.com/o'),
        doc
      ))
      const withDefault = serialize(doc, kb, null, 'text/turtle')
      expect(withDefault).to.contain('ex:file.name')
      const withFlag = serialize(doc, kb, null, 'text/turtle', undefined, { flags: 'o' })
      expect(withFlag).to.contain('<http://example.com/file.name>')
      expect(withFlag).to.not.contain('ex:file.name')
    })
  })
})
