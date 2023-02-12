import {expect} from 'chai'
import {graph, Literal, serialize, st, sym, lit} from '../../src/index';
import parse from '../../src/parse'

describe('serialize text/turtle', () => {
    describe('doubles', () => {
        it('literal from double value is taken as-is', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                Literal.fromNumber(0.123),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123 .

`)
        });

        it('literal from number ending with .0 serializes to integer', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                Literal.fromNumber(123.0),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 123 .

`)
        });

        it('appends e0 for strings typed as xsd:double', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123e0 .

`)
        });

        it('adds .0 and e0 for strings containing an integer', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 123.0e0 .

`)
        });

        it('"e" notation is serialized as-is', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123e2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123e2 .

`)
        });

        it('"e" notation with negative exponent is serialized as-is', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123e-2 .

`)
        });

        it('capital "E" is serialized as-is', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123E2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 0.123E2 .

`)
        });

        it('strings without dot but e notation are serialized as-is', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123e2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 123e2 .

`)
        });

        it('strings without dot but e notation with negative exponent are serialized as-is', () => {
            const doc = sym("https://example.net/doc");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> 123e-2 .

`)
        });



      it('use setPrefix to define a namespace prefix', () => {
        const doc = sym("https://example.net/doc");
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
      });


      it('use setPrefix to override a graph prefix', () => {
        const doc = sym("https://example.net/doc");
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
      });

      it('use setPrefix to override a default prefix', () => {
        const doc = sym("https://example.net/doc");
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
      const doc = sym("https://example.net/doc");
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
      expect(result).to.equal(`@prefix : </doc#>.
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
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "voc": "http://example.com/foo/vocab#"
  },
  "@graph": [
    {
      "@id": "voc:building0",
      "voc:bar": [
        123,
        78768
      ],
      "voc:connectsTo": {
        "@id": "voc:building4"
      }
    },
    {
      "@id": "voc:building1",
      "voc:created": {
        "@value": "2012-03-12",
        "@type": "xsd:date"
      },
      "voc:length": {
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
      });
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
      });
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
        expect(await serialize(null, store, null, 'application/ld+json')).to.eql(jsonld1('def'))
        // expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonld1('0'))
        // expect(await serialize(store.sym(base), store, null, 'application/ld+json')).to.eql(jsonld1('0'))
        // expect(await serialize(store.sym(base), store, base, 'application/ld+json')).to.eql(jsonld1('0'))
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
      });

      it('serialize to jsonld', async () => {
          expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonld1('def'))
      })
    })
  })

  describe('collections', () => {
    const ttlCollection = `@prefix : </#>.
@prefix n: <https://example.org/ns#>.
@prefix ex: <http://example.com/>.

:me n:listProp ( "list item 0" 1 ex:2 ).

`    
    const jsonldCollection0 = `{
  "@context": {
    "n": "https://example.org/ns#",
    "ex": "http://example.com/",
    "n0": "https://www.example.org/#"
  },
  "@id": "n0:me",
  "n:listProp": {
    "@list": [
      "list item 0",
      1,
      {
        "@id": "ex:2"
      }
    ]
  }
}`
const jsonldCollection1 = `{
  "@context": {
    "n0": "https://www.example.org/#",
    "n": "https://example.org/ns#",
    "ex": "http://example.com/"
  },
  "@id": "n0:me",
  "n:listProp": {
    "@list": [
      "list item 0",
      1,
      {
        "@id": "ex:2"
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
      });
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
      });
      it('serialize to jsonld', async () => {
        // console.log(await serialize(null, store, base, 'application/ld+json'))
        expect(await serialize(null, store, base, 'application/ld+json')).to.eql(jsonldCollection1)
      })
    })
  })
})
