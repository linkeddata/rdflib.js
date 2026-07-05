// Parse a SPARQL-Update subset syntax for patches, using the SPARQL 1.1
// Update grammar implemented by sparqljs.
//
//  This parses
//   DELETE {yyy} INSERT {zzz} WHERE {xxx}
// (for backward compatibility, the clauses may arrive in any order, e.g.
// legacy WHERE-first patches, and `INSERT DATA`/`DELETE DATA` and N3-style
// `@prefix` directives are also accepted)
// as though it were the n3
//   <#query> patch:where {xxx}; patch:delete {yyy}; patch:insert {zzz}.
import { Parser as SparqlParser } from 'sparqljs'
import Namespace from './namespace'
import { docpart } from './uri'

// Skip whitespace and #-comments. Returns the next index (may be str.length).
function skipSpace (str, i) {
  while (i < str.length) {
    var ch = str[i]
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '\f') {
      i += 1
    } else if (ch === '#') { // comment runs to end of line
      while (i < str.length && str[i] !== '\n') i += 1
    } else {
      break
    }
  }
  return i
}

// Scan a single- or triple-quoted string starting at i (str[i] is the quote).
// Returns the index just after the closing quote(s).
function skipString (str, i, base) {
  var quote = str[i]
  var long = str.slice(i, i + 3) === quote + quote + quote
  var terminator = long ? quote + quote + quote : quote
  i += terminator.length
  while (i < str.length) {
    if (str[i] === '\\') {
      i += 2
    } else if (str.slice(i, i + terminator.length) === terminator) {
      return i + terminator.length
    } else if (!long && str[i] === '\n') {
      return i // unterminated single-line string; let sparqljs report it
    } else {
      i += 1
    }
  }
  throw badPatchSyntax(base, str, i, 'unterminated string literal in patch')
}

// Given str[i] === '{', return the index just after the matching '}',
// respecting nested groups, strings, IRIs and comments.
function skipGroup (str, i, base) {
  var depth = 0
  var start = i
  while (i < str.length) {
    var ch = str[i]
    if (ch === '{') {
      depth += 1
      i += 1
    } else if (ch === '}') {
      depth -= 1
      i += 1
      if (depth === 0) return i
    } else if (ch === '"' || ch === "'") {
      i = skipString(str, i, base)
    } else if (ch === '<') { // probably an IRIREF: scan to '>' unless it is a comparison
      var j = i + 1
      while (j < str.length && str[j] !== '>' &&
             !/[\s<"{}]/.test(str[j])) j += 1
      i = (str[j] === '>') ? j + 1 : i + 1
    } else if (ch === '#') { // comment runs to end of line
      while (i < str.length && str[i] !== '\n') i += 1
    } else {
      i += 1
    }
  }
  throw badPatchSyntax(base, str, start, "no matching '}' for clause group")
}

function badPatchSyntax (base, str, i, why) {
  return new Error('Patch syntax failure in <' + base + '>: ' + why +
    '\n   at: "' + str.slice(i, i + 30) + '"')
}

// Split the patch into prefix/base directives and top-level clauses,
// without interpreting the clause bodies.
function scanTopLevel (str, base) {
  var directives = []
  var clauses = [] // { kind: 'insert'|'delete'|'where', body: string }
  var i = 0
  var m
  for (;;) {
    i = skipSpace(str, i)
    if (i >= str.length) return { directives: directives, clauses: clauses }
    if (str[i] === ';') { // clause separator, as in legacy patches
      i += 1
      continue
    }
    var rest = str.slice(i)
    if ((m = rest.match(/^@?prefix\s+([^\s<>]*:)\s*(<[^<>"{}|^`\\\s]*>)\s*\.?/i))) {
      // N3-style `@prefix foo: <x> .` is normalized to SPARQL `PREFIX foo: <x>`
      directives.push('PREFIX ' + m[1] + ' ' + m[2])
      i += m[0].length
    } else if ((m = rest.match(/^@?base\s+(<[^<>"{}|^`\\\s]*>)\s*\.?/i))) {
      directives.push('BASE ' + m[1])
      i += m[0].length
    } else if ((m = rest.match(/^(INSERT|DELETE|WHERE)\b/i))) {
      var kind = m[1].toLowerCase()
      var j = skipSpace(str, i + m[1].length)
      if (kind !== 'where' && /^DATA\b/i.test(str.slice(j, j + 5))) {
        j = skipSpace(str, j + 4) // `INSERT DATA`/`DELETE DATA`; also tolerated alongside WHERE, like the old parser
      }
      if (str[j] !== '{') {
        throw badPatchSyntax(base, str, j, 'expected {...} after ' + m[1].toUpperCase())
      }
      var end = skipGroup(str, j, base)
      clauses.push({ kind: kind, body: str.slice(j + 1, end - 1) })
      i = end
    } else {
      throw badPatchSyntax(base, str, i,
        "Unknown syntax at start of statement: '" + str.slice(i, i + 20) + "'")
    }
  }
}

// Reassemble the scanned clauses as a spec-conformant SPARQL 1.1 Update
// string: `DELETE {} INSERT {} WHERE {}` when a WHERE clause is present
// (whatever the input clause order), `DELETE DATA`/`INSERT DATA` otherwise.
function normalizePatch (directives, clauses, base) {
  var parts = directives.slice()
  var byKind = { insert: [], delete: [], where: [] }
  clauses.forEach(function (clause) { byKind[clause.kind].push(clause) })
  if (byKind.where.length) {
    ;['insert', 'delete', 'where'].forEach(function (kind) {
      if (byKind[kind].length > 1) {
        throw new Error('Patch syntax failure in <' + base + '>: multiple ' +
          kind.toUpperCase() + ' clauses in one DELETE/INSERT/WHERE patch are not supported')
      }
    })
    if (byKind.delete.length) {
      parts.push('DELETE { ' + byKind.delete[0].body + ' }')
    } else if (!byKind.insert.length) {
      parts.push('DELETE { }') // a patch of just WHERE needs some template clause
    }
    if (byKind.insert.length) parts.push('INSERT { ' + byKind.insert[0].body + ' }')
    parts.push('WHERE { ' + byKind.where[0].body + ' }')
    return parts.join('\n')
  }
  // No WHERE: each clause is an independent DATA operation, in input order
  var ops = clauses.map(function (clause) {
    return (clause.kind === 'delete' ? 'DELETE DATA' : 'INSERT DATA') +
      ' { ' + clause.body + ' }'
  })
  parts.push(ops.join(' ;\n'))
  return parts.join('\n')
}

export default function sparqlUpdateParser (str, kb, base) {
  var SQNS = Namespace('http://www.w3.org/ns/pim/patch#')
  var doc = docpart(base) // the document part: a fragment on the base cannot take part in IRI resolution
  var query = kb.sym(doc + '#query') // Invent a URI for the query
  var source = kb.sym(doc)
  var clauses = {}
  clauses['query'] = query // A way of accessing it in its N3 model.

  var scanned = scanTopLevel(str, base)
  if (scanned.clauses.length === 0) {
    return clauses // An empty patch (or just directives): nothing to do
  }
  var inputHas = {}
  scanned.clauses.forEach(function (clause) { inputHas[clause.kind] = true })

  var normalized = normalizePatch(scanned.directives, scanned.clauses, base)

  var parsed
  try {
    // The store's data factory makes sparqljs produce rdflib terms directly
    parsed = new SparqlParser({ factory: kb.rdfFactory, baseIRI: doc }).parse(normalized)
  } catch (e) {
    throw new Error('Patch syntax failure in <' + base + '>: ' + (e && e.message ? e.message : e))
  }

  var addClause = function (kind, patterns) {
    var formula = kb.formula()
    patterns.forEach(function (pattern) {
      if (pattern.type !== 'bgp') {
        throw new Error('Patch parser, in <' + base + '>: only basic graph patterns are supported ' +
          'in patch clauses, found a ' + pattern.type + ' pattern')
      }
      pattern.triples.forEach(function (t) {
        if (!t.predicate.termType) { // a property path object, not a term
          throw new Error('Patch parser, in <' + base + '>: property paths are not supported in patches')
        }
        formula.add(t.subject, t.predicate, t.object, source)
      })
    })
    clauses[kind] = formula.close()
    kb.add(query, SQNS(kind), formula)
  }

  parsed.updates.forEach(function (op) {
    if (op.updateType === 'insert') {
      addClause('insert', op.insert)
    } else if (op.updateType === 'delete') {
      addClause('delete', op.delete)
    } else if (op.updateType === 'insertdelete') {
      if (inputHas.delete) addClause('delete', op.delete)
      if (inputHas.insert) addClause('insert', op.insert)
      addClause('where', op.where)
    } else {
      throw new Error('Patch parser, in <' + base + '>: unsupported update operation ' +
        (op.updateType || op.type))
    }
  })
  return clauses
}
