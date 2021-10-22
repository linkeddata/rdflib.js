import CanonicalDataFactory from './factories/canonical-data-factory'

export function createXSD(localFactory = CanonicalDataFactory) {
  class XSD {}

  XSD.boolean = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')
  XSD.dateTime = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#dateTime')
  XSD.decimal = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#decimal')
  XSD.double = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#double')
  XSD.integer = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer')
  XSD.langString = localFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString')
  XSD.string = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#string')

  return XSD
}

const defaultXSD = createXSD(CanonicalDataFactory)

export default defaultXSD
