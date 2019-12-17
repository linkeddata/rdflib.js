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
import { ContentType, TurtleContentType, N3ContentType, RDFXMLContentType, XHTMLContentType, HTMLContentType, SPARQLUpdateContentType, JSONLDContentType, NQuadsContentType, NQuadsAltContentType } from './types'
import { Quad } from './tf-types'

type CallbackFunc = (error: any, kb: Formula | null) => void

/**
 * Parse a string and put the result into the graph kb.
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 * @param str - The input string to parse
 * @param kb - The store to use
 * @param base - The base URI to use
 * @param contentType - The MIME content type string for the input
 * @param callback - The callback to call when the data has been loaded
 */
export default function parse (
  str: string,
  kb: Formula,
  base: string,
  contentType: string | ContentType,
  callback?: CallbackFunc
) {
  contentType = contentType || TurtleContentType
  contentType = contentType.split(';')[0] as ContentType
  try {
    if (contentType === N3ContentType || contentType === TurtleContentType) {
      var p = N3Parser(kb, kb, base, base, null, null, '', null)
      p.loadBuf(str)
      executeCallback()
    } else if (contentType === RDFXMLContentType) {
      var parser = new RDFParser(kb)
      parser.parse(Util.parseXML(str), base, kb.sym(base))
      executeCallback()
    } else if (contentType === XHTMLContentType) {
      parseRDFaDOM(Util.parseXML(str, {contentType: XHTMLContentType}), kb, base)
      executeCallback()
    } else if (contentType === HTMLContentType) {
      parseRDFaDOM(Util.parseXML(str, {contentType: HTMLContentType}), kb, base)
      executeCallback()
    } else if (contentType === SPARQLUpdateContentType) { // @@ we handle a subset
      sparqlUpdateParser(str, kb, base)
      executeCallback()
    } else if (contentType === JSONLDContentType) {
      jsonldParser(str, kb, base, executeCallback)
    } else if (contentType === NQuadsContentType ||
               contentType === NQuadsAltContentType) {
      var n3Parser = new N3jsParser({ factory: DataFactory })
      nquadCallback(null, str)
    } else if (contentType === undefined) {
      throw new Error("contentType is undefined")
    } else {
      throw new Error("Don't know how to parse " + contentType + ' yet')
    }
  } catch (e) {
    executeErrorCallback(e)
  }

  (parse as any).handled= {
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

  function executeErrorCallback (e: Error): void {
    if (
      // TODO: Always true, what is the right behavior
      contentType !== JSONLDContentType ||
      // @ts-ignore always true?
      contentType !== NQuadsContentType ||
      // @ts-ignore always true?
      contentType !== NQuadsAltContentType
    ) {
      if (callback) {
        callback(e, kb)
      } else {
        let e2 = new Error('' + e + ' while trying to parse <' + base + '> as ' + contentType)
        //@ts-ignore .cause is not a default error property
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
  function nquadCallback (err?: Error | null, nquads?: string): void {
    if (err) {
      (callback as CallbackFunc)(err, kb)
    }
    try {
      n3Parser.parse(nquads, tripleCallback)
    } catch (err) {
      (callback as CallbackFunc)(err, kb)
    }
  }

  function tripleCallback (err: Error, triple: Quad) {
    if (triple) {
      kb.add(triple.subject, triple.predicate, triple.object, triple.graph)
    } else {
      (callback as CallbackFunc)(err, kb)
    }
  }
}
