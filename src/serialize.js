module.exports = serialize

const convert = require('./convert')
const Serializer = require('./serializer')

/**
 * Serialize to the appropriate format
 * @@ Currently NQuads and JSON/LD are deal with extrelemently inefficiently
 * through mutiple conversions.
 */
function serialize (target, kb, base, contentType, callback, options) {
  base = base || target.uri
  options = options || {}
  contentType = contentType || 'text/turtle' // text/n3 if complex?
  var documentString = null
  try {
    var sz = Serializer(kb)
    if (options.flags) sz.setFlags(options.flags)
    var newSts = kb.statementsMatching(undefined, undefined, undefined, target)
    var n3String
    sz.suggestNamespaces(kb.namespaces)
    sz.setBase(base)
    switch (contentType) {
      case 'application/rdf+xml':
        documentString = sz.statementsToXML(newSts)
        return executeCallback(null, documentString)
      case 'text/n3':
      case 'application/n3': // Legacy
        documentString = sz.statementsToN3(newSts)
        return executeCallback(null, documentString)
      case 'text/turtle':
      case 'application/x-turtle': // Legacy
        sz.setFlags('si') // Suppress = for sameAs and => for implies
        documentString = sz.statementsToN3(newSts)
        return executeCallback(null, documentString)
      case 'application/n-triples':
        sz.setFlags('deinprstux') // Suppress nice parts of N3 to make ntriples
        documentString = sz.statementsToNTriples(newSts)
        return executeCallback(null, documentString)
      case 'application/ld+json':
        sz.setFlags('deinprstux') // Use adapters to connect to incmpatible parser
        n3String = sz.statementsToNTriples(newSts)
        // n3String = sz.statementsToN3(newSts)
        convert.convertToJson(n3String, callback)
        break
      case 'application/n-quads':
      case 'application/nquads': // @@@ just outpout the quads? Does not work for collections
        sz.setFlags('deinprstux q') // Suppress nice parts of N3 to make ntriples
        documentString = sz.statementsToNTriples(newSts) // q in flag means actually quads
        return executeCallback(null, documentString)
        // n3String = sz.statementsToN3(newSts)
        // documentString = convert.convertToNQuads(n3String, callback)
        break
      default:
        throw new Error('Serialize: Content-type ' + contentType + ' not supported for data write.')
    }
  } catch (err) {
    if (callback) {
      return callback(err)
    }
    throw err // Don't hide problems from caller in sync mode
  }

  function executeCallback (err, result) {
    if (callback) {
      callback(err, result)
      return
    } else {
      return result
    }
  }
}
