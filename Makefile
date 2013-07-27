# rdflib.js Makefile

R=src/util.js make/src/uri.js make/src/term.js src/rdfparser.js src/n3parser.js src/identity.js src/query.js src/sparql.js src/sparqlUpdate.js src/jsonparser.js src/serialize.js make/src/updatesVia.js src/web.js

targets=$(addprefix dist/, rdflib.js node-rdflib.js rdflib-rdfa.js)
coffeejs=$(patsubst %.coffee,make/%.js,$(wildcard */*.coffee))

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
X=jquery.uri.js jquery.xmlns.js

dist/rdflib-rdfa.js: $X $R src/rdfa.js
	cat $X > $@
	echo "\$$rdf = function() {" >> $@
	cat $R src/rdfa.js >> $@
	echo "return \$$rdf;}()" >> $@

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

#   WARNING  .. don't do this if you have uncommitted local changes
#
gh-pages: detach all
	git branch -D gh-pages ||:
	git checkout -b gh-pages
	git add -f dist/*.js *.js
	git commit -m 'gh-pages: update to latest'
	git push -f origin gh-pages
	git checkout master

clean:
	rm -f $(targets) $(coffeejs)

status:
	@pwd
	@git branch -v
	@git status -s

writable:
	@sed -i -re 's/git:\/\/github.com\//git@github.com:/' .git/config

# npm install -g coffee-script nodeunit

testjs=$(patsubst %.coffee,make/%.js,$(wildcard tests/*.coffee))
#LIB=$(SRC)

make/src/%.js: src/%.coffee 
	mkdir -p make/src
	coffee -bp $< > $@

make/tests/%.js: tests/%.coffee
	mkdir -p make/tests
	coffee -bp $< > $@

.PHONY: coffee
coffee: $(testjs)

.PHONY: test
test: $(testjs)
	@nodeunit make/tests/*.js


