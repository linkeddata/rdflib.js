import CanonicalDataFactory from "./factories/canonical-data-factory"

export function createXSD(localFactory = CanonicalDataFactory) {
  return {
    boolean: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#boolean"),
    dateTime: localFactory.namedNode(
      "http://www.w3.org/2001/XMLSchema#dateTime"
    ),
    decimal: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#decimal"),
    double: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#double"),
    integer: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#integer"),
    langString: localFactory.namedNode(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString"
    ),
    string: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#string"),
  }
}

const defaultXSD = createXSD(CanonicalDataFactory)

export default defaultXSD
