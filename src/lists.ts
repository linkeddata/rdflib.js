import DataFactory from './factories/extended-term-factory'
import jsonldParser from './jsonldparser'
// @ts-ignore is this injected?
import { Parser as N3jsParser } from 'n3'  // @@ Goal: remove this dependency
import N3Parser from './n3parser'
import { parseRDFaDOM } from './rdfaparser'
import RDFParser from './rdfxmlparser'
import sparqlUpdateParser from './patch-parser'
import * as Util from './utils-js'
import Formula from './formula'
import { ContentType, TurtleContentType, N3ContentType, RDFXMLContentType, XHTMLContentType, HTMLContentType, SPARQLUpdateContentType, SPARQLUpdateSingleMatchContentType, JSONLDContentType, NQuadsContentType, NQuadsAltContentType } from './types'
import { Quad } from './tf-types'

import Namespace from './namespace'

const RDF  = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')

/**
 * Convert lists reified as rd
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 * @param store - The quadstore
 * @param doc - The document in which the conversion is done
 */
 // @@@@@@@ also fidn remaining rdf:nil empty list to ()
 
export default function convertFirstRestNil (
  store: Store,
  doc: NamedNode | undefined,  // Do whole store
) {
  let trash = []
  function preceding (ele): Node[] {
    const pres = store.statementsMatching(null, RDF('rest'), ele, doc)
    if (pres.length === 0) return { list: [], trash: [] }
    if (pres.length !== 1) thow new Error(`Bad list structure: ${pres.length} pres at ${ele}`)
    const pre = pres[0]
    const firsts = store.statementsMatching(pre, RDF('first'), null, doc)
    if (firsts.length !== 1) thow new Error(`Bad list structure: rest but ${firsts.length} firsts at ${pre}`)
    // trash = trash.concat(pres).concat(firsts)
    return { list: preceding(pre).concat([firsts[0].object]), trash: pres.concat(firsts) }
  }

  const tails = store.statementsMatching(null, RDF('rest'), RDF('nil'), doc)

  const lists = tails.map(tail => {
    { list, trash } = preceding
  })


}
