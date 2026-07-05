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

  describe('target', () => {
    // https://github.com/linkeddata/rdflib.js/issues/450
    it('serializes all statements when target is undefined and a base is given', () => {
      const statement = st(
        sym('https://subject.example'),
        sym('https://predicate.example'),
        lit('value'),
        sym('https://example.net/doc')
      )
      const kb = graph()
      kb.add(statement)

      const result = serialize(undefined, kb, 'https://example.net/doc', 'text/turtle')

      expect(result).to.equal(`@prefix : </doc#>.

<https://subject.example> <https://predicate.example> "value".

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
      it('serialize to n-triples terminates the list with rdf:nil', () => {
        // https://github.com/linkeddata/rdflib.js/issues/750
        const result = serialize(null, store, base, 'application/n-triples')
        expect(result).to.contain('<http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>')
        expect(result).not.to.contain('<http://www.w3.org/1999/02/22-rdf-syntax-ns#nill>')
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

// Term-level correctness of the Turtle serializer: datatype abbreviation
// (#147/#619/#772) and string escaping per the Turtle grammar
describe('serialize text/turtle - term-level correctness', () => {
  const XSD = (local) => sym('http://www.w3.org/2001/XMLSchema#' + local)
  const S = sym('http://example.org/s')
  const P = sym('http://example.org/p')
  const base = 'http://example.org/'
  const doc = sym(base + 'doc')

  // Serialize a single `s p object` statement and return the Turtle string.
  const ttlOf = (object) => {
    const kb = graph()
    kb.add(st(S, P, object, doc))
    return serialize(doc, kb, base, 'text/turtle')
  }
  // Serialize then re-parse; returns the parsed-back object term (round-trip).
  const roundTrip = (object) => {
    const ttl = ttlOf(object)
    const kb2 = graph()
    parse(ttl, kb2, base, 'text/turtle') // throws if the output is invalid Turtle
    const back = kb2.statementsMatching(S, P, null)
    return { ttl, obj: back.length === 1 ? back[0].object : null }
  }
  const truth = (v) => v === 'true' || v === '1'

  describe('xsd:boolean (#147/#619/#772)', () => {
    it('serializes canonical "true" as true, not false (#772)', () => {
      const ttl = ttlOf(lit('true', null, XSD('boolean')))
      expect(ttl).to.match(/\btrue\b/)
      expect(ttl).to.not.match(/\bfalse\b/)
    })

    it('serializes "false", "1", "0" to the correct native token', () => {
      expect(ttlOf(lit('false', null, XSD('boolean')))).to.match(/\bfalse\b/)
      expect(ttlOf(lit('1', null, XSD('boolean')))).to.match(/\btrue\b/)
      expect(ttlOf(lit('0', null, XSD('boolean')))).to.match(/\bfalse\b/)
    })

    it('preserves the truth value through a round-trip for every valid form', () => {
      for (const form of ['true', 'false', '1', '0']) {
        const { obj } = roundTrip(lit(form, null, XSD('boolean')))
        expect(obj.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#boolean')
        expect(truth(obj.value)).to.equal(truth(form))
      }
    })

    it('preserves invalid boolean forms verbatim instead of coercing to false', () => {
      for (const bad of ['yes', 'TRUE', '2', '']) {
        const { ttl, obj } = roundTrip(lit(bad, null, XSD('boolean')))
        expect(ttl).to.contain('^^xsd:boolean')
        expect(obj.value).to.equal(bad)
        expect(obj.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#boolean')
      }
    })
  })

  describe('xsd:integer / xsd:decimal / xsd:double', () => {
    it('abbreviates valid numeric forms exactly as before', () => {
      expect(ttlOf(lit('42', null, XSD('integer')))).to.match(/\s42\s/)
      expect(ttlOf(lit('12.0', null, XSD('decimal')))).to.match(/\s12\.0\s/)
      expect(ttlOf(lit('0.123', null, XSD('double')))).to.match(/\s0\.123e0\s/)
    })

    it('completes the Turtle DECIMAL fraction ("5" -> 5.0, "2." -> 2.0)', () => {
      expect(ttlOf(lit('5', null, XSD('decimal')))).to.match(/\s5\.0\s/)
      expect(ttlOf(lit('2.', null, XSD('decimal')))).to.match(/\s2\.0\s/)
    })

    it('never emits an invalid Turtle token for invalid lexical forms', () => {
      const cases = [
        ['abc', 'integer'],
        ['1.2.3', 'decimal'],
        ['NaN', 'double'],
        ['INF', 'double'],
        ['-INF', 'double'],
      ]
      for (const [value, dt] of cases) {
        const { ttl, obj } = roundTrip(lit(value, null, XSD(dt)))
        expect(ttl, `${value}^^xsd:${dt}`).to.contain('"' + value + '"^^xsd:' + dt)
        expect(obj.value).to.equal(value)
        expect(obj.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#' + dt)
      }
    })
  })

  describe('string escaping', () => {
    it('escapes U+000B as \\u000b, never the invalid \\v escape', () => {
      const { ttl, obj } = roundTrip(lit('a' + String.fromCharCode(0x0b) + 'b', null, XSD('string')))
      expect(ttl).to.contain('\\u000b')
      expect(ttl).to.not.contain('\\v')
      expect(obj.value).to.equal('a' + String.fromCharCode(0x0b) + 'b')
    })

    it('escapes control characters that have no named Turtle escape', () => {
      const raw = 'x' + String.fromCharCode(0x01) + String.fromCharCode(0x1f) + 'y'
      const { ttl, obj } = roundTrip(lit(raw, null, XSD('string')))
      expect(ttl).to.contain('\\u0001')
      expect(ttl).to.contain('\\u001f')
      expect(obj.value).to.equal(raw)
    })
  })

  describe('a graph of invalid-and-valid literals', () => {
    it('always serializes to valid, re-parseable Turtle with no value loss', () => {
      const kb = graph()
      const objects = [
        lit('true', null, XSD('boolean')),
        lit('yes', null, XSD('boolean')),
        lit('abc', null, XSD('integer')),
        lit('1.2.3', null, XSD('decimal')),
        lit('NaN', null, XSD('double')),
        lit('42', null, XSD('integer')),
      ]
      objects.forEach((o, i) => kb.add(st(S, sym(base + 'p' + i), o, doc)))
      const ttl = serialize(doc, kb, base, 'text/turtle')
      const kb2 = graph()
      expect(() => parse(ttl, kb2, base, 'text/turtle')).to.not.throw()
      expect(kb2.statements).to.have.length(objects.length)
    })
  })
})

// JSON-LD serialization routes through the Turtle serializer (#619)
describe('serialize application/ld+json - boolean value (#619)', () => {
  const XSD = (local) => sym('http://www.w3.org/2001/XMLSchema#' + local)
  it('keeps xsd:boolean "true" as true (not false)', async () => {
    const kb = graph()
    kb.add(st(sym('http://ex/s'), sym('http://ex/p'), lit('true', null, XSD('boolean')), sym('http://ex/doc')))
    const jsonld = await serialize(sym('http://ex/doc'), kb, 'http://ex/', 'application/ld+json')
    expect(JSON.parse(jsonld)['http://ex/p']).to.equal(true)
  })
})
