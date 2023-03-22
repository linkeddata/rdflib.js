/* eslint-env mocha */
import {expect} from 'chai'

import { convertFirstRestNil } from '../../src/lists'
import parse from '../../src/parse'
import CanonicalDataFactory from '../../src/factories/canonical-data-factory'
import defaultXSD from '../../src/xsd'
import DataFactory from '../../src/factories/rdflib-data-factory'
import serialize from '../../src/serialize'

const prefixes = `
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
`
function showDoc(store, doc) {
   const text = serialize(doc, store, doc.uri)
   return text
}
function gist(store, doc) {
   const text = showDoc(store, doc)
   return text.replace(/@prefix [^>]*> *\./g, '')
}
function dumpStore(store) {
   const text = store.statements.map(st => st.toNT()).join('\n')
   return text
}

describe('Lists', () => {
  describe('convert', () => {
    describe('first-rest to Collection', () => {
      it('parses a collection', () => {
        let base = 'https://example.com/tests/test.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let content = ' <#test> <#value> ( 1 2 3 ) .'
        parse(content, store, base, mimeType)
        expect(store.statements[0].object.termType).to.eql('Collection')
      })

      it('handles a lone list', () => {
        let base = 'https://example.com/tests/test.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let doc = store.sym(base)
        let content = prefixes +
  ' <#test> <#value> [ rdf:first 1; rdf:rest [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ]]] .'
        parse(content, store, base, mimeType)
        convertFirstRestNil(store, doc)
        expect(store.statements[0].object.termType).to.eql('Collection')
        expect(showDoc(store, doc)).to.eql(`@prefix : <#>.

:test :value ( 1 2 3 ).

`)
      })

      it('handles a lone list in Subject position', () => {
        let base = 'https://example.com/tests/test.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let doc = store.sym(base)
        let content = prefixes +
  '[ rdf:first 1; rdf:rest [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ]]] <#value>  <#test>  .'
        parse(content, store, base, mimeType)
        convertFirstRestNil(store, doc)
        // console.log('@@@ CCC ' + dumpStore(store))
        expect(store.statements[0].subject.termType).to.eql('Collection')
        expect(store.statements[0].subject.elements.length).to.eql(3)
      })

      // Skip for now as serializer does not handle list as subject
      /*
      it.skip('handles a lone list in Subject position serialized', () => {
        let base = 'https://example.com/tests/test.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let doc = store.sym(base)
        let content = prefixes +
  '[ rdf:first 1; rdf:rest [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ]]] <#value>  <#test>  .'
        parse(content, store, base, mimeType)
        // console.log('@@@ AAA ' + showDoc(store, doc))
        // expect(store.statements[0].object.termType).to.eql('BlankNode')
        convertFirstRestNil(store, doc)
        // console.log('@@@ CCC ' + dumpStore(store))
        // expect(store.statements[0].object.termType).to.eql('Collection')
        expect(showDoc(store, doc)).to.eql(`@prefix : <#>.

 ( 1 2 3 ) :value :test .

`)
      })
      */

      it('handles nested lists', () => {
        let base = 'https://example.com/tests/test.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let doc = store.sym(base)
        let content = prefixes +
  ` <#test> <#value> [
     rdf:first [ rdf:first 11; rdf:rest [ rdf:first 12; rdf:rest [ rdf:first 13; rdf:rest rdf:nil ]]];
     rdf:rest [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ]]] .`
        parse(content, store, base, mimeType)
        // console.log('@@@ AAA ' + showDoc(store, doc))
        // expect(store.statements[0].object.termType).to.eql('BlankNode')
        convertFirstRestNil(store, doc)
        // console.log('@@@ BBB ' + showDoc(store, doc))
        // expect(store.statements[0].object.termType).to.eql('Collection')
        expect(showDoc(store, doc)).to.eql(`@prefix : <#>.

:test :value ( ( 11 12 13 ) 2 3 ).

`)
      })

      it('handles one rdf:nil', () => {
        let base = 'https://example.com/tests/test.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let doc = store.sym(base)
        let content = prefixes +
  ' <#test> <#value> rdf:nil .'
        parse(content, store, base, mimeType)
        convertFirstRestNil(store, doc)
        expect(showDoc(store, doc)).to.eql(`@prefix : <#>.

:test :value ( ).

`)
      })

      it('handles several rdf:nil', () => {
        let base = 'https://example.com/tests/test.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let doc = store.sym(base)
        let content = prefixes +
  ` <#test> <#value> rdf:nil .
<#test2> :value [ a rdf:nil; :name rdf:nil ];
         :zap [ rdf:first 2;  rdf:rest [  rdf:first rdf:nil; rdf:rest [ rdf:first 4; rdf:rest rdf:nil]]] .
  `
        parse(content, store, base, mimeType)
        convertFirstRestNil(store, doc)
        expect(showDoc(store, doc)).to.eql(`@prefix : <#>.

:test :value ( ).

:test2 :value [ a ( ); :name ( ) ]; :zap ( 2 ( ) 4 ).

`)
      })


    })

  })
})
