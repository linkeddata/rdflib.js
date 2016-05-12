# Crude tests for particular serializer bugs

all: t1 t2 t3 t4 t5 t6

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
