// Converting between SPARQL queries and the $rdf query API
/*

function SQuery () {
  this.terms = []
  return this
}

STerm.prototype.toString = STerm.val
SQuery.prototype.add = function (str) {this.terms.push()}*/

import log from './log'
import { Query } from './query'

/**
 * @SPARQL: SPARQL text that is converted to a query object which is returned.
 * @testMode: testing flag. Prevents loading of sources.
 */
export default function SPARQLToQuery (SPARQL, testMode, kb) {
  // AJAR_ClearTable()
  var variableHash = []
  function makeVar (name) {
    if (variableHash[name]) {
      return variableHash[name]
    }
    var newVar = kb.variable(name)
    variableHash[name] = newVar
    return newVar
  }

  // term type functions
  function isRealText (term) {
    return (typeof term === 'string' && term.match(/[^ \n\t]/))
  }
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
    return (typeof term === 'string' && (term.match(/^_:/) || term.match(/^$/)))
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
  // takes a string and returns an array of strings and Literals in the place of literals
  function parseLiterals (str) {
    // var sin = (str.indexOf(/[ \n]\'/)==-1)?null:str.indexOf(/[ \n]\'/), doub = (str.indexOf(/[ \n]\"/)==-1)?null:str.indexOf(/[ \n]\"/)
    var sin = (str.indexOf("'") === -1)
      ? null
      : str.indexOf("'")
    var doub = (str.indexOf('"') === -1)
      ? null
      : str.indexOf('"')
    // alert("S: "+sin+" D: "+doub)
    if (!sin && !doub) {
      var a = new Array(1)
      a[0] = str
      return a
    }
    var res = new Array(2)
    var br
    var ind
    if (!sin || (doub && doub < sin)) {
      br = '"'
      ind = doub
    } else if (!doub || (sin && sin < doub)) {
      br = "'"
      ind = sin
    } else {
      log.error('SQARQL QUERY OOPS!')
      return res
    }
    res[0] = str.slice(0, ind)
    var end = str.slice(ind + 1).indexOf(br)
    if (end === -1) {
      log.error('SPARQL parsing error: no matching parentheses in literal ' + str)
      return str
    }
    // alert(str.slice(end + ind + 2).match(/^\^\^/))
    var end2
    if (str.slice(end + ind + 2).match(/^\^\^/)) {
      end2 = str.slice(end + ind + 2).indexOf(' ')
      // alert(end2)
      res[1] = kb.literal(
        str.slice(ind + 1, ind + 1 + end),
        kb.sym(removeBrackets(
          str.slice(ind + 4 + end, ind + 2 + end + end2))
        )
      )
      // alert(res[1].datatype.uri)
      res = res.concat(parseLiterals(str.slice(end + ind + 3 + end2)))
    } else if (str.slice(end + ind + 2).match(/^@/)) {
      end2 = str.slice(end + ind + 2).indexOf(' ')
      // alert(end2)
      res[1] = kb.literal(
        str.slice(ind + 1, ind + 1 + end),
        str.slice(ind + 3 + end, ind + 2 + end + end2), null
      )
      // alert(res[1].datatype.uri)
      res = res.concat(
        parseLiterals(str.slice(end + ind + 2 + end2))
      )
    } else {
      res[1] = kb.literal(str.slice(ind + 1, ind + 1 + end))
      log.info('Literal found: ' + res[1])
      res = res.concat(parseLiterals(str.slice(end + ind + 2))) // finds any other literals
    }
    return res
  }

  function spaceDelimit (str) {
    str = str.replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .replace(/</g, ' <')
      .replace(/>/g, '> ')
      .replace(/{/g, ' { ')
      .replace(/}/g, ' } ')
      .replace(/[\t\n\r]/g, ' ')
      .replace(/; /g, ' ; ')
      .replace(/\. /g, ' . ')
      .replace(/, /g, ' , ')
    log.info('New str into spaceDelimit: \n' + str)
    var res = []
    var br = str.split(' ')
    for (var x in br) {
      if (isRealText(br[x])) {
        res = res.concat(br[x])
      }
    }
    return res
  }

  function replaceKeywords (input) {
    var strarr = input
    for (var x = 0; x < strarr.length; x++) {
      if (strarr[x] === 'a') {
        strarr[x] = '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>'
      }
      if (strarr[x] === 'is' && strarr[x + 2] === 'of') {
        strarr.splice(x, 1)
        strarr.splice(x + 1, 1)
        var s = strarr[x - 1]
        strarr[x - 1] = strarr[x + 1]
        strarr[x + 1] = s
      }
    }
    return strarr
  }

  function toTerms (input) {
    var res = []
    for (var x = 0; x < input.length; x++) {
      if (typeof input[x] !== 'string') {
        res[x] = input[x]
        continue
      }
      input[x] = fixSymbolBrackets(input[x])
      if (isVar(input[x])) {
        res[x] = makeVar(input[x].slice(1))
      } else if (isBnode(input[x])) {
        log.info(input[x] + ' was identified as a bnode.')
        res[x] = kb.bnode()
      } else if (isSymbol(input[x])) {
        log.info(input[x] + ' was identified as a symbol.')
        res[x] = kb.sym(removeBrackets(input[x]))
      } else if (isPrefixedSymbol(input[x])) {
        log.info(input[x] + ' was identified as a prefixed symbol')
        if (prefixes[getPrefix(input[x])]) {
          res[x] = kb.sym(input[x] = prefixes[getPrefix(input[x])] +
            getSuffix(input[x]))
        } else {
          log.error('SPARQL error: ' + input[x] + ' with prefix ' +
            getPrefix(input[x]) + ' does not have a correct prefix entry.')
          res[x] = input[x]
        }
      } else {
        res[x] = input[x]
      }
    }
    return res
  }

  function tokenize (str) {
    var token1 = parseLiterals(str)
    var token2 = []
    for (var x in token1) {
      if (typeof token1[x] === 'string') {
        token2 = token2.concat(spaceDelimit(token1[x]))
      } else {
        token2 = token2.concat(token1[x])
      }
    }
    token2 = replaceKeywords(token2)
    log.info('SPARQL Tokens: ' + token2)
    return token2
  }

  // CASE-INSENSITIVE
  function arrayIndexOf (str, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== 'string') {
        continue
      }
      if (arr[i].toLowerCase() === str.toLowerCase()) {
        return i
      }
    }
    // log.warn("No instance of "+str+" in array "+arr)
    return null
  }

  // CASE-INSENSITIVE
  function arrayIndicesOf (str, arr) {
    var ind = []
    for (var i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== 'string') {
        continue
      }
      if (arr[i].toLowerCase() === str.toLowerCase()) {
        ind.push(i)
      }
    }
    return ind
  }

  function setVars (input, query) {
    log.info('SPARQL vars: ' + input)
    for (var x in input) {
      if (isVar(input[x])) {
        log.info('Added ' + input[x] + ' to query variables from SPARQL')
        var v = makeVar(input[x].slice(1))
        query.vars.push(v)
        v.label = input[x].slice(1)
      } else {
        log.warn('Incorrect SPARQL variable in SELECT: ' + input[x])
      }
    }
  }

  function getPrefixDeclarations (input) {
    var prefInd = arrayIndicesOf('PREFIX', input)
    var res = []
    for (var i in prefInd) {
      var a = input[prefInd[i] + 1]
      var b = input[prefInd[i] + 2]
      if (!isPrefix(a)) {
        log.error('Invalid SPARQL prefix: ' + a)
      } else if (!isSymbol(b)) {
        log.error('Invalid SPARQL symbol: ' + b)
      } else {
        log.info('Prefix found: ' + a + ' -> ' + b)
        var pref = getPrefix(a)
        var symbol = removeBrackets(b)
        res[pref] = symbol
      }
    }
    return res
  }

  function getMatchingBracket (arr, open, close) {
    log.info('Looking for a close bracket of type ' + close + ' in ' + arr)
    var index = 0
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === open) {
        index++
      }
      if (arr[i] === close) {
        index--
      }
      if (index < 0) {
        return i
      }
    }
    log.error('Statement had no close parenthesis in SPARQL query')
    return 0
  }

  function constraintGreaterThan (value) {
    this.describe = function (varstr) {
      return varstr + ' > ' + value.toNT()
    }
    this.test = function (term) {
      if (term.value.match(/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/)) {
        return (parseFloat(term.value) > parseFloat(value))
      } else {
        return (term.toNT() > value.toNT())
      }
    }
    return this
  }

  function constraintLessThan (value) { // this is not the recommended usage. Should only work on literal, numeric, dateTime
    this.describe = function (varstr) {
      return varstr + ' < ' + value.toNT()
    }
    this.test = function (term) {
      // this.describe = function (varstr) { return varstr + " < "+value }
      if (term.value.match(/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/)) {
        return (parseFloat(term.value) < parseFloat(value))
      } else {
        return (term.toNT() < value.toNT())
      }
    }
    return this
  }
  // This should only work on literals but doesn't.
  function ConstraintEqualTo (value) {
    this.describe = function (varstr) {
      return varstr + ' = ' + value.toNT()
    }
    this.test = function (term) {
      return value.equals(term)
    }
    return this
  }

  // value must be a literal
  function ConstraintRegexp (value) {
    this.describe = function (varstr) {
      return "REGEXP( '" + value + "' , " + varstr + ' )'
    }
    this.test = function (term) {
      var str = value
      // str = str.replace(/^//,"").replace(//$/,"")
      var rg = new RegExp(str)
      if (term.value) {
        return rg.test(term.value)
      } else {
        return false
      }
    }
  }

  function setConstraint (input, pat) {
    if (input.length === 3 && input[0].termType === 'Variable' &&
      (input[2].termType === 'NamedNode' || input[2].termType === 'Literal')) {
      if (input[1] === '=') {
        log.debug('Constraint added: ' + input)
        pat.constraints[input[0]] = new ConstraintEqualTo(input[2])
      } else if (input[1] === '>') {
        log.debug('Constraint added: ' + input)
        pat.constraints[input[0]] = new ConstraintEqualTo(input[2])
      } else if (input[1] === '<') {
        log.debug('Constraint added: ' + input)
        pat.constraints[input[0]] = new ConstraintEqualTo(input[2])
      } else {
        log.warn("I don't know how to handle the constraint: " + input)
      }
    } else if (input.length === 6 && typeof input[0] === 'string' &&
      input[0].toLowerCase() === 'regexp' &&
      input[1] === '(' && input[5] === ')' && input[3] === ',' &&
      input[4].termType === 'Variable' && input[2].termType === 'Literal') {
      log.debug('Constraint added: ' + input)
      pat.constraints[input[4]] = new ConstraintRegexp(input[2].value)
    }
  // log.warn("I don't know how to handle the constraint: "+input)
  // alert("length: "+input.length+" input 0 type: "+input[0].termType+" input 1: "+input[1]+" input[2] type: "+input[2].termType)
  }

  function setOptional (terms, pat) {
    log.debug('Optional query: ' + terms + ' not yet implemented.')
    var opt = kb.formula()
    setWhere(terms, opt)
    pat.optional.push(opt)
  }

  function setWhere (input, pat) {
    var terms = toTerms(input)
    var end
    log.debug('WHERE: ' + terms)
    var opt
    // var opt = arrayIndicesOf("OPTIONAL",terms)
    while (arrayIndexOf('OPTIONAL', terms)) {
      opt = arrayIndexOf('OPTIONAL', terms)
      log.debug('OPT: ' + opt + ' ' + terms[opt] + ' in ' + terms)
      if (terms[opt + 1] !== '{') {
        log.warn('Bad optional opening bracket in word ' + opt)
      }
      end = getMatchingBracket(terms.slice(opt + 2), '{', '}')
      if (end === -1) {
        log.error('No matching bracket in word ' + opt)
      } else {
        setOptional(terms.slice(opt + 2, opt + 2 + end), pat)
        // alert(pat.statements[0].toNT())
        opt = arrayIndexOf('OPTIONAL', terms)
        end = getMatchingBracket(terms.slice(opt + 2), '{', '}')
        terms.splice(opt, end + 3)
      }
    }
    log.debug('WHERE after optionals: ' + terms)
    while (arrayIndexOf('FILTER', terms)) {
      var filt = arrayIndexOf('FILTER', terms)
      if (terms[filt + 1] !== '(') {
        log.warn('Bad filter opening bracket in word ' + filt)
      }
      end = getMatchingBracket(terms.slice(filt + 2), '(', ')')
      if (end === -1) {
        log.error('No matching bracket in word ' + filt)
      } else {
        setConstraint(terms.slice(filt + 2, filt + 2 + end), pat)
        filt = arrayIndexOf('FILTER', terms)
        end = getMatchingBracket(terms.slice(filt + 2), '(', ')')
        terms.splice(filt, end + 3)
      }
    }
    log.debug('WHERE after filters and optionals: ' + terms)
    extractStatements(terms, pat)
  }

  function extractStatements (terms, formula) {
    var arrayZero = new Array(1)
    arrayZero[0] = -1 // this is just to add the beginning of the where to the periods index.
    var per = arrayZero.concat(arrayIndicesOf('.', terms))
    var stat = []
    for (var x = 0; x < per.length - 1; x++) {
      stat[x] = terms.slice(per[x] + 1, per[x + 1])
    }
    // Now it's in an array of statements
    for (x in stat) { // THIS MUST BE CHANGED FOR COMMA, SEMICOLON
      log.info('s+p+o ' + x + ' = ' + stat[x])
      var subj = stat[x][0]
      stat[x].splice(0, 1)
      var sem = arrayZero.concat(arrayIndicesOf(';', stat[x]))
      sem.push(stat[x].length)
      var stat2 = []
      for (var y = 0; y < sem.length - 1; y++) {
        stat2[y] = stat[x].slice(sem[y] + 1, sem[y + 1])
      }
      for (x in stat2) {
        log.info('p+o ' + x + ' = ' + stat[x])
        var pred = stat2[x][0]
        stat2[x].splice(0, 1)
        var com = arrayZero.concat(arrayIndicesOf(',', stat2[x]))
        com.push(stat2[x].length)
        var stat3 = []
        for (y = 0; y < com.length - 1; y++) {
          stat3[y] = stat2[x].slice(com[y] + 1, com[y + 1])
        }
        for (x in stat3) {
          var obj = stat3[x][0]
          log.info('Subj=' + subj + ' Pred=' + pred + ' Obj=' + obj)
          formula.add(subj, pred, obj)
        }
      }
    }
  }

  // ******************************* Body of SPARQLToQuery ***************************//
  log.info('SPARQL input: \n' + SPARQL)
  var q = new Query()
  var sp = tokenize(SPARQL) // first tokenize everything
  var prefixes = getPrefixDeclarations(sp)
  if (!prefixes.rdf) {
    prefixes.rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
  }
  if (!prefixes.rdfs) {
    prefixes.rdfs = 'http://www.w3.org/2000/01/rdf-schema#'
  }
  var selectLoc = arrayIndexOf('SELECT', sp)
  var whereLoc = arrayIndexOf('WHERE', sp)
  if (selectLoc < 0 || whereLoc < 0 || selectLoc > whereLoc) {
    log.error('Invalid or nonexistent SELECT and WHERE tags in SPARQL query')
    return false
  }
  setVars(sp.slice(selectLoc + 1, whereLoc), q)

  setWhere(sp.slice(whereLoc + 2, sp.length - 1), q.pat)

  if (testMode) {
    return q
  }

  for (var x in q.pat.statements) {
    var st = q.pat.statements[x]
    if (st.subject.termType === 'NamedNode') {
      if (kb.fetcher) {
        kb.fetcher.lookUpThing(st.subject, 'sparql:' + st.subject)
      }
    }
    if (st.object.termType === 'NamedNode') {
      if (kb.fetcher) {
        kb.fetcher.lookUpThing(st.object, 'sparql:' + st.object)
      }
    }
  }
  // alert(q.pat)
  return q
// checkVars()
// *******************************************************************//
}
