

#J=../jquery
J=.
Q=../jquery/jquery-1.4.2.min.js
X=$J/jquery.uri.js $J/jquery.xmlns.js

# rdfa.js

R=util.js uri.js term.js match.js rdfparser.js \
n3parser.js identity.js rdfs.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js web.js


rdflib.js: $R
	echo "\$$rdf = function() {" >> rdflib.js
	cat $R >> rdflib.js
	echo "return \$$rdf;}()" >> rdflib.js

rdflib2.js: $X $R rdfa.js
	cat $X > rdflib2.js
	echo "\$$rdf = function() {" >> rdflib.js
	cat $R rdfa.js >> rdflib.js
	echo "return \$$rdf;}()" >> rdflib.js

jq-rdflib.js : rdflib2.js rdfa.js
	cat $Q rdflib2.js > jq-rdflib.js 
