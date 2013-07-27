This is a library for working with RDF on the web.

LICENSE: MIT

Originally targetted at the AJAX environment in the browser,
it can also be used server side with for example Node.js.

Possible out of date information is available from here:

http://dig.csail.mit.edu/2005/ajar/ajaw/Developer.html

This is a linked data library, which can look up data 
on the web as it goes. 

- Reads and writes RDF/xml, turtle and N3.
- Read/Write Linked Data client, using WebDav or SPARQL/Update
- Parses RDF/a. (rdflib-rdfa.js version only)
- Local API for querying store
- SPARQL queries (not full SPARQL)
- Smushing of nodes from owl:sameAs, and owl:{f,inverseF}unctionProperty
- Tracks provence of triples keeps metadata (in RDF) from HTTP accesses

SUBDIRECTORIES

- dist    Run 'make' in this directory to generate dist in whch libraries are buit
- test    Tests are here.

DEPENDENCIES

    jQuery   (rdfa version only)
    jQuery, XMLHTTPRequest (Node.js version)

INSTALL
 
 Install the Node Package Manager https://npmjs.org/
 As root run

```bash
$ npm install -g coffee-script nodeunit   
```
 
 Run `make` to generate the dist directory

THANKS

Thanks to the many contributors who have been involved along the way.
LinkedData team & TimBL
