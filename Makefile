

J=../jquery
Q=$J/jquery-1.4.2.min.js
X=$J/jquery.uri.js $J/jquery.xmlns.js
R=util.js uri.js term.js match.js rdfparser.js rdfa.js \
n3parser.js identity.js rdfs.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js web.js


rdflib.js: $X $R
	cat $X > rdflib.js
	echo "\$$rdf = function() {" >> rdflib.js
	cat $R >> rdflib.js
	echo "return \$$rdf;}()" >> rdflib.js

jq-rdflib.js : rdflib.js 
	cat $Q rdflib.js > jq-rdflib.js 
