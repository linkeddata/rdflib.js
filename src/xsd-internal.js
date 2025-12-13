import NamedNode from './named-node'

export default {
  boolean: new NamedNode('http://www.w3.org/2001/XMLSchema#boolean'),
  dateTime: new NamedNode('http://www.w3.org/2001/XMLSchema#dateTime'),
  decimal: new NamedNode('http://www.w3.org/2001/XMLSchema#decimal'),
  double: new NamedNode('http://www.w3.org/2001/XMLSchema#double'),
  integer: new NamedNode('http://www.w3.org/2001/XMLSchema#integer'),
  langString: new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString'),
  string: new NamedNode('http://www.w3.org/2001/XMLSchema#string'),
}
