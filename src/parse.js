import BlankNode from './blank-node'
import DataFactory from './data-factory'
import jsonld from 'jsonld'
import Literal from './literal'
import { Parser as N3jsParser } from 'n3'  // @@ Goal: remove this dependency
import N3Parser from './n3parser'
import NamedNode from './named-node'
import { parseRDFaDOM } from './rdfaparser'
import RDFParser from './rdfxmlparser'
import sparqlUpdateParser from './patch-parser'
import * as Util from './util'

/**
 * Parse a string and put the result into the graph kb.
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 */
export default function parse (str, kb, base, contentType, callback) {
  contentType = contentType || 'text/turtle'
  contentType = contentType.split(';')[0]
  try {
    if (contentType === 'text/n3' || contentType === 'text/turtle') {
      var p = N3Parser(kb, kb, base, base, null, null, '', null)
      p.loadBuf(str)
      executeCallback()
    } else if (contentType === 'application/rdf+xml') {
      var parser = new RDFParser(kb)
      parser.parse(Util.parseXML(str), base, kb.sym(base))
      executeCallback()
    } else if (contentType === 'application/xhtml+xml') {
      parseRDFaDOM(Util.parseXML(str, {contentType: 'application/xhtml+xml'}), kb, base)
      executeCallback()
    } else if (contentType === 'text/html') {
      parseRDFaDOM(Util.parseXML(str, {contentType: 'text/html'}), kb, base)
      executeCallback()
    } else if (contentType === 'application/sparql-update') { // @@ we handle a subset
      sparqlUpdateParser(str, kb, base)
      executeCallback()
    } else if (contentType === 'application/ld+json' ||
               contentType === 'application/nquads' ||
               contentType === 'application/n-quads') {
      var n3Parser = new N3jsParser({ factory: DataFactory })
      var triples = []
      if (contentType === 'application/ld+json') {
        var jsonDocument
        try {
          jsonDocument = JSON.parse(str)
        } catch (parseErr) {
          return callback(parseErr, null)
        }
        jsonld.toRDF(jsonDocument,
          {format: 'application/nquads', base},
          nquadCallback)
      } else {
        nquadCallback(null, str)
      }
    } else {
      throw new Error("Don't know how to parse " + contentType + ' yet')
    }
  } catch (e) {
    executeErrorCallback(e)
  }

  parse.handled = {
    'text/n3': true,
    'text/turtle': true,
    'application/rdf+xml': true,
    'application/xhtml+xml': true,
    'text/html': true,
    'application/sparql-update': true,
    'application/ld+json': true,
    'application/nquads' : true,
    'application/n-quads' : true
  }

  function executeCallback () {
    if (callback) {
      callback(null, kb)
    } else {
      return
    }
  }

  function executeErrorCallback (e) {
    if (contentType !== 'application/ld+json' ||
      contentType !== 'application/nquads' ||
      contentType !== 'application/n-quads') {
      if (callback) {
        callback(e, kb)
      } else {
        let e2 = new Error('' + e + ' while trying to parse <' + base + '> as ' + contentType)
        e2.cause = e
        throw e2
      }
    }
  }
/*
  function setJsonLdBase (doc, base) {
    if (doc instanceof Array) {
      return
    }
    if (!('@context' in doc)) {
      doc['@context'] = {}
    }
    doc['@context']['@base'] = base
  }
*/
  function nquadCallback (err, nquads) {
    if (err) {
      callback(err, kb)
    }
    try {
      n3Parser.parse(nquads, tripleCallback)
    } catch (err) {
      callback(err, kb)
    }
  }

  function tripleCallback (err, triple, prefixes) {
    if (triple) {
      kb.add(triple)
    } else {
      callback(err, kb)
    }
  }
}
