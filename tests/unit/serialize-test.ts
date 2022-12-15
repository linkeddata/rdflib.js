import {expect} from 'chai'
import {graph, Literal, serialize, st, sym, lit} from '../../src/index';
import parse from '../../src/parse'

describe('serialize text/turtle', () => {
    describe('doubles', () => {
        it('literal from double value is taken as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                Literal.fromNumber(0.123),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123 .

`)
        });

        it('literal from number ending with .0 serializes to integer', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                Literal.fromNumber(123.0),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 123 .

`)
        });

        it('appends e0 for strings typed as xsd:double', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123e0 .

`)
        });

        it('adds .0 and e0 for strings containing an integer', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 123.0e0 .

`)
        });

        it('"e" notation is serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123e2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123e2 .

`)
        });

        it('"e" notation with negative exponent is serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123e-2 .

`)
        });

        it('capital "E" is serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123E2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123E2 .

`)
        });

        it('strings without dot but e notation are serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123e2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 123e2 .

`)
        });

        it('strings without dot but e notation with negative exponent are serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 123e-2 .

`)
        });



      it('use setPrefix to define a namespace prefix', () => {
        const doc = sym("https://doc.example");
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
        expect(result).to.equal(`@prefix : <#>.
@prefix schema: <http://schema.org/>.
@prefix example: <https://example.com/>.

example:subject schema:predicate 123e-2 .

`)
      });


      it('use setPrefix to override a graph prefix', () => {
        const doc = sym("https://doc.example");
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
        expect(result).to.equal(`@prefix : <#>.
@prefix schema: <http://schema.org/>.
@prefix example2: <https://example.com/>.

example2:subject schema:predicate 123e-2 .

`)
      });

      it('use setPrefix to override a default prefix', () => {
        const doc = sym("https://doc.example");
        const statement = st(
          sym('https://example.com/subject'),
          sym('http://schema.org/predicate'),
          lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
          doc
        )
        const kb = graph();
        kb.setPrefixForURI("example", "https://example.com/")
        kb.setPrefixForURI("schema2", "http://schema.org/")
        kb.add(statement)

        const result = kb.serialize(null, 'text/turtle', null);

        //const result = serialize(doc, kb, null, 'text/turtle')
        expect(result).to.equal(`@prefix schema2: <http://schema.org/>.
@prefix example: <https://example.com/>.

example:subject schema2:predicate 123e-2 .

`)
      });


    });

  describe('namespaces', () => {
    it('producing [prefix][colon] [dot]', () => {
      // when a symbol has a trailing slash, the automatic prefix production results in a prefixed symbol with no local name
      // if that symbol is the statement's object, it results in a colon immediately followed by a dot
      // some platforms choke if there's no whitespace between the colon and the dot - make sure there is.
      const doc = sym("https://doc.example");
      const statement = st(
        sym('https://example.com/subject'),
        sym('http://schema.org/predicate'),
        sym('https://example.com/object/'),
        doc
      )
      const kb = graph();
      kb.setPrefixForURI("example", "https://example.com/")
      kb.setPrefixForURI("schema2", "http://schema.org/")
      kb.add(statement)

      const result = serialize(doc, kb, null, 'text/turtle');

      //const result = serialize(doc, kb, null, 'text/turtle')
      expect(result).to.equal(`@prefix : <#>.
@prefix schema: <http://schema.org/>.
@prefix example: <https://example.com/>.
@prefix obj: <https://example.com/object/>.

example:subject schema:predicate obj: .

`)
    });
  });
})

describe('parse --> serialize', () => {
  describe('example 0', () => {
    const ttl0 = `@prefix : <#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix voc: <http://example.com/foo/vocab#>.

voc:building0 voc:bar 123, 78768; voc:connectsTo voc:building4 .

voc:building1 voc:created "2012-03-12"^^xsd:date; voc:length 145000.0e0 .

`
    const jsonld0 = `{
  "@context": {
    "voc": "http://example.com/foo/vocab#",
    "xsd": "http://www.w3.org/2001/XMLSchema#"
  },
  "@graph": [
    {
      "@id": "voc:building0",
      "voc:bar": [
        {
          "@type": "xsd:integer",
          "@value": "123"
        },
        {
          "@type": "xsd:integer",
          "@value": "78768"
        }
      ],
      "voc:connectsTo": {
        "@id": "voc:building4"
      }
    },
    {
      "@id": "voc:building1",
      "voc:created": {
        "@type": "xsd:date",
        "@value": "2012-03-12"
      },
      "voc:length": {
        "@type": "xsd:double",
        "@value": "145000"
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
        expect(store.statements).to.have.length(5)
      })

      it('serialize to ttl', () => {
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttl0)
      });
      it('serialize to jsonld', async () => {
        expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonld0)
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
        expect(store.statements).to.have.length(5)
      })

      it('serialize to ttl', () => {
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttl0)
      });
      it('serialize to jsonld', async () => {
        expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonld0)
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
    const jsonld1 = `{
  "@context": {
    "sioc": "http://rdfs.org/sioc/ns#",
    "pad": "http://www.w3.org/ns/pim/pad#",
    "xsd": "http://www.w3.org/2001/XMLSchema#"
  },
  "@id": "#id1443100844982",
  "sioc:content": "kasdfjsahdkfhkjhdkjsfhjkasdfkhjkajkdsajkhadsfkhjhjkdfajsdsafhjkdfhjksa",
  "pad:date": {
    "@type": "xsd:date",
    "@value": "2012-12-10"
  },
  "pad:dateTime": {
    "@type": "xsd:dateTime",
    "@value": "2012-12-25T23:59"
  },
  "pad:decimal": {
    "@type": "xsd:decimal",
    "@value": "12"
  },
  "pad:float": {
    "@type": "xsd:double",
    "@value": "3.141"
  },
  "pad:integer": {
    "@type": "xsd:integer",
    "@value": "0"
  },
  "pad:next": {
    "@id": "#id1443100912627"
  }
}`

    describe('source ttl', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/abc/def'
        const mimeType = 'text/turtle'
        const content = ttl1
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 7 statements', () => {
        expect(store.statements).to.have.length(7)
      })

      it('serialize to ttl', () => {
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttl1)
      });

      it('serialize to jsonld', async () => {
          expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonld1)
      })
    })

    describe('source jsonld', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = jsonld1
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 7 statements', () => {
        expect(store.statements).to.have.length(7)
      })

      it('serialize to ttl', () => {
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttl1)
      });

      it('serialize to jsonld', async () => {
          expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonld1)
      })
    })
  })

  describe('collections', () => {
    const ttlCollection = `@prefix : </#>.
@prefix n: <https://example.org/ns#>.
@prefix ex: <http://example.com/>.

:me n:listProp ( "list item 0" 1 ex:2 ).

`

    const jsonldCollection = `{
  "@context": {
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "ex": "http://example.com/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "n": "https://example.org/ns#"
  },
  "@graph": [
    {
      "@id": "_:n1",
      "rdf:first": {
        "@id": "ex:2"
      },
      "rdf:rest": {
        "@id": "rdf:nill"
      }
    },
    {
      "@id": "_:n2",
      "rdf:first": {
        "@type": "xsd:integer",
        "@value": "1"
      },
      "rdf:rest": {
        "@id": "_:n1"
      }
    },
    {
      "@id": "_:n3",
      "rdf:first": "list item 0",
      "rdf:rest": {
        "@id": "_:n2"
      }
    },
    {
      "@id": "/#me",
      "n:listProp": {
        "@id": "_:n3"
      }
    }
  ]
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
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttlCollection)
      });
      it('serialize to jsonld', async () => {
        console.log(await serialize(null, store, base, 'application/ld+json'))
        let result = await serialize(null, store, base, 'application/ld+json')
        expect(result).to.include('"list item 0"')
        expect(result).to.include('"@value": "1"')
        expect(result).to.include('"@id": "ex:2"')
        // expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonldCollection)
      })
    })

    describe.skip('collections - source jsonld', () => {
      let store, base
      before(done => {
        base = 'https://www.example.org/'
        const mimeType = 'application/ld+json'
        const content = jsonldCollection
        store = graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 7 statements', () => {
        expect(store.statements).to.have.length(7)
      })

      it('serialize to ttl', () => {
        console.log(serialize(null, store, base, 'text/turtle'))
        expect(serialize(null, store, base, 'text/turtle')).to.eql(ttlCollection)
      });
      it('serialize to jsonld', async () => {
        console.log(await serialize(null, store, base, 'application/ld+json'))
        expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonldCollection)
      })
    })
  })
})
