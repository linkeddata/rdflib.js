# rdflib.js Makefile

R=util.js uri.js term.js rdfparser.js n3parser.js identity.js rdfaparser.js  \
	patchParser.js query.js sparql.js update.js jsonparser.js serialize.js \
	updatesVia.js web.js

targets=$(addprefix dist/, rdflib-node.js)
# coffeejs=$(patsubst %.coffee,%.js,$(wildcard *.coffee))

PATH:=./node_modules/.bin:${PATH}

all: dist $(targets) dist/rdflib.js dist/rdflib.min.js

size:
	wc $R

dist/rdflib.js: dist/rdflib-node.js
	browserify -r ./dist/rdflib-node.js:rdflib --exclude "xmlhttprequest" --standalone "\$$rdf" > dist/rdflib.js

dist/rdflib.min.js: dist/rdflib-node.js
	browserify -r ./dist/rdflib-node.js:rdflib --exclude "xmlhttprequest" --standalone "\$$rdf" -d -p [minifyify --no-map] > dist/rdflib.min.js

dist:
	mkdir -p dist

dist/rdflib-node.js: $R module.js
# dist/rdflib.js: $R module.js
	echo "(function(root, undef) {" > $@
	cat $R module.js >> $@
	date '+$$rdf.buildTime = "%Y-%m-%dT%H:%M:%S";'  >> $@
	echo '})(this);' >> $@

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
	rm -f $(targets)
	rm -f dist/*


status:
	@pwd
	@git branch -v
	@git status -s

minify: dist/rdflib.min.js

writable:
	@sed -i -re 's/git:\/\/github.com\//git@github.com:/' .git/config

# npm install -g coffee-script nodeunit

# SRC=$(wildcard *.coffee */*.coffee)
# LIB=$(SRC:%.coffee=%.js)

# %.js: %.coffee
# 	coffee -bp $< > $@

# .PHONY: coffee
# coffee: $(LIB)

.PHONY: test
test: # $(LIB)
	@nodeunit tests/*.js
	make -C tests/serialize
