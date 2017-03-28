# Crude tests for particular serializer bugs

all: t1 t2 t3 t4 t5 t6 t7

clean:
	rm ,* || echo ok

#  Problem: not adding the type of an object!
t1:
	node ./data.js -in=t1.ttl -format=application/rdf+xml -out=,t1.xml
	grep "http://www.w3.org/2001/XMLSchema#integer" ,t1.xml

t2:
	node ./data.js -in=t2.ttl -format=application/rdf+xml  -out=,t2.xml
	diff ,t2.xml t2-ref.xml

t3:
	node ./data.js -in=t3.ttl -format=application/rdf+xml  -out=,t3.xml
	diff ,t3.xml t3-ref.xml

t4:
	node ./data.js -in=t3.ttl  -out=,t4.ttl
	diff ,t4.ttl t4-ref.ttl

# Suppress = and => in turtle
t5:
	node ./data.js -in=t5.n3 -format=text/turtle -out=,t5.ttl
	diff ,t5.ttl t5-ref.ttl
t6:
	node ./data.js -in=t5.n3 -format=text/n3 -out=,t6.n3
	diff ,t6.n3 t6-ref.n3

#   NTriple output
t7:
	node ./data.js -in=t7.n3 -format=application/n-triples -out=,t7.nt
	diff ,t7.nt t7-ref.nt

	# NQUADS t8 ends up including todays datetime in data so not reproducable
t8:
	node ./data.js -in=t5.n3  -format=application/n-quads -dump=,t8.nq
	diff ,t8.nq t8-ref.nq
	#   NTriple output
t9:
		node ./data.js -in=t7.n3 -format=application/ld+json -out=,t9.json
		diff ,t9.json t9-ref.json
