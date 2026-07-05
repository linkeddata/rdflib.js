// Converting between SPARQL queries and the $rdf query API
//
// A SPARQL front-end for the rdflib query engine (src/query.js), built on
// the sparqljs SPARQL 1.1 parser. It maps the parsed algebra onto the
// existing Query object shape (`query.pat`, `query.vars`) that the matcher
// and downstream UI code (e.g. solid-ui table panes) consume.
//
// The rdflib matcher is a basic-graph-pattern engine, so only the
// following SPARQL forms are accepted:
//   - SELECT queries: `SELECT ?a ?b WHERE { ... }` and `SELECT * WHERE { ... }`
//   - CONSTRUCT queries are executed as binding queries over their WHERE
//     clause (the Query API returns variable bindings, not graphs)
//   - WHERE clauses made of basic graph patterns (triple patterns with
//     `;`/`,` abbreviations, `a`, prefixed names, IRIs, literals, blank nodes)
//   - OPTIONAL { ... } groups (may nest, and may contain FILTERs)
//   - FILTER constraints of the forms:
//       FILTER (?x = <constant>)   FILTER (?x > <constant>)
//       FILTER (?x < <constant>)   FILTER regex(?x, "pattern"[, "flags"])
// Everything else (ASK/DESCRIBE, property paths, UNION, GRAPH, FROM, BIND,
// VALUES, subqueries, aggregates, solution modifiers such as ORDER/LIMIT/
// DISTINCT, other FILTER operators) throws an informative error rather
// than silently misparsing.

import { Parser as SparqlParser } from 'sparqljs'
import { Query } from './query'

const SUPPORTED = 'The supported subset is: SELECT (or CONSTRUCT, run as a SELECT ' +
  'over its WHERE clause) with basic graph patterns, OPTIONAL groups, and ' +
  'FILTER (?x = / < / > constant) or FILTER regex(?x, "pattern").'

// The constraint objects the matcher (query.js) applies to candidate
// bindings: each has test(term), and describe(varStr) for query-to-sparql.
function ConstraintEqualTo (value) {
  this.describe = function (varstr) {
    return varstr + ' = ' + value.toNT()
  }
  this.test = function (term) {
    return value.equals(term)
  }
  return this
}

function ConstraintGreaterThan (value) {
  this.describe = function (varstr) {
    return varstr + ' > ' + value.toNT()
  }
  this.test = function (term) {
    if (term.value.match(/^[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?$/)) {
      return (parseFloat(term.value) > parseFloat(value.value))
    } else {
      return (term.toNT() > value.toNT())
    }
  }
  return this
}

function ConstraintLessThan (value) {
  this.describe = function (varstr) {
    return varstr + ' < ' + value.toNT()
  }
  this.test = function (term) {
    if (term.value.match(/^[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?$/)) {
      return (parseFloat(term.value) < parseFloat(value.value))
    } else {
      return (term.toNT() < value.toNT())
    }
  }
  return this
}

// value is the pattern string, flags the optional regex flags
function ConstraintRegexp (value, flags) {
  this.describe = function (varstr) {
    return "REGEXP( '" + value + "' , " + varstr + ' )'
  }
  this.test = function (term) {
    var rg = new RegExp(value, flags)
    if (term.value) {
      return rg.test(term.value)
    } else {
      return false
    }
  }
  return this
}

function unsupported (why) {
  return new Error('SPARQLToQuery: ' + why + '\n' + SUPPORTED)
}

/**
 * @SPARQL: SPARQL text that is converted to a query object which is returned.
 * @testMode: testing flag. Prevents loading of sources.
 */
export default function SPARQLToQuery (SPARQL, testMode, kb) {
  var q = new Query()

  // One rdflib Variable instance per name, so identical names share a term
  var variableHash = {}
  function makeVar (name) {
    if (!variableHash[name]) {
      variableHash[name] = kb.variable(name)
    }
    return variableHash[name]
  }

  // Order of first occurrence of variables in the patterns, for SELECT *
  var varsSeen = []
  function noteTerm (term) {
    if (term.termType === 'Variable' && varsSeen.indexOf(term) < 0) {
      varsSeen.push(term)
    }
  }

  // Have sparqljs build rdflib terms via the store's data factory, with
  // variables funnelled through makeVar so instances are shared
  var factory = {
    namedNode: function (value) { return kb.rdfFactory.namedNode(value) },
    blankNode: function (value) { return kb.rdfFactory.blankNode(value) },
    literal: function (value, languageOrDatatype) { return kb.rdfFactory.literal(value, languageOrDatatype) },
    variable: function (name) { return makeVar(name) },
    defaultGraph: function () { return kb.rdfFactory.defaultGraph() },
    quad: function (s, p, o, g) { return kb.rdfFactory.quad(s, p, o, g) }
  }

  var parsed
  try {
    // rdf: and rdfs: are predeclared, as they were in the old parser
    parsed = new SparqlParser({
      factory: factory,
      prefixes: {
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
      }
    }).parse(SPARQL)
  } catch (e) {
    throw new Error('SPARQLToQuery: could not parse the query: ' +
      (e && e.message ? e.message : e) + '\n' + SUPPORTED)
  }

  if (parsed.type !== 'query') {
    throw unsupported('only SPARQL queries are supported, not ' + parsed.type + ' operations')
  }
  if (parsed.queryType !== 'SELECT' && parsed.queryType !== 'CONSTRUCT') {
    throw unsupported(parsed.queryType + ' queries are not supported')
  }
  if (parsed.from) {
    throw unsupported('FROM clauses are not supported: the query runs over the given knowledge base')
  }
  if (parsed.group || parsed.having || parsed.order ||
      parsed.limit !== undefined || parsed.offset !== undefined || parsed.distinct) {
    throw unsupported('aggregates and solution modifiers (GROUP BY, HAVING, ORDER BY, LIMIT, OFFSET, DISTINCT) are not supported')
  }

  // SELECT variables (a Wildcard for `SELECT *`); CONSTRUCT has none
  var wildcard = parsed.queryType === 'CONSTRUCT'
  var selectVars = []
  ;(parsed.variables || []).forEach(function (v) {
    if (v.termType === 'Wildcard' || v.value === '*') {
      wildcard = true
    } else if (v.termType === 'Variable') {
      selectVars.push(makeVar(v.value))
    } else {
      throw unsupported('SELECT expressions (AS) are not supported')
    }
  })

  function checkPatternTerm (term) {
    if (!term.termType) { // e.g. a property path object
      throw unsupported('property paths are not supported')
    }
    noteTerm(term)
    return term
  }

  function addConstraint (formula, expression) {
    if (expression.type !== 'operation') {
      throw unsupported('only simple FILTER constraints are supported')
    }
    var op = expression.operator
    var args = expression.args
    if (op === 'regex') {
      if (args.length < 2 || args[0].termType !== 'Variable' || args[1].termType !== 'Literal') {
        throw unsupported('FILTER regex is only supported as regex(?variable, "pattern"[, "flags"])')
      }
      formula.constraints[args[0]] = new ConstraintRegexp(
        args[1].value, args[2] && args[2].value)
      return
    }
    if (op === '=' || op === '>' || op === '<') {
      if (args.length !== 2 || args[0].termType !== 'Variable' ||
          (args[1].termType !== 'Literal' && args[1].termType !== 'NamedNode')) {
        throw unsupported("FILTER " + op + ' is only supported as (?variable ' + op + ' constant)')
      }
      var Constraint = op === '=' ? ConstraintEqualTo
        : op === '>' ? ConstraintGreaterThan : ConstraintLessThan
      formula.constraints[args[0]] = new Constraint(args[1])
      return
    }
    throw unsupported("the FILTER operator '" + op + "' is not supported")
  }

  function addGroup (patterns, formula) {
    patterns.forEach(function (pattern) {
      switch (pattern.type) {
        case 'bgp':
          pattern.triples.forEach(function (t) {
            formula.add(checkPatternTerm(t.subject),
              checkPatternTerm(t.predicate),
              checkPatternTerm(t.object))
          })
          break
        case 'optional': {
          var opt = kb.formula()
          addGroup(pattern.patterns, opt)
          formula.optional.push(opt)
          break
        }
        case 'filter':
          addConstraint(formula, pattern.expression)
          break
        case 'group':
          addGroup(pattern.patterns, formula)
          break
        default:
          throw unsupported("the '" + pattern.type.toUpperCase() + "' construct is not supported")
      }
    })
  }

  addGroup(parsed.where || [], q.pat)

  var vars = wildcard ? varsSeen : selectVars
  vars.forEach(function (v) {
    q.vars.push(v)
    v.label = v.value
  })

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
  return q
}
