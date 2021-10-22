// Run me with:
// js
// Rhino 1.6 release 5 2006 11 18

// load('../../dist/rdflib.js')

// load('../../util.js')
// load('../../uri.js')
// load('../../term.js')
// load('../../rdfparser.js')
// load('../../rdfa.js')
// load('../../n3parser.js')
// load('../../identity.js')
// load('../../query.js')
// load('../../sparql.js')
// load('../../sparqlUpdate.js')
// load('../../jsonparser.js')
// load('../../serialize.js')
// load('../../web.js')

var $rdf = require('../../src')

if (dump == undefined) {
  var dump = function (str) { print('----  ' + str);}
  // $rdf.log.debug = function(str) {print("debug: "+str)}
  // $rdf.log.warn = function(str) {print("warn:  "+str)}
  // $rdf.log.info = function(str) {print("info:  "+str)}
  $rdf.log.error = function (str) {print('error: ' + str)}
}
if (setTimeout == undefined) var setTimeout = function (f, t) {f()}

// ///////////////////////////////////////////////////////////////


var onResult = function (result) {
  // print("TEST RESULT:")
  var str = '\tTEST Result: '
  for (var v in result) {
    str += '   ' + v + '->' + result[v]
  }
  print(str)
}

var onDone = function () {
  print('\tTEST DONE -- final callback')
}


// Make some initial test data:

kb = $rdf.graph()
var x = kb.sym('#foo')
var foaf = $rdf.Namespace('http://xmlns.com/foaf/0.1/')
kb.add(x, foaf('type'), foaf('Person'))

// Make a query:

q = new $rdf.Query('test', 3)

var who = $rdf.variable('who')
var email = $rdf.variable('email')
var name = $rdf.variable('name')

q.pat.add(who, foaf('type'), foaf('Person'))

var opt1 = $rdf.graph()
opt1.add(who, foaf('mbox'), email)
q.pat.optional.push(opt1)

var opt2 = $rdf.graph()
opt2.add(who, foaf('name'), name)
q.pat.optional.push(opt2)

print('\nTest1:')
kb.query(q, onResult, undefined, onDone)

kb.add(x, foaf('name'), 'Fred')

print('\nTest 2:')
kb.query(q, onResult, undefined, onDone)

kb.add(x, foaf('mbox'), kb.sym('mailto:fred@example.com'))

print('\nTest 3: kb=' + kb)
kb.query(q, onResult, undefined, onDone)
