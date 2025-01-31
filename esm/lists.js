/* Lists form conversion
*/

// import DataFactory from './factories/extended-term-factory'
// import jsonldParser from './jsonldparser'
// @ts-ignore is this injected?
// @@ Goal: remove this dependency
// import N3Parser from './n3parser'
// import { parseRDFaDOM } from './rdfaparser'
// import RDFParser from './rdfxmlparser'
// import sparqlUpdateParser from './patch-parser'
// import * as Util from './utils-js'

// import BlankNode from './blank-node'
// import NamedNode from './named-node'
import Collection from './collection';
import Statement from './statement';
// import Formula from './formula'

// import { ContentType, TurtleContentType, N3ContentType, RDFXMLContentType, XHTMLContentType, HTMLContentType, SPARQLUpdateContentType, SPARQLUpdateSingleMatchContentType, JSONLDContentType, NQuadsContentType, NQuadsAltContentType } from './types'

// import { Quad } from './tf-types'

import Namespace from './namespace';
const RDF = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');

/* Replace a given node with another node throughout a given document
*
* we do the predicate as well for complenesss though we don't expect Collections to use it
*/
export function substituteInDoc(store, x, y, doc) {
  // console.log(`substituteInDoc put ${x} for ${y} in ${doc}}`)
  for (const quad of store.statementsMatching(y, null, null, doc)) {
    const newStatement = new Statement(x, quad.predicate, quad.object, doc);
    store.remove(quad);
    store.add(newStatement);
  }
  for (const quad of store.statementsMatching(null, y, null, doc)) {
    store.remove(quad);
    // console.log(`  substituteInDoc predicate ${x} in ${quad}}`)
    store.add(new Statement(quad.subject, x, quad.object, doc));
  }
  for (const quad of store.statementsMatching(null, null, y, doc)) {
    store.remove(quad);
    store.add(new Statement(quad.subject, quad.predicate, x, doc));
  }
}

/* Change all lone rdf:nil nodes into empty Collections
*/
export function substituteNillsInDoc(store, doc) {
  const x = RDF('nil');
  for (const quad of store.statementsMatching(x, null, null, doc)) {
    store.remove(quad);
    const y = new Collection();
    store.add(new Statement(y, quad.predicate, quad.object, doc));
  }
  for (const quad of store.statementsMatching(null, null, x, doc)) {
    if (!quad.predicate.sameTerm(RDF('rest'))) {
      // If not a tail
      store.remove(quad);
      const y = new Collection();
      store.add(new Statement(quad.subject, quad.predicate, y, doc));
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

export function convertFirstRestNil(store, doc // Do whole store?
) {
  function preceding(ele, listSoFar, trash) {
    const rests = store.statementsMatching(ele, RDF('rest'), null, doc);
    if (rests.length !== 1) throw new Error(`Bad list structure: no rest at ${ele}`);
    const firsts = store.statementsMatching(ele, RDF('first'), null, doc);
    if (firsts.length !== 1) throw new Error(`Bad list structure: rest but ${firsts.length} firsts at ${ele}`);
    const value = firsts[0].object;
    const total = [value].concat(listSoFar);
    // console.log('  List now is: ', total)
    const totalTrash = trash.concat(rests).concat(firsts);
    const pres = store.statementsMatching(null, RDF('rest'), ele, doc);
    if (pres.length === 0) {
      // Head of the list
      const newList = new Collection(total);
      store.remove(totalTrash);
      // Replace old list with new list:
      substituteInDoc(store, newList, ele, doc);
      return;
    }
    if (pres.length !== 1) throw new Error(`Bad list structure: ${pres.length} pres at ${ele}`);
    const pre = pres[0].subject;
    if (pre.termType !== 'BlankNode') throw new Error(`Bad list element node ${pre} type: ${pre.termType} `);
    preceding(pre, total, totalTrash);
    return;
  }
  substituteNillsInDoc(store, doc); // lone ones only

  const tails = store.statementsMatching(null, RDF('rest'), RDF('nil'), doc);
  tails.forEach(tail => {
    if (tail.subject.termType !== 'BlankNode') throw new Error(`Bad list element node ${tail.subject} type: ${tail.subject.termType} `);
    preceding(tail.subject, [], []);
  });
}