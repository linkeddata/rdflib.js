/* Lists form conversion
*/


import DataFactory from './factories/extended-term-factory'
import jsonldParser from './jsonldparser'
// @ts-ignore is this injected?
import { Parser as N3jsParser } from 'n3'  // @@ Goal: remove this dependency
import N3Parser from './n3parser'
import { parseRDFaDOM } from './rdfaparser'
import RDFParser from './rdfxmlparser'
import sparqlUpdateParser from './patch-parser'
import * as Util from './utils-js'
import Node from './node-internal'
// import BlankNode from './blank-node'
// import NamedNode from './named-node'
import Collection from './collection'
import Statement from './statement'
// import Formula from './formula'
import Store from './store'
import { ContentType, TurtleContentType, N3ContentType, RDFXMLContentType, XHTMLContentType, HTMLContentType, SPARQLUpdateContentType, SPARQLUpdateSingleMatchContentType, JSONLDContentType, NQuadsContentType, NQuadsAltContentType } from './types'

// import { Quad } from './tf-types'

import {BlankNode, NamedNode, Quad, Quad_Graph, Quad_Object, Quad_Predicate, Quad_Subject, Term,} from './tf-types'
import Namespace from './namespace'

const RDF  = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')

/**
 * Convert lists reified as rdf:first, rest
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 * @param store - The quadstore
 * @param doc - The document in which the conversion is done
 */
 // @@@@@@@ also fidn remaining rdf:nil empty list to ()

/* Replace a given node for another node throughout a given document
*
* we do the predicate as well for complenesss though we don't expect Collections to use it
*/
export function substituteInDoc (store:Store, x:Term, y:Term, doc: NamedNode) {

  for (const quad of store.statementsMatching(x as any, null, null, doc as any)) {
    store.remove(quad)
    store.add(new Statement(y as any, quad.predicate, quad.object, doc as any))
  }
  for (const quad of store.statementsMatching(null, x as any, null, doc) as any) {
    store.remove(quad)
    store.add(new Statement(quad.subject, y as any, quad.object, doc as any))
  }
  for (const quad of store.statementsMatching(null, null, x as any, doc) as any) {
    store.remove(quad)
    store.add(new Statement(quad.subject, quad.predicate, y as any, doc as any))
  }
}

/* Change all lone rdf:nil nodes into empty Collections
*/
export function substituteNillsInDoc (store:Store, doc: NamedNode) {
  const x = RDF('nil')
  for (const quad of store.statementsMatching(x as any, null, null, doc as any)) {
    store.remove(quad)
    const y = new Collection()
    store.add(new Statement(y as any, quad.predicate, quad.object, doc as any))
  }
  for (const quad of store.statementsMatching(null, x as any, null, doc) as any) {
    store.remove(quad)
    const y = new Collection()
    store.add(new Statement(quad.subject, y as any, quad.object, doc as any))
  }
  for (const quad of store.statementsMatching(null, null, x as any, doc) as any) {
    store.remove(quad)
    const y = new Collection()
    store.add(new Statement(quad.subject, quad.predicate, y as any, doc as any))
  }
}

export function convertFirstRestNil (
  store: Store,
  doc: NamedNode | undefined,  // Do whole store
) {

  function preceding (ele:BlankNode, listSoFar: Node[], trash: Quad[]): undefined {
    const pres = store.statementsMatching(null, RDF('rest'), ele, doc)
    if (pres.length === 0) { // Head of the list
      console.log(`Found a whole first/rest list: ${ele}, content: ${listSoFar}`)
      const newList  = new Collection(listSoFar)

      // Replace old list with new list:
      substituteInDoc(store, newList, ele, doc)
      // Remove the old form
      store.remove(trash)
    }
    if (pres.length !== 1) throw new Error(`Bad list structure: ${pres.length} pres at ${ele}`)
    const pre = pres[0].subject
    if (pre.termType !== 'BlankNode')  throw new Error(`Bad list element node ${pre} type: ${pre.termType} `)

    const firsts = store.statementsMatching(pre, RDF('first'), null, doc)
    if (firsts.length !== 1) throw new Error(`Bad list structure: rest but ${firsts.length} firsts at ${pre}`)
    const value = firsts[0].object
    preceding(pre, [value].concat(listSoFar as any), trash.concat(pres).concat(firsts))
    return
  }

  const tails = store.statementsMatching(null, RDF('rest'), RDF('nil'), doc)
  tails.forEach(tail => {
    if (tail.subject.termType !== 'BlankNode')
      throw new Error(`Bad list element node ${tail.subject} type: ${tail.subject.termType} `)
    preceding(tail.subject, [], [])

  })
  substituteNillsInDoc(store, doc)

}
