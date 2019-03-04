const ns = require('./ns')

class XSD {}

XSD.boolean = ns.xsd('boolean')
XSD.dateTime = ns.xsd('dateTime')
XSD.decimal = ns.xsd('decimal')
XSD.double = ns.xsd('double')
XSD.integer = ns.xsd('integer')
XSD.langString = ns.rdf('langString')
XSD.string = ns.xsd('string')

module.exports = XSD
