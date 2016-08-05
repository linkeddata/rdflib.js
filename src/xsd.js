const NamedNode = require('./named-node')

class XSD {}

XSD.boolean = new NamedNode('http://www.w3.org/2001/XMLSchema#boolean')
XSD.dateTime = new NamedNode('http://www.w3.org/2001/XMLSchema#dateTime')
XSD.decimal = new NamedNode('http://www.w3.org/2001/XMLSchema#decimal')
XSD.float = new NamedNode('http://www.w3.org/2001/XMLSchema#float')
XSD.integer = new NamedNode('http://www.w3.org/2001/XMLSchema#integer')

module.exports = XSD
