###
# nodeunit tests for term.js
###

$rdf = require '../term.js'

tests =
    statement: [{
        s: new $rdf.Symbol("http://example.com/btb")
        p: new $rdf.Symbol("http://xmlns.com/foaf/0.1/name")
        o: "Bob Builder"
        expect: '<http://example.com/btb> <http://xmlns.com/foaf/0.1/name> "Bob Builder" .'
    }]
    formula: [{
        s: new $rdf.Symbol("http://example.com/btb")
        p: new $rdf.Symbol("http://xmlns.com/foaf/0.1/name")
        o: "Builder"
        expect: '{<http://example.com/btb> <http://xmlns.com/foaf/0.1/name> "Builder" .}'
    },{
        s: new $rdf.BlankNode()
        p: new $rdf.Symbol("http://xmlns.com/foaf/0.1/firstname")
        o: "Bob"
        expect: '{_:n0 <http://xmlns.com/foaf/0.1/firstname> "Bob" .}'
    },{
        s: new $rdf.Symbol("http://example.com/btb")
        p: new $rdf.Symbol("http://xmlns.com/foaf/0.1/lastname")
        o: new $rdf.Literal("Builder", "en")
        expect: '{<http://example.com/btb> <http://xmlns.com/foaf/0.1/lastname> "Builder"@en .}'
    },{
        s: new $rdf.Symbol("http://example.com/btb")
        p: new $rdf.Symbol("http://example.org/vocab#shoeSize")
        o: new $rdf.Literal("30", undefined, (new $rdf.Namespace("http://www.w3.org/2001/XMLSchema#"))('integer'))
        expect: '{<http://example.com/btb> <http://example.org/vocab#shoeSize> "30"^^<http://www.w3.org/2001/XMLSchema#integer> .}'
    }]

statementTest = (s, p, o, expect) ->
    (test) ->
        triple = new $rdf.Statement s, p, o, undefined
        test.equal triple.toString(), expect
        test.done()

formulaTest = (s, p, o, expect) ->
    (test) ->
        kb = new $rdf.Formula
        kb.add s, p, o
        test.equal kb.toNT(), expect
        test.done()

module.exports =
    Statement: {}
    Formula: {}

for {s, p, o, expect} in tests.statement
    module.exports.Statement["(#{s}, #{p}, #{o}) == '#{expect}'"] = statementTest s, p, o, expect
for {s, p, o, expect} in tests.formula
    module.exports.Formula["(#{s}, #{p}, #{o}) == '#{expect}'"] = formulaTest s, p, o, expect
