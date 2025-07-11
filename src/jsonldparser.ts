import type Formula from './formula'
import type Node from './node-internal'
import { arrayToStatements } from './utils'

/**
 * Parses json-ld formatted JS objects to a rdf Term.
 * @param kb - The DataFactory to use.
 * @param obj - The json-ld object to process.
 * @return {Literal|NamedNode|BlankNode|Collection}
 */
export function jsonldObjectToTerm(kb: Formula, obj: Record<string, any>) {
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
function listToStatements(kb: Formula, obj: Record<string, any>) {
  const listId = obj['@id'] ? nodeType(kb, obj) : kb.rdfFactory.blankNode()

  const items = obj['@list'].map((listItem => jsonldObjectToTerm(kb, listItem)))
  const statements = arrayToStatements(kb.rdfFactory, listId, items)
  kb.addAll(statements)

  return listId
}

function listToCollection(kb: Formula, obj: Record<string, any>) {
  if (!Array.isArray(obj)) {
    throw new TypeError("Object must be an array")
  }
  return kb.rdfFactory.collection(obj.map((o) => jsonldObjectToTerm(kb, o)))
}

/**
 * Type guard to check if an object is a Node.
 */
function isNode(x: any): x is Node {
  return x && typeof x === 'object' && 'termType' in x && 'value' in x
}

/**
 * Takes a json-ld formatted string {str} and adds its statements to {kb}.
 *
 * Ensure that {kb.rdfFactory} is a DataFactory.
 */
export default async function jsonldParser<T extends Formula>(str: string, kb: T, base: string | Node): Promise<T> {
  const baseString: string = base && isNode(base) ? base.value : base;
  const jsonld = await import('jsonld');
  const flattened = await jsonld.flatten(JSON.parse(str), null, { base: baseString });
  const result = flattened.reduce((store, flatResource) => processResource(kb, baseString, flatResource), kb);
  return result
}

function nodeType(kb: Formula, obj: Record<string, any>) {
  if (obj['@id'].startsWith('_:')) {
    // This object is a Blank Node. Pass the id without the `_:` prefix
    return kb.rdfFactory.blankNode(obj['@id'].substring(2));
  } else {
    // This object is a Named Node
    return kb.rdfFactory.namedNode(obj['@id']);
  }
}

function processResource(kb: Formula, base: string, flatResource: Record<string, any>): Formula {
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
function createStatement(kb: Formula, id: string, property: string, value: any, base: string) {
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
