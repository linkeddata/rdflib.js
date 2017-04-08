'use strict'
import $rdf from '../../lib/index'
import fs from 'mz/fs'

/**
 * A helper class for manipulating files during tests
 *
 * @export
 * @class TestHelper
 */
class TestHelper {
  constructor (folder) {
    this.testFolder = folder || 'tests/serialize/sample_files/'
    this.kb = $rdf.graph()
    this.fetcher = $rdf.fetcher(this.kb)
    $rdf.fetcher(this.kb)
    this.contentType = 'text/turtle'
    this.base = 'file://' + this.normalizeSlashes(process.cwd()) + '/' + this.testFolder
    this.targetDocument = $rdf.sym(this.base + 'stdin') // defaul URI of test data
  }
  setBase (base) {
    this.base = $rdf.uri.join(base, this.base)
  }
  clear () {
    $rdf.BlankNode.nextId = 0
    this.kb = $rdf.graph()
    this.fetcher = $rdf.fetcher(this.kb)
  }
  setFormat (format) {
    this.contentType = format
  }
  /**
   * load a file and return a promise
   *
   * @param {any} file
   * @returns a promise
   *
   * @memberOf TestHelper
   */
  loadFile (file) {
    let document = $rdf.sym($rdf.uri.join(file, this.base))
    this.targetDocument = document
    return this.fetcher.load(document, {})
    .catch((err) => {
      console.log('Loading error:' + err)
      // I dont think not rethrowing is a good idea since we are testing
      throw Error(err)
    })
  }
  outputFile (file, format) {
    if (format) {
      this.setFormat(format)
    }
    let out
    if (!file) {
      console.log('Result: ' + out)
      return
    }
    let doc = $rdf.sym($rdf.uri.join(file, this.base))
    if (doc.uri.slice(0, 7) !== 'file://') {
      console.log('Can only write files just now, sorry: ' + doc.uri)
    }
    let fileName = doc.uri.slice(7)
    if (process) {
      if (process.platform.slice(0, 3) === 'win') {
        fileName = doc.uri.slice(8)
      }
    }
    var options = { flags: 'z' } // Only applies to RDF/XML
    try {
      if (this.contentType !== 'application/ld+json') {
        out = $rdf.serialize(this.targetDocument, this.kb, this.targetDocument.uri, this.contentType, undefined, options)
        return fs.writeFile(fileName, out, 'utf8')
          .catch(err => {
            console.log('Error writing file <' + file + '> :' + err)
            throw Error(err)
          })
      } else {
        return new Promise((resolve, reject) => {
          try {
            $rdf.serialize(this.targetDocument, this.kb, this.targetDocument.uri, this.contentType, function (err, res) {
              if (err) { reject(err) } else { resolve(res) }
            }, options)
          } catch (e) {
            reject(e)
          }
        }).then((out) => {
          return fs.writeFile(fileName, out, 'utf8')
            .catch(err => {
              console.log('Error writing file <' + file + '> :' + err)
              throw Error(err)
            })
        })
      }
    } catch (e) {
      console.log('Error in serializer: ' + e + this.stackString(e))
      throw Error(e)
    }
  }
  dump (file) {
    let doc = $rdf.sym($rdf.uri.join(file, this.base))
    $rdf.term()
    let out
    try {
      out = $rdf.serialize(null, this.kb, this.targetDocument.uri, 'application/n-quads') // whole store
    } catch (err) {
      console.log('Error in serializer: ' + err + this.stackString(e))
      throw Error(err)
    }
    console.log(out)
    if (doc.uri.slice(0, 7) !== 'file://') {
      // console.log('Can only write files just now, sorry: ' + doc.uri)
    }
    let fileName = doc.uri.slice(7)
    if (process) {
      if (process.platform.slice(0, 3) === 'win') {
        fileName = doc.uri.slice(8)
      }
    }
    return fs.writeFile(fileName, out)
      .catch(err => {
        console.log('Error writing file <' + file + '> :' + err)
        throw Error(err)
      })
  }
  size () {
    console.log(this.kb.statements.length + ' triples')
  }
  version () {
    // console.log('rdflib built: ' + $rdf.buildTime)
  }
  stackString (e) {
    var str = '' + e + '\n'
    if (!e.stack) {
      return str + 'No stack available.\n'
    }
    var lines = e.stack.toString().split('\n')
    var toprint = []
    for (let i = 0; i < lines.length; i++) {
      var line = lines[i]
      if (line.indexOf('ecmaunit.js') > -1) {
        // remove useless bit of traceback
        break
      }
      if (line.charAt(0) === '(') {
        line = 'function' + line
      }
      var chunks = line.split('@')
      toprint.push(chunks)
    }
    // toprint.reverse();  No - I prefer the latest at the top by the error message -tbl
    for (let i = 0; i < toprint.length; i++) {
      str += '  ' + toprint[i][1] + '\n    ' + toprint[i][0]
    }
    return str
  }

  normalizeSlashes (str) {
    if (str[0] !== '/') {
      str = '/' + str
    }
    return str.replace(/\\/g, '/')
  }
}
export default TestHelper
function check (ok, message, status) {
  if (!ok) {
    console.log('Failed ' + status + ': ' + message)
  }
}
