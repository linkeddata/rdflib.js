import $rdf = require('rdflib')

import * as fs from 'fs'
import * as Promise from 'bluebird'

export type MIME = "application/rdf+xml" | "text/turtle" | "text/n3" | "application/n-triples" | "application/n-quads" | "application/ldjson"

/**
 * A helper class for manipulating files during tests
 * 
 * @export
 * @class TestHelper
 */
export class TestHelper {
  testFolder: string
  kb: $rdf.IndexedFormula
  fetcher: $rdf.Fetcher
  contentType
  base: string
  targetDocument

  constructor(folder?) {
    this.testFolder = folder || "tests/serialize/sample_files/"
    this.kb = $rdf.graph()
    this.fetcher = $rdf.fetcher(this.kb)
    $rdf.fetcher(this.kb)
    this.contentType = 'text/turtle'
    this.base = 'file://' + this.reverseSlash(process.cwd()) + "/" + this.testFolder
    this.targetDocument = $rdf.sym(this.base + 'stdin') // defaul URI of test data
  }

  setBase(base) {
    this.base = $rdf.uri.join(base, this.base)
  }

  clear() {
    this.kb = $rdf.graph();
    this.fetcher = $rdf.fetcher(this.kb)
  }

  setFormat(format) {
    this.contentType = format;
  }

  /**
   * load a file and return a promise
   * 
   * @param {any} file  
   * @returns a promise
   * 
   * @memberOf TestHelper
   */
  loadFile(file) {
    // console.log(this.base);

    let document = $rdf.sym($rdf.uri.join(file, this.base))
    this.targetDocument = document
    return new Promise((fulfill, reject) => {
      this.fetcher.nowOrWhenFetched(document, {}, function (ok, body, xhr) {
        if (ok) {
          // console.log('Loaded  ' + document)
          fulfill(this)
        } else {
          check(ok, body, xhr ? xhr.status : undefined)
          reject()
        }
      })
    }
    )
  }

  outputFile(file, format?: MIME) {
    if (format) {
      this.setFormat(format);
    }
    let out
    try {
      out = $rdf.serialize(this.targetDocument, this.kb, this.targetDocument.uri, this.contentType)
    } catch (e) {
      console.log('Error in serializer: ' + e + this.stackString(e))
    }
    if (!file) {
      console.log('Result: ' + out)
      return
    }
    let doc = $rdf.sym($rdf.uri.join(file, this.base))
    if (doc.uri.slice(0, 7) !== 'file://') {
      console.log('Can only write files just now, sorry: ' + doc.uri);
    }
    let fileName = doc.uri.slice(7) //
    return new Promise(function (fulfilled, rejected) {
      fs.writeFile(fileName, out, "utf8", function (err) {
        if (err) {
          console.log('Error writing file <' + file + '> :' + err)
          rejected(err)
        }
        // console.log('Written ' + fileName)
        fulfilled()
      })
    })
  }

  dump(file) {
    let doc = $rdf.sym($rdf.uri.join(file, this.base))
    $rdf.term()
    let out
    try {
      out = $rdf.serialize(null, this.kb, this.targetDocument.uri, 'application/n-quads') // whole store
    } catch (e) {
      console.log('Error in serializer: ' + e + this.stackString(e))
    }
    console.log(out);
    if (doc.uri.slice(0, 7) !== 'file://') {
      // console.log('Can only write files just now, sorry: ' + doc.uri)
    }
    var fileName = doc.uri.slice(7) //
    return new Promise(function (fulfill, reject) {
      fs.writeFile(fileName, out, function (err) {
        if (err) {
          console.log('Error writing file <' + file + '> :' + err)
          reject(err)
        }
        // console.log('Written ' + fileName)
        fulfill()
      })
    })
  }

  size() {
    console.log(this.kb.statements.length + ' triples')
  }

  version() {
    // console.log('rdflib built: ' + $rdf.buildTime)
  }

  stackString(e) {
    var str = '' + e + '\n'
    if (!e.stack) {
      return str + 'No stack available.\n'
    }
    var lines = e.stack.toString().split('\n')
    var toprint = []
    for (var i = 0; i < lines.length; i++) {
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

    for (var i = 0; i < toprint.length; i++) {
      str += '  ' + toprint[i][1] + '\n    ' + toprint[i][0]
    }
    return str
  }

  reverseSlash(str) {
    // this would uniform the kb in windows and linux but it's still breaking the fetcher so I can't run it.
    // I think it whould be placed inside the fetcher before inserting the literal referring to the loaded file in the kb,
    // but remember that xhr on windows wants "file://folder"
    // if (str[0] !== "/") {
    //     str = "/" + str
    // }
    return str = str.replace(/\\/g, "/");
  }
}

function check(ok, message, status) {
  if (!ok) {
    console.log('Failed ' + status + ': ' + message)
  }
}
