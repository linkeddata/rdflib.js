// General read-parse-serialize data tool
//
// Original motivation: Test rdfa parser
//
// See http://www.w3.org/TR/rdfa-syntax/  etc
//

const $rdf = require('../../lib')
var fs = require('fs')

var kb = $rdf.graph()
var fetcher = $rdf.fetcher(kb)

var contentType = 'text/turtle'
var base = 'file://' + process.cwd() + '/'
var uri
var targetDocument = $rdf.sym(base + 'stdin') // defaul URI of test data

var check = function (ok, message, status) {
  if (!ok) {
    console.log('Failed ' + status + ': ' + message)
    process.exit(2)
  }
}

var stackString = function (e) {
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
    if (line.charAt(0) == '(') {
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


var exitMessage = function (message) {
  console.log(message)
  process.exit(4)
}

var doNext = function (remaining) {
  while (remaining.length) {
    // console.log("... remaining " + remaining.join(' '))

    var command = remaining.shift().split('=')
    var left = command[0],
      right = command[1]
    let doc
    switch (left) {
      case '-base':
        base = $rdf.uri.join(right, base)
        break

      case '-clear':
        kb = $rdf.graph()
        break

      case '-format':
        contentType = right
        break

      case '-in':
        targetDocument = $rdf.sym($rdf.uri.join(right, base))
        // console.log("Document is " + targetDocument)
        fetcher.nowOrWhenFetched(targetDocument, {}, function (ok, body, xhr) {
          check(ok, body, xhr ? xhr.status : undefined)
          console.log('Loaded  ' + targetDocument)
          doNext(remaining)
        }); // target, kb, base, contentType, callback
        return // STOP processing at this level

        case '-out':
          try {
            var options = {flags: 'z'} // Only applies to RDF/XML
            var out = $rdf.serialize(targetDocument, kb, targetDocument.uri, contentType, undefined, options)
          } catch(e) {
            exitMessage('Error in serializer: ' + e + stackString(e))
          }
          if (!right){
            console.log('Result: ' + out)
            doNext(remaining)
            return
          }
          doc = $rdf.sym($rdf.uri.join(right, base))
          if (doc.uri.slice(0, 7) !== 'file://') {
            exitMessage('Can only write files just now, sorry: ' + doc.uri)
          }
          var fileName = doc.uri.slice(7) //
          fs.writeFile(fileName, out, function (err) {
            if (err) {
              exitMessage('Error writing file <' + right + '> :' + err)
            }
            console.log('Written ' + fileName)
            doNext(remaining)
          })
          return

          case '-dump':
            doc = $rdf.sym($rdf.uri.join(right, base))
            try {
              var out = $rdf.serialize(null, kb, targetDocument.uri, 'application/n-quads') // whole store
            } catch(e) {
              exitMessage('Error in serializer: ' + e + stackString(e))
            }
            if (doc.uri.slice(0, 7) !== 'file://') {
              exitMessage('Can only write files just now, sorry: ' + doc.uri)
            }
            var fileName = doc.uri.slice(7) //
            fs.writeFile(fileName, out, function (err) {
              if (err) {
                exitMessage('Error writing file <' + right + '> :' + err)
              }
              console.log('Written ' + fileName)
              doNext(remaining)
            })
            return

      case '-size':
        console.log(kb.statements.length + ' triples')
        break

      case '-version':
        console.log('rdflib built: ' + $rdf.buildTime)
        break

      default:
        console.log('Unknown command: ' + left)
        process.exit(1)
    }
  }
  process.exit(0)
}

doNext(process.argv.slice(2))

// {'forceContentType': 'application/rdfa'}

// http://melvincarvalho.com/
// http://schema.org/Person
