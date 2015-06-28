# rdflib.js Makefile

R=util.js uri.js term.js rdfparser.js n3parser.js identity.js \
	patchParser.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js updatesVia.js web_browserify.js

A=util.js uri.js term.js rdfparser.js n3parser.js identity.js \
	green-turtle/src/RDFaProcessor.js rdfa.js \
	patchParser.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js updatesVia.js web_browserify.js

targets=$(addprefix dist/, rdflib.js rdflib-rdfa.js)
coffeejs=$(patsubst %.coffee,%.js,$(wildcard *.coffee))

PATH:=./node_modules/.bin:${PATH}

all: browserify dist $(targets)

browserify:
	browserify web.js -o web_browserify.js

dist:
	mkdir -p dist

alpha: dist/rdflib-alpha.js
	echo

dist/rdflib-alpha.js: $R module.js
	echo "(function(root, undef) {" > $@
	cat $R module.js >> $@
	echo "})(this);" >> $@

dist/rdflib.js: $R module.js
	echo "(function(root, undef) {" > $@
	cat $R module.js >> $@
	echo "})(this);" >> $@

J=dist
X=jquery.uri.js jquery.xmlns.js

dist/rdflib-rdfa.js: $X $R rdfa.js module.js
	cat $X > $@
	echo "(function(root, undef) {" > $@
	cat $R rdfa.js module.js >> $@
	echo "})(this);" >> $@

# This URL rotted and we don't update this anymore 2015-02
#jquery.uri.js:
#	wget http://rdfquery.googlecode.com/svn-history/trunk/jquery.uri.js -O $@
#
#jquery.xmlns.js:
#	wget http://rdfquery.googlecode.com/svn-history/trunk/jquery.xmlns.js -O $@

upstream: jquery.uri.js jquery.xmlns.js

.PHONY: detach gh-pages

detach:
	git checkout origin/master
	git reset --hard HEAD

#   WARNING  .. don't do this if you have uncommitted local changes
#
gh-pages: detach
	git branch -D gh-pages ||:
	git checkout -b gh-pages
	make -B
	git add -f dist/*.js *.js
	git commit -m 'gh-pages: update to latest'
	git push -f origin gh-pages
	git checkout master

clean:
	rm -f $(targets) $(coffeejs)
	rm -f web_browserify.js

status:
	@pwd
	@git branch -v
	@git status -s

writable:
	@sed -i -re 's/git:\/\/github.com\//git@github.com:/' .git/config

# npm install -g coffee-script nodeunit

SRC=$(wildcard *.coffee */*.coffee)
LIB=$(SRC:%.coffee=%.js)

%.js: %.coffee
	coffee -bp $< > $@

.PHONY: coffee
coffee: $(LIB)

.PHONY: test
test: $(LIB)
	@nodeunit tests/*.js
