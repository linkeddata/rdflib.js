/*
 * nodeunit tests for uri.js
 */
var abs, base, i, joinTest, len, ref, refToTest, rel, tests, uri

uri = (require('../uri.js')).uri

tests = [['foo:xyz', 'bar:abc', 'bar:abc'], ['http://example/x/y/z', 'http://example/x/abc', '../abc'], ['http://example2/x/y/z', 'http://example/x/abc', 'http://example/x/abc'], ['http://ex/x/y/z', 'http://ex/x/r', '../r'], ['http://ex/x/y', 'http://ex/x/q/r', 'q/r'], ['http://ex/x/y', 'http://ex/x/q/r#s', 'q/r#s'], ['http://ex/x/y', 'http://ex/x/q/r#s/t', 'q/r#s/t'], ['http://ex/x/y', 'ftp://ex/x/q/r', 'ftp://ex/x/q/r'], ['http://ex/x/y', 'http://ex/x/y', ''], ['http://ex/x/y/', 'http://ex/x/y/', ''], ['http://ex/x/y/pdq', 'http://ex/x/y/pdq', ''], ['http://ex/x/y/', 'http://ex/x/y/z/', 'z/'], ['file:/swap/test/animal.rdf', 'file:/swap/test/animal.rdf#Animal', '#Animal'], ['file:/e/x/y/z', 'file:/e/x/abc', '../abc'], ['file:/example2/x/y/z', 'file:/example/x/abc', '/example/x/abc'], ['file:/ex/x/y/z', 'file:/ex/x/r', '../r'], ['file:/ex/x/y/z', 'file:/r', '/r'], ['file:/ex/x/y', 'file:/ex/x/q/r', 'q/r'], ['file:/ex/x/y', 'file:/ex/x/q/r#s', 'q/r#s'], ['file:/ex/x/y', 'file:/ex/x/q/r#', 'q/r#'], ['file:/ex/x/y', 'file:/ex/x/q/r#s/t', 'q/r#s/t'], ['file:/ex/x/y', 'ftp://ex/x/q/r', 'ftp://ex/x/q/r'], ['file:/ex/x/y', 'file:/ex/x/y', ''], ['file:/ex/x/y/', 'file:/ex/x/y/', ''], ['file:/ex/x/y/pdq', 'file:/ex/x/y/pdq', ''], ['file:/ex/x/y/', 'file:/ex/x/y/z/', 'z/'], ['file:/devel/WWW/2000/10/swap/test/reluri-1.n3', 'file://meetings.example.com/cal#m1', 'file://meetings.example.com/cal#m1'], ['file:/home/connolly/w3ccvs/WWW/2000/10/swap/test/reluri-1.n3', 'file://meetings.example.com/cal#m1', 'file://meetings.example.com/cal#m1'], ['file:/some/dir/foo', 'file:/some/dir/#blort', './#blort'], ['file:/some/dir/foo', 'file:/some/dir/#', './#'], ['http://example/x/y%2Fz', 'http://example/x/abc', 'abc'], ['http://example/x/y/z', 'http://example/x%2Fabc', '/x%2Fabc'], ['http://example/x/y%2Fz', 'http://example/x%2Fabc', '/x%2Fabc'], ['http://example/x%2Fy/z', 'http://example/x%2Fy/abc', 'abc'], ['http://example/x/abc.efg', 'http://example/x/', './'], ['http://www.w3.org/People/Berners-Lee/card.rdf', 'http://www.w3.org/2002/01/tr-automation/tr.rdf', '/2002/01/tr-automation/tr.rdf'], ['http://example.com/', 'http://example.com/', ''], ['http://example.com/.meta.n3', 'http://example.com/.meta.n3', '']]

joinTest = function (base, abs, rel) {
  return function (test) {
    var result
    result = uri.join(rel, base)
    test.equal(result, abs)
    return test.done()
  }
}

refToTest = function (base, abs, rel) {
  return function (test) {
    var result
    result = uri.refTo(base, abs)
    test.equal(result, rel)
    return test.done()
  }
}

module.exports = {
  join: {},
  refTo: {}
}

for (i = 0, len = tests.length; i < len; i++) {
  ref = tests[i], base = ref[0], abs = ref[1], rel = ref[2]
  module.exports.join['(<' + rel + '>, <' + base + '>) == <' + abs + '>'] = joinTest(base, abs, rel)
  module.exports.refTo['(<' + base + '>, <' + abs + '>) == <' + rel + '>'] = refToTest(base, abs, rel)
}
