# rdflib.js
[![NPM Version](https://img.shields.io/npm/v/rdflib.svg?style=flat)](https://npm.im/rdflib)
[![Join the chat at https://gitter.im/linkeddata/rdflib.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/linkeddata/rdflib.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Javascript RDF library for browsers and Node.js.

- Reads and writes RDF/XML, Turtle and N3; Reads RDFa and JSON-LD
- Read/Write Linked Data client, using WebDav or SPARQL/Update
- Local API for querying a store
- Compatible with [RDFJS task force spec](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md)
- SPARQL queries (not full SPARQL)
- Smushing of nodes from `owl:sameAs`, and `owl:{f,inverseF}unctionProperty`
- Tracks provenance of triples keeps metadata (in RDF) from HTTP accesses

## Documentation

See:

* The [API documentation](https://linkeddata.github.io/rdflib.js/doc/) is partial but useful
* [Using rdflib in a web app](https://linkeddata.github.io/rdflib.js/Documentation/webapp-intro.html)
* [Tutorial for using rdflib.js](https://github.com/solid/solid-tutorial-rdflib.js)
* [Using Turtle](https://linkeddata.github.io/rdflib.js/Documentation/turtle-intro.html)
* [The Solid developer portal at Inrupt](https://solid.inrupt.com/)

for more information.

## Install

```bash
npm install
```

Generate the dist directory

```bash
npm run build:browser
```

#### Node.js

Make sure you have Node.js and Node Package Manager ([npm](https://npmjs.org/))
installed.

```bash
npm install --save rdflib
```

## Contribute

#### Subdirectories

- `dist`: Where the bundled libraries are built. Run `npm run build` to generate them.
- `test`: Tests are here.
- `lib`: Transpiled, non-bundled library is built here when the library is
  published to npm.

#### Dependencies

    - XMLHTTPRequest (Node.js version)

## Thanks

Thanks to the many contributors who have been involved along the way.
LinkedData team & TimBL

## LICENSE
MIT
