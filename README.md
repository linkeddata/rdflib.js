# rdflib.js
[![NPM Version](https://img.shields.io/npm/v/rdflib.svg?style=flat)](https://npm.im/rdflib)
[![Join the chat at https://gitter.im/linkeddata/rdflib.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/linkeddata/rdflib.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Javascript RDF library for browsers and Node.js.

- Reads and writes RDF/XML, Turtle and N3; Reads RDFa and JSON-LD
- Read/Write Linked Data client, using WebDav or SPARQL/Update
- Real-Time Collaborative editing with web sockets and PATCHes
- Local API for querying a store
- Compatible with the [RDF/JS data model specification](https://rdf.js.org/data-model-spec/)
- SPARQL queries (not full SPARQL — a documented subset, see [SPARQL support](#sparql-support))
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

## Creating terms

rdflib implements the [RDF/JS data model specification](https://rdf.js.org/data-model-spec/): terms are created with the factory functions `namedNode()`, `blankNode()`, `literal()`, `variable()` and `quad()`, all exported from the package root (`sym()` is an alias for `namedNode()`).

Note that, per that specification, `literal()` takes **two** arguments — the second one is *either* a language tag *or* a datatype:

```ts
literal(value: string | number | boolean | Date, languageOrDatatype?: string | NamedNode): Literal
```

For example:

```js
import { literal, namedNode } from 'rdflib'

literal('chat')       // plain string literal ("chat"^^xsd:string)
literal('chat', 'fr') // language-tagged literal ("chat"@fr, datatype rdf:langString)
literal('2019', namedNode('http://www.w3.org/2001/XMLSchema#gYear')) // typed literal
literal('2019', 'http://www.w3.org/2001/XMLSchema#gYear')            // same, with the datatype IRI as a string
literal(4)            // convenience form: infers the datatype ("4"^^xsd:integer)
```

A string second argument is interpreted as a datatype IRI when it contains a colon, and as a language tag otherwise.

A common pitfall (present in some older tutorials) is calling `literal(value, undefined, datatype)`: the factory function ignores the third argument and returns a plain `xsd:string` literal. The three-argument form only exists on the class constructor, `new Literal(value, language, datatype)`. To create a typed literal with the factory function, pass the datatype as the second argument, as shown above.

## owl:sameAs smushing and link#uri statements

"Smushing" is the merging of everything a graph knows about two identifiers which are stated to denote the same thing. Stores perform **no** smushing by default (see [#458](https://github.com/linkeddata/rdflib.js/issues/458)); you opt in per feature when creating the store:

```js
const kb = $rdf.graph(['sameAs', 'InverseFunctionalProperty', 'FunctionalProperty'])
```

With the `sameAs` feature enabled, whenever a statement `A owl:sameAs B` is added the store equates the two nodes: one of them is chosen as canonical and all statements are re-indexed under it, so queries about either identifier see the merged data. The `InverseFunctionalProperty` and `FunctionalProperty` features likewise equate nodes which share a value of such a property.

When two nodes are equated, the store records the equivalence by adding one statement of the form:

```
<canonical> <http://www.w3.org/2007/ont/link#uri> <obsoleted> .
```

that is, a back-link from the canonical node to the identifier it replaced. This is internal book-keeping: it is how the store remembers aliases, so that `store.uris(term)` and `store.allAliases(node)` can list all the identifiers something is known by. It is stored like any other statement, though, so you may encounter these triples when querying or serializing a store that has smushing enabled. If a Fetcher is attached to the store, equating two nodes also triggers a look-up of the newly-learned alias, so that data published under either URI gets loaded.

The same `http://www.w3.org/2007/ont/link#` namespace is also used by the Fetcher for the HTTP metadata (requests, responses, status codes) it records; that metadata lives in a separate metadata graph and can be removed with `store.removeMetadata(doc)`.

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

## SPARQL support

rdflib is not a SPARQL engine, but it accepts a well-defined subset of SPARQL
in two places. Both are parsed with [sparqljs](https://github.com/RubenVerborgh/SPARQL.js),
so anything accepted is real SPARQL 1.1 syntax and syntax errors are reported
with clear messages.

#### Queries: `SPARQLToQuery(sparql, testMode, kb)`

`SPARQLToQuery` translates a SPARQL string onto rdflib's pattern-matching
`Query` object, which you can run against a store with `kb.query(query,
onResult, fetcher?, onDone?)` or `kb.querySync(query)`:

```js
const query = $rdf.SPARQLToQuery(`
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  SELECT ?name WHERE {
    ?person a foaf:Person ;
            foaf:name ?name .
    OPTIONAL { ?person foaf:nick ?nick . }
    FILTER regex(?name, "^A")
  }`, false, kb)

kb.query(query, bindings => console.log(bindings['?name'].value))
```

The supported subset is:

- `SELECT ?x ?y WHERE { ... }` and `SELECT * WHERE { ... }` (a `CONSTRUCT`
  query is executed as a `SELECT` over its `WHERE` clause: the API returns
  variable bindings, not graphs)
- basic graph patterns: triple patterns with `;`/`,` abbreviations, `a`,
  prefixed names, IRIs, literals and blank nodes (`rdf:` and `rdfs:` are
  predeclared)
- `OPTIONAL { ... }` groups, which may nest and may contain `FILTER`s
- `FILTER` constraints of the forms `FILTER (?x = constant)`,
  `FILTER (?x > constant)`, `FILTER (?x < constant)` and
  `FILTER regex(?x, "pattern"[, "flags"])`

Everything else — `ASK`/`DESCRIBE`, property paths, `UNION`, `GRAPH`, `FROM`,
`BIND`, `VALUES`, subqueries, aggregates and solution modifiers such as
`ORDER BY`/`LIMIT`/`DISTINCT`, other `FILTER` operators — throws an
informative error naming the unsupported construct. If you need full SPARQL
1.1, run a real engine (e.g. [Comunica](https://comunica.dev/)) over the
store instead.

#### Updates

`UpdateManager.update(deletions, insertions, callback?)` writes changes back
to the web by generating spec-conformant SPARQL 1.1 Update (or N3 Patch)
requests — you never write SPARQL yourself. The patch parser used for
`text/n3`-less servers (`application/sparql-update` documents fed to
`parse()`) accepts `INSERT DATA`, `DELETE DATA`, and `DELETE/INSERT/WHERE`
operations built from basic graph patterns, with `PREFIX` (or legacy
`@prefix ... .`) declarations, in any clause order.

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
