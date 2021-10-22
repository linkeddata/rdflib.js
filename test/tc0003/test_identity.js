var tc0003Passed = true

function testTC0003 (showDetails) {
  var result = ''
  var expected = ''
  var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"'
  var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"'
  var allResults = '<div><strong>Detailed results:</strong></div>'
  var testTitles = [	'owl:sameAs',
    'inverse functional property',
    'inverse functional property 2',
    'functional property',
    'functional property 2'
  ]
  var expected = [	true,
    true,
    true,
    true,
    true
  ]
  var n = expected.length
  var i = 0

  for (i = 0; i < n; i++) {
    allResults += '<h2>' + testTitles[i] + '</h2>'
    result = eval('test' + i + '()')
    if (result != expected[i]) {
      tc0003Passed = false
      styleResult = failStyle
    } else {
      styleResult = passStyle
    }
    allResults += '<p>EXPECTED: ' + expected[i] + '</p><p>RESULT: <span ' + styleResult + '>' + result + '</p>'
  }
  if (showDetails) return allResults
  else return tc0003Passed
}

function test0 () {
  var ex = new $rdf.Namespace('http://example/com/#')
  var owl = new $rdf.Namespace('http://www.w3.org/2002/07/owl#')
  var kb = new $rdf.IndexedFormula()
  kb.add(ex('John'), ex('hairColor'), 'Yellow')
  kb.add(ex('Jack'), ex('eyeColor'), 'Green')
  kb.add(ex('John'), owl('sameAs'), ex('Jack'))
  var y = kb.the(ex('John'), ex('eyeColor'))
  if (!y || y.value != 'Green') return false
  else return true
}

function test1 () {
  var ex = new $rdf.Namespace('http://example/com/#')
  var rdf = new $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
  var owl = new $rdf.Namespace('http://www.w3.org/2002/07/owl#')
  var kb = new $rdf.IndexedFormula()
  kb.add(ex('ssn'), rdf('type'), owl('InverseFunctionalProperty'))
  kb.add(ex('Fred'), ex('ssn'), '1234')
  kb.add(ex('Jack'), ex('ssn'), '1234')
  kb.add(ex('Jack'), ex('eyeColor'), 'Green')
  var y = kb.the(ex('Fred'), ex('eyeColor'))
  if (!y || y.value != 'Green') return false
  else return true
}

function test2 () {
  var ex = new $rdf.Namespace('http://example/com/#')
  var rdf = new $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
  var owl = new $rdf.Namespace('http://www.w3.org/2002/07/owl#')
  var kb = new $rdf.IndexedFormula()
  kb.add(ex('Fred'), ex('ssn'), '1234')
  kb.add(ex('Jack'), ex('ssn'), '1234')
  kb.add(ex('Jack'), ex('eyeColor'), 'Green')
  kb.add(ex('ssn'), rdf('type'), owl('InverseFunctionalProperty'))
  var y = kb.the(ex('Fred'), ex('eyeColor'))
  if (!y || y.value != 'Green') return false
  else return true
}

function test3 () {
  var ex = new $rdf.Namespace('http://example/com/#')
  var rdf = new $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
  var owl = new $rdf.Namespace('http://www.w3.org/2002/07/owl#')
  var kb = new $rdf.IndexedFormula()
  kb.add(ex('mother'), rdf('type'), owl('FunctionalProperty'))
  kb.add(ex('Fred'), ex('mother'), ex('Bess'))
  var mom = kb.bnode()
  kb.add(ex('Fred'), ex('mother'), mom)
  kb.add(mom, ex('height'), '1.7')
  var y = kb.the(ex('Bess'), ex('height'))
  if (!y || y.value != '1.7') return false
  else return true
}

function test4 () {
  var ex = new $rdf.Namespace('http://example/com/#')
  var rdf = new $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
  var owl = new $rdf.Namespace('http://www.w3.org/2002/07/owl#')
  var kb = new $rdf.IndexedFormula()
  kb.add(ex('Fred'), ex('mother'), ex('Bess'))
  var mom = kb.bnode()
  kb.add(ex('Fred'), ex('mother'), mom)
  kb.add(mom, ex('height'), '1.7')
  kb.add(ex('mother'), rdf('type'), owl('FunctionalProperty'))
  var y = kb.the(ex('Bess'), ex('height'))
  if (!y || y.value != '1.7') return false
  else return true
}
