var tc0005Passed = true

function escapeForXML (str) {
  if (typeof str == 'undefined') return '@@@undefined@@@@'
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function testTC0005 (showDetails) {
  var result = ''
  var expected = ''
  var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"'
  var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"'
  var allResults = '<div><strong>Detailed Results:</strong></div>'
  var testTitles = []
  var expected = []

  testTitles.push('straight string'); expected.push('"foo bar"')
  testTitles.push('newline escaping'); expected.push('"foo\\nbar"')
  testTitles.push('quote escaping'); expected.push('"foo\\"bar"')
  testTitles.push('escape escaping'); expected.push('"foo\\\\bar"')
  testTitles.push('unicode'); expected.push('"état"')
  testTitles.push('typed string'); expected.push('"123"^^<http://www.w3.org/2001/XMLSchema#integer>')
  testTitles.push('language string'); expected.push('"chat"@fr')
  testTitles.push('symbol'); expected.push('<http://www.w3.org/2001/XMLSchema#integer>')
  testTitles.push('bnode'); expected.push('_:n6785764')

  var n = expected.length
  var i = 0

  for (i = 0; i < n; i++) {
    allResults += '<h2>' + testTitles[i] + '</h2>'
    // result = eval("test" + i + "()")
    try {
      result = $rdf.fromNT(expected[i]).toNT()
    } catch(e) {
      result = 'Runtime exception: ' + e
    }
    if (result != expected[i]) {
      tc0005Passed = false
      styleResult = failStyle
    } else {
      styleResult = passStyle
    }
    allResults += '<p>EXPECTED: ' + escapeForXML(expected[i]) + '</p><p>RESULT: <span ' + styleResult + '>' + escapeForXML(result) + '</p>'; // / encode for XML!!
  }
  if (showDetails) return allResults
  else return tc0005Passed
}

function test0 () {
  return true
}
