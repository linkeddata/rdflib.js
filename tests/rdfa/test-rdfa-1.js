
// Test rdfa parser
//
// See http://www.w3.org/TR/rdfa-syntax/  etc
//

$rdf = require('./../../dist/rdflib.js');

kb = $rdf.graph();
f = $rdf.fetcher(kb);
var doc = kb.sym('http://schema.org/Person');
f.nowOrWhenFetched(doc, {'forceContentType': 'application/rdfa'}, function(uri, ok, body) {
    console.log("DONE FETCH");
    var out = $rdf.serialize(doc, kb, doc.uri, 'text/n3')
    console.log(out);
}); // target, kb, base, contentType, callback


