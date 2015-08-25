
// Test rdfa parser
//
// See http://www.w3.org/TR/rdfa-syntax/  etc
//

$rdf = require('./../../dist/rdflib-rdfa.js');

kb = $rdf.graph();
f = $rdf.fetcher(kb);
var doc = kb.sym('http://schema.org/Person');
f.nowOrWhenFetched(doc, undefined, function(uri, ok, body) {
    console.log("DONE FETCH");
    var out = $rdf.serialize(doc, kb, doc.uri, 'text/n3')
    console.log(out);
}); // target, kb, base, contentType, callback


