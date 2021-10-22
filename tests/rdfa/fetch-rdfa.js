// Test rdfa parser
//
// See http://www.w3.org/TR/rdfa-syntax/  etc
//

var $rdf = require('./../../index.js')

var kb = $rdf.graph()
var f = $rdf.fetcher(kb)
var doc = kb.sym(process.argv[2])
f.nowOrWhenFetched(doc, {'forceContentType': 'application/rdfa'}, function (uri, ok, body) {
  console.log('DONE FETCH')
  var out = $rdf.serialize(doc, kb, doc.uri, 'text/n3')
  console.log(out)
  console.log('EXIT')
  process.exit()
}) // target, kb, base, contentType, callback

// {'forceContentType': 'application/rdfa'}

// http://melvincarvalho.com/
// http://schema.org/Person
