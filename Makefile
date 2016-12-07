# rdflib.js Makefile

PATH:=./node_modules/.bin:${PATH}

all: dist dist/rdflib.js dist/rdflib.min.js

size:
	wc $R

dist/rdflib.js:
	browserify -r ./src/index.js:rdflib --exclude "xmlhttprequest" --standalone "\$$rdf" -t [ babelify --presets [ es2015 ] ] -o dist/rdflib.js

dist/rdflib.min.js:
	browserify -r ./src/index.js:rdflib --exclude "xmlhttprequest" --standalone "\$$rdf" -d -t [ babelify --presets [ es2015 ] ] -p [ minifyify --no-map --uglify [ --compress [ --dead_code --conditionals --unused --if_return ] --mangle --screw-ie8 ] ] -o dist/rdflib.min.js

dist:
	mkdir -p dist

.PHONY: lib
lib:
	babel src -d lib

.PHONY: detach
detach:
	git checkout origin/master
	git reset --hard HEAD

#   WARNING  .. don't do this if you have uncommitted local changes
#
.PHONY: gh-pages
gh-pages: detach
	git branch -D gh-pages ||:
	git checkout -b gh-pages
	make -B
	git add -f dist/*.js src/*.js *.js
	git commit -m 'gh-pages: update to latest'
	git push -f origin gh-pages
	git checkout master

clean:
	rm -f dist/*
	rm -f lib/*

cleantest:
	rm tests/serialize/,t1.xml
	rm tests/serialize/,t2.xml
	rm tests/serialize/,t3.xml
	rm tests/serialize/,t4.ttl
	rm tests/serialize/,t5.ttl
	rm tests/serialize/,t6.n3
	rm tests/serialize/,t7.nt

status:
	@pwd
	@git branch -v
	@git status -s

minify: dist/rdflib.min.js

writable:
	@sed -i -re 's/git:\/\/github.com\//git@github.com:/' .git/config

.PHONY: test
test:
	@nodeunit tests/unit/nodeunit/*.js
	make -C tests/serialize
	make cleantest
