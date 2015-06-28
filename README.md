# rdflib.js

[![Join the chat at https://gitter.im/linkeddata/rdflib.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/linkeddata/rdflib.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Javascript RDF library for browsers and NodeJS.

- Reads and writes RDF/xml, turtle and N3.
- Read/Write Linked Data client, using WebDav or SPARQL/Update
- Parses RDF/a. (rdflib-rdfa.js version only)
- Local API for querying store
- SPARQL queries (not full SPARQL)
- Smushing of nodes from owl:sameAs, and owl:{f,inverseF}unctionProperty
- Tracks provence of triples keeps metadata (in RDF) from HTTP accesses

## Install

#### Browser

Install dependencies you may need to generate the js file.

```bash
$ npm install -g coffee-script nodeunit   
```

Generate the dist directory

```bash
$ npm install
```

#### NodeJS

Make sure you have NodeJS and Node Package Manager ([npm](https://npmjs.org/)) installed.
```bash
npm install --save rdflib
```

## Documentation

Possible out of date information is available from here: [http://dig.csail.mit.edu/2005/ajar/ajaw/Developer.html](http://dig.csail.mit.edu/2005/ajar/ajaw/Developer.html).

## Contribute

#### Subdirectories

- `dist`, Run 'make' in this directory to generate dist in whch libraries are buit
- `test`, Tests are here.

#### Dependencies

    - jQuery   (rdfa version only)
    - jQuery, XMLHTTPRequest (Node.js version)

## Thanks

Thanks to the many contributors who have been involved along the way.
LinkedData team & TimBL

## LICENSE
MIT
