

#J=../jquery
J=.
Q=../jquery/jquery-1.4.2.min.js
X=$J/jquery.uri.js $J/jquery.xmlns.js

# rdfa.js

R=util.js uri.js term.js match.js rdfparser.js \
n3parser.js identity.js rdfs.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js web.js


rdflib.js: $R
	echo "\$$rdf = function() {" > rdflib.js
	cat $R >> rdflib.js
	echo "return \$$rdf;}()" >> rdflib.js

node-rdflib.js: $R
	echo "module.\$$rdf = function() {" > $@
	cat $R >> $@
	echo "return \$$rdf;}()" >> $@

rdf-rdfa-lib.js: $X $R rdfa.js
	cat $X > rdf-rdfa-lib.js
	echo "\$$rdf = function() {" >> rdf-rdfa-lib.js
	cat $R rdfa.js >> rdf-rdfa-lib.js
	echo "return \$$rdf;}()" >> rdf-rdfa-lib.js

#jq-rdflib.js : rdf-rdfa-lib.js rdfa.js
#	cat $Q rdf-rdfa-lib.js > jq-rdflib.js 
