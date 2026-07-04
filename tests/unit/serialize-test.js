import {expect} from 'chai'
import {graph, Literal, serialize, st, sym, lit} from '../../src/index'
import parse from '../../src/parse'

describe('serialize text/turtle', () => {
    describe('doubles', () => {
        it('literal from double value is taken as-is', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                Literal.fromNumber(0.123),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123 .

`)
        })

        it('literal from number ending with .0 serializes to integer', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                Literal.fromNumber(123.0),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 123 .

`)
        })

        it('appends e0 for strings typed as xsd:double', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123e0 .

`)
        })

        it('adds .0 and e0 for strings containing an integer', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 123.0e0 .

`)
        })

        it('"e" notation is serialized as-is', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123e2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123e2 .

`)
        })

        it('"e" notation with negative exponent is serialized as-is', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123e-2 .

`)
        })

        it('capital "E" is serialized as-is', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123E2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123E2 .

`)
        })

        it('strings without dot but e notation are serialized as-is', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123e2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 123e2 .

`)
        })

        it('strings without dot but e notation with negative exponent are serialized as-is', () => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph()
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 123e-2 .

`)
        })



      it('use setPrefix to define a namespace prefix', () => {
        const doc = sym("https://example.net/doc")
        const statement = st(
          sym('https://example.com/subject'),
          sym('http://schema.org/predicate'),
          lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
          doc
        )
        const kb = graph()
        kb.setPrefixForURI("example", "https://example.com/")
        kb.add(statement)
        const result = serialize(doc, kb, null, 'text/turtle')
        expect(result).to.equal(`@prefix : </doc#>.
@prefix schema: <http://schema.org/>.
@prefix example: <https://example.com/>.

example:subject schema:predicate 123e-2 .

`)
      })


      it('use setPrefix to override a graph prefix', () => {
        const doc = sym("https://example.net/doc")
        const statement = st(
          sym('https://example.com/subject'),
          sym('http://schema.org/predicate'),
          lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
          doc
        )
        const kb = graph()
        kb.setPrefixForURI("example", "https://example.com/")

        kb.setPrefixForURI("example2", "https://example.com/")
        kb.add(statement)
        const result = serialize(doc, kb, null, 'text/turtle')
        expect(result).to.equal(`@prefix : </doc#>.
@prefix schema: <http://schema.org/>.
@prefix example2: <https://example.com/>.

example2:subject schema:predicate 123e-2 .

`)
      })

      it('use setPrefix to override a default prefix', () => {
        const doc = sym("https://example.net/doc")
        const statement = st(
          sym('https://example.com/subject'),
          sym('http://schema.org/predicate'),
          lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
          doc
        )
        const kb = graph()
        kb.setPrefixForURI("example", "https://example.com/")
        kb.setPrefixForURI("schema2", "http://schema.org/")
        kb.add(statement)

        const result = kb.serialize(null, 'text/turtle', null)

        //const result = serialize(doc, kb, null, 'text/turtle')
        expect(result).to.equal(`@prefix schema2: <http://schema.org/>.
@prefix example: <https://example.com/>.

example:subject schema2:predicate 123e-2 .

`)
      })


    })

    describe('booleans', () => {
        const serializeBoolean = (lexicalForm) => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit(lexicalForm, undefined, sym("http://www.w3.org/2001/XMLSchema#boolean")),
                doc
            )
            const kb = graph()
            kb.add(statement)
            return serialize(doc, kb, null, 'text/turtle')
        }
        const expected = (token) => `@prefix : </doc#>.

<https://subject.example> <https://predicate.example> ${token}.

`

        it('lexical form "true" serializes to true', () => {
            expect(serializeBoolean('true')).to.equal(expected('true'))
        })

        it('lexical form "false" serializes to false', () => {
            expect(serializeBoolean('false')).to.equal(expected('false'))
        })

        it('lexical form "1" serializes to true', () => {
            expect(serializeBoolean('1')).to.equal(expected('true'))
        })

        it('lexical form "0" serializes to false', () => {
            expect(serializeBoolean('0')).to.equal(expected('false'))
        })

        // Invalid lexical forms must fall through to the verbose form so no data is lost
        const expectedVerbose = (token) => `@prefix : </doc#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<https://subject.example> <https://predicate.example> ${token}.

`

        it('invalid lexical form "yes" serializes verbosely', () => {
            expect(serializeBoolean('yes')).to.equal(expectedVerbose('"yes"^^xsd:boolean'))
        })

        it('invalid lexical form "TRUE" serializes verbosely', () => {
            expect(serializeBoolean('TRUE')).to.equal(expectedVerbose('"TRUE"^^xsd:boolean'))
        })

        it('invalid lexical form "2" serializes verbosely', () => {
            expect(serializeBoolean('2')).to.equal(expectedVerbose('"2"^^xsd:boolean'))
        })

        it('invalid empty lexical form serializes verbosely', () => {
            expect(serializeBoolean('')).to.equal(expectedVerbose('""^^xsd:boolean'))
        })

        it('invalid lexical form "01" serializes verbosely', () => {
            expect(serializeBoolean('01')).to.equal(expectedVerbose('"01"^^xsd:boolean'))
        })
    })

    describe('typed literals with valid and invalid lexical forms', () => {
        const serializeTyped = (lexicalForm, datatype) => {
            const doc = sym("https://example.net/doc")
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit(lexicalForm, undefined, sym(`http://www.w3.org/2001/XMLSchema#${datatype}`)),
                doc
            )
            const kb = graph()
            kb.add(statement)
            return serialize(doc, kb, null, 'text/turtle')
        }
        const expectedNative = (token) => `@prefix : </doc#>.

<https://subject.example> <https://predicate.example> ${token} .

`
        const expectedVerbose = (token) => `@prefix : </doc#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<https://subject.example> <https://predicate.example> ${token}.

`

        describe('integers', () => {
            it('valid lexical forms serialize natively', () => {
                expect(serializeTyped('42', 'integer')).to.equal(expectedNative('42'))
                expect(serializeTyped('-7', 'integer')).to.equal(expectedNative('-7'))
                expect(serializeTyped('+3', 'integer')).to.equal(expectedNative('+3'))
            })

            it('invalid lexical forms serialize verbosely', () => {
                expect(serializeTyped('abc', 'integer')).to.equal(expectedVerbose('"abc"^^xsd:integer'))
                expect(serializeTyped('1.5', 'integer')).to.equal(expectedVerbose('"1.5"^^xsd:integer'))
                expect(serializeTyped('', 'integer')).to.equal(expectedVerbose('""^^xsd:integer'))
                expect(serializeTyped('0x10', 'integer')).to.equal(expectedVerbose('"0x10"^^xsd:integer'))
            })
        })

        describe('decimals', () => {
            it('valid lexical forms serialize natively', () => {
                expect(serializeTyped('3.14', 'decimal')).to.equal(expectedNative('3.14'))
                expect(serializeTyped('-0.5', 'decimal')).to.equal(expectedNative('-0.5'))
                expect(serializeTyped('.5', 'decimal')).to.equal(expectedNative('.5'))
                expect(serializeTyped('5', 'decimal')).to.equal(expectedNative('5.0'))
                expect(serializeTyped('2.', 'decimal')).to.equal(expectedNative('2.0'))
            })

            it('invalid lexical forms serialize verbosely', () => {
                expect(serializeTyped('1.2.3', 'decimal')).to.equal(expectedVerbose('"1.2.3"^^xsd:decimal'))
                expect(serializeTyped('abc', 'decimal')).to.equal(expectedVerbose('"abc"^^xsd:decimal'))
                expect(serializeTyped('.', 'decimal')).to.equal(expectedVerbose('"."^^xsd:decimal'))
                expect(serializeTyped('1e5', 'decimal')).to.equal(expectedVerbose('"1e5"^^xsd:decimal'))
            })
        })

        describe('doubles', () => {
            it('valid lexical forms serialize natively', () => {
                expect(serializeTyped('1.0e10', 'double')).to.equal(expectedNative('1.0e10'))
                expect(serializeTyped('1E5', 'double')).to.equal(expectedNative('1E5'))
                expect(serializeTyped('-3.14e-2', 'double')).to.equal(expectedNative('-3.14e-2'))
            })

            it('valid xsd:double lexical forms without a native Turtle form serialize verbosely', () => {
                // INF, -INF and NaN are valid xsd:double values but not valid Turtle DOUBLE tokens
                expect(serializeTyped('NaN', 'double')).to.equal(expectedVerbose('"NaN"^^xsd:double'))
                expect(serializeTyped('INF', 'double')).to.equal(expectedVerbose('"INF"^^xsd:double'))
                expect(serializeTyped('-INF', 'double')).to.equal(expectedVerbose('"-INF"^^xsd:double'))
            })

            it('invalid lexical forms serialize verbosely', () => {
                expect(serializeTyped('abc', 'double')).to.equal(expectedVerbose('"abc"^^xsd:double'))
                expect(serializeTyped('1.2.3', 'double')).to.equal(expectedVerbose('"1.2.3"^^xsd:double'))
            })
        })

        describe('invalid lexical forms round-trip without data loss', () => {
            const roundTrip = (lexicalForm, datatype) => {
                const doc = sym("https://example.net/doc")
                const ttl = serializeTyped(lexicalForm, datatype)
                const kb = graph()
                parse(ttl, kb, doc.uri, 'text/turtle')
                return kb.any(sym('https://subject.example'), sym('https://predicate.example'))
            }
            const cases = {
                boolean: ['yes', 'TRUE', '2', '', '01'],
                integer: ['abc', '1.5', '', '0x10'],
                decimal: ['1.2.3', 'abc', '.', '1e5'],
                double: ['NaN', 'INF', '-INF', 'abc', '1.2.3'],
            }
            Object.entries(cases).forEach(([datatype, lexicalForms]) => {
                lexicalForms.forEach(lexicalForm => {
                    it(`preserves "${lexicalForm}"^^xsd:${datatype}`, () => {
                        const recovered = roundTrip(lexicalForm, datatype)
                        expect(recovered.value).to.equal(lexicalForm)
                        expect(recovered.datatype.uri).to.equal(`http://www.w3.org/2001/XMLSchema#${datatype}`)
                    })
                })
            })
        })
    })

  describe('namespaces', () => {
    it('producing [prefix][colon] [dot]', () => {
      // when a symbol has a trailing slash, the automatic prefix production results in a prefixed symbol with no local name
      // if that symbol is the statement's object, it results in a colon immediately followed by a dot
      // some platforms choke if there's no whitespace between the colon and the dot - make sure there is.
      const doc = sym("https://example.net/doc")
      const statement = st(
        sym('https://example.com/subject'),
        sym('http://schema.org/predicate'),
        sym('https://example.com/object/'),
        doc
      )
      const kb = graph()
      kb.setPrefixForURI("example", "https://example.com/")
      kb.setPrefixForURI("schema2", "http://schema.org/")
      kb.add(statement)

      const result = serialize(doc, kb, null, 'text/turtle')

      //const result = serialize(doc, kb, null, 'text/turtle')
      expect(result).to.equal(`@prefix : </doc#>.
@prefix schema: <http://schema.org/>.
@prefix example: <https://example.com/>.
@prefix obj: <https://example.com/object/>.

example:subject schema:predicate obj: .

`)
    })
  })
})

describe('parse --> serialize', () => {
  describe('example 0', () => {
    const ttl0 = `@prefix : <#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix vocab: <http://example.com/foo/vocab#>.

vocab:building0 vocab:bar 123, 78768; vocab:connectsTo vocab:building4 .

vocab:building1 vocab:created "2012-03-12"^^xsd:date; vocab:length 145000.0e0 .

`

    const jsonld0 = `{
  "@context": {
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "vocab": "http://example.com/foo/vocab#"
  },
  "@graph": [
    {
      "@id": "vocab:building0",
      "vocab:bar": [
        123,
        78768
      ],
      "vocab:connectsTo": {
        "@id": "vocab:building4"
      }
    },
    {
      "@id": "vocab:building1",
      "vocab:created": {
        "@value": "2012-03-12",
        "@type": "xsd:date"
      },
      "vocab:length": {
        "@value": "145000.0e0",
        "@type": "http://www.w3.org/2001/XMLSchema#double"
      }
    }
  ]
}`

    describe('source ttl', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/abc/def'
        const mimeType = 'text/turtle'
        const content = ttl0
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 5 statements', () => {
        // console.log(store.statements)
        expect(store.statements).to.have.length(5)
      })

      it('serialize to ttl', () => {
        // console.log(serialize(null, store, base, 'text/turtle'))
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttl0)
      })
      it('serialize to jsonld', async () => {
        // console.log(serialize(null, store, base, 'application/ld+json'))
        expect(await serialize(null, store, null, 'application/ld+json')).to.eql(jsonld0)
      })
    })

    describe('source jsonld', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = jsonld0
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 5 statements', () => {
        // console.log(store.statements)
        expect(store.statements).to.have.length(5)
      })

      it('serialize to ttl', () => {
        // console.log(serialize(null, store, base, 'text/turtle'))
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttl0)
      })
      it('serialize to jsonld', async () => {
        // console.log(serialize(null, store, base, 'application/ld+json'))
        expect(await serialize(null, store, null, 'application/ld+json')).to.eql(jsonld0)
      })
    })
  })

  describe('example 1', () => {
    const ttl1 = `@prefix : <#>.
@prefix pad: <http://www.w3.org/ns/pim/pad#>.
@prefix sioc: <http://rdfs.org/sioc/ns#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

:id1443100844982
    sioc:content
    "kasdfjsahdkfhkjhdkjsfhjkasdfkhjkajkdsajkhadsfkhjhjkdfajsdsafhjkdfhjksa";
    pad:date "2012-12-10"^^xsd:date;
    pad:dateTime "2012-12-25T23:59"^^xsd:dateTime;
    pad:decimal 12.0;
    pad:float 3.141e0;
    pad:integer 0;
    pad:next :id1443100912627 .
`

    const jsonld1 = (prefix) => `{
  "@context": {
    "pad": "http://www.w3.org/ns/pim/pad#",
    "sioc": "http://rdfs.org/sioc/ns#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "${prefix}": "https://www.example.org/abc/def#"
  },
  "@id": "${prefix}:id1443100844982",
  "sioc:content": "kasdfjsahdkfhkjhdkjsfhjkasdfkhjkajkdsajkhadsfkhjhjkdfajsdsafhjkdfhjksa",
  "pad:date": {
    "@value": "2012-12-10",
    "@type": "xsd:date"
  },
  "pad:dateTime": {
    "@value": "2012-12-25T23:59",
    "@type": "xsd:dateTime"
  },
  "pad:decimal": {
    "@value": "12.0",
    "@type": "http://www.w3.org/2001/XMLSchema#decimal"
  },
  "pad:float": {
    "@value": "3.141e0",
    "@type": "http://www.w3.org/2001/XMLSchema#double"
  },
  "pad:integer": 0,
  "pad:next": {
    "@id": "${prefix}:id1443100912627"
  }
}`

    const xml1 = `<rdf:RDF
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns:sioc="http://rdfs.org/sioc/ns#"
 xmlns:pad="http://www.w3.org/ns/pim/pad#">
    <rdf:Description rdf:about="https://www.example.org/abc/def#id1443100844982">
        <sioc:content>kasdfjsahdkfhkjhdkjsfhjkasdfkhjkajkdsajkhadsfkhjhjkdfajsdsafhjkdfhjksa</sioc:content>
        <pad:date rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2012-12-10</pad:date>
        <pad:dateTime rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">2012-12-25T23:59</pad:dateTime>
        <pad:decimal rdf:datatype="http://www.w3.org/2001/XMLSchema#decimal">12</pad:decimal>
        <pad:float rdf:datatype="http://www.w3.org/2001/XMLSchema#double">3.141</pad:float>
        <pad:integer rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">0</pad:integer>
        <pad:next rdf:resource="https://www.example.org/abc/def#id1443100912627"/>
    </rdf:Description>
</rdf:RDF>
`
    describe('source ttl', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/abc/def'
        const mimeType = 'text/turtle'
        const content = ttl1
        store = graph()
        parse(content, store, base, mimeType, done)
        // console.log(serialize(null, store, base, 'application/rdf+xml'))
        // console.log(serialize(null, store, undefined, 'application/rdf+xml'))
      })

      it('store contains 7 statements', () => {
        expect(store.statements).to.have.length(7)
      })

      it('serialize to ttl', () => {
        // console.log(serialize(null, store, base, 'application/rdf+xml'))
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttl1)
      })

      it('serialize to jsonld', async () => {
        expect(await serialize(null, store, null, 'application/ld+json')).to.eql(jsonld1('def'))
        // expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonld1('0'))
        // expect(await serialize(store.sym(base), store, null, 'application/ld+json')).to.eql(jsonld1('0'))
        // expect(await serialize(store.sym(base), store, base, 'application/ld+json')).to.eql(jsonld1('0'))
      })

      it('serialize to xml', () => {
        // console.log(serialize(null, store, null, 'application/rdf+xml'))
        expect(serialize(null, store, null, 'application/rdf+xml')).to.eql(xml1)
        // expect(serialize(null, store, base, 'application/rdf+xml')).to.eql(xml1)
      })
    })

    describe('source jsonld', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = jsonld1('0')
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 7 statements', () => {
        expect(store.statements).to.have.length(7)
      })

      it('serialize to ttl', () => {
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttl1)
      })

      it('serialize to jsonld', async () => {
          expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonld1('def'))
      })
    })
  })

  describe('collections', () => {
    const ttlCollection = `@prefix : </#>.
@prefix n: <https://example.org/ns#>.
@prefix exa: <http://example.com/>.

:me n:listProp ( "list item 0" 1 exa:2 ).

`    
    const jsonldCollection0 = `{
  "@context": {
    "n": "https://example.org/ns#",
    "exa": "http://example.com/",
    "n0": "https://www.example.org/#"
  },
  "@id": "n0:me",
  "n:listProp": {
    "@list": [
      "list item 0",
      1,
      {
        "@id": "exa:2"
      }
    ]
  }
}`
const jsonldCollection1 = `{
  "@context": {
    "n0": "https://www.example.org/#",
    "n": "https://example.org/ns#",
    "exa": "http://example.com/"
  },
  "@id": "n0:me",
  "n:listProp": {
    "@list": [
      "list item 0",
      1,
      {
        "@id": "exa:2"
      }
    ]
  }
}`

    describe('collections - source ttl', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/'
        const mimeType = 'text/turtle'
        const content = ttlCollection
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 1 statement', () => {
        expect(store.statements).to.have.length(1)
      })

      it('serialize to ttl', () => {
        // console.log(serialize(null, store, base, 'text/turtle'))
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttlCollection)
      })
      it('serialize to jsonld', async () => {
        // console.log(await serialize(null, store, base, 'application/ld+json'))
        expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonldCollection0)
      })
    })

    describe('collections - source jsonld', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/'
        const mimeType = 'application/ld+json'
        const content = jsonldCollection0
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 1 statement with object collection', () => {
        expect(store.statements).to.have.length(1)
      })

      it('serialize to ttl', () => {
        // console.log(serialize(null, store, base, 'text/turtle'))
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttlCollection)
      })
      it('serialize to jsonld', async () => {
        // console.log(await serialize(null, store, base, 'application/ld+json'))
        expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonldCollection1)
      })
    })
  })

  describe('encoded URIs', () => {
    let srcStore
    const base = 'http://www.example.com/'

    before(() => {
      const srcTtl = '<http://example.com#myid> <http://example.com#my%20property> "myvalue" .'
      srcStore = graph()
      parse(srcTtl, srcStore, base, 'text/turtle')
    })

    it("convert to ttl without base", async () => {
      const res = await serialize(null, srcStore, undefined, 'text/turtle')
      expect(res?.toString()).to.contain("%20")
      expect(res?.toString()).not.to.contain("%2520")
    })

    it("convert to ttl with base", async () => {
      const res = await serialize(null, srcStore, base, 'text/turtle')
      expect(res?.toString()).to.contain("%20")
      expect(res?.toString()).not.to.contain("%2520")
    })
  })
})
