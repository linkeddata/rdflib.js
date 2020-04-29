/* eslint-env mocha */
import { expect } from 'chai'

import parse from '../../src/parse'
import CanonicalDataFactory from '../../src/factories/canonical-data-factory'
import defaultXSD from '../../src/xsd'
import DataFactory from '../../src/factories/rdflib-data-factory'

describe('Parse', () => {
  describe('ttl', () => {
    describe('literals', () => {
      it('handles language subtags', () => {
        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let content = '<http://www.wikidata.org/entity/Q328> <http://www.w3.org/2000/01/rdf-schema#label> "ангельская Вікіпэдыя"@be-x-old .'
        parse(content, store, base, mimeType)
        expect(store.statements[0].object.lang).to.eql('be-x-old')
      })
    })

    describe('collections', () => {
      describe('with collection term support', () => {
        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let content = '<http://www.wikidata.org/entity/Q328> <http://www.w3.org/2000/01/rdf-schema#label> ( "0" "1"^^<http://www.w3.org/2001/XMLSchema#number> <http://example.org/> ) .'
        parse(content, store, base, mimeType)
        expect(store.statements[0].object.termType).to.eql('Collection')
      })

      describe('without collection term support', () => {
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
    })
  })

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
  })

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
      })

      it('uses the specified base IRI', () => {
        expect(store.rdfFactory.supports["COLLECTIONS"]).to.be.false()
        const homePageHeight = 5 // homepage + height + 3 x name
        const list = 2 * 3 + 1 // (rdf:first + rdf:rest) * 3 items + listProp
        expect(store.statements).to.have.length(homePageHeight + list)

        const height = store.statements[0]
        expect(height.subject.value).to.equal('https://www.example.org/#me')
        expect(height.predicate.value).to.equal('http://schema.org/height')
        expect(height.object.datatype.value).to.equal('http://www.w3.org/2001/XMLSchema#float')
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
        expect(list0First.subject.value).to.equal('n1')
        expect(list0First.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(list0First.object.value).to.equal('list item 0')

        const list0Rest = store.statements[6]
        expect(list0Rest.subject.value).to.equal('n1')
        expect(list0Rest.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
        expect(list0Rest.object.value).to.equal(store.statements[7].subject.value)

        const list1First = store.statements[7]
        expect(list1First.subject.value).to.equal('n2')
        expect(list1First.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(list1First.object.value).to.equal('list item 1')

        const list1Rest = store.statements[8]
        expect(list1Rest.subject.value).to.equal('n2')
        expect(list1Rest.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
        expect(list1Rest.object.value).to.equal(store.statements[9].subject.value)

        const list2First = store.statements[9]
        expect(list2First.subject.value).to.equal('n3')
        expect(list2First.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
        expect(list2First.object.value).to.equal('list item 2')

        const list2Rest = store.statements[10]
        expect(list2Rest.subject.value).to.equal('n3')
        expect(list2Rest.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
        expect(list2Rest.object.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')

        const listProp = store.statements[11]
        expect(listProp.subject.value).to.equal('https://www.example.org/#me')
        expect(listProp.predicate.value).to.equal('https://example.org/ns#listProp')
        expect(listProp.object.value).to.equal('n1')
      })
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
        expect(store.rdfFactory.supports["COLLECTIONS"]).to.be.true()
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
  })

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
      })
    })
  })
})
