# reference/ — archived pre-TypeScript relics

The files in this directory are **historical reference copies only**. They are
not part of the build, are not exported by the package, and are not expected
to run.

In particular, `dumpParser.js`, `ldpatchParser.js` and `fetcher-classes.js`
build on the legacy hand-rolled `N3Parser`, which was **removed in rdflib 3.0**
(replaced by [N3.js](https://github.com/rdfjs/N3.js); see PR #831). The
`N3Parser` export is now a stub that throws with a pointer to `parse()`.
Anything here that constructs `$rdf.N3Parser(...)` or requires
`./n3parser` documents an API that no longer exists — use
`parse(text, store, baseURI, contentType)` or the
[`n3`](https://www.npmjs.com/package/n3) package directly instead.

The `.coffee` files predate the 2015-era JavaScript port and are kept for
archaeology only.
