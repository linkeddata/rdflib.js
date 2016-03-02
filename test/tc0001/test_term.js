var tc0001Passed = true

function testTC0001 (showDetails) {
  var result = ''
  var expected = ''
  var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"'
  var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"'
  var allResults = '<div><strong>Detailed results:</strong></div>'
  var testTitles = [	'Statement()',
    'NamedNode()',
    'BlankNode()',
    'Literal(@EN)',
    'Literal(xsd:int)'
  ]
  var expected = [	'<http://example.com/btb> <http://xmlns.com/foaf/0.1/name> "Bob Builder" .',
    '{<http://example.com/btb> <http://xmlns.com/foaf/0.1/name> "Builder" .}',
    '{_:n0 <http://xmlns.com/foaf/0.1/firstname> "Bob" .}',
    '{<http://example.com/btb> <http://xmlns.com/foaf/0.1/lastname> "Builder"@en .}',
    '{<http://example.com/btb> <http://example.org/vocab#shoeSize> "30"^^<http://www.w3.org/2001/XMLSchema#integer> .}'
  ]
  var n = expected.length
  var i = 0

  for (i = 0; i < n; i++) {
    allResults += '<h2>' + testTitles[i] + '</h2>'
    result = eval('test' + i + '()')
    if (result != expected[i]) {
      tc0001Passed = false
      styleResult = failStyle
    } else {
      styleResult = passStyle
    }
    allResults += '<p>EXPECTED: ' + escapeEntities(expected[i]) + '</p><p>RESULT: <span ' + styleResult + '>' + escapeEntities(result) + '</p>'
  }

  if (showDetails) return allResults
  else return tc0001Passed
}

function test0 () {
  var kb = new $rdf.Formula()
  var triple = new $rdf.Statement(
    new $rdf.NamedNode('http://example.com/btb'),
    new $rdf.NamedNode('http://xmlns.com/foaf/0.1/name'),
    'Bob Builder',
    undefined
  )
  return triple.toString()
}

function test1 () {
  var kb = new $rdf.Formula()
  var s = new $rdf.NamedNode('http://example.com/btb')
  var p = new $rdf.NamedNode('http://xmlns.com/foaf/0.1/name')
  kb.add(s, p, 'Builder')
  return kb.toNT()
}

function test2 () {
  var kb = new $rdf.Formula()
  var s = new $rdf.BlankNode()
  var p = new $rdf.NamedNode('http://xmlns.com/foaf/0.1/firstname')
  kb.add(s, p, 'Bob')
  return kb.toNT()
}

function test3 () {
  var kb = new $rdf.Formula()
  var s = new $rdf.NamedNode('http://example.com/btb')
  var p = new $rdf.NamedNode('http://xmlns.com/foaf/0.1/lastname')
  var o = new $rdf.Literal('Builder', 'en')
  kb.add(s, p, o)
  return kb.toNT()
}

function test4 () {
  var kb = new $rdf.Formula()
  var XSD = new $rdf.Namespace('http://www.w3.org/2001/XMLSchema#')
  var xsdint = XSD('integer')

  var s = new $rdf.NamedNode('http://example.com/btb')
  var p = new $rdf.NamedNode('http://example.org/vocab#shoeSize')
  var o = new $rdf.Literal('30', undefined, xsdint)
  //	var o =  new $rdf.Literal("30", undefined, "xsd:integer"); // this causes a this.datatype.toNT in term.js line 85
  kb.add(s, p, o)
  return kb.toNT()
}

function test5 () {
  var kb = new $rdf.Formula()
  var XSD = new $rdf.Namespace('http://www.w3.org/2001/XMLSchema#')
  var xsdint = XSD('integer')

  var b = new $rdf.NamedNode('http://example.com/bbb')
  var c = new $rdf.NamedNode('http://example.com/ccc')

  var x = new $rdf.Variable('x')
  var y = new $rdf.Variable('y')
  var z = new $rdf.Variable('z')

  var o = new $rdf.Literal('30', undefined, xsdint)
  //	var o =  new $rdf.Literal("30", undefined, "xsd:integer"); // this causes a this.datatype.toNT in term.js line 85
  kb.add(x, p, 123)
  kb.add(b, y, 456)
  kb.add(b, c, z)
  var bindings = { 'x': 1000, 'y': $rdf.NamedNode('http://example.com/yyy'), 'z': 2222 }
  return kb.substitute(bindings).toNT()
}
