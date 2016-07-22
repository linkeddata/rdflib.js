# rdflib.js Makefile

PATH:=./node_modules/.bin:${PATH}

all: dist dist/rdflib.js dist/rdflib.min.js

size:
	wc $R

dist/rdflib.js:
	browserify -r ./index.js:rdflib --exclude "xmlhttprequest" --standalone "\$$rdf" > dist/rdflib.js

dist/rdflib.min.js:
	browserify -r ./index.js:rdflib --exclude "xmlhttprequest" --standalone "\$$rdf" -d -p [minifyify --no-map] > dist/rdflib.min.js

dist:
	mkdir -p dist

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
	rm -f dist/*

cleantest:
	rm tests/serialize/,t1.xml
	rm tests/serialize/,t2.xml
	rm tests/serialize/,t3.xml
	rm tests/serialize/,t4.ttl
	rm tests/serialize/,t5.ttl
	rm tests/serialize/,t6.n3

status:
	@pwd
	@git branch -v
	@git status -s

minify: dist/rdflib.min.js

writable:
	@sed -i -re 's/git:\/\/github.com\//git@github.com:/' .git/config

.PHONY: test
test: # $(LIB)
	@nodeunit tests/*.js
	make -C tests/serialize
