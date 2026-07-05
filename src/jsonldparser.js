const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const RDF_FIRST = RDF_NS + 'first'
const RDF_REST = RDF_NS + 'rest'
const RDF_NIL = RDF_NS + 'nil'
const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string'

/**
 * Marker property used to recognize our own remote-context refusal error when
 * jsonld.js wraps it inside a JsonLdError.
 */
const REFUSED_REMOTE_CONTEXT = 'rdflibRemoteContextRefused'

/**
 * Builds the error thrown when a document requests a remote `@context` and no
 * documentLoader has been injected by the caller.
 */
function remoteContextRefusedError (url) {
  const err = new Error(
    'Refused to fetch remote @context <' + url + '>: rdflib.js disables remote ' +
    'JSON-LD context fetching by default, because dereferencing contexts from ' +
    'untrusted documents lets attackers trigger arbitrary outbound HTTP(S) ' +
    'requests (SSRF). To opt in, pass an explicit `documentLoader` in the ' +
    'options argument of jsonldParser/parse (e.g. jsonld.js\'s ' +
    'documentLoaders.node() or a loader backed by your own fetch policy).'
  )
  err[REFUSED_REMOTE_CONTEXT] = true
  err.contextUrl = url
  return err
}

/**
 * The default documentLoader: refuses every remote context fetch.
 */
async function refusingDocumentLoader (url) {
  throw remoteContextRefusedError(url)
}

/**
 * jsonld.js wraps documentLoader failures in a JsonLdError whose generic
 * message hides the cause. If our refusal error is anywhere in the cause
 * chain, surface it directly so callers get the actionable message.
 */
function unwrapRefusalError (err) {
  const seen = new Set()
  let e = err
  while (e && typeof e === 'object' && !seen.has(e)) {
    seen.add(e)
    if (e[REFUSED_REMOTE_CONTEXT]) {
      return e
    }
    e = e.cause || (e.details && e.details.cause)
  }
  return err
}

/**
 * Maps an RDF/JS term (as emitted by jsonld.toRDF) onto an rdflib term
 * built with {kb.rdfFactory}.
 *
 * Blank nodes are allocated fresh through {bnodeMap} (one map per parse), so
 * labels from one document can never collide with blank nodes from another
 * parse into the same store.
 */
function termToRdflibTerm (kb, term, bnodeMap) {
  switch (term.termType) {
    case 'NamedNode':
      return kb.rdfFactory.namedNode(term.value)
    case 'BlankNode': {
      let bnode = bnodeMap.get(term.value)
      if (!bnode) {
        bnode = kb.rdfFactory.blankNode()
        bnodeMap.set(term.value, bnode)
      }
      return bnode
    }
    case 'Literal': {
      if (term.language) {
        return kb.rdfFactory.literal(term.value, term.language)
      }
      if (term.datatype && term.datatype.value && term.datatype.value !== XSD_STRING) {
        return kb.rdfFactory.literal(term.value, kb.rdfFactory.namedNode(term.datatype.value))
      }
      return kb.rdfFactory.literal(term.value)
    }
    default:
      throw new Error('Unexpected term type from JSON-LD toRDF: ' + term.termType)
  }
}

function isBlank (term) {
  return term.termType === 'BlankNode'
}

function isNil (term) {
  return term.termType === 'NamedNode' && term.value === RDF_NIL
}

/**
 * Folds well-formed rdf:first/rdf:rest chains (as emitted by toRDF for
 * `@list`) back into rdflib Collection terms, mirroring what the Turtle
 * parse path does (see src/lists.ts) so `Collection.elements` keeps working
 * for downstream consumers.
 *
 * Operates only on the quads produced by the current parse (never on
 * pre-existing store content) and, unlike lists.ts's convertFirstRestNil,
 * leaves non-well-formed chains as raw triples instead of throwing.
 *
 * @param kb - The store whose rdfFactory builds the Collections.
 * @param quads - The rdflib quads of this parse.
 * @return The remaining quads with list heads replaced by Collections.
 */
function foldListChains (kb, quads) {
  // Usage info per blank node label, over this parse's quads only
  const info = new Map()
  const getInfo = (id) => {
    let i = info.get(id)
    if (!i) {
      i = { first: [], rest: [], otherOut: 0, inRefs: [], usedAsGraph: false }
      info.set(id, i)
    }
    return i
  }

  for (const q of quads) {
    if (isBlank(q.subject)) {
      const i = getInfo(q.subject.value)
      if (q.predicate.value === RDF_FIRST) {
        i.first.push(q)
      } else if (q.predicate.value === RDF_REST) {
        i.rest.push(q)
      } else {
        i.otherOut += 1
      }
    }
    if (isBlank(q.object)) {
      getInfo(q.object.value).inRefs.push(q)
    }
    if (isBlank(q.graph)) {
      getInfo(q.graph.value).usedAsGraph = true
    }
  }

  // A blank node is a well-formed list node when it carries exactly one
  // rdf:first, exactly one rdf:rest, nothing else, is referenced exactly
  // once, and never names a graph.
  const isListNode = (id) => {
    const i = info.get(id)
    return !!i && i.first.length === 1 && i.rest.length === 1 &&
      i.otherOut === 0 && i.inRefs.length === 1 && !i.usedAsGraph
  }

  /**
   * Walks the chain from {headId}, returning `{ elements, chain }` when the
   * whole chain (and any nested chains reachable through rdf:first) is
   * well-formed and lives in {graph}; `null` otherwise (fold nothing).
   */
  const foldFrom = (headId, graph, visited) => {
    const elements = []
    const chain = []
    let cur = headId
    for (;;) {
      if (visited.has(cur) || !isListNode(cur)) {
        return null
      }
      visited.add(cur)
      const i = info.get(cur)
      const firstQuad = i.first[0]
      const restQuad = i.rest[0]
      if (!firstQuad.graph.equals(graph) || !restQuad.graph.equals(graph)) {
        return null
      }
      chain.push(firstQuad, restQuad)

      let element = firstQuad.object
      if (isBlank(element) && isListNode(element.value) &&
          info.get(element.value).inRefs[0] === firstQuad) {
        // Nested @list: fold it into a nested Collection when possible
        const nested = foldFrom(element.value, graph, visited)
        if (nested) {
          element = kb.rdfFactory.collection(nested.elements)
          chain.push(...nested.chain)
        }
      } else if (isNil(element)) {
        // Nested empty @list
        element = kb.rdfFactory.collection([])
      }
      elements.push(element)

      const tail = restQuad.object
      if (isNil(tail)) {
        return { elements, chain }
      }
      if (!isBlank(tail) || !info.get(tail.value) ||
          info.get(tail.value).inRefs[0] !== restQuad) {
        return null
      }
      cur = tail.value
    }
  }

  const consumed = new Set()
  const replacements = new Map() // referencing quad -> Collection

  for (const q of quads) {
    if (q.predicate.value === RDF_REST || !isBlank(q.object)) {
      continue
    }
    if (!isListNode(q.object.value) || info.get(q.object.value).inRefs[0] !== q) {
      continue
    }
    if (q.predicate.value === RDF_FIRST && isBlank(q.subject) && isListNode(q.subject.value)) {
      continue // owned by the enclosing chain's fold
    }
    const foldedList = foldFrom(q.object.value, q.graph, new Set())
    if (foldedList) {
      replacements.set(q, kb.rdfFactory.collection(foldedList.elements))
      for (const chainQuad of foldedList.chain) {
        consumed.add(chainQuad)
      }
    }
  }

  const result = []
  for (const q of quads) {
    if (consumed.has(q)) {
      continue
    }
    let object = replacements.get(q)
    if (!object && isNil(q.object) && q.predicate.value !== RDF_REST) {
      // Lone rdf:nil object (e.g. an empty @list): empty Collection, matching
      // the Turtle path's substituteNillsInDoc behavior.
      object = kb.rdfFactory.collection([])
    }
    result.push(object ? kb.rdfFactory.quad(q.subject, q.predicate, object, q.graph) : q)
  }
  return result
}

/**
 * Takes a json-ld formatted string {str} and adds its statements to {kb},
 * using jsonld.js's toRDF() (the JSON-LD 1.1 "Deserialize JSON-LD to RDF"
 * algorithm).
 *
 * Quads in the default graph are placed in the document graph named by
 * {base} (rdflib's doc-graph convention); quads in named graphs keep their
 * graph as `why`.
 *
 * Remote `@context` URLs are NOT dereferenced by default: parsing untrusted
 * JSON-LD must not trigger outbound network requests (SSRF). Callers that
 * want remote contexts resolved must inject `options.documentLoader`.
 *
 * Ensure that {kb.rdfFactory} is a DataFactory.
 *
 * @param str - The JSON-LD document as a string.
 * @param kb - The store to add the parsed statements to.
 * @param base - The base IRI (string or NamedNode); also names the doc graph.
 * @param [options] - Optional parse options.
 * @param [options.documentLoader] - A jsonld.js documentLoader
 *   (`async (url) => ({ document, documentUrl, contextUrl })`) used to
 *   resolve remote `@context` URLs. Omitted: remote contexts are refused.
 * @param [options.expandContext] - A context to expand the document with,
 *   for documents whose context is supplied out-of-band.
 */
export default async function jsonldParser (str, kb, base, options = {}) {
  const baseString = base && Object.prototype.hasOwnProperty.call(base, 'termType')
    ? base.value
    : base

  const jsonld = await import('jsonld')
  // ⚠ Unit tests also work without accessing `jsonld.default` explicitly, but real browser usage will fail with
  // just calling `jsonld.toRDF`, so please do not remove `default`
  // Handle both ESM (browser) and CommonJS (Node.js) module formats
  // Browser ESM: jsonld.default.toRDF
  // Node.js CommonJS: jsonld.toRDF
  const jsonldLib = jsonld.default || jsonld

  const toRdfOptions = {
    base: baseString,
    documentLoader: options.documentLoader || refusingDocumentLoader
  }
  if (options.expandContext !== undefined) {
    toRdfOptions.expandContext = options.expandContext
  }

  let dataset
  try {
    dataset = await jsonldLib.toRDF(JSON.parse(str), toRdfOptions)
  } catch (err) {
    throw unwrapRefusalError(err)
  }

  const docGraph = kb.rdfFactory.namedNode(baseString)
  // Fresh blank nodes per parse: never reuse the document's `_:` labels
  const bnodeMap = new Map()

  let quads = []
  for (const quad of dataset) {
    const graph = quad.graph.termType === 'DefaultGraph'
      ? docGraph
      : termToRdflibTerm(kb, quad.graph, bnodeMap)
    quads.push(kb.rdfFactory.quad(
      termToRdflibTerm(kb, quad.subject, bnodeMap),
      termToRdflibTerm(kb, quad.predicate, bnodeMap),
      termToRdflibTerm(kb, quad.object, bnodeMap),
      graph
    ))
  }

  if (kb.rdfFactory.supports['COLLECTIONS'] === true) {
    quads = foldListChains(kb, quads)
  }

  for (const quad of quads) {
    kb.addStatement(quad)
  }
  return kb
}
