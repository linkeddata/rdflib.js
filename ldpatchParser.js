// Parse LDPATCH subset syntax for patches.
//
// http://www.w3.org/TR/ldpatch
//
//

$rdf.LDPatchParser = function (str, kb, base) {
  var i
  var j
  var k

  var SQNS = $rdf.Namespace('http://www.w3.org/ns/pim/patch#')
  var p = $rdf.N3Parser(kb, kb, base, base, null, null, '', null)
  var res = []
  var clauses = []

  var badSyntax = function (uri, lines, str, i, why) {
    return ('Line ' + (lines + 1) + ' of <' + uri + '>: Bad syntax:\n   ' +
    why + '\n   at: "' + str.slice(i, (i + 30)) + '"')
  }

  var check = function (next, last, message) {
    if (next < 0) {
      throw badSyntax(p._thisDoc, p.lines, str, j, last, message)
    }
    return next
  }

  var positiveInteger2 = function (str, i, res) {
    var j = p.skipSpace(str, i)
    if (j < 0) return -1
    var k = j
    while ((j < str.length) && ('0123456789'.indexOf(str[j]) >= 0)) {
      j++
    }
    if (k === j) return -1
    res.push(parseInt(str.slice(k, j), 10))
    return j
  }

  var expect = function (str, i, word) {
    var j = p.skipSpace(str, i)
    if (j >= 0 && str.slice(j, j + word.length) === word) return j + word.length
    return -1
  }

  var ldppath = function (str, pointer, res) {
    var i
    var j
    // var k
    // var inverse
    var step
    j = p.skipSpace(str, pointer)
    check(j, pointer, 'Expected / or ! or [  as path')
    i = j + 1 // i is pointer
    var path = []
    switch (str[j]) {
      case '/': // Path step
        j = p.skipSpace(str, i)
        check(j, i, 'Found end, expected ^ or URI or 0-9 after /')

        if ('0123456789.'.indexOf(str[j]) >= 0) { // "Index"
          res = []
          step = { 'type': 'index', from: 0, to: 0 }
          j = positiveInteger2(str, i, res)
          if (j >= 0) {
            step.from = res.pop()
            i = j
          }

          j = expect(str, i, '..')
          i = check(j, i, 'Expected .. in index in path')

          j = positiveInteger2(str, i, res)
          if (j >= 0) {
            step.to = res.pop()
            i = j
          }
          path.push(step)
          //  i is pointer
          break
        } else {
          step = { 'type': 'arc', 'inverse': (str[j] === '^') }
          if (step.inverse) {
            i = p.skipSpace(str, j + 1)
            j = check(i, j + 1, 'EOF found after /^')
          }
          i = p.node(str, j, res)
          if (i < 0) {
            throw BadSyntax(p._thisDoc, p.lines, str, j, 'bad URI in step  ')
          }
          step.predicate = res[0]
        }
        path.push(step)
        break
      case '!':
        path.push({'type': 'unique'})
        break
      case '[': // Constraint ::= '[' Path ( '=' Value )? ']' | '!'
        step = { 'type': 'branch' }
        var nested = []
        j = j + 1 // skip bracket
        i = ldppath(str, j + 1, nested)
        if (i > 0) {
          step.path = nested.pop()
          j = i
        }
        i = p.skipSpace(str, j)
        check(i, j, 'found end of file when expected ] or =')
        if (str[i] === '"') {
          j = p.skipSpace(str, i++)
          check(j, i + 1, 'expected node after = in path constraint, found end of file')
          i = p.node(str, j, nested)
          check(i, j, 'expected node after = in path constraint')
          step.final = nested.pop()
          j = p.skipSpace(str, i)
          check(j, i, 'found end of file when expected ]')
        }
        if (str[i] !== ']') {
          check(-1, i, 'expected ] or =  at end of path constraint')
        }
        path.push(step)
        break
      default:
        check(-1, j, 'Expected / or ! or [  in path')
        break
    }
  }

  i = 0
  var query = kb.sym(base + '#query') // Invent a URI for the query

  while (true) {
    res = []
    j = p.bareWord(str, i, res)
    if (j < 0) return clauses // End of file

    switch (res[0]) {
      case '@prefix':
        i = p.directive(str, j)
        check(i, j, 'bad syntax or EOF after @prefix ')
        i = p.checkDot(str, i)
        break

      case 'D':
      case 'Delete':
      case 'A':
      case 'Add':
        for (k - 0; k < 3; k++) {
          i = p.node(str, j, res)
          j = check(i, j, 'Bad triple after ' + res[0])
        }
        i = p.checkDot(str, j)
        res[0] = res[0][0] // For uniformity, just initial
        clauses.push(res) // [ command, s, p, o ]
        j = i
        break

      case 'B':
      case 'Bind':
        i = p.variable(str, j, res)
        check(i, j, 'Expected variable after ' + res[0])
        // @@@@@@@@ TBC
        break

      case 'UL':
      case 'UpdateList':
        // @@@ TBC
        break
      default:
        check(-1, i, 'Unknown syntax start of statement: ' + res[0])
    } // switch
  // return clauses
  }
} // End of LDPatchParser
