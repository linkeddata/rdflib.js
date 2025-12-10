# rdflib.js
[![NPM Version](https://img.shields.io/npm/v/rdflib.svg?style=flat)](https://npm.im/rdflib)
[![Join the chat at https://gitter.im/linkeddata/rdflib.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/linkeddata/rdflib.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Javascript RDF library for browsers and Node.js.

- Reads and writes RDF/XML, Turtle and N3; Reads RDFa and JSON-LD
- Read/Write Linked Data client, using WebDav or SPARQL/Update
- Real-Time Collaborative editing with web sockets and PATCHes
- Local API for querying a store
- Compatible with [RDFJS task force spec](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md)
- SPARQL queries (not full SPARQL - just graph match and optional)
- Smushing of nodes from `owl:sameAs`, and `owl:{f,inverseF}unctionProperty`
- Tracks provenance of triples keeps metadata (in RDF) from HTTP accesses

## Documentation

See:

* The [API documentation](https://linkeddata.github.io/rdflib.js/doc/) is partial but useful
* [Tutorial: Using rdflib in a Solid web app](https://linkeddata.github.io/rdflib.js/Documentation/webapp-intro.html)
* [Tutorial: Using rdflib.js](https://github.com/solidos/solid-tutorial-rdflib.js)
* [Tutorial: Using Turtle](https://linkeddata.github.io/rdflib.js/Documentation/turtle-intro.html)
* [Using authenticated & alternate fetch methods](https://linkeddata.github.io/rdflib.js/Documentation/alternate-fetches.md)
* [Block diagram: rdflib modules](https://linkeddata.github.io/rdflib.js/Documentation/diagrams/rdflib-block-diagram.svg)
* [Block diagram: The Fetcher](https://linkeddata.github.io/rdflib.js/Documentation/diagrams/fetcher-block-diagram.svg)
* [Block diagram: The Fetcher - handling retries](https://linkeddata.github.io/rdflib.js/Documentation/diagrams/fetcher-block-diagram-2.svg)
* [Block diagram: The Update Manager](https://linkeddata.github.io/rdflib.js/Documentation/diagrams/update-manager-diagram.svg)


* [The Solid developer portal at Inrupt](https://solid.inrupt.com/)

for more information.

## Install

#### Browser (using a bundler like Webpack)

```bash
npm install rdflib
```

#### Browser (generating a `<script>` file to include)

```bash
git clone git@github.com:linkeddata/rdflib.js.git;
cd rdflib.js;
npm install;
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

## Serializer flags

The Turtle/N3/JSON‑LD serializers accept an optional `flags` string to tweak output formatting and abbreviation behavior.

- Pass flags via the options argument to `serialize(...)`:

```ts
import { graph, serialize, sym } from 'rdflib'

const kb = graph()
const doc = sym('http://example.com/doc')
// ... add some statements ...

// Example: prevent dotted local parts in prefixed names
const turtle = serialize(doc, kb, doc.value, 'text/turtle', undefined, { flags: 'o' })
```

Common flags used internally (you can combine them, e.g. `'o k'`):

- `s` `i` – used by default for Turtle to suppress `=`, `=>` notations
- `d e i n p r s t u x` – used for N-Triples/N-Quads to simplify output
- `dr` – used with JSON‑LD conversion (no default, no relative prefix)
- `o` – new: do not abbreviate to a prefixed name when the local part contains a dot. This keeps IRIs like
  `http://example.org/ns/subject.example` in `<...>` form instead of `ns:subject.example`.

Notes:

- For Turtle and JSON‑LD, user‑provided flags are merged with the defaults so your flags (like `o`) are honored.
- By contrast, passing `'p'` disables prefix abbreviations entirely (all terms are written as `<...>` IRIs).

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
