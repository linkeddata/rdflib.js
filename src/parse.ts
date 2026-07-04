import jsonldParser from './jsonldparser'
import parseN3js, { N3JS_FORMATS } from './n3-adapter'
import { parseRDFaDOM } from './rdfaparser'
import RDFParser from './rdfxmlparser'
import sparqlUpdateParser from './patch-parser'
import * as Util from './utils-js'
import Formula from './formula'
import { ContentType, TurtleContentType, RDFXMLContentType, XHTMLContentType, HTMLContentType, SPARQLUpdateContentType, SPARQLUpdateSingleMatchContentType, JSONLDContentType, NQuadsContentType, NQuadsAltContentType } from './types'
import type { Document as XmldomDocument } from '@xmldom/xmldom'

type CallbackFunc = (error: any, kb: Formula | null) => void

/**
 * Parse a string and put the result into the graph kb.
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * If you are parsing JSON-LD and want to know when and whether it succeeded, you need to use the callback param.
 * @param str - The input string to parse
 * @param kb - The store to use
 * @param base - The base URI to use
 * @param contentType - The MIME content type string for the input - defaults to text/turtle
 * @param [callback] - The callback to call when the data has been loaded
 */
export default function parse (
  str: string,
  kb: Formula,
  base: string,
  contentType: string | ContentType = 'text/turtle',
  callback?: CallbackFunc
) {
  contentType = contentType || TurtleContentType
  contentType = contentType.split(';')[0] as ContentType
  try {
    if (Object.prototype.hasOwnProperty.call(N3JS_FORMATS, contentType)) {
      // The Turtle family — Turtle, N3, TriG, N-Triples and N-Quads — is
      // parsed by the N3.js parser, adapted onto rdflib's model.
      parseN3js(str, kb, base, contentType)
      executeCallback()
    } else if (contentType === RDFXMLContentType) {
      var parser = new RDFParser(kb)
      parser.parse(Util.parseXML(str) as unknown as XmldomDocument, base, kb.sym(base))
      executeCallback()
    } else if (contentType === XHTMLContentType) {
      parseRDFaDOM(Util.parseXML(str, {contentType: XHTMLContentType}) as unknown as XmldomDocument, kb, base)
      executeCallback()
    } else if (contentType === HTMLContentType) {
      parseRDFaDOM(Util.parseXML(str, {contentType: HTMLContentType}) as unknown as XmldomDocument, kb, base)
      executeCallback()
    } else if ((contentType === SPARQLUpdateContentType) || (contentType === SPARQLUpdateSingleMatchContentType)) { // @@ we handle a subset
      sparqlUpdateParser(str, kb, base)
      executeCallback()
    } else if (contentType === JSONLDContentType) {
      // since we do not await the promise here, rejections will not be covered by the surrounding try catch
      // we do not use await, because parse() should stay sync
      // so, to not lose the async error, we need to catch the rejection and call the error callback here too
      jsonldParser(str, kb, base)
          .then(executeCallback)
          .catch(executeErrorCallback)
    } else if (contentType === undefined) {
      throw new Error("contentType is undefined")
    } else {
      throw new Error("Don't know how to parse " + contentType + ' yet')
    }
  } catch (e) {
    // @ts-ignore
    executeErrorCallback(e)
  }

  (parse as any).handled= {
    'text/n3': true,
    'application/n3': true,
    'text/turtle': true,
    'application/x-turtle': true,
    'application/rdf+xml': true,
    'application/xhtml+xml': true,
    'text/html': true,
    'application/sparql-update': true,
    'application/sparql-update-single-match': true,
    'application/ld+json': true,
    'application/nquads' : true,
    'application/n-quads' : true,
    'application/n-triples' : true,
    'application/trig' : true
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
}
