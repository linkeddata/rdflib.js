import {expect} from 'chai'

import parse from '../../src/parse'
import CanonicalDataFactory from '../../src/factories/canonical-data-factory'
import defaultXSD from '../../src/xsd'
import DataFactory from '../../src/factories/rdflib-data-factory'
import serialize from '../../src/serialize'

const prefixes = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix schema: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <https://example.com/ont#>.
`

function gist(store, doc) {
  const text = showDoc(store, doc)
  const short = text.replace(/@prefix [^>]*> *\./g, '')
  const sweet = short.replace(/\n+/g, '\n')
  return sweet
}
function showDoc(store, doc) {
  const text = serialize(doc, store, doc.uri)
  return text
}
function squash(s) {
  const white = s.replace(/[ \t]+/g, ' ')
  return white.trim()
}
function dumpStore(store) {
  const text = store.statements.map(st => st.toNT()).join('\n')
  return text
}

describe('Parse', () => {
  describe('ttl', () => {
    describe('literals', () => {
      it('parses a language tag ', () => {

        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let content = '<http://www.wikidata.org/entity/Q328> <http://www.w3.org/2000/01/rdf-schema#label> "ангельская Вікіпэдыя"@be-x-old .'
        parse(content, store, base, mimeType)
        expect(store.statements[0].object.lang).to.eql('be-x-old')
      })
    }) // literals

    describe('collections', () => {
      describe('explicit: with collection term support', () => {
        it('creates a Collection object', () => {

        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let content = '<http://www.wikidata.org/entity/Q328> <http://www.w3.org/2000/01/rdf-schema#label> ( "0" "1"^^<http://www.w3.org/2001/XMLSchema#number> <http://example.org/> ) .'
        parse(content, store, base, mimeType)
        expect(store.statements[0].object.termType).to.eql('Collection')
      })

      it('creates a first/rest description', () => {

        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph(undefined, { rdfFactory: CanonicalDataFactory })
        let content = '<http://www.wikidata.org/entity/Q328> <http://www.w3.org/2000/01/rdf-schema#label> ( "0" "1"^^<http://www.w3.org/2001/XMLSchema#number> <http://example.org/> ) .'
        parse(content, store, base, mimeType)
        expect(store.statements.length).to.eql(1 + 3 * 2)

        expect(store.statements[0].predicate.value).to.eql('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(store.statements[0].object.value).to.eql('0')

        expect(store.statements[2].predicate.value).to.eql('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(store.statements[2].object.value).to.eql('1')
        expect(store.statements[2].object.datatype.value).to.eql('http://www.w3.org/2001/XMLSchema#number')

        expect(store.statements[4].predicate.value).to.eql('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(store.statements[4].object.termType).to.eql('NamedNode')
        expect(store.statements[4].object.value).to.eql('http://example.org/')

        expect(store.statements[6].predicate.value).to.eql('http://www.w3.org/2000/01/rdf-schema#label')
        expect(store.statements[6].object.termType).to.eql('BlankNode')
        expect(store.statements[6].object.value).to.eql(store.statements[0].subject.value)
      })
    }) // explict

      describe('reified, with collection term support from first/rest', () => {
        it('creates a Collection object', () => {

          let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
          let mimeType = 'text/turtle'
          let store = DataFactory.graph()
          let content = prefixes + '<http://www.wikidata.org/entity/Q328> schema:label [ rdf:first 1; rdf:rest [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ]]].'
          parse(content, store, base, mimeType)
          expect(store.statements[0].object.termType).to.eql('Collection')
          expect(squash(gist(store, store.sym(base)))).to.eql(squash(`ent:Q328 rdfs:label ( 1 2 3 ).`))

        })

        it('creates a first/rest description from first/rest', () => {

        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph(undefined, { rdfFactory: CanonicalDataFactory })
        const doc = store.sym(base)
        const text = `ent:Q328
              rdfs:label
                      [
                          rdf:first 1;
                          rdf:rest
                          [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ] ]
                      ].

        `

        let content = prefixes + '<http://www.wikidata.org/entity/Q328> schema:label [ rdf:first 1; rdf:rest [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ]]].'
        parse(content, store, base, mimeType)
        expect(store.statements.length).to.eql(1 + 3 * 2)

        expect(squash(gist(store, doc))).to.eql(squash(
`ent:Q328
      rdfs:label
              [
                  rdf:first 1;
                  rdf:rest
                  [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ] ]
              ].

`))
/*      // replaced by above expect, due to unpredictable order in store.statements
        expect(store.statements[0].predicate.value).to.eql('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(store.statements[0].object.value).to.eql('1')

        expect(store.statements[2].predicate.value).to.eql('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(store.statements[2].object.value).to.eql('3')
        expect(store.statements[2].object.datatype.value).to.eql('http://www.w3.org/2001/XMLSchema#integer')

        expect(store.statements[4].predicate.value).to.eql('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(store.statements[4].object.termType).to.eql('NamedNode')
        expect(store.statements[4].object.value).to.eql('http://example.org/')

        expect(store.statements[6].predicate.value).to.eql('http://www.w3.org/2000/01/rdf-schema#label')
        expect(store.statements[6].object.termType).to.eql('BlankNode')
        expect(store.statements[6].object.value).to.eql(store.statements[0].subject.value)
        */
      }) // test
    }) // reified
  }) //collections


  describe('ttl with charset', () => {
    describe('literals', () => {
      it('handles language subtags', () => {
        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle;charset=UTF-8'
        let store = DataFactory.graph()
        let content = '<http://www.wikidata.org/entity/Q328> <http://www.w3.org/2000/01/rdf-schema#label> "ангельская Вікіпэдыя"@be-x-old .'
        parse(content, store, base, mimeType)
        expect(store.statements[0].object.lang).to.eql('be-x-old')
      })
    })

    describe('ttl with blanknodes', () => {
      let store
      before(done => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'text/turtle'
        const content = `
        @prefix : <#>.
        @prefix ex: <http://example.com#>.

        ex:myid ex:prop1 _:b0.
        _:b0 ex:prop2 _:b1.
        _:b1 ex:prop3 "value".
        `
        store = DataFactory.graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 3 statements', () => {
        expect(store.statements).to.have.length(3)
        expect(serialize(null, store, null, 'text/turtle')).to.eql(`@prefix ex: <http://example.com#>.

ex:myid ex:prop1 [ ex:prop2 [ ex:prop3 "value" ] ].

`)
      })
    })
    describe('ttl to jsonld from test-suite', () => {
      let store
      let base
      before(done => {
        base = 'https://www.example.org/abc/def'
        const mimeType = 'text/turtle'
        const content = `<#hello> <#linked> <#world> .`
        store = DataFactory.graph()
        parse(content, store, base, mimeType, done)
      })

      it('test suite example store contains 1 statement', () => {
        const body = (prefix) => `{
  "@context": {
    "${prefix}": "https://www.example.org/abc/def#"
  },
  "@id": "${prefix}:hello",
  "${prefix}:linked": {
    "@id": "${prefix}:world"
  }
}`
        // console.log(serialize(null, store, null, 'text/turtle'))
        // console.log(serialize(null, store, null, 'application/ld+json'))
        expect(store.statements).to.have.length(1)
        expect(serialize(null, store, null, 'application/ld+json')).to.eql(body('def'))
        expect(serialize(null, store, base, 'application/ld+json')).to.eql(body('def'))
        expect(serialize(store.sym(base), store, null, 'application/ld+json')).to.eql(body('def'))
      })
    })
  })
}) // ttl

  describe('a JSON-LD document', () => {
    describe('with a base IRI', () => {
      let store
      before(done => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = `
        {
          "@context": {
            "homepage": {
              "@id": "http://xmlns.com/foaf/0.1/homepage",
              "@type": "@id"
            },
            "name": {
              "@id": "http://xmlns.com/foaf/0.1/name",
              "@container": "@language"
            },
            "height": {
              "@id": "http://schema.org/height",
              "@type": "xsd:float"
            },
            "list": {
              "@id": "https://example.org/ns#listProp",
              "@container": "@list"
            },
            "xsd": "http://www.w3.org/2001/XMLSchema#"
          },
          "@id": "../#me",
          "homepage": "xyz",
          "name": {
            "en": "The Queen",
            "de": [ "Die Königin", "Ihre Majestät" ]
          },
          "height": "173.9",
          "list": [
            "list item 0",
            "list item 1",
            "list item 2"
          ]
        }`
        store = DataFactory.graph(undefined, { rdfFactory: CanonicalDataFactory })
        parse(content, store, base, mimeType, done)
      }) // before

      it('uses the specified base IRI', () => {
        expect(store.rdfFactory.supports["COLLECTIONS"]).to.equal(false)

        const homePageHeight = 5 // homepage + height + 3 x name
        const list = 2 * 3 + 1 // (rdf:first + rdf:rest) * 3 items + listProp
        expect(store.statements).to.have.length(homePageHeight + list)

        const height = store.statements[0]
        expect(height.subject.value).to.equal('https://www.example.org/#me')
        expect(height.predicate.value).to.equal('http://schema.org/height')
        expect(height.object.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#float')
        expect(height.object.termType).to.equal('Literal')
        expect(height.object.value).to.equal('173.9')

        const homepage = store.statements[1]
        expect(homepage.subject.value).to.equal('https://www.example.org/#me')
        expect(homepage.predicate.value).to.equal('http://xmlns.com/foaf/0.1/homepage')
        expect(homepage.object.value).to.equal('https://www.example.org/abc/xyz')

        const nameDe1 = store.statements[2]
        expect(nameDe1.subject.value).to.equal('https://www.example.org/#me')
        expect(nameDe1.predicate.value).to.equal('http://xmlns.com/foaf/0.1/name')
        expect(nameDe1.object.value).to.equal('Die Königin')

        const nameDe2 = store.statements[3]
        expect(nameDe2.subject.value).to.equal('https://www.example.org/#me')
        expect(nameDe2.predicate.value).to.equal('http://xmlns.com/foaf/0.1/name')
        expect(nameDe2.object.value).to.equal('Ihre Majestät')

        const nameEn = store.statements[4]
        expect(nameEn.subject.value).to.equal('https://www.example.org/#me')
        expect(nameEn.predicate.value).to.equal('http://xmlns.com/foaf/0.1/name')
        expect(nameEn.object.value).to.equal('The Queen')

        const list0First = store.statements[5]
        // expect(list0First.subject.value).to.equal('n0')
        expect(list0First.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(list0First.object.value).to.equal('list item 0')

        const list0Rest = store.statements[6]
        expect(list0Rest.subject.termType).to.equal('BlankNode')
        expect(list0Rest.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
        expect(list0Rest.object.value).to.equal(store.statements[7].subject.value)

        const list1First = store.statements[7]
        expect(list1First.subject.termType).to.equal('BlankNode')
        expect(list1First.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(list1First.object.value).to.equal('list item 1')

        const list1Rest = store.statements[8]
        expect(list1Rest.subject.termType).to.eql('BlankNode')
        expect(list1Rest.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
        expect(list1Rest.object.value).to.equal(store.statements[9].subject.value)

        const list2First = store.statements[9]
        expect(list2First.subject.termType).to.eql('BlankNode')
        expect(list2First.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(list2First.object.value).to.equal('list item 2')

        const list2Rest = store.statements[10]
        expect(list2Rest.subject.termType).to.eql('BlankNode')
        expect(list2Rest.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
        expect(list2Rest.object.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')

        const listProp = store.statements[11]
        expect(listProp.subject.value).to.equal('https://www.example.org/#me')
        expect(listProp.predicate.value).to.equal('https://example.org/ns#listProp')
        expect(listProp.object.termType).to.eql('BlankNode')
    })

    describe('with collections enabled', () => {
      let store
      before(done => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = `
        {
          "@context": {
            "list": {
              "@id": "https://example.org/ns#listProp",
              "@container": "@list"
            },
            "xsd": "http://www.w3.org/2001/XMLSchema#"
          },
          "@id": "../#me",
          "list": [
            "list item 0",
            1,
            { "@id": "http://example.com/2" }
          ]
        }`
        store = DataFactory.graph()
        parse(content, store, base, mimeType, done)
      })

      it('uses the specified base IRI', () => {
        expect(store.rdfFactory.supports["COLLECTIONS"]).to.equal(true)
        expect(store.statements).to.have.length(1)

        const collection = store.statements[0]
        expect(collection.subject.value).to.equal('https://www.example.org/#me')
        expect(collection.predicate.value).to.equal('https://example.org/ns#listProp')
        expect(collection.object.termType).to.equal('Collection')
        expect(collection.object.elements.length).to.equal(3)

        expect(collection.object.elements[0].termType).to.equal('Literal')
        expect(collection.object.elements[0].datatype.value).to.equal(defaultXSD.string.value)
        expect(collection.object.elements[0].value).to.equal(`list item 0`)

        expect(collection.object.elements[1].termType).to.equal('Literal')
        expect(collection.object.elements[1].datatype.value).to.equal(defaultXSD.integer.value)
        expect(collection.object.elements[1].value).to.equal(`1`)

        expect(collection.object.elements[2].termType).to.equal('NamedNode')
        expect(collection.object.elements[2].value).to.equal(`http://example.com/2`)

      })
    })

    describe('with a @type node', () => {
      const content = `
        {
          "@id": "jane",
          "@type": "http://schema.org/Person",
          "http://schema.org/name": "Jane Doe"
        }`
      const mimeType = 'application/ld+json'
      let store
      before(async () => {
        store = DataFactory.graph()
        await parse(content, store, 'https://base.example/', mimeType, () => null)
      })

      it('store contains 2 statements', () => {
        expect(store.statements).to.have.length(2)
      })

      it('store contains type', async () => {
        const nameDe2 = store.statements[0]
        expect(nameDe2.subject.value).to.equal('https://base.example/jane')
        expect(nameDe2.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
        expect(nameDe2.object.value).to.equal('http://schema.org/Person')
        expect(nameDe2.object.termType).to.equal('NamedNode')
      })

      it('store contains name', async () => {
        const nameDe2 = store.statements[1]
        expect(nameDe2.subject.value).to.equal('https://base.example/jane')
        expect(nameDe2.predicate.value).to.equal('http://schema.org/name')
        expect(nameDe2.object.value).to.equal('Jane Doe')
      })
    })
    }) // with a base IRI

    describe('jsonld with blanknodes', () => {
      let store
      before(done => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = `
        {
          "@context": {
              "ex": "http://example.com#"
          },
          "@id": "ex:myid",
          "ex:prop1": {
              "ex:prop2": {
                  "ex:prop3": "value"
              }
          }
        }`
        store = DataFactory.graph()
        parse(content, store, base, mimeType, done)
      })

      it('store contains 3 statements', async () => {
        // console.log(await serialize(null, store, null, 'application/ld+json'))
        expect(store.statements).to.have.length(3)
        expect(serialize(null, store, null, 'text/turtle')).to.eql(`@prefix exa: <http://example.com#>.

exa:myid exa:prop1 [ exa:prop2 [ exa:prop3 "value" ] ].

`)
        const nt = store.toNT()
        expect(nt).to.include('<http://example.com#myid> <http://example.com#prop1> _:b0 .')
        expect(nt).to.include('_:b0 <http://example.com#prop2> _:b1 .')
        expect(nt).to.include('_:b1 <http://example.com#prop3> "value" .')
      })
    })

    describe('that fails to parse', () => {
      let store

      it('calls the callback with an error', (done) => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'application/ld+json'
        const content = `this is not valid JSON-LD`
        store = DataFactory.graph(undefined, {rdfFactory: CanonicalDataFactory})
        parse(content, store, base, mimeType, (r) => {
          console.log("error callback in test reached")
          try {
            expect(r.message).to.contain("Unexpected token")
            done()
          } catch (assertionError) {
            done(assertionError)
          }
        })
      })
    })

  }) // JSONLD

  describe('xml', () => {
    describe('literals', () => {
      it('handles language subtags', () => {
        let base = 'http://test.com'
        let mimeType = 'application/rdf+xml'
        let store = DataFactory.graph()
        let content = `<rdf:RDF
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns:core="http://www.w3.org/2004/02/skos/core#">
           <rdf:Description rdf:about="http://test.com/entity1">
               <core:prefLabel rdf:datatype="http://www.w3.org/1999/02/22-rdf-syntax-ns#langString" xml:lang="fr">Valeur de test</core:prefLabel>
           </rdf:Description>
       </rdf:RDF>`
        parse(content, store, base, mimeType)
        expect(store.statements[0].object.lang).to.eql('fr')
      }) // test
    }) // literals
  }) // xml

  describe('rdfa', () => {
    describe('html from test-suite', () => {
            let store
            let store1
            let ttlContent
      before(done => {
        const base = 'https://www.example.org/abc/def'
        const mimeType = 'text/html'
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.1//EN"
        "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-2.dtd">
<html version="XHTML+RDFa 1.1" xmlns="http://www.w3.org/1999/xhtml"
      xmlns:contact="http://www.w3.org/2000/10/swap/pim/contact#"
      xmlns:foaf="http://xmlns.com/foaf/0.1/"
      xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
      xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
      xml:lang="en"
      lang="en">
<head>
    <title>XHTML+RDFa example</title>
    <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
    <meta http-equiv="Content-Style-Type" content="text/css" />
    <meta name="content-language" content="en" />
    <meta name="robots" content="index, follow" />
    <link rel="schema.DC" href="http://purl.org/dc/elements/1.1/" />
    <link rel="schema.DCTERMS" href="http://purl.org/dc/terms/" />
    <link rel="alternate" type="application/rss+xml" title="Feed channel of XHTML+RDFa example page" href="http://www.example.com/rss.xml" />
    <meta name="DC.title" content="XHTML+RDFa example" />
    <meta name="DC.subject" content="XHTML+RDFa, semantic web" />
    <meta name="DC.description" content="Example for Extensible Hypertext Markup Language + Resource Description Framework – in – attributes." />
    <meta name="DC.format" content="application/xhtml+xml" />
    <meta name="DC.language" content="en" />
    <link rel="shortcut icon" href="favicon.ico" />
    <link  rel="stylesheet" type="text/css" href="main.css" title="main styles" />
    <link rel="foaf:primaryTopic" type="application/rdf+xml" title="FOAF" href="http://www.example.com/metadata/foaf.rdf" />
    <script type="text/javascript" src="js/click.js"></script>
</head>
<body>
<div class="content">
    <p>
        <span property="foaf:name">Jerry Smith</span><br />
        <i>Senior developer, QA</i><br />
        <a title="More about me" rel="rdfs:seeAlso" href="about.htm">More...</a>
    </p>
    <p rel="contact:address">
        93 Rose Ave <br />
        <a property="contact:city" rel="rdfs:seeAlso" title="Adelaide on Wikipedia" resource="http://dbpedia.org/resource/Adelaide"
           href="http://en.wikipedia.org/wiki/Adelaide">Adelaide</a>
    </p>
    <p>
        <span rel="foaf:phone" resource="tel:+6112345678">+61 12/345-678</span>
    </p>
</div>
</body>
</html>`
        store = DataFactory.graph() // (undefined, { rdfFactory: CanonicalDataFactory })
        parse(content, store, base, mimeType, done)
        // console.log('Alain test rdfa')
        // console.log(store.statements)
      }) // before

      it('to ttl', () => {
        ttlContent = `@prefix contact: <http://www.w3.org/2000/10/swap/pim/contact#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix abc: <https://www.example.org/abc/>.
@prefix vocab: <http://www.w3.org/1999/xhtml/vocab#>.
@prefix www: <http://www.example.com/>.
@prefix res: <http://dbpedia.org/resource/>.
@prefix met: <http://www.example.com/metadata/>.

abc:def
    vocab:alternate www:rss.xml;
    vocab:icon abc:favicon.ico;
    vocab:stylesheet abc:main.css;
    rdfs:seeAlso abc:about.htm;
    contact:address [ rdfs:seeAlso res:Adelaide; contact:city "Adelaide"@en ];
    foaf:name "Jerry Smith"@en;
    foaf:phone <tel:+6112345678>;
    foaf:primaryTopic met:foaf.rdf.
`

        expect(store.statements).to.have.length(10)
        // console.log(serialize(null, store, null, 'text/turtle'))
        expect(serialize(null, store, null, 'text/turtle')).to.eql(ttlContent)


      }) // test ttl
      it('to jsonld', () => {
        let jsonldContent = `{
  "@context": {
    "contact": "http://www.w3.org/2000/10/swap/pim/contact#",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "abc": "https://www.example.org/abc/",
    "vocab": "http://www.w3.org/1999/xhtml/vocab#",
    "www": "http://www.example.com/",
    "res": "http://dbpedia.org/resource/",
    "met": "http://www.example.com/metadata/"
  },
  "@id": "abc:def",
  "vocab:alternate": {
    "@id": "www:rss.xml"
  },
  "vocab:icon": {
    "@id": "abc:favicon.ico"
  },
  "vocab:stylesheet": {
    "@id": "abc:main.css"
  },
  "rdfs:seeAlso": {
    "@id": "abc:about.htm"
  },
  "contact:address": {
    "rdfs:seeAlso": {
      "@id": "res:Adelaide"
    },
    "contact:city": {
      "@value": "Adelaide",
      "@language": "en"
    }
  },
  "foaf:name": {
    "@value": "Jerry Smith",
    "@language": "en"
  },
  "foaf:phone": {
    "@id": "tel:+6112345678"
  },
  "foaf:primaryTopic": {
    "@id": "met:foaf.rdf"
  }
}`

        expect(store.statements).to.have.length(10)
        // console.log(serialize(null, store, null, 'application/ld+json'))
        expect(serialize(null, store, null, 'application/ld+json')).to.eql(jsonldContent)
        // Now parse back the jsonld content and see we get the same number of triples
        let store1 = DataFactory.graph()
        let base = 'https://www.example.org/abc/def'
        let mimeType = 'application/ld+json'
        parse(jsonldContent, store1, base, mimeType, (err) => {
          expect(err).to.be.undefined
          expect(store1.statements).to.have.length(10)
          console.log('RDFa jsonld parse back successful')
          expect(serialize(null, store1, null, 'text/turtle')).to.eql(ttlContent)
        })
      }) // test jsonld
    }) // html
  }) // rdfa

}) // Parse
