// Parse a simple SPARQL-Update subset syntax for patches.
//
//  This parses
//   WHERE {xxx} DELETE {yyy} INSERT DATA {zzz}
// (not necessarily in that order)
// by rewriting it to the equivalent N3
//   <#query> patch:where {xxx}; patch:delete {yyy}; patch:insert {zzz}.
// and handing that to the N3.js-based Notation3 parser, so that each clause
// becomes an rdflib Formula, exactly as the legacy parser produced.
import parseN3js from './n3-adapter'
import Namespace from './namespace'

const keywords = ['INSERT', 'DELETE', 'WHERE']
const SQNS = Namespace('http://www.w3.org/ns/pim/patch#')

export default function sparqlUpdateParser (str, kb, base) {
  const clauses = {}
  const query = kb.sym(base + '#query') // Invent a URI for the query
  clauses['query'] = query // A way of accessing it in its N3 model.

  const badSyntax = function (uri, str, i, why) {
    const lines = str.slice(0, i < 0 ? str.length : i).split('\n').length - 1
    return ('Line ' + (lines + 1) + ' of <' + uri + '>: Bad syntax:\n   ' +
    why + '\n   at: "' + str.slice(i < 0 ? 0 : i, (i < 0 ? 0 : i) + 30) + '"')
  }

  // Scan the top level of the document: keywords with their {...} clauses,
  // @prefix directives, and optional ';' separators. Everything inside the
  // braces is left for the N3 parser.
  let n3doc = ''
  const order = []
  let i = 0
  while (true) {
    i = skipSpace(str, i)
    if (i < 0) break // Normal end of input
    if (str[i] === ';') { // Allow a separator (and a trailing one)
      i++
      continue
    }
    let found = false
    for (let k = 0; k < keywords.length; k++) {
      const key = keywords[k]
      if (str.slice(i, i + key.length) === key) {
        let j = skipSpace(str, i + key.length)
        if (j < 0) {
          throw badSyntax(base, str, i + key.length, 'found EOF, needed {...} after ' + key)
        }
        if (((key === 'INSERT') || (key === 'DELETE')) && str.slice(j, j + 4) === 'DATA') { // Some wanted 'DATA'. Whatever
          j = skipSpace(str, j + 4)
          if (j < 0) {
            throw badSyntax(base, str, j, 'needed {...} after INSERT DATA ' + key)
          }
        }
        if (str[j] !== '{') {
          throw badSyntax(base, str, j, 'needed {...} after ' + key)
        }
        const end = skipClause(str, j)
        if (end < 0) {
          throw badSyntax(base, str, j, 'bad syntax or EOF in {...} after ' + key)
        }
        n3doc += '<#query> <' + SQNS(key.toLowerCase()).value + '> ' + str.slice(j, end) + ' .\n'
        order.push(key.toLowerCase())
        i = end
        found = true
        break
      }
    }
    if (!found && str.slice(i, i + 7) === '@prefix') {
      // Pass @prefix directives through to the N3 parser, in source order.
      let j = i + 7
      while (j < str.length && str[j] !== '.') {
        if (str[j] === '<') {
          j = str.indexOf('>', j)
          if (j < 0) throw badSyntax(base, str, i, 'bad syntax or EOF after @prefix ')
        }
        j++
      }
      if (j >= str.length) {
        throw badSyntax(base, str, i, 'bad syntax or EOF after @prefix ')
      }
      n3doc += str.slice(i, j + 1) + '\n'
      i = j + 1
      found = true
    }
    if (!found && str.slice(i, i + 7) === 'PREFIX ') {
      // SPARQL-style PREFIX declaration (no trailing dot) — see #651.
      let j = str.indexOf('<', i)
      if (j >= 0) j = str.indexOf('>', j)
      if (j < 0) {
        throw badSyntax(base, str, i, 'bad syntax or EOF after PREFIX ')
      }
      n3doc += str.slice(i, j + 1) + '\n'
      i = j + 1
      found = true
    }
    if (!found) {
      throw badSyntax(base, str, i,
        "Unknown syntax at start of statememt: '" + str.slice(i).slice(0, 20) + "'")
    }
  } // while

  parseN3js(n3doc, kb, base, 'text/n3')

  // Pull the clause Formulae back out of the store (the last one wins if a
  // keyword appears twice, as before).
  for (const key of order) {
    const sts = kb.statementsMatching(query, SQNS(key), null)
    if (sts.length) {
      clauses[key] = sts[sts.length - 1].object
    }
  }
  return clauses
}

/** Skip whitespace and comments; returns -1 at end of input. */
function skipSpace (str, i) {
  while (i < str.length) {
    const ch = str[i]
    if (ch === '#') {
      while (i < str.length && str[i] !== '\n') i++
    } else if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '\f') {
      i++
    } else {
      return i
    }
  }
  return -1
}

/**
 * Skip a balanced `{ … }` clause starting at the opening brace, ignoring
 * braces inside string literals, IRIs and comments.
 * Returns the index just past the matching `}`, or -1 on EOF.
 */
function skipClause (str, i) {
  let depth = 0
  while (i < str.length) {
    const ch = str[i]
    if (ch === '{') {
      depth++
      i++
    } else if (ch === '}') {
      depth--
      i++
      if (depth === 0) return i
    } else if (ch === '"' || ch === "'") {
      i = skipStringLiteral(str, i)
      if (i < 0) return -1
    } else if (ch === '<') {
      i = skipIriOrOperator(str, i)
    } else if (ch === '#') {
      while (i < str.length && str[i] !== '\n') i++
    } else {
      i++
    }
  }
  return -1
}

/** Skip a short or long ("""…""") string literal; -1 on EOF. */
function skipStringLiteral (str, i) {
  const quote = str[i]
  const delim = str.slice(i, i + 3) === quote + quote + quote ? quote + quote + quote : quote
  i += delim.length
  while (i < str.length) {
    if (str[i] === '\\') {
      i += 2
    } else if (str.slice(i, i + delim.length) === delim) {
      return i + delim.length
    } else {
      i++
    }
  }
  return -1
}

/**
 * At a `<`: skip a `<iri>` reference, or just the `<` itself when it is part
 * of an operator such as `<=`.
 */
function skipIriOrOperator (str, i) {
  let j = i + 1
  while (j < str.length && !/[>\s"'{}]/.test(str[j])) j++
  return (j < str.length && str[j] === '>') ? j + 1 : i + 1
}
