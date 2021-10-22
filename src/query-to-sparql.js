import log from './log'

export default function queryToSPARQL (query) {
  var indent = 0
  function getSelect (query) {
    var str = addIndent() + 'SELECT '
    for (var i = 0; i < query.vars.length; i++) {
      str += query.vars[i] + ' '
    }
    str += '\n'
    return str
  }

  function getPattern (pat) {
    var str = ''
    var st = pat.statements
    for (var x in st) {
      log.debug('Found statement: ' + st)
      str += addIndent() + st[x] + '\n'
    }
    return str
  }

  function getConstraints (pat) {
    var str = ''
    for (var v in pat.constraints) {
      var foo = pat.constraints[v]
      str += addIndent() + 'FILTER ( ' + foo.describe(v) + ' ) ' + '\n'
    }
    return str
  }

  function getOptionals (pat) {
    var str = ''
    for (var x = 0; x < pat.optional.length; x++) {
      // alert(pat.optional.termType)
      log.debug('Found optional query')
      str += addIndent() + 'OPTIONAL { ' + '\n'
      indent++
      str += getPattern(pat.optional[x])
      str += getConstraints(pat.optional[x])
      str += getOptionals(pat.optional[x])
      indent--
      str += addIndent() + '}' + '\n'
    }
    return str
  }

  function getWhere (pat) {
    var str = addIndent() + 'WHERE \n' + '{ \n'
    indent++
    str += getPattern(pat)
    str += getConstraints(pat)
    str += getOptionals(pat)
    indent--
    str += '}'
    return str
  }

  function addIndent () {
    var str = ''
    for (var i = 0; i < indent; i++) {
      str += '    '
    }
    return str
  }

  function getSPARQL (query) {
    return getSelect(query) + getWhere(query.pat)
  }

  return getSPARQL(query)
}
