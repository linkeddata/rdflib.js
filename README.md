# rdflib.js
[![NPM Version](https://img.shields.io/npm/v/rdflib.svg?style=flat)](https://npm.im/rdflib)
[![Join the chat at https://gitter.im/linkeddata/rdflib.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/linkeddata/rdflib.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Javascript RDF library for browsers and Node.js.

- Reads and writes RDF/xml, Turtle and N3.
- Read/Write Linked Data client, using WebDav or SPARQL/Update
- Parses RDF/a
- Local API for querying a store
- SPARQL queries (not full SPARQL)
- Smushing of nodes from `owl:sameAs`, and `owl:{f,inverseF}unctionProperty`
- Tracks provence of triples keeps metadata (in RDF) from HTTP accesses

## Documentation

See **[Tutorial for using rdflib.js](https://github.com/solid/solid-tutorial-rdflib.js)**
for more information.

Possible out of date information is available from here:
[http://dig.csail.mit.edu/2005/ajar/ajaw/Developer.html](http://dig.csail.mit.edu/2005/ajar/ajaw/Developer.html).

## Install

```bash
npm install
```

Generate the dist directory

```bash
make all
```

#### Node.js

Make sure you have Node.js and Node Package Manager ([npm](https://npmjs.org/))
installed.

```bash
npm install --save rdflib
```

## Contribute

#### Subdirectories

- `dist`, Run 'make' in this directory to generate dist in which libraries are
  built
- `test`, Tests are here.

#### Dependencies

    - jQuery   (rdfa version only)
    - jQuery, XMLHTTPRequest (Node.js version)

## Thanks

Thanks to the many contributors who have been involved along the way.
LinkedData team & TimBL

## LICENSE
MIT
