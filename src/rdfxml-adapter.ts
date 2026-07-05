/**
 * Adapter between rdfxml-streaming-parser and rdflib's data model:
 *
 *  - statements are attributed to the document graph `kb.sym(base)`
 *    (rdflib's provenance convention);
 *  - `rdf:nodeID` labels are scoped per parse (`rxN_<label>`), so a nodeID
 *    unifies within one document (issue #751) but two documents using the
 *    same nodeID can never collide in one store;
 *  - `rdf:parseType="Collection"` chains are folded back into rdflib
 *    `Collection` terms when the data factory supports them;
 *  - `xmlns:` prefix declarations are harvested into the store's prefix
 *    table, feeding the serializer;
 *  - duplicate `rdf:ID` values are tolerated and IRIs are not validated,
 *    keeping the leniency of the parser this replaces.
 */
import { RdfXmlParser } from 'rdfxml-streaming-parser'
import BlankNode from './blank-node'
import Collection from './collection'
import Formula from './formula'
import Node from './node-internal'
import { NamedNode, Quad, Quad_Object, Term } from './tf-types'
import * as uriUtil from './uri'

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'

/** Per-parse counter scoping blank-node labels (fresh labels per document). */
let parseCount = 0

/** Matches `xmlns:prefix="uri"` / `xmlns:prefix='uri'` declarations. */
const XMLNS_PATTERN = /xmlns:([A-Za-z_][^\s=]*?)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

/**
 * Parse an RDF/XML document with rdfxml-streaming-parser and load it into
 * the given store. Asynchronous: the returned promise settles when every
 * statement has been added (or parsing failed).
 *
 * @param str - The RDF/XML document body
 * @param kb - The store (or plain Formula) to load the statements into
 * @param base - The base IRI for relative-IRI resolution; also names the document graph
 * @returns A promise resolving once the document is fully loaded
 */
export default function parseRDFXML (str: string, kb: Formula, base: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const docGraph = kb.sym(base)
    const factory = kb.rdfFactory
    const bnodeScope = 'rx' + parseCount++ + '_'
    const bnodes: { [label: string]: BlankNode } = Object.create(null)

    // A thin RDF/JS DataFactory over rdflib's own factory, so the parser
    // emits rdflib-native terms directly. Blank-node labels get the
    // per-parse scope prefix; anonymous blank nodes are freshly minted.
    const dataFactory = {
      namedNode: (value: string) => factory.namedNode(value),
      blankNode: (label?: string) => label
        ? (bnodes[label] || (bnodes[label] = factory.blankNode(bnodeScope + label)))
        : factory.blankNode(),
      literal: (value: string, languageOrDatatype?: any) => {
        if (languageOrDatatype && typeof languageOrDatatype === 'object' &&
            !languageOrDatatype.termType) {
          // RDF 1.2 directional language string ({ language, direction }):
          // rdflib has no base-direction support yet, keep the language tag.
          return factory.literal(value, languageOrDatatype.language)
        }
        return factory.literal(value, languageOrDatatype)
      },
      variable: (value: string) => (factory as any).variable
        ? (factory as any).variable(value)
        : undefined,
      defaultGraph: () => docGraph,
      quad: (s: any, p: any, o: any, g: any) => factory.quad(s, p, o, g || docGraph),
    }

    let settled = false
    const fail = (err: Error) => {
      if (!settled) {
        settled = true
        reject(err)
      }
    }

    const parser = new RdfXmlParser({
      baseIRI: base,
      dataFactory: dataFactory as any,
      defaultGraph: docGraph,
      // Keep tolerating duplicate rdf:ID values and lax IRIs
      allowDuplicateRdfIds: true,
      validateUri: false,
    })

    parser.on('data', (quad: Quad) => {
      if (settled) return
      try {
        kb.add(quad.subject, quad.predicate, quad.object, quad.graph)
      } catch (e) {
        fail(e as Error)
      }
    })
    parser.on('error', fail)
    parser.on('end', () => {
      if (settled) return
      // RdfXmlParser never closes its saxes parser at end of stream, so a
      // truncated document (unclosed tags at EOF) would be silently
      // accepted; closing saxes makes it report unclosed tags through the
      // parser's regular error path.
      try {
        (parser as any).saxParser.close()
      } catch (e) {
        return fail(e as Error)
      }
      if (settled) return // a saxes EOF error surfaced via 'error'
      try {
        harvestPrefixes(str, kb, base)
        if (factory.supports && factory.supports['COLLECTIONS'] === true) {
          foldCollections(kb, docGraph)
        }
        settled = true
        resolve()
      } catch (e) {
        fail(e as Error)
      }
    })

    parser.write(str)
    parser.end()
  })
}

/**
 * Register `xmlns:` prefix declarations into the store's prefix table.
 * Harvested textually since the streaming parser exposes no namespace events.
 */
function harvestPrefixes (str: string, kb: Formula, base: string): void {
  const setPrefix = (kb as any).setPrefixForURI
  if (typeof setPrefix !== 'function') {
    return
  }
  let match
  while ((match = XMLNS_PATTERN.exec(str)) !== null) {
    const prefix = match[1]
    let uri = match[2] !== undefined ? match[2] : match[3]
    if (!uri) continue
    if (base) uri = uriUtil.join(uri, base)
    setPrefix.call(kb, prefix, uri)
  }
  XMLNS_PATTERN.lastIndex = 0
}

/**
 * Fold well-formed rdf:first/rdf:rest/rdf:nil chains in the document graph
 * back into rdflib `Collection` terms, the shape `rdf:parseType="Collection"`
 * consumers expect. Malformed or externally referenced chains are left
 * untouched as plain triples (unlike src/lists.ts, this never throws).
 */
function foldCollections (kb: Formula, doc: NamedNode): void {
  const anyKb = kb as any
  if (typeof anyKb.statementsMatching !== 'function' ||
      typeof anyKb.remove !== 'function' ||
      typeof anyKb.rdfFactory.collection !== 'function') {
    return // needs an indexed store to fold
  }
  const first = kb.sym(RDF_NS + 'first')
  const rest = kb.sym(RDF_NS + 'rest')
  const nil = kb.sym(RDF_NS + 'nil')

  // 1. Fold bnode chains, innermost first (nested lists need extra passes).
  let folded = true
  while (folded) {
    folded = false
    const tails: Quad[] = anyKb.statementsMatching(null, rest, nil, doc)
    for (const tail of tails) {
      const chain = wellFormedChain(anyKb, tail.subject, first, rest, doc)
      if (!chain) continue
      // Defer chains whose elements are themselves unfolded chains.
      if (chain.elements.some((el: Term) => el.termType === 'BlankNode' &&
          anyKb.statementsMatching(el, first, null, doc).length > 0)) {
        continue
      }
      const collection: Collection = anyKb.rdfFactory.collection(chain.elements)
      collection.close()
      anyKb.remove(chain.trash)
      substituteInDoc(anyKb, collection, chain.head, doc)
      folded = true
    }
  }

  // 2. A lone rdf:nil in object position (not a chain tail) is an empty
  //    collection: the shape `<p rdf:parseType="Collection"/>` produces.
  for (const st of anyKb.statementsMatching(null, null, nil, doc)) {
    if (st.predicate.value === rest.value) continue
    const empty: Collection = anyKb.rdfFactory.collection([])
    empty.close()
    anyKb.remove([st])
    anyKb.add(st.subject, st.predicate, empty, doc)
  }
}

/**
 * Validate and collect the list chain ending at `tail`. Returns the chain
 * (head, in-order elements, statements to remove) if and only if every node
 * is a blank node carrying exactly one rdf:first and one rdf:rest and no
 * other statements, and interior nodes are referenced only by their
 * incoming rdf:rest link. Returns null otherwise.
 */
function wellFormedChain (
  kb: any,
  tail: Term,
  first: NamedNode,
  rest: NamedNode,
  doc: NamedNode
): { head: Term, elements: Quad_Object[], trash: Quad[] } | null {
  const nodes: Term[] = []
  const seen: { [id: string]: boolean } = Object.create(null)
  let node: Term = tail as Term
  for (;;) {
    if (node.termType !== 'BlankNode' || seen[node.value]) return null
    seen[node.value] = true
    nodes.push(node)
    const incoming: Quad[] = kb.statementsMatching(null, rest, node, doc)
    if (incoming.length === 0) break // reached the head
    if (incoming.length !== 1) return null
    // Interior nodes may be referenced only by their incoming rdf:rest.
    if (kb.statementsMatching(null, null, node, doc).length !== 1) return null
    node = incoming[0].subject
  }
  nodes.reverse() // head to tail
  const elements: Quad_Object[] = []
  const trash: Quad[] = []
  for (const n of nodes) {
    const firsts: Quad[] = kb.statementsMatching(n, first, null, doc)
    const rests: Quad[] = kb.statementsMatching(n, rest, null, doc)
    // Exactly one first, one rest, and nothing else hangs off a list node.
    if (firsts.length !== 1 || rests.length !== 1) return null
    if (kb.statementsMatching(n, null, null, doc).length !== 2) return null
    elements.push(firsts[0].object)
    trash.push(firsts[0], rests[0])
  }
  return { head: nodes[0], elements, trash }
}

/**
 * Replace every occurrence of the term `y` with `x` in the given document
 * graph (subject, predicate and object positions). Local defensive copy of
 * the src/lists.ts idiom.
 */
function substituteInDoc (kb: any, x: Node | Collection, y: Term, doc: NamedNode): void {
  for (const quad of kb.statementsMatching(y, null, null, doc)) {
    kb.remove([quad])
    kb.add(x, quad.predicate, quad.object, doc)
  }
  for (const quad of kb.statementsMatching(null, y, null, doc)) {
    kb.remove([quad])
    kb.add(quad.subject, x, quad.object, doc)
  }
  for (const quad of kb.statementsMatching(null, null, y, doc)) {
    kb.remove([quad])
    kb.add(quad.subject, quad.predicate, x, doc)
  }
}
