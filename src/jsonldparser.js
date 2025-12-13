import {arrayToStatements} from './utils'

/**
 * Parses json-ld formatted JS objects to a rdf Term.
 * @param kb - The DataFactory to use.
 * @param obj - The json-ld object to process.
 * @return {Literal|NamedNode|BlankNode|Collection}
 */
export function jsonldObjectToTerm(kb, obj) {
  if (typeof obj === 'string') {
    return kb.rdfFactory.literal(obj)
  }

  if (Object.prototype.hasOwnProperty.call(obj, '@list')) {
    if (kb.rdfFactory.supports["COLLECTIONS"] === true) {
      return listToCollection(kb, obj['@list'])
    }

    return listToStatements(kb, obj)
  }

  if (Object.prototype.hasOwnProperty.call(obj, '@id')) {
    return nodeType(kb, obj)
  }

  if (Object.prototype.hasOwnProperty.call(obj, '@language')) {
    return kb.rdfFactory.literal(obj['@value'], obj['@language'])
  }

  if (Object.prototype.hasOwnProperty.call(obj, '@type')) {
    return kb.rdfFactory.literal(obj['@value'], kb.rdfFactory.namedNode(obj['@type']))
  }

  if (Object.prototype.hasOwnProperty.call(obj, '@value')) {
    return kb.rdfFactory.literal(obj['@value'])
  }

  return kb.rdfFactory.literal(obj)
}

/**
 * Adds the statements in a json-ld list object to {kb}.
 */
function listToStatements(kb, obj) {
  const listId = obj['@id'] ? nodeType(kb, obj) : kb.rdfFactory.blankNode()

  const items = obj['@list'].map((listItem => jsonldObjectToTerm(kb, listItem)))
  const statements = arrayToStatements(kb.rdfFactory, listId, items)
  kb.addAll(statements)

  return listId
}

function listToCollection(kb, obj) {
  if (!Array.isArray(obj)) {
    throw new TypeError("Object must be an array")
  }
  return kb.rdfFactory.collection(obj.map((o) => jsonldObjectToTerm(kb, o)))
}

/**
 * Takes a json-ld formatted string {str} and adds its statements to {kb}.
 *
 * Ensure that {kb.rdfFactory} is a DataFactory.
 */
export default async function jsonldParser(str, kb, base) {
  const baseString = base && Object.prototype.hasOwnProperty.call(base, 'termType')
    ? base.value
    : base

  const jsonld = await import('jsonld')
  // ⚠ Unit tests also work without accessing `jsonld.default` explicitly, but real browser usage will fail with
  // just calling `jsonld.flatten`, so please do not remove `default`
  const flattened = await jsonld.default.flatten(JSON.parse(str), null, {base: baseString})
  return flattened.reduce((store, flatResource) => processResource(store, base, flatResource), kb)
}

function nodeType(kb, obj) {
  if (obj['@id'].startsWith('_:')) {
    // This object is a Blank Node. Pass the id without the `_:` prefix
    return kb.rdfFactory.blankNode(obj['@id'].substring(2))
  } else {
    // This object is a Named Node
    return kb.rdfFactory.namedNode(obj['@id'])
  }
}

function processResource(kb, base, flatResource) {
  const id = flatResource['@id']
    ? nodeType(kb, flatResource)
    : kb.rdfFactory.blankNode()

  for (const property of Object.keys(flatResource)) {
    if (property === '@id') {
      continue
    } else if (property == '@graph') {
      // the JSON-LD flattened structure may contain nested graphs
      // the id value for this object is the new base (named graph id) for all nested flat resources
      const graphId = id
      // this is an array of resources
      const nestedFlatResources = flatResource[property]

      // recursively process all flat resources in the array, but with the graphId as base.
      for (let i = 0; i < nestedFlatResources.length; i++) {
        kb = processResource(kb, graphId, nestedFlatResources[i])
      }
    }

    const value = flatResource[property]
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        kb.addStatement(createStatement(kb, id, property, value[i], base))
      }
    } else {
      kb.addStatement(createStatement(kb, id, property, value, base))
    }
  }

  return kb
}

/**
 * Create statement quad depending on @type being a type node
 * @param kb
 * @param subject id
 * @param property
 * @param value
 * @return quad statement
 */
function createStatement(kb, id, property, value, base) {
  let predicate, object

  if (property === "@type") {
    predicate = kb.rdfFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
    object = kb.rdfFactory.namedNode(value)
  } else {
    predicate = kb.rdfFactory.namedNode(property)
    object = jsonldObjectToTerm(kb, value)
  }
  return kb.rdfFactory.quad(id, predicate, object, kb.rdfFactory.namedNode(base))
}