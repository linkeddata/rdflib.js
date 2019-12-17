import jsonld from 'jsonld'

import { arrayToStatements } from './utils'

/**
 * Parses json-ld formatted JS objects to a rdf Term.
 * @param kb - The DataFactory to use.
 * @param obj - The json-ld object to process.
 * @return {Literal|NamedNode|BlankNode|Collection}
 */
export function jsonldObjectToTerm (kb, obj) {
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
    return kb.rdfFactory.namedNode(obj['@id'])
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
function listToStatements (kb, obj) {
  const listId = obj['@id'] ? kb.rdfFactory.namedNode(obj['@id']) : kb.rdfFactory.blankNode()

  const items = obj['@list'].map((listItem => jsonldObjectToTerm(kb, listItem)))
  const statements = arrayToStatements(kb.rdfFactory, listId, items)
  kb.addAll(statements)

  return listId
}

function listToCollection (kb, obj) {
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
export default function jsonldParser (str, kb, base, callback) {
  const baseString = base && Object.prototype.hasOwnProperty.call(base, 'termType')
    ? base.value
    : base

  return jsonld
    .flatten(JSON.parse(str), null, { base: baseString })
    .then((flattened) => flattened.reduce((store, flatResource) => {
      const id = flatResource['@id']
        ? kb.rdfFactory.namedNode(flatResource['@id'])
        : kb.rdfFactory.blankNode()

      for (const property of Object.keys(flatResource)) {
        if (property === '@id') {
          continue
        }
        const value = flatResource[property]
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            kb.addStatement(kb.rdfFactory.quad(id, kb.rdfFactory.namedNode(property), jsonldObjectToTerm(kb, value[i])))
          }
        } else {
          kb.addStatement(kb.rdfFactory.quad(id, kb.rdfFactory.namedNode(property), jsonldObjectToTerm(kb, value)))
        }
      }

      return kb
    }, kb))
    .then(callback)
    .catch(callback)
}
