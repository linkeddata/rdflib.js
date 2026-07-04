/**
 * Adapter between the N3.js parser and rdflib's data model.
 *
 * All Turtle-family content types (Turtle, TriG, N-Triples, N-Quads and full
 * Notation3) are parsed by the spec-compliant, optimised N3.js parser; this
 * module maps its flat quad stream back onto rdflib's richer model:
 *
 *  - `( … )` collections are folded into rdflib `Collection` terms using
 *    N3.js's own list machinery (`Store#extractLists`);
 *  - N3 formulae `{ … }` (which N3.js emits as quads whose graph is a fresh
 *    blank node) are rebuilt into rdflib `Formula` sub-stores;
 *  - `@forAll` / `@forSome` declarations (reified by N3.js under
 *    `explicitQuantifiers`) are registered through `newUniversal` /
 *    `declareExistential`, as the legacy parser did;
 *  - `?x` becomes a `Variable`, `=` becomes `owl:sameAs`, `=>`/`<=` become
 *    (reversed) `log:implies` — all handled natively by N3.js's n3 mode.
 *
 * Statements in the default graph are attributed to the document graph
 * `kb.sym(base)` — rdflib's provenance convention — while explicit named
 * graphs (TriG / N-Quads) are kept as-is.
 */
import { Parser as N3jsParser, Store as N3jsStore, DataFactory as N3jsDataFactory } from 'n3'
import Collection from './collection'
import Formula from './formula'
import Variable from './variable'
import {
  TurtleContentType,
  TurtleLegacyContentType,
  N3ContentType,
  N3LegacyContentType,
  NTriplesContentType,
  NQuadsContentType,
  NQuadsAltContentType,
  TrigContentType,
} from './types'

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const RDF_FIRST = RDF_NS + 'first'
const RDF_REST = RDF_NS + 'rest'
const RDF_NIL = RDF_NS + 'nil'

/** The graph N3.js reifies quantifier declarations into (explicitQuantifiers). */
const QUANTIFIERS_GRAPH = 'urn:n3:quantifiers'
const REIFY_FOR_ALL = 'http://www.w3.org/2000/10/swap/reify#forAll'
const REIFY_FOR_SOME = 'http://www.w3.org/2000/10/swap/reify#forSome'

/** Distinct document-label prefix per n3-mode parse (see label repair below). */
let docLabelCounter = 0

/**
 * The rdflib content types parsed by N3.js, mapped to the N3.js `format`
 * string that enforces the right grammar for each.
 */
export const N3JS_FORMATS: { [contentType: string]: string } = {
  [TurtleContentType]: 'text/turtle',
  [TurtleLegacyContentType]: 'text/turtle',
  [N3ContentType]: 'text/n3',
  [N3LegacyContentType]: 'text/n3',
  [NTriplesContentType]: 'application/n-triples',
  [NQuadsContentType]: 'application/n-quads',
  [NQuadsAltContentType]: 'application/n-quads',
  [TrigContentType]: 'application/trig',
}

/** Options accepted by {@link parseN3js} (a subset of `parse()`'s options). */
export type ParseN3jsOptions = {
  /**
   * Canonicalize the lexical forms of boolean and numeric literals at parse
   * time, as rdflib ≤2 did — see the `canonicalize` option of `parse()`.
   */
  canonicalize?: boolean
}

/**
 * Parse a Turtle-family document with N3.js and load it into the given store.
 *
 * @param str - The document body
 * @param kb - The store (or plain Formula) to load the statements into
 * @param base - The base IRI for relative-IRI resolution; also names the document graph
 * @param contentType - One of the content types in {@link N3JS_FORMATS}
 * @param [options] - Parse options; see {@link ParseN3jsOptions}
 * @returns The number of statements loaded
 */
export default function parseN3js (str: string, kb: Formula, base: string, contentType: string, options?: ParseN3jsOptions): number {
  const format = N3JS_FORMATS[contentType]
  if (!format) {
    throw new Error('parseN3js: unsupported content type ' + contentType)
  }
  const sugared = format === 'text/n3' || format === 'text/turtle'
  try {
    return runParse(str, kb, base, format, false, options)
  } catch (e) {
    // rdflib's legacy parser implicitly bound the empty prefix `:` to
    // `<base#>`, so documents using `:name` without declaring `@prefix :`
    // parsed anyway. N3.js is strict, so when (and only when) it reports an
    // undefined empty prefix in one of the syntaxes the legacy parser
    // accepted, re-parse once with a synthetic `@prefix : <base#>.` seeded.
    // Because the declaration is prepended, a later in-document declaration
    // still overrides it from that point on, exactly like the sequential
    // semantics of the legacy parser.
    if (sugared && base && /Undefined prefix ":"/.test(String(e && (e as Error).message))) {
      return runParse(str, kb, base, format, true, options)
    }
    throw e
  }
}

function runParse (str: string, kb: Formula, base: string, format: string, seedEmptyPrefix: boolean, options?: ParseN3jsOptions): number {
  const canonicalize = !!(options && options.canonicalize)
  const n3Mode = format === 'text/n3'
  const rdfFactory = kb.rdfFactory
  const docGraph = base ? kb.sym(base) : rdfFactory.defaultGraph()
  const foldLists = (n3Mode || format === 'text/turtle') &&
    !!(rdfFactory && rdfFactory.supports && rdfFactory.supports['COLLECTIONS'])

  // --- 1. Parse (synchronously — N3.js throws on error in this mode) -------
  const prefixes: { [prefix: string]: string } = {}
  let sawSyntheticEmptyPrefix = false
  const input = seedEmptyPrefix ? '@prefix : <' + escapeIri(base) + '#>.\n' + str : str
  // In n3 mode, N3.js mis-scopes a document-labelled blank node (`_:c`)
  // mentioned inside a `[ … ]` property list: it gets the label
  // `<currentGraphLabel>.c` instead of the document-wide label. At the top
  // level the graph label is empty, so such labels start with "." — we pass an
  // explicit per-parse prefix so they can be renamed back to the document
  // label (inside a formula the formula label is used, which is the correct
  // formula-wide scoping, so those are left alone).
  const docLabelPrefix = 'dl' + docLabelCounter++ + '_'
  const parser = new N3jsParser({
    baseIRI: base || undefined,
    format,
    explicitQuantifiers: n3Mode,
    blankNodePrefix: n3Mode ? docLabelPrefix : undefined,
  } as any)
  const parsed: any[] = (parser as any).parse(input, {
    onPrefix: (prefix: string, node: any) => {
      if (seedEmptyPrefix && prefix === '' && !sawSyntheticEmptyPrefix) {
        sawSyntheticEmptyPrefix = true // the synthetic binding is not the document's
        return
      }
      prefixes[prefix] = node && node.value !== undefined ? node.value : String(node)
    }
  })

  // --- 2. Set aside the empty-formula markers ------------------------------
  // N3.js signals an empty formula `{}` with a degenerate marker quad that has
  // no predicate; its graph is the empty formula's blank node.
  const emptyFormulaLabels: string[] = []
  const quads: any[] = []
  for (const q of parsed) {
    if (!q.predicate) {
      emptyFormulaLabels.push(q.graph.value)
    } else {
      quads.push(q)
    }
  }

  // --- 3. List and quantifier work, via N3.js's own store machinery --------
  // Only build the intermediate N3.Store when there is work for it: full N3
  // (formulae/quantifiers possible), or a document that actually mentions
  // rdf:nil (every complete list ends in one — same gate the legacy parser
  // used for its list folding).
  const listItems: { [head: string]: any[] } = {}
  const quantifiers: Array<{ scopeLabel: string | null, forAll: boolean, vars: string[] }> = []
  const mentionsNil = (q: any): boolean =>
    (q.object.termType === 'NamedNode' && q.object.value === RDF_NIL) ||
    (q.subject.termType === 'NamedNode' && q.subject.value === RDF_NIL)

  // Quads consumed by the list/quantifier machinery are dropped from the
  // stream; the survivors are still loaded in original document order (which
  // matters: a formula must be populated before an outer statement that
  // mentions it is checked against the store's duplicate suppression).
  let isLive: (q: any) => boolean = () => true

  if (n3Mode || (foldLists && quads.some(mentionsNil))) {
    const n3Store = new N3jsStore()
    n3Store.addQuads(quads)
    isLive = (q: any): boolean => n3Store.has(q)

    if (n3Mode) {
      // Under explicitQuantifiers, each `@forAll x, y` / `@forSome …` becomes
      //   <scope> reify:forAll ( x y )   in graph <urn:n3:quantifiers>
      // where <scope> is the default graph or the enclosing formula's label.
      const quantifierQuads = n3Store.getQuads(null, null, null, N3jsDataFactory.namedNode(QUANTIFIERS_GRAPH))
      if (quantifierQuads.length) {
        const firsts: { [id: string]: any } = {}
        const rests: { [id: string]: any } = {}
        const declarations: any[] = []
        for (const q of quantifierQuads) {
          if (q.predicate.value === REIFY_FOR_ALL || q.predicate.value === REIFY_FOR_SOME) {
            declarations.push(q)
          } else if (q.predicate.value === RDF_FIRST) {
            firsts[q.subject.value] = q.object
          } else if (q.predicate.value === RDF_REST) {
            rests[q.subject.value] = q.object
          }
        }
        for (const decl of declarations) {
          const vars: string[] = []
          let node: any = decl.object
          while (node && node.value !== RDF_NIL && firsts[node.value] !== undefined) {
            vars.push(firsts[node.value].value)
            node = rests[node.value]
          }
          quantifiers.push({
            scopeLabel: decl.subject.termType === 'BlankNode' ? decl.subject.value : null,
            forAll: decl.predicate.value === REIFY_FOR_ALL,
            vars,
          })
        }
        n3Store.removeQuads(quantifierQuads)
      }
    }

    if (foldLists) {
      // N3.js finds, validates and removes rdf:first/rest/nil chains for us.
      // (Throwing mode: a malformed chain is a document error, as it was for
      // the legacy parser's own folding.)
      Object.assign(listItems, n3Store.extractLists({ remove: true }))
    }
  }

  // --- 4. Formula registry (n3 mode only) ----------------------------------
  // A blank node is a formula iff it occurs as a graph label (or is an
  // empty-formula marker, or scopes a quantifier declaration).
  const formulas: { [label: string]: Formula } = {}
  const getFormula = (label: string): Formula => {
    if (formulas[label] === undefined) {
      formulas[label] = (kb as any).formula()
    }
    return formulas[label]
  }
  if (n3Mode) {
    for (const label of emptyFormulaLabels) getFormula(label)
    for (const q of quads) {
      if (isLive(q) && q.graph && q.graph.termType === 'BlankNode') getFormula(q.graph.value)
    }
    for (const decl of quantifiers) {
      if (decl.scopeLabel !== null) getFormula(decl.scopeLabel)
    }
    // Register the quantified variables on their scope, as the legacy parser
    // did (the terms themselves stay NamedNodes in the statements).
    for (const decl of quantifiers) {
      const scope: any = decl.scopeLabel === null ? kb : getFormula(decl.scopeLabel)
      for (const v of decl.vars) {
        if (decl.forAll) {
          if (typeof scope.newUniversal === 'function') scope.newUniversal(v)
        } else if (typeof scope.declareExistential === 'function') {
          scope.declareExistential(rdfFactory.namedNode(v))
        }
      }
    }
  }

  // --- 5. Term conversion ---------------------------------------------------
  const collections: { [head: string]: Collection } = {}
  const collectionFor = (label: string): Collection => {
    let c = collections[label]
    if (c === undefined) {
      c = rdfFactory.collection()
      collections[label] = c // registered before resolving elements: cycle guard
      for (const item of listItems[label]) {
        c.append(convertTerm(item))
      }
    }
    return c
  }

  const convertTerm = (t: any, isPredicate?: boolean): any => {
    switch (t.termType) {
      case 'NamedNode':
        if (foldLists && !isPredicate) {
          // `()` (and any other lone rdf:nil mention) becomes an empty
          // Collection, matching the legacy parser.
          if (t.value === RDF_NIL) return rdfFactory.collection()
          if (listItems[t.value] !== undefined) return collectionFor(t.value)
        }
        return rdfFactory.namedNode(t.value)
      case 'BlankNode':
        if (n3Mode && formulas[t.value] !== undefined) return formulas[t.value]
        if (foldLists && !isPredicate && listItems[t.value] !== undefined) return collectionFor(t.value)
        // Repair N3.js's mis-scoped top-level document labels (see above).
        if (n3Mode && t.value.charAt(0) === '.') return rdfFactory.blankNode(docLabelPrefix + t.value.slice(1))
        return rdfFactory.blankNode(t.value)
      case 'Literal':
        if (t.language) return rdfFactory.literal(t.value, t.language)
        return rdfFactory.literal(
          canonicalize ? canonicalLexicalForm(t.value, t.datatype.value) : t.value,
          rdfFactory.namedNode(t.datatype.value)
        )
      case 'Variable':
        return rdfFactory.variable ? rdfFactory.variable(t.value) : new Variable(t.value)
      case 'DefaultGraph':
        return docGraph
      default:
        // e.g. RDF-star quoted triples, which N3.js can parse but rdflib's
        // store cannot represent.
        throw new Error('rdflib cannot represent ' + t.termType + ' terms parsed from ' + format + ' input')
    }
  }

  // --- 6. Load the statements ----------------------------------------------
  // Statements whose graph is a formula's blank node go into that Formula;
  // everything else goes into kb (default graph → the document graph,
  // TriG/N-Quads named graphs kept as-is). Inner formula statements carry the
  // document as their `why`, exactly like the legacy parser.
  let count = 0
  for (const q of quads) {
    if (!isLive(q)) continue
    let target: any = kb
    let why: any = docGraph
    const g = q.graph
    if (n3Mode && g && g.termType === 'BlankNode') {
      target = getFormula(g.value)
    } else if (g && g.termType !== 'DefaultGraph') {
      why = convertTerm(g)
    }
    target.add(convertTerm(q.subject), convertTerm(q.predicate, true), convertTerm(q.object), why)
    count++
  }

  for (const label in formulas) {
    const f: any = formulas[label]
    if (typeof f.close === 'function') f.close()
  }

  // Register the document's prefix declarations so serialisation round-trips
  // them (only stores implement setPrefixForURI; a plain Formula does not).
  if (typeof (kb as any).setPrefixForURI === 'function') {
    for (const prefix in prefixes) {
      (kb as any).setPrefixForURI(prefix, prefixes[prefix])
    }
  }

  return count
}

const XSD_NS = 'http://www.w3.org/2001/XMLSchema#'
const XSD_BOOLEAN = XSD_NS + 'boolean'
const XSD_INTEGER = XSD_NS + 'integer'
const XSD_DECIMAL = XSD_NS + 'decimal'
const XSD_DOUBLE = XSD_NS + 'double'
const XSD_FLOAT = XSD_NS + 'float'

const INTEGER_LEXICAL = /^([+-]?)0*([0-9]+)$/
const DECIMAL_LEXICAL = /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/
const FLOATING_LEXICAL = /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/

/**
 * Map a boolean or numeric lexical form to the canonical form rdflib ≤2
 * produced at parse time (the `canonicalize: true` compatibility mode):
 * booleans become `"1"`/`"0"` (matching `Literal.fromBoolean`), integers
 * lose their sign/leading-zero decoration, and decimals/doubles/floats are
 * rewritten as JavaScript stringifies their numeric value (`12.0` → `"12"`,
 * `3.141e0` → `"3.141"`), exactly as the legacy parsers' number round-trip
 * did. Only valid lexical forms are rewritten; anything ill-typed (and any
 * other datatype) is preserved as-is.
 */
function canonicalLexicalForm (value: string, datatype: string): string {
  switch (datatype) {
    case XSD_BOOLEAN:
      if (value === 'true') return '1'
      if (value === 'false') return '0'
      return value
    case XSD_INTEGER: {
      // Rewritten lexically (not via Number) so arbitrary-precision integers
      // keep their exact value.
      const m = INTEGER_LEXICAL.exec(value)
      if (!m) return value
      return (m[1] === '-' && m[2] !== '0' ? '-' : '') + m[2]
    }
    case XSD_DECIMAL: {
      if (!DECIMAL_LEXICAL.test(value)) return value
      const canonical = String(Number(value))
      // Guard: keep the source form when JS would stringify with an exponent
      // (e.g. 0.0000001 → "1e-7"), which is outside xsd:decimal's lexical space.
      return DECIMAL_LEXICAL.test(canonical) ? canonical : value
    }
    case XSD_DOUBLE:
    case XSD_FLOAT:
      // INF/-INF/NaN don't match and are preserved as-is.
      return FLOATING_LEXICAL.test(value) ? String(Number(value)) : value
    default:
      return value
  }
}

/** Percent-escape the characters that cannot appear in a Turtle IRIREF. */
function escapeIri (iri: string): string {
  // eslint-disable-next-line no-control-regex
  return iri.replace(/[<>"{}|^`\\\u0000-\u0020]/g, (ch) => {
    const hex = ch.charCodeAt(0).toString(16).toUpperCase()
    return '%' + (hex.length < 2 ? '0' + hex : hex)
  })
}
