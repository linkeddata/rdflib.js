var tc0000Passed = true

function testTC0000 (showDetails) {
  var testCases = [
    ['foo:xyz', 'bar:abc', 'bar:abc'],
    ['http://example/x/y/z', 'http://example/x/abc', '../abc'],
    ['http://example2/x/y/z', 'http://example/x/abc', 'http://example/x/abc'],
    ['http://ex/x/y/z', 'http://ex/x/r', '../r'],
    // ['http://ex/x/y/z', 'http://ex/r', '../../r'],    // DanC had this.
    ['http://ex/x/y', 'http://ex/x/q/r', 'q/r'],
    ['http://ex/x/y', 'http://ex/x/q/r#s', 'q/r#s'],
    ['http://ex/x/y', 'http://ex/x/q/r#s/t', 'q/r#s/t'],
    ['http://ex/x/y', 'ftp://ex/x/q/r', 'ftp://ex/x/q/r'],
    ['http://ex/x/y', 'http://ex/x/y', ''],
    ['http://ex/x/y/', 'http://ex/x/y/', ''],
    ['http://ex/x/y/pdq', 'http://ex/x/y/pdq', ''],
    ['http://ex/x/y/', 'http://ex/x/y/z/', 'z/'],
    ['file:/swap/test/animal.rdf', 'file:/swap/test/animal.rdf#Animal', '#Animal'],
    ['file:/e/x/y/z', 'file:/e/x/abc', '../abc'],
    ['file:/example2/x/y/z', 'file:/example/x/abc', '/example/x/abc'], // TBL
    ['file:/ex/x/y/z', 'file:/ex/x/r', '../r'],
    ['file:/ex/x/y/z', 'file:/r', '/r'], // I prefer this. - tbl
    ['file:/ex/x/y', 'file:/ex/x/q/r', 'q/r'],
    ['file:/ex/x/y', 'file:/ex/x/q/r#s', 'q/r#s'],
    ['file:/ex/x/y', 'file:/ex/x/q/r#', 'q/r#'],
    ['file:/ex/x/y', 'file:/ex/x/q/r#s/t', 'q/r#s/t'],
    ['file:/ex/x/y', 'ftp://ex/x/q/r', 'ftp://ex/x/q/r'],
    ['file:/ex/x/y', 'file:/ex/x/y', ''],
    ['file:/ex/x/y/', 'file:/ex/x/y/', ''],
    ['file:/ex/x/y/pdq', 'file:/ex/x/y/pdq', ''],
    ['file:/ex/x/y/', 'file:/ex/x/y/z/', 'z/'],
    ['file:/devel/WWW/2000/10/swap/test/reluri-1.n3', 'file://meetings.example.com/cal#m1', 'file://meetings.example.com/cal#m1'],
    ['file:/home/connolly/w3ccvs/WWW/2000/10/swap/test/reluri-1.n3', 'file://meetings.example.com/cal#m1', 'file://meetings.example.com/cal#m1'],
    ['file:/some/dir/foo', 'file:/some/dir/#blort', './#blort'],
    ['file:/some/dir/foo', 'file:/some/dir/#', './#'],
    // From Graham Klyne Thu, 20 Feb 2003 18:08:17 +0000
    ['http://example/x/y%2Fz', 'http://example/x/abc', 'abc'],
    ['http://example/x/y/z', 'http://example/x%2Fabc', '/x%2Fabc'],
    ['http://example/x/y%2Fz', 'http://example/x%2Fabc', '/x%2Fabc'],
    ['http://example/x%2Fy/z', 'http://example/x%2Fy/abc', 'abc'],
    // Ryan Lee
    ['http://example/x/abc.efg', 'http://example/x/', './'],

    // Tim BL 2005-11-28  A version of the uri.js URIjoin() failed:
    // ['http://www.w3.org/People/Berners-Lee/card.rdf', 'http://www.w3.org/2002/01/tr-automation/tr.rdf', '../../2002/01/tr-automation/tr.rdf'],
    // ["http://example.com/", "http://example.com/", "."],  // wrong
    // ["http://example.com/.meta.n3", "http://example.com/.meta.n3", ".meta.n3"]  // wrong

    // Tim BL 2005-11-28  A version of the uri.js URIjoin() get right:
    ['http://www.w3.org/People/Berners-Lee/card.rdf', 'http://www.w3.org/2002/01/tr-automation/tr.rdf', '/2002/01/tr-automation/tr.rdf'],
    ['http://example.com/', 'http://example.com/', ''], // Self-reference is the empty string
    ['http://example.com/.meta.n3', 'http://example.com/.meta.n3', ''] // Self-reference is the empty string
  ]

  var n = testCases.length
  var i
  var failStyle = 'style="border: solid 2px red;"'
  var passStyle = 'style="border: solid 2px green;"'

  var str = "<div><strong>Detailed results:</strong></div><div style='border: 1px dotted black; padding: 5px; margin-top: 10px'><a href='#T1'>T1 = join(rel, base)</a> | <a href='#T2'>T2 = refTo(base, abs)</a> | <a href='#T3'>T3 = join(T2, base)</a></div>"
  str += "<div style='font-size: 90%'>"
  str += "<a id='T1'></a><h2>T1 = join(rel, base)</h2><div style='margin: 0px 0px 20px 0px;'><a href='#header'>back to menu ...</a></div>"
  str += "<table border='1' cellpadding='2' width='100%' style='font-size: 90%'><tr><th>#</th><th>IN: base URI</th><th>IN: relative URI</th><th>EXPECTED: absolute URI</th><th>RESULT: join(relative URI, base URI)</th></tr>\n"
  for (i = 0; i < n; i++) {
    var c = testCases[i]
    var base = c[0]
    var abs = c[1]
    var rel = c[2]
    var absGenerated = $rdf.Util.uri.join(rel, base)
    var styleAbs = ''

    if (absGenerated != abs) {
      tc0000Passed = false
      styleAbs = failStyle
    } else {
      styleAbs = passStyle
    }
    rel = (rel == '') ? '&nbsp;' : rel // make sure empty table cells are rendered nicely
    str += '<tr><td>' + i + '</td><td>' + base + '</td><td>' + rel + '</td><td>' + abs + '</td><td ' + styleAbs + '>' + absGenerated + '</td></tr>\n'
  }
  str += '</table>\n'


  str += "<a id='T2'></a><h2>T2 = refTo(base, abs)</h2><div style='margin: 0px 0px 20px 0px;'><a href='#header'>back to menu ...</a></div>"
  str += "<table border='1' cellpadding='2' width='100%' style='font-size: 90%'><tr><th>#</th><th>IN: base URI</th><th>IN: absolute URI</th><th>EXPECTED: relative URI</th><th>RESULT: refTo(base URI, absolute URI)</th></tr>\n"
  for (i = 0; i < n; i++) {
    var c = testCases[i]
    var base = c[0]
    var abs = c[1]
    var rel = c[2]
    var relGenerated = $rdf.Util.uri.refTo(base, abs)
    var styleRel = ''

    if (relGenerated != rel) {
      tc0000Passed = false
      styleRel = failStyle
    } else {
      styleRel = passStyle
    }
    // make sure empty table cells are rendered nicely:
    rel = (rel == '') ? '&nbsp;' : rel
    relGenerated = (relGenerated == '') ? '&nbsp;' : relGenerated
    str += '<tr><td>' + i + '</td><td>' + base + '</td><td>' + abs + '</td><td>' + rel + '</td><td ' + styleRel + '>' + relGenerated + '</td></tr>\n'
  }
  str += '</table>\n'

  str += "<a id='T3'></a><h2>T3 = join(T2, base)</h2><div style='margin: 0px 0px 20px 0px;'><a href='#header'>back to menu ...</a></div>"
  str += "<table border='1' cellpadding='2' width='100%' style='font-size: 90%'><tr><th>#</th><th>IN: base URI</th><th>IN: relative URI</th><th>EXPECTED: absolute URI</th><th>RESULT: join(T2, base)</th></tr>\n"
  for (i = 0; i < n; i++) {
    var c = testCases[i]
    var base = c[0]
    var abs = c[1]
    var rel = c[2]
    var relGenerated = $rdf.Util.uri.refTo(base, abs)
    var absGeneratedFromRel = $rdf.Util.uri.join(relGenerated, base)
    var styleAbsFromRel = ''

    if (absGeneratedFromRel != abs) {
      tc0000Passed = false
      styleAbsFromRel = failStyle
    } else {
      styleAbsFromRel = passStyle
    }
    // make sure empty table cells are rendered nicely:
    rel = (rel == '') ? '&nbsp;' : rel
    relGenerated = (relGenerated == '') ? '&nbsp;' : relGenerated
    str += '<tr><td>' + i + '</td><td>' + base + '</td><td>' + rel + '</td><td>' + abs + '</td><td ' + styleAbsFromRel + '>' + absGeneratedFromRel + '</td></tr>\n'
  }
  str += '</table>\n'
  str += '</div>\n'

  if (showDetails) return str
  else return tc0000Passed
}
