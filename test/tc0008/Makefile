# Where do you keep your node instalations?

N=/devel/npmjs.org/node_modules

# I also needed for xmllibjs install:
# port install scors

# See also http://npmjs.org/ for npm
# http://nodejs.org/ for node

X=$J/jquery.uri.js $J/jquery.xmlns.js

# rdfa.js

R=util.js uri.js term.js rdfparser.js \
n3parser.js identity.js query.js sparql.js sparqlUpdate.js jsonparser.js serialize.js web.js


npm:
	npm install jquery xmllibjs
test:
	NODE_PATH=$N node node-test.js

# Do node-inspector in diff windows .. but for the record:
debug:
	node-inspector &
	open http://0.0.0.0:8080/debug?port=5858
	node --debug-brk node-test-writeStore.js

rdflib2.js: $X $R rdfa.js
	cat $X > rdflib2.js
	echo "\$$rdf = function() {" >> rdflib2.js
	cat $R rdfa.js >> rdflib2.js
	echo "return \$$rdf;}()" >> rdflib2.js
