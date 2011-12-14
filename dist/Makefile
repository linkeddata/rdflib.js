# rdflib.js Makefile

R=$(addprefix ../,util.js uri.js term.js match.js rdfparser.js n3parser.js identity.js rdfs.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js web.js)

all: rdflib.js node-rdflib.js rdflib-rdfa.js

rdflib.js: $R
	echo "\$$rdf = function() {" > $@
	cat $R >> $@
	echo "return \$$rdf;}()" >> $@

node-rdflib.js: $R
	echo "module.\$$rdf = function() {" > $@
	cat $R >> $@
	echo "return \$$rdf;}()" >> $@

J=.
Q=$J/jquery-1.4.2.min.js
X=$J/jquery.uri.js $J/jquery.xmlns.js

rdflib-rdfa.js: $X $R ../rdfa.js
	cat $X > $@
	echo "\$$rdf = function() {" >> $@
	cat $R ../rdfa.js >> $@
	echo "return \$$rdf;}()" >> $@

jquery-1.4.2.min.js:
	wget http://code.jquery.com/jquery-1.4.2.min.js

jquery.uri.js:
	wget http://rdfquery.googlecode.com/svn-history/trunk/jquery.uri.js

jquery.xmlns.js:
	wget http://rdfquery.googlecode.com/svn-history/trunk/jquery.xmlns.js
