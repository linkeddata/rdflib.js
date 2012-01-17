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
# But module.exports = $rdf should

dist/node-rdflib.js: $R
	echo "module.exports = \$$rdf = function() {" > $@
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

jquery.uri.js:
	wget http://rdfquery.googlecode.com/svn-history/trunk/jquery.uri.js -O $@
#
jquery.xmlns.js:
	wget http://rdfquery.googlecode.com/svn-history/trunk/jquery.xmlns.js -O $@

upstream: jquery.uri.js jquery.xmlns.js

.PHONY: detach gh-pages

detach:
	git checkout origin/master
	git reset --hard HEAD
	
gh-pages: detach all
	git branch -D gh-pages ||:
	git checkout -b gh-pages
	git add -f dist/*.js
	git commit -m 'gh-pages: add dist'
	git push -f origin gh-pages
	git checkout master
