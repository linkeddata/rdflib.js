# rdflib.js Makefile

R=util.js uri.js term.js match.js rdfparser.js n3parser.js identity.js rdfs.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js web.js

targets=$(addprefix dist/, rdflib.js node-rdflib.js rdflib-rdfa.js)

all: dist $(targets)

dist:
	mkdir -p dist

dist/rdflib.js: $R
	echo "\$$rdf = function() {" > $@
	cat $R >> $@
	echo "return \$$rdf;}()" >> $@

# Currently the blow is suboptimal == you have to say $rdf=require(â€¦).$rdf
# but this doesn't work at all: echo "module.\$$rdf = function() {" > $@

dist/node-rdflib.js: $R
	echo "exports.\$$rdf = function() {" > $@
	cat $R >> $@
	echo "return \$$rdf;}()" >> $@

J=dist
Q=$J/jquery-1.4.2.min.js
X=jquery.uri.js jquery.xmlns.js

dist/rdflib-rdfa.js: $X $R rdfa.js
	cat $X > $@
	echo "\$$rdf = function() {" >> $@
	cat $R rdfa.js >> $@
	echo "return \$$rdf;}()" >> $@

dist/jquery-1.4.2.min.js:
	wget http://code.jquery.com/jquery-1.4.2.min.js -O $@

#dist/jquery.uri.js:
#	wget http://rdfquery.googlecode.com/svn-history/trunk/jquery.uri.js -O $@
#
#dist/jquery.xmlns.js:
#	wget http://rdfquery.googlecode.com/svn-history/trunk/jquery.xmlns.js -O $@
