var tc0002Passed = true

function testTC0002 (showDetails) {
  var result = ''
  var expected = ''
  var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"'
  var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"'
  var allResults = '<div><strong>Detailed results:</strong></div>'
  var testTitles = [	'any()',
    'any() with wrong subject',
    'holds()',
    'statementsMatching()'
  ]
  var expected = [	'foo',
    undefined,
    true,
    '&lt;http://example.com/&gt; &lt;example:name&gt; "foo" .'
  ]
  var n = expected.length
  var i = 0

  for (i = 0; i < n; i++) {
    allResults += '<h2>' + testTitles[i] + '</h2>'
    result = eval('test' + i + '()')
    if (result != expected[i]) {
      tc0002Passed = false
      styleResult = failStyle
    } else {
      styleResult = passStyle
    }
    allResults += '<p>EXPECTED: ' + expected[i] + '</p><p>RESULT: <span ' + styleResult + '>' + result + '</p>'
  }
  if (showDetails) return allResults
  else return tc0002Passed
}

function test0 () {
  var kb = new $rdf.IndexedFormula()
  kb.add(kb.sym('http://example.com/'), kb.sym('example:name'), kb.literal('foo'))
  return kb.any(kb.sym('http://example.com/'), kb.sym('example:name')).value
}

function test1 () {
  var kb = new $rdf.IndexedFormula()
  kb.add(kb.sym('http://example.com/'), kb.sym('example:name'), kb.literal('foo'))
  return kb.any(kb.sym('http://example.com/kajsdfh'), kb.sym('example:name'))
}

function test2 () {
  var kb = new $rdf.IndexedFormula()
  kb.add(kb.sym('http://example.com/'), kb.sym('example:name'), kb.literal('foo'))
  return kb.holds(kb.sym('http://example.com/'), kb.sym('example:name'), kb.literal('foo'))
}

function test3 () {
  var kb = new $rdf.IndexedFormula()
  kb.add(kb.sym('http://example.com/'), kb.sym('example:name'), kb.literal('foo'))
  var tmpStmts = kb.statementsMatching(kb.sym('http://example.com/'))
  var returnValue = ''
  var n = tmpStmts.length
  var i = 0

  for (i = 0; i < n; i++) {
    returnValue += tmpStmts[i].toNT()
  }
  return escapeEntities(returnValue)
}
