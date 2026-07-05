/**
 * Line-format serialization on the N3.js Writer — the write-side counterpart
 * of the parse-side adapter in src/n3-adapter.ts.
 *
 * The non-pretty formats (N-Triples, N-Quads) and TriG are serialized by the
 * spec-compliant N3.js `Writer` instead of rdflib's hand-rolled line
 * serializer. This module maps rdflib's model onto the flat quads N3.js
 * expects:
 *
 *  - rdflib terms are rebuilt as N3.js terms (rdflib `BlankNode`s carry an
 *    `id` property that N3.js's encoder would otherwise emit verbatim,
 *    without the `_:` prefix);
 *  - rdflib `Collection` terms — which are not RDF/JS — are unfolded into
 *    their `rdf:first`/`rdf:rest` chains with fresh blank nodes, recursively,
 *    so nested collections serialize correctly (#749);
 *  - for N-Triples the statement graph is dropped (triples only); for
 *    N-Quads and TriG the statement's `why` becomes the quad graph, and the
 *    default graph is written in triple form as the spec requires (#561).
 *
 * The pretty Turtle/N3 serializer (src/serializer.js `statementsToN3`) is
 * intentionally NOT routed through N3.js: rdflib's grouped, prefixed,
 * 80-column pretty output is a deliberate feature and a non-goal of the
 * N3.js Writer.
 */
// N3.js modules are deep-imported (not the package root) to keep
// N3StreamWriter's readable-stream polyfill chain out of browser bundles —
// see tests/unit/n3-import-hygiene-test.js (#449).
// @ts-ignore no types shipped for n3's internal modules
import N3jsWriter from 'n3/lib/N3Writer.js'
// @ts-ignore no types shipped for n3's internal modules
import N3jsDataFactory from 'n3/lib/N3DataFactory.js'

import CanonicalDataFactory from './factories/canonical-data-factory'
import Statement from './statement'
import {
  BlankNodeTermType,
  CollectionTermType,
  DefaultGraphTermType,
  LiteralTermType,
  NamedNodeTermType,
  NQuadsAltContentType,
  NQuadsContentType,
  NTriplesContentType,
  TrigContentType,
  VariableTermType,
} from './types'

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'

/** Content types this module can serialize, mapped to N3.js format names. */
export const N3JS_WRITER_FORMATS: { [contentType: string]: string } = {
  [NTriplesContentType]: 'N-Triples',
  [NQuadsContentType]: 'N-Quads',
  [NQuadsAltContentType]: 'N-Quads',
  [TrigContentType]: 'TriG',
}

export interface N3jsWriterOptions {
  /**
   * Factory used to mint the fresh blank nodes that anchor unfolded
   * `Collection` terms. Pass the store's own factory so generated labels
   * cannot collide with blank nodes already in the graph; defaults to
   * rdflib's canonical factory.
   */
  factory?: { blankNode: (id?: string) => { value: string } }
  /**
   * Namespace prefixes (`prefix → IRI`) for TriG output. Only prefixes whose
   * IRI actually occurs in the statements are declared. Ignored for the
   * line formats, which never abbreviate.
   */
  namespaces?: Record<string, string>
}

/** Rebuild an rdflib term as an N3.js term the Writer encodes correctly. */
function termToN3js (term: any): any {
  switch (term.termType) {
    case NamedNodeTermType:
      return N3jsDataFactory.namedNode(term.value)
    case BlankNodeTermType:
      return N3jsDataFactory.blankNode(term.value)
    case LiteralTermType:
      return N3jsDataFactory.literal(
        term.value,
        term.language || (term.datatype ? N3jsDataFactory.namedNode(term.datatype.value) : undefined)
      )
    case VariableTermType:
      return N3jsDataFactory.variable(term.value)
    case DefaultGraphTermType:
      return N3jsDataFactory.defaultGraph()
    default:
      throw new Error('N3.js writer: cannot serialize term of type ' + term.termType)
  }
}

/**
 * Serialize statements with the N3.js Writer.
 *
 * @param sts - The statements to serialize
 * @param contentType - One of the keys of {@link N3JS_WRITER_FORMATS}
 * @param options - See {@link N3jsWriterOptions}
 * @returns The serialized document
 */
export default function statementsToN3js (
  sts: ReadonlyArray<Statement>,
  contentType: string,
  options: N3jsWriterOptions = {}
): string {
  const format = N3JS_WRITER_FORMATS[contentType]
  if (!format) {
    throw new Error('N3.js writer: unsupported content type ' + contentType)
  }
  const factory = options.factory || CanonicalDataFactory
  const isTrig = format === 'TriG'
  const withGraph = isTrig || format === 'N-Quads'

  // Sort as the legacy line serializer did (default lexicographic order on
  // the statements' string forms), so output stays deterministic; for TriG,
  // additionally group by graph so each graph serializes as a single block.
  const sorted = sts.slice().sort() as Statement[]
  if (isTrig) {
    sorted.sort((a, b) => {
      const ga = a.graph ? String(a.graph.value) : ''
      const gb = b.graph ? String(b.graph.value) : ''
      return ga < gb ? -1 : ga > gb ? 1 : 0
    })
  }

  const writer = new N3jsWriter({
    format,
    prefixes: isTrig ? usedNamespaces(options.namespaces, sorted) : undefined,
  })

  /**
   * Unfold rdflib `Collection` terms (recursively) into rdf:first/rest
   * chains, queuing the chain quads ahead of the referencing statement.
   */
  function expandTerm (term: any, graph: any, queue: any[][]): any {
    if (term.termType !== CollectionTermType) return termToN3js(term)
    let tail = N3jsDataFactory.namedNode(RDF_NS + 'nil')
    for (let i = term.elements.length - 1; i >= 0; i--) {
      const element = expandTerm(term.elements[i], graph, queue)
      const head = N3jsDataFactory.blankNode(factory.blankNode().value)
      queue.unshift(
        [head, N3jsDataFactory.namedNode(RDF_NS + 'first'), element, graph],
        [head, N3jsDataFactory.namedNode(RDF_NS + 'rest'), tail, graph]
      )
      tail = head
    }
    return tail
  }

  for (const st of sorted) {
    const graph = withGraph && st.graph ? termToN3js(st.graph) : N3jsDataFactory.defaultGraph()
    const queue: any[][] = []
    const subject = expandTerm(st.subject, graph, queue)
    const object = expandTerm(st.object, graph, queue)
    for (const quad of queue) writer.addQuad(quad[0], quad[1], quad[2], quad[3])
    writer.addQuad(subject, termToN3js(st.predicate), object, graph)
  }

  let document = ''
  writer.end((error: Error | null, result: string) => {
    if (error) throw error
    document = result
  })
  return document
}

/** Restrict a namespace map to the prefixes the statements actually use. */
function usedNamespaces (
  namespaces: Record<string, string> | undefined,
  sts: ReadonlyArray<Statement>
): Record<string, string> {
  const used: Record<string, string> = {}
  if (!namespaces) return used
  const inUse = (iri: string): boolean => sts.some(st =>
    [st.subject, st.predicate, st.object, st.graph].some(term =>
      term && term.termType === NamedNodeTermType && (term.value as string).startsWith(iri)
    )
  )
  for (const prefix of Object.keys(namespaces)) {
    if (inUse(namespaces[prefix])) used[prefix] = namespaces[prefix]
  }
  return used
}
