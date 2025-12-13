"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AJAR_handleNewTerm = AJAR_handleNewTerm;
exports.ArrayIndexOf = ArrayIndexOf;
exports.appliedFactoryMethods = void 0;
exports.arrayToStatements = arrayToStatements;
var _log = _interopRequireDefault(require("./log"));
var _uri = require("./uri");
var _utilsJs = require("./utils-js");
/** RDF/JS spec Typeguards */

/**
 * Loads ontologies of the data we load (this is the callback from the kb to
 * the fetcher).
 */
function AJAR_handleNewTerm(kb, p, requestedBy) {
  var sf = null;
  if (typeof kb.fetcher !== 'undefined') {
    sf = kb.fetcher;
  } else {
    return;
  }
  if (p.termType !== 'NamedNode') return;
  var docuri = (0, _uri.docpart)(p.uri);
  var fixuri;
  if (p.uri.indexOf('#') < 0) {
    // No hash
    // @@ major hack for dbpedia Categories, which spread indefinitely
    if ((0, _utilsJs.string_startswith)(p.uri, 'http://dbpedia.org/resource/Category:')) return;

    /*
      if (string_startswith(p.uri, 'http://xmlns.com/foaf/0.1/')) {
      fixuri = "http://dig.csail.mit.edu/2005/ajar/ajaw/test/foaf"
      // should give HTTP 303 to ontology -- now is :-)
      } else
    */
    if ((0, _utilsJs.string_startswith)(p.uri, 'http://purl.org/dc/elements/1.1/') || (0, _utilsJs.string_startswith)(p.uri, 'http://purl.org/dc/terms/')) {
      fixuri = 'http://dublincore.org/2005/06/13/dcq';
      // dc fetched multiple times
    } else if ((0, _utilsJs.string_startswith)(p.uri, 'http://xmlns.com/wot/0.1/')) {
      fixuri = 'http://xmlns.com/wot/0.1/index.rdf';
    } else if ((0, _utilsJs.string_startswith)(p.uri, 'http://web.resource.org/cc/')) {
      //            log.warn("creative commons links to html instead of rdf. doesn't seem to content-negotiate.")
      fixuri = 'http://web.resource.org/cc/schema.rdf';
    }
  }
  if (fixuri) {
    docuri = fixuri;
  }
  if (sf && sf.getState(docuri) !== 'unrequested') return;
  if (fixuri) {
    // only give warning once: else happens too often
    _log.default.warn('Assuming server still broken, faking redirect of <' + p.uri + '> to <' + docuri + '>');
  }
  return sf.fetch(docuri, {
    referringTerm: requestedBy
  });
}
const appliedFactoryMethods = exports.appliedFactoryMethods = ['blankNode', 'defaultGraph', 'literal', 'namedNode', 'quad', 'variable', 'supports'];
const rdf = {
  first: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first',
  rest: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest',
  nil: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'
};

/**
 * Expands an array of Terms to a set of statements representing the rdf:list.
 * @param rdfFactory - The factory to use
 * @param subject - The iri of the first list item.
 * @param data - The terms to expand into the list.
 * @return The {data} as a set of statements.
 */
function arrayToStatements(rdfFactory, subject, data) {
  const statements = [];
  data.reduce((id, _listObj, i, listData) => {
    statements.push(rdfFactory.quad(id, rdfFactory.namedNode(rdf.first), listData[i]));
    let nextNode;
    if (i < listData.length - 1) {
      nextNode = rdfFactory.blankNode();
      statements.push(rdfFactory.quad(id, rdfFactory.namedNode(rdf.rest), nextNode));
    } else {
      statements.push(rdfFactory.quad(id, rdfFactory.namedNode(rdf.rest), rdfFactory.namedNode(rdf.nil)));
    }
    return nextNode;
  }, subject);
  return statements;
}
function ArrayIndexOf(arr, item, i = 0) {
  var length = arr.length;
  if (i < 0) i = length + i;
  for (; i < length; i++) {
    if (arr[i] === item) {
      return i;
    }
  }
  return -1;
}