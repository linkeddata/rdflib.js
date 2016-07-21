const log = require('../src/log')

function SPARQLResultsInterpreter (xml, callback, doneCallback) {
  function isVar (term) {
    return (typeof term === 'string' && term.match(/^[\?\$]/))
  }
  function fixSymbolBrackets (term) {
    if (typeof term === 'string') {
      return term.replace(/^&lt;/, '<').replace(/&gt;$/, '>')
    } else {
      return term
    }
  }
  function isSymbol (term) {
    return (typeof term === 'string' && term.match(/^<[^>]*>$/))
  }
  function isBnode (term) {
    return (typeof term === 'string' &&
    (term.match(/^_:/) || term.match(/^$/)))
  }
  function isPrefix (term) {
    return (typeof term === 'string' && term.match(/:$/))
  }
  function isPrefixedSymbol (term) {
    return (typeof term === 'string' && term.match(/^:|^[^_][^:]*:/))
  }
  function getPrefix (term) {
    var a = term.split(':')
    return a[0]
  }
  function getSuffix (term) {
    var a = term.split(':')
    return a[1]
  }
  function removeBrackets (term) {
    if (isSymbol(term)) {
      return term.slice(1, term.length - 1)
    } else {
      return term
    }
  }
  function parsePrefix (attribute) {
    if (!attribute.name.match(/^xmlns/)) {
      return false
    }
    var pref = attribute.name.replace(/^xmlns/, '')
      .replace(/^:/, '').replace(/ /g, '')
    prefixes[pref] = attribute.value
    log.info('Prefix: ' + pref + '\nValue: ' + attribute.value)
  }
  function handleP (str) { // reconstructs prefixed URIs
    var pref
    var suf
    if (isPrefixedSymbol(str)) {
      pref = getPrefix(str)
      suf = getSuffix(str)
    } else {
      pref = ''
      suf = str
    }
    if (prefixes[pref]) {
      return prefixes[pref] + suf
    } else {
      log.error('Incorrect SPARQL results - bad prefix')
    }
  }
  function xmlMakeTerm (node) {
    // alert("xml Node name: "+node.nodeName+"\nxml Child value: "+node.childNodes[0].nodeValue)
    var val = node.childNodes[0]
    for (var x = 0; x < node.childNodes.length; x++) {
      if (node.childNodes[x].nodeType === 3) {
        val = node.childNodes[x]
        break
      }
    }
    if (handleP(node.nodeName) === spns + 'uri') {
      return kb.sym(val.nodeValue)
    } else if (handleP(node.nodeName) === spns + 'literal') {
      return kb.literal(val.nodeValue)
    } else if (handleP(node.nodeName) === spns + 'unbound') {
      return 'unbound'
    } else {
      log.warn("Don't know how to handle xml binding term " + node)
    }
    return false
  }
  function handleResult (result) {
    var resultBindings = []
    var bound = false
    for (var x = 0; x < result.childNodes.length; x++) {
      // alert(result[x].nodeName)
      if (result.childNodes[x].nodeType !== 1) {
        continue
      }
      if (handleP(result.childNodes[x].nodeName) !== spns + 'binding') {
        log.warn('Bad binding node inside result')
        continue
      }
      var bind = result.childNodes[x]
      var bindVar = makeVar(bind.getAttribute('name'))
      var binding = null
      for (var y = 0; y < bind.childNodes.length; y++) {
        if (bind.childNodes[y].nodeType === 1) {
          binding = xmlMakeTerm(bind.childNodes[y])
          break
        }
      }
      if (!binding) {
        log.warn('Bad binding')
        return false
      }
      log.info('var: ' + bindVar + ' binding: ' + binding)
      bound = true
      if (binding !== 'unbound') {
        resultBindings[bindVar] = binding
      }
    }
    // alert(callback)
    if (bound && callback) {
      setTimeout(function () {
        callback(resultBindings)
      }, 0)
    }
    bindingList.push(resultBindings)
    return
  }

  // ****MAIN CODE**********
  var prefixes = []
  var bindingList = []
  var head
  var results
  var sparql = xml.childNodes[0]
  var spns = 'http://www.w3.org/2005/sparql-results#'
  prefixes[''] = ''
  var x

  if (sparql.nodeName !== 'sparql') {
    log.error('Bad SPARQL results XML')
    return
  }

  for (x = 0; x < sparql.attributes.length; x++) { // deals with all the prefixes beforehand
    parsePrefix(sparql.attributes[x])
  }
  // looks for the head and results childNodes
  for (x = 0; x < sparql.childNodes.length; x++) {
    log.info('Type: ' + sparql.childNodes[x].nodeType +
      '\nName: ' + sparql.childNodes[x].nodeName + '\nValue: ' +
      sparql.childNodes[x].nodeValue
    )

    if (sparql.childNodes[x].nodeType === 1 &&
      handleP(sparql.childNodes[x].nodeName) === spns + 'head') {
      head = sparql.childNodes[x]
    } else if (sparql.childNodes[x].nodeType === 1 &&
      handleP(sparql.childNodes[x].nodeName) === spns + 'results') {
      results = sparql.childNodes[x]
    }
  }

  if (!results && !head) {
    log.error('Bad SPARQL results XML')
    return
  }
  // @@does anything need to be done with these?
  // Should we check against query vars?
  for (x = 0; x < head.childNodes.length; x++) {
    if (head.childNodes[x].nodeType === 1 &&
      handleP(head.childNodes[x].nodeName) === spns + 'variable') {
      log.info('Var: ' + head.childNodes[x].getAttribute('name'))
    }
  }

  for (x = 0; x < results.childNodes.length; x++) {
    if (handleP(results.childNodes[x].nodeName) === spns + 'result') {
      log.info('Result # ' + x)
      handleResult(results.childNodes[x])
    }
  }
  if (doneCallback) {
    doneCallback()
  }
  return bindingList
// ****END OF MAIN CODE*****
}

module.exports = SPARQLResultsInterpreter
