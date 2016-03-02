/*
 * nodeunit tests for term.js
 */
var $rdf, expect, formulaTest, i, j, len, len1, o, p, ref, ref1, ref2, ref3, s, statementTest, tests

$rdf = require('../term.js')

tests = {
  statement: [
    {
      s: new $rdf.NamedNode('http://example.com/btb'),
      p: new $rdf.NamedNode('http://xmlns.com/foaf/0.1/name'),
      o: 'Bob Builder',
      expect: '<http://example.com/btb> <http://xmlns.com/foaf/0.1/name> "Bob Builder" .'
    }
  ],
  formula: [
    {
      s: new $rdf.NamedNode('http://example.com/btb'),
      p: new $rdf.NamedNode('http://xmlns.com/foaf/0.1/name'),
      o: 'Builder',
      expect: '{<http://example.com/btb> <http://xmlns.com/foaf/0.1/name> "Builder" .}'
    }, {
      s: new $rdf.BlankNode(),
      p: new $rdf.NamedNode('http://xmlns.com/foaf/0.1/firstname'),
      o: 'Bob',
      expect: '{_:n0 <http://xmlns.com/foaf/0.1/firstname> "Bob" .}'
    }, {
      s: new $rdf.NamedNode('http://example.com/btb'),
      p: new $rdf.NamedNode('http://xmlns.com/foaf/0.1/lastname'),
      o: new $rdf.Literal('Builder', 'en'),
      expect: '{<http://example.com/btb> <http://xmlns.com/foaf/0.1/lastname> "Builder"@en .}'
    }, {
      s: new $rdf.NamedNode('http://example.com/btb'),
      p: new $rdf.NamedNode('http://example.org/vocab#shoeSize'),
      o: new $rdf.Literal('30', void 0, (new $rdf.Namespace('http://www.w3.org/2001/XMLSchema#'))('integer')),
      expect: '{<http://example.com/btb> <http://example.org/vocab#shoeSize> "30"^^<http://www.w3.org/2001/XMLSchema#integer> .}'
    }
  ]
}

statementTest = function (s, p, o, expect) {
  return function (test) {
    var triple
    triple = new $rdf.Statement(s, p, o, void 0)
    test.equal(triple.toString(), expect)
    return test.done()
  }
}

formulaTest = function (s, p, o, expect) {
  return function (test) {
    var kb
    kb = new $rdf.Formula
    kb.add(s, p, o)
    test.equal(kb.toNT(), expect)
    return test.done()
  }
}

module.exports = {
  Statement: {},
  Formula: {}
}

ref = tests.statement
for (i = 0, len = ref.length; i < len; i++) {
  ref1 = ref[i], s = ref1.s, p = ref1.p, o = ref1.o, expect = ref1.expect
  module.exports.Statement['(' + s + ', ' + p + ', ' + o + ") == '" + expect + "'"] = statementTest(s, p, o, expect)
}

ref2 = tests.formula
for (j = 0, len1 = ref2.length; j < len1; j++) {
  ref3 = ref2[j], s = ref3.s, p = ref3.p, o = ref3.o, expect = ref3.expect
  module.exports.Formula['(' + s + ', ' + p + ', ' + o + ") == '" + expect + "'"] = formulaTest(s, p, o, expect)
}
