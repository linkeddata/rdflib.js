// See npm and node.js documentation http://nodejs.org/docs/v0.6.5/api/modules.html
//

// Test Serializer.writeStore

// var jQuery = require('jquery')

var $rdf = require('../../src')
var util = require('util')
var print = util.print
var k = $rdf.graph()
// var f = $rdf.fetcher(k)
var z = $rdf.Serializer(k)
z.writeStore(print)

var s = k.sym('foo:')
var p = k.sym('bar:age')
var w = k.sym('source:')
k.add(s, p, 21, w)
k.add(s, k.sym('baz:name'), 'Aimée', w)
print('Dump 2:')
z.writeStore(print)
print('Done.\n')
