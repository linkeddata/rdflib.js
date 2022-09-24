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
function dumpStore(store, doc) {
   const text = serialize(doc, store, doc.uri)
   return text
  // return store.statements.map(st => st.toNT()).join('\n')
}

describe('Lists', () => {
  describe('convert', () => {
    describe('first-rest to Collection', () => {
      it('parses a collection', () => {
        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let content = ' <#test> <#value> ( 1 2 3 ) .'
        parse(content, store, base, mimeType)
        expect(store.statements[0].object.termType).to.eql('Collection')
      })

      it('handles a lone list', () => {
        let base = 'https://www.wikidata.org/wiki/Special:EntityData/Q2005.ttl'
        let mimeType = 'text/turtle'
        let store = DataFactory.graph()
        let doc = store.sym(base)
        let content = prefixes +
  ' <#test> <#value> [ rdf:first 1; rdf:rest [ rdf:first 2; rdf:rest [ rdf:first 3; rdf:rest rdf:nil ]]] .'
        parse(content, store, base, mimeType)
        // console.log('@@@ AAA ' + dumpStore(store, doc))
        // expect(store.statements[0].object.termType).to.eql('BlankNode')
        convertFirstRestNil(store, doc)
        // console.log('@@@ BBB ' + dumpStore(store, doc))
        // expect(store.statements[0].object.termType).to.eql('Collection')
        expect(dumpStore(store, doc)).to.eql(`@prefix : <#>.

:test :value ( 1 2 3 ).

`)

      })
    })

  })
})
