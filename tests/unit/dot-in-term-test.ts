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

    it('parses blank node followed by QName containing dot', (done) => {
      const ttl = `@prefix ex: <http://example.com/> .
@prefix set: <http://example.com/settings/> .

ex:subject
    ex:trustedApp [
        ex:mode ex:Read;
        ex:origin <https://example.com>
    ];
    ex:inbox ex:inbox;
    ex:preferencesFile set:prefs.ttl .
`
      const kb = graph()
      const base = 'https://example.net/doc'
      parse(ttl, kb, base, 'text/turtle', (err) => {
        if (err) return done(err)
        expect(kb.statements).to.have.length(5)
        const prefsFile = kb.statements.find(s => 
          s.predicate.value === 'http://example.com/preferencesFile'
        )
        expect(prefsFile).to.not.be.undefined
        expect(prefsFile?.object.value).to.equal('http://example.com/settings/prefs.ttl')
        done()
      })
    })

    it('parses multiple dotted QNames in same statement', (done) => {
      const ttl = `@prefix ex: <http://example.com/> .
@prefix file: <http://example.com/files/> .

file:data.txt ex:property file:backup.txt .
`
      const kb = graph()
      const base = 'https://example.net/doc'
      parse(ttl, kb, base, 'text/turtle', (err) => {
        if (err) return done(err)
        expect(kb.statements).to.have.length(1)
        const stmt = kb.statements[0]
        expect(stmt.subject.value).to.equal('http://example.com/files/data.txt')
        expect(stmt.object.value).to.equal('http://example.com/files/backup.txt')
        done()
      })
    })

    it('parses dotted QNames in predicate position', (done) => {
      const ttl = `@prefix ex: <http://example.com/> .
@prefix rel: <http://example.com/relations/> .

ex:subject rel:related.to ex:object .
`
      const kb = graph()
      const base = 'https://example.net/doc'
      parse(ttl, kb, base, 'text/turtle', (err) => {
        if (err) return done(err)
        expect(kb.statements).to.have.length(1)
        const stmt = kb.statements[0]
        expect(stmt.predicate.value).to.equal('http://example.com/relations/related.to')
        done()
      })
    })

    it('parses collections with dotted QNames', (done) => {
      const ttl = `@prefix ex: <http://example.com/> .
@prefix file: <http://example.com/files/> .

ex:subject ex:hasFiles (file:doc.pdf file:image.png file:data.json) .
`
      const kb = graph()
      const base = 'https://example.net/doc'
      parse(ttl, kb, base, 'text/turtle', (err) => {
        if (err) return done(err)
        
        // Collections are stored as Collection objects, not expanded to RDF lists
        expect(kb.statements.length).to.equal(1)
        const stmt = kb.statements[0]
        expect(stmt.object.termType).to.equal('Collection')
        
        // Check that all dotted filenames were parsed correctly in the collection
        const collection = stmt.object as any
        expect(collection.elements).to.have.length(3)
        
        const values = collection.elements.map((el: any) => el.value)
        expect(values).to.include('http://example.com/files/doc.pdf')
        expect(values).to.include('http://example.com/files/image.png')
        expect(values).to.include('http://example.com/files/data.json')
        done()
      })
    })

    it('parses nested blank nodes with multiple dotted QNames', (done) => {
      const ttl = `@prefix ex: <http://example.com/> .
@prefix cfg: <http://example.com/config/> .
@prefix file: <http://example.com/files/> .

ex:app ex:configuration [
    ex:settings cfg:app.settings;
    ex:database [
        ex:host cfg:db.host;
        ex:credentials file:db.credentials
    ]
];
ex:output file:result.json .
`
      const kb = graph()
      const base = 'https://example.net/doc'
      parse(ttl, kb, base, 'text/turtle', (err) => {
        if (err) return done(err)
        // Check all dotted QNames are parsed correctly
        const hasAppSettings = kb.statements.some(s => s.object.value === 'http://example.com/config/app.settings')
        const hasDbHost = kb.statements.some(s => s.object.value === 'http://example.com/config/db.host')
        const hasDbCreds = kb.statements.some(s => s.object.value === 'http://example.com/files/db.credentials')
        const hasResultJson = kb.statements.some(s => s.object.value === 'http://example.com/files/result.json')
        expect(hasAppSettings).to.be.true
        expect(hasDbHost).to.be.true
        expect(hasDbCreds).to.be.true
        expect(hasResultJson).to.be.true
        done()
      })
    })

    it('parses dotted QNames in property lists', (done) => {
      const ttl = `@prefix ex: <http://example.com/> .
@prefix file: <http://example.com/files/> .

ex:root ex:child ex:middle ;
        ex:config file:config.yaml .
`
      const kb = graph()
      const base = 'https://example.net/doc'
      parse(ttl, kb, base, 'text/turtle', (err) => {
        if (err) return done(err)
        expect(kb.statements.length).to.equal(2)
        // Check that config.yaml was parsed correctly
        const configStmt = kb.statements.find(s => s.predicate.value === 'http://example.com/config')
        expect(configStmt).to.not.be.undefined
        expect(configStmt?.object.value).to.equal('http://example.com/files/config.yaml')
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
