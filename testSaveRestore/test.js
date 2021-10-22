
var $rdf = require('./../index.js')
// process = require('process');

var prefix = 'http://localhost/devel/github.com/linkeddata/tabulator-firefox/content/js/rdf/testSaveRestore/'
prefix = 'file:///devel/github.com/linkeddata/tabulator-firefox/content/js/rdf/testSaveRestore/'

var g = $rdf.graph()
var f = $rdf.fetcher(g)

f.nowOrWhenFetched(prefix + 'a.ttl', undefined, function (ok, message) {
  f.nowOrWhenFetched(prefix + 'b.ttl', undefined, function (ok, message) {
    var sz = new $rdf.Serializer(g)
    sz.writeStore(console.log)
  })
})
