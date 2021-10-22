var tc0004Passed = true

var rdfxmlTestCaseBaseURI = 'http://www.w3.org/2000/10/rdf-tests/rdfcore/'
var rdfxmlTestCaseDirs = [	'amp-in-url',
  'datatypes',
  'rdf-element-not-mandatory',
  'rdfms-reification-required',
  'rdfms-uri-substructure',
  'rdfms-xmllang',
  'unrecognised-xml-attributes',
  'xml-canon',
  'rdf-charmod-literals',
  'rdf-charmod-uris',
  'rdf-ns-prefix-confusion',
  'rdf-containers-syntax-vs-schema',
  'rdfms-difference-between-ID-and-about',
  'rdfms-duplicate-member-props',
  'rdfms-empty-property-elements',
  'rdfms-identity-anon-resources',
  'rdfms-not-id-and-resource-attr',
  'rdfms-para196',
  'rdfms-rdf-names-use',
  'rdfms-seq-representation',
  'rdfms-syntax-incomplete',
  'xmlbase',
  'rdfms-xml-literal-namespaces',
  'rdfs-domain-and-range'
]
var rdfxmlTestCaseMsg = [ ]

function testTC0004 (showDetails) {
  var result = ''
  var expected = ''
  var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"'
  var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"'
  var allResults = '<div><strong>Detailed results:</strong></div>'
  var testTitles = rdfxmlTestCaseDirs
  var expected = [	true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true
  ]
  var n = expected.length + 1
  var i = 0
  var from = $('#fromTC').val()
  var to = $('#toTC').val()

  // check specified range and make sure it stays within the allowed space
  from = parseInt(from)
  to = parseInt(to) + 1
  if (isNaN(from) || from == undefined || from == null || from < 0) from = 0
  if (isNaN(to) || to == undefined || to == null || to > n) to = n - 1
  if (from > to) from = 0
  $('#fromTC').val(from)
  $('#toTC').val(to - 1)

  $('#tocTC0004').append("<div style='font-size: 80%; border-bottom: 1px solid #e6e6e6; margin-bottom: 5px'><a href='#header'>Overview</a></div>") // init TOC
  if (isOffline()) { // we're in off-line mode
    rdfxmlTestCaseBaseURI = 'chrome://tabulator/content/test/tc0004/rdfcore/' // use the local mirror of the test case
  }

  for (i = from; i < to; i++) {
    startBusy()
    var dirParam = new String(testTitles[i])

    result = eval('test' + i + '()')
    if (result != expected[i]) {
      tc0004Passed = false
      styleResult = failStyle
    } else {
      styleResult = passStyle
    }
    allResults += "<a id='sec" + testTitles[i] + "'></a><h2 " + styleResult + '>' + testTitles[i] + '</h2></div>'

    if (rdfxmlTestCaseMsg[testTitles[i]]) { // we have a detailed fail message
      allResults += '<p><em>Reason: ' + rdfxmlTestCaseMsg[testTitles[i]] + '</em></p>'
    }
    $('#tocTC0004').append('<div ' + styleResult + "><span style='font-size: 80%;'>" + i + ". <a href='#sec" + testTitles[i] + "'>" + testTitles[i] + '</a></span></div>') // update TOC
    stopBusy()
  }

  if (showDetails) return allResults
  else return tc0004Passed
}

function test0 () {
  var dir = rdfxmlTestCaseDirs[0]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test1 () {
  var dir = rdfxmlTestCaseDirs[1]
  var tests = ['test001', 'test002']
  return runParseTests(dir, tests)
}

function test2 () {
  var dir = rdfxmlTestCaseDirs[2]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test3 () {
  var dir = rdfxmlTestCaseDirs[3]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test4 () {
  var dir = rdfxmlTestCaseDirs[4]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test5 () {
  var dir = rdfxmlTestCaseDirs[5]
  var tests = ['test001', 'test002', 'test003', 'test004', 'test005', 'test006']
  return runParseTests(dir, tests)
}

function test6 () {
  var dir = rdfxmlTestCaseDirs[6]
  var tests = ['test001', 'test002']
  return runParseTests(dir, tests)
}

function test7 () {
  var dir = rdfxmlTestCaseDirs[7]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test8 () {
  var dir = rdfxmlTestCaseDirs[8]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test9 () {
  var dir = rdfxmlTestCaseDirs[9]
  var tests = ['test001', 'test002']
  return runParseTests(dir, tests)
}

function test10 () {
  var dir = rdfxmlTestCaseDirs[10]
  var tests = ['test0001', 'test0003', 'test0004', 'test0005', 'test0006', 'test0009', 'test0010', 'test0011', 'test0012', 'test0013', 'test0014']
  return runParseTests(dir, tests)
}

function test11 () {
  var dir = rdfxmlTestCaseDirs[11]
  var tests = ['test001', 'test002', 'test003', 'test004', 'test006', 'test007', 'test008']
  return runParseTests(dir, tests)
}

function test12 () {
  var dir = rdfxmlTestCaseDirs[12]
  var tests = ['test1', 'test2', 'test3']
  return runParseTests(dir, tests)
}

function test13 () {
  var dir = rdfxmlTestCaseDirs[13]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test14 () {
  var dir = rdfxmlTestCaseDirs[14]
  var tests = ['test001', 'test002', 'test003', 'test004', 'test005', 'test006',
    'test007', 'test008', 'test009', 'test010', 'test011', 'test012',
    'test013', 'test014', 'test015', 'test016', 'test017']
  return runParseTests(dir, tests)
}

function test15 () {
  var dir = rdfxmlTestCaseDirs[15]
  var tests = ['test001', 'test002', 'test003', 'test004', 'test005']
  return runParseTests(dir, tests)
}

function test16 () {
  var dir = rdfxmlTestCaseDirs[16]
  var tests = ['test001', 'test002', 'test004', 'test005']
  return runParseTests(dir, tests)
}

function test17 () {
  var dir = rdfxmlTestCaseDirs[17]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test18 () {
  var dir = rdfxmlTestCaseDirs[18]
  var tests = ['test-001', 'test-002', 'test-003', 'test-004', 'test-005',
    'test-006', 'test-007', 'test-008', 'test-009', 'test-010',
    'test-011', 'test-012', 'test-013', 'test-014', 'test-015',
    'test-016', 'test-017', 'test-018', 'test-019', 'test-020',
    'test-021', 'test-022', 'test-023', 'test-024', 'test-025',
    'test-026', 'test-027', 'test-028', 'test-029', 'test-030',
    'test-031', 'test-032', 'test-033', 'test-034', 'test-035',
    'test-036', 'test-037']
  return runParseTests(dir, tests)
}

function test19 () {
  var dir = rdfxmlTestCaseDirs[19]
  var tests = ['test001']
  return runParseTests(dir, tests)
}

function test20 () {
  var dir = rdfxmlTestCaseDirs[20]
  var tests = ['test001', 'test002', 'test003', 'test004']
  return runParseTests(dir, tests)
}

function test21 () {
  var dir = rdfxmlTestCaseDirs[21]
  var tests = ['test001', 'test002', 'test003', 'test004', 'test006', 'test007', 'test008', 'test009', 'test010', 'test011', 'test013', 'test014']
  return runParseTests(dir, tests)
}

function test22 () {
  var dir = rdfxmlTestCaseDirs[22]
  var tests = ['test001', 'test002']
  return runParseTests(dir, tests)
}

function test23 () {
  var dir = rdfxmlTestCaseDirs[23]
  var tests = ['test001', 'test002']
  return runParseTests(dir, tests)
}

// utility functions
function runParseTests (dir, tests) {
  var j = 0
  var allTC = true

  for (j = 0; j < tests.length; j++) {
    var thisTCPassed = runSingleParseTest(dir, tests[j])
    if (!thisTCPassed) allTC = false
  }
  return allTC
}

function runSingleParseTest (dir, test) {
  var testCaseURI = rdfxmlTestCaseBaseURI + dir + '/' + test
  var kbNT = getTestCaseData(testCaseURI, 'text')
  var kbRDFXML = getTestCaseData(testCaseURI, 'xml')
  var allHold = true
  var k = 0

  if (kbNT.statements.length == kbRDFXML.statements.length) { // the two stores have the same number of triples ...
    for (k = 0; k < kbNT.statements.length; k++) { // check if each triple in the one store is actually in the other store as well
      var s = kbNT.statements[k].subject
      var p = kbNT.statements[k].predicate
      var o = kbNT.statements[k].object
      var thisStatementHolds = kbRDFXML.holds(s, p, o, undefined)
      if (!thisStatementHolds) {
        rdfxmlTestCaseMsg[dir] = "<a href='" + testCaseURI + ".rdf' target='_new'>" + testCaseURI + '.rdf</a> failed concerning: <pre>' + escapeEntities(kbNT.statements[k].toString()) + '</pre>'
        allHold = false
      }
    }
  } else {
    rdfxmlTestCaseMsg[dir] = "<a href='" + testCaseURI + ".rdf'>" + testCaseURI + '.rdf</a> failed.'
    return false
  }
  return allHold
}

function getTestCaseData (testCaseURI, format) {
  var kb = new $rdf.IndexedFormula()
  var returnValue = ''
  var why = testCaseURI

  if (format == 'text') {
    testCaseURI += '.nt'
  }
  if (format == 'xml') {
    testCaseURI += '.rdf'
  }


  $.ajax({
    url: testCaseURI,
    dataType: format,
    async: false,
    success: function (data) {
      if (format == 'text') {
        returnValue = parseN3FromString(testCaseURI, data, kb, why)
        returnValue = kb
      }
      if (format == 'xml') {
        var rdfxmlparser = new $rdf.RDFParser(kb)
        rdfxmlparser.reify = true
        rdfxmlparser.parse(data, testCaseURI, why)
        returnValue = kb
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      alert('Error running test: ' + textStatus + ' (' + errorThrown + ')')
    }
  })

  return returnValue; // escapeEntities(returnValue)
}

function parseN3FromString (docURI, data, kb, why) {
  var n3Parser = new $rdf.N3Parser(kb, kb, docURI, rdfxmlTestCaseBaseURI, undefined, undefined, undefined, why)
  n3Parser.loadBuf(data)
}
