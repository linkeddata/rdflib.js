//     Serialization tests
//

var tc0006Passed = true

var base = 'http://linkeddata.github.io/rdflib.js/test/tc0006'

function escapeForXML (str) {
  if (typeof str == 'undefined') return '@@@undefined@@@@'
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function testTC0006 (showDetails) {
  var result = ''
  var expected = ''
  var failStyle = 'style="background-color: #fee;"'
  var passStyle = 'style="background-color: #efe;"'
  //    var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"'
  //    var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"'
  var allResults = '<div><strong>Detailed Results:</strong></div>'
  var tests = []

  tests = [
    {
      'title': 'substitute in Statement',
      'input': ' <> :insert {  ?x :p1 1.  :b ?y 2. :c :p3 ?z . }.',
      'bindings': {   '?x': $rdf.sym('http://example.com/foo#xxx'),
        '?y': $rdf.sym('http://example.com/foo#yyy'),
        '?z': $rdf.sym('http://example.com/foo#zzz')
      },
      'expected': '<>\n\
    <#insert>\n\
            {    <http://example.com/foo#xxx> <#p1> 1.\n\
               <#b> <http://example.com/foo#yyy> 2.\n\
               <#c> <#p3> <http://example.com/foo#zzz>. }.'
    },
    {
      'title': 'substitute in Collection',
      'input': ' <> :insert {  :b :p ( ?x 2 ( 31 ?y 33 ) 4). }.',
      'bindings': {   '?x': $rdf.sym('http://example.com/foo#xxx'),
        '?y': $rdf.sym('http://example.com/foo#yyy'),
        '?z': $rdf.sym('http://example.com/foo#zzz')
      },
      'expected': '<>\n\
    <#insert>\n\
            {\n\
                <#b>\n\
                    <#p>\n\
                            (    <http://example.com/foo#xxx>\n\
                               2\n\
                               ( 31 <http://example.com/foo#yyy> 33 ) ). }.'
    }
  ]


  for (var i = 0; i < tests.length; i++) {
    var test = tests[i]
    allResults += '<h2>' + test.title + '</h2>'
    var result, expected
    try {
      var kb = $rdf.graph()
      $rdf.parse(test.input, kb, base, 'text/n3')
      var before = kb.serialize(base)
      var graph = kb.substitute(test.bindings) // as a debugger trace variable
      var after = graph.serialize(base) // default is N3
      result = after // .replace(/\n/g, ' ').trim()
      expected = test.expected // .replace(/\n/g, ' ').trim()
    } catch(e) {
      result = 'Runtime exception: ' + stackString(e)
    }
    allResults += '<pre>Before: ' + escapeForXML(before) + '</pre>\n'
    if (result.trim() != expected.trim()) {
      tc0006Passed = false
      styleResult = failStyle
    } else {
      styleResult = passStyle
    }
    allResults += '<pre ' + styleResult + '>After: ' + escapeForXML(after) + '</pre>'
    allResults += '<pre>EXPECTED: (' + test.expected.length + '): ' + escapeForXML(test.expected) + '</pre>'

  }
  if (showDetails) return allResults
  else return tc0006Passed
}

function test0 () {
  return true
}
