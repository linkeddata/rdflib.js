// General read-parse-serialize data tool
//
// Original motivation: Test rdfa parser
//
// See http://www.w3.org/TR/rdfa-syntax/  etc
//

$rdf = require('./../../dist/rdflib-node.js')
var fs = require('fs')

var kb = $rdf.graph()
var fetcher = $rdf.fetcher(kb)

var contentType = 'text/turtle'
var base = 'file://' + process.cwd() + '/'
var uri
var targetDocument

var check = function (ok, message, status) {
  if (!ok) {
    console.log('Failed ' + status + ': ' + message)
    process.exit(2)
  }
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
    switch (left) {
      case '-base':
        base = $rdf.uri.join(right, base)
        break

      case '-clear':
        kb = $rdf.graph()
        break

      case '-dump':
        console.log('Serialize ' + targetDocument + ' as ' + contentType)
        try {
          var out = $rdf.serialize(targetDocument, kb, targetDocument.uri, contentType)
        } catch(e) {
          exitMessage('Error in serializer: ' + e)
        }
        console.log('Result: ' + out)
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
        doc = $rdf.sym($rdf.uri.join(right, base))
        try {
          var out = $rdf.serialize(targetDocument, kb, targetDocument.uri, contentType)
        } catch(e) {
          exitMessage('Error in serializer: ' + e)
        }
        if (doc.uri.slice(0, 8) !== 'file:///') {
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
