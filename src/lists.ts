/* Lists form conversion
*/


// import DataFactory from './factories/extended-term-factory'
// import jsonldParser from './jsonldparser'
// @ts-ignore is this injected?
import { Parser as N3jsParser } from 'n3'  // @@ Goal: remove this dependency
// import N3Parser from './n3parser'
// import { parseRDFaDOM } from './rdfaparser'
// import RDFParser from './rdfxmlparser'
// import sparqlUpdateParser from './patch-parser'
// import * as Util from './utils-js'
import Node from './node-internal'
// import BlankNode from './blank-node'
// import NamedNode from './named-node'
import Collection from './collection'
import Statement from './statement'
// import Formula from './formula'
import Store from './store'
// import { ContentType, TurtleContentType, N3ContentType, RDFXMLContentType, XHTMLContentType, HTMLContentType, SPARQLUpdateContentType, SPARQLUpdateSingleMatchContentType, JSONLDContentType, NQuadsContentType, NQuadsAltContentType } from './types'

// import { Quad } from './tf-types'

import {BlankNode, NamedNode, Quad, Term,} from './tf-types'
import Namespace from './namespace'

const RDF  = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')

/* Replace a given node with another node throughout a given document
*
* we do the predicate as well for complenesss though we don't expect Collections to use it
*/
export function substituteInDoc (store:Store, x:Term, y:Term, doc?: NamedNode ) {
  // console.log(`substituteInDoc put ${x} for ${y} in ${doc}}`)
  for (const quad of store.statementsMatching(y as any, null, null, doc as any)) {
    const newStatement = new Statement(x as any, quad.predicate, quad.object, doc as any)
    store.remove(quad)
    store.add(newStatement)
  }
  for (const quad of store.statementsMatching(null, y as any, null, doc) as any) {
    store.remove(quad)
    // console.log(`  substituteInDoc predicate ${x} in ${quad}}`)
    store.add(new Statement(quad.subject, x as any, quad.object, doc as any))
  }
  for (const quad of store.statementsMatching(null, null, y as any, doc) as any) {
    store.remove(quad)
    store.add(new Statement(quad.subject, quad.predicate, x as any, doc as any))
  }
}

/* Change all lone rdf:nil nodes into empty Collections
*/
export function substituteNillsInDoc (store:Store, doc?: NamedNode) {
  const x = RDF('nil')
  for (const quad of store.statementsMatching(x as any, null, null, doc as any)) {
    store.remove(quad)
    const y = new Collection()
    store.add(new Statement(y as any, quad.predicate, quad.object, doc as any))
  }
  for (const quad of store.statementsMatching(null, null, x as any, doc) as any) {
    if (!quad.predicate.sameTerm(RDF('rest'))) { // If not a tail
      store.remove(quad)
      const y = new Collection()
      store.add(new Statement(quad.subject, quad.predicate, y as any, doc as any))
    }
  }
}
/**
 * Convert lists reified as rdf:first, rest
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 * @param store - The quadstore
 * @param doc - The document in which the conversion is done
 */


export function convertFirstRestNil (
  store: Store,
  doc: NamedNode | undefined,  // Do whole store?
) {

  function preceding (ele:BlankNode, listSoFar: Node[], trash: Quad[]): undefined {

    const rests = store.statementsMatching(ele, RDF('rest'), null, doc)
    if (rests.length !== 1) throw new Error(`Bad list structure: no rest at ${ele}`)

    const firsts = store.statementsMatching(ele, RDF('first'), null, doc)
    if (firsts.length !== 1) throw new Error(`Bad list structure: rest but ${firsts.length} firsts at ${ele}`)
    const value = firsts[0].object
    const total = [value].concat(listSoFar as any)
    // console.log('  List now is: ', total)
    const totalTrash =  trash.concat(rests).concat(firsts)

    const pres = store.statementsMatching(null, RDF('rest'), ele, doc)
    if (pres.length === 0) { // Head of the list
      const newList  = new Collection(total)
      store.remove(totalTrash)
      // Replace old list with new list:
      substituteInDoc(store, newList, ele, doc)
      return
    }
    if (pres.length !== 1) throw new Error(`Bad list structure: ${pres.length} pres at ${ele}`)
    const pre = pres[0].subject
    if (pre.termType !== 'BlankNode')  throw new Error(`Bad list element node ${pre} type: ${pre.termType} `)

    preceding(pre, total, totalTrash)
    return
  }

  substituteNillsInDoc(store, doc) // lone ones only

  const tails = store.statementsMatching(null, RDF('rest'), RDF('nil'), doc)
  tails.forEach(tail => {
    if (tail.subject.termType !== 'BlankNode')
      throw new Error(`Bad list element node ${tail.subject} type: ${tail.subject.termType} `)
    preceding(tail.subject, [], [])
  })

}
