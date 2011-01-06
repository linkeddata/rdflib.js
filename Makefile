rdflib.js: util.js uri.js term.js match.js rdfparser.js rdfa.js n3parser.js identity.js rdfs.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js web.js
	echo "\$$rdf = function() {" > rdflib.js
	cat $^ >> rdflib.js
	echo "return \$$rdf;}()" >> rdflib.js
