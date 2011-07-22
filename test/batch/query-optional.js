// Run me with:
// js
// Rhino 1.6 release 5 2006 11 18
    
   // load('../../js/rdf/rdflib.js')

    load('../../js/rdf/util.js');
    load('../../js/rdf/uri.js');
    load('../../js/rdf/term.js');
    load('../../js/rdf/match.js');
    load('../../js/rdf/rdfparser.js');
    load('../../js/rdf/rdfa.js');
    load('../../js/rdf/n3parser.js');
    load('../../js/rdf/identity.js');
    load('../../js/rdf/rdfs.js');
    load('../../js/rdf/query.js');
    load('../../js/rdf/sparql.js');
    load('../../js/rdf/sparqlUpdate.js');
    load('../../js/rdf/jsonparser.js');
    load('../../js/rdf/serialize.js');
    load('../../js/rdf/web.js');


    if (dump == undefined) {
        var dump = function(str) { print("dump:  "+str);};
        $rdf.log.debug = function(str) {print("debug: "+str)};
        $rdf.log.warn = function(str) {print("warn:  "+str)};
        $rdf.log.info = function(str) {print("info:  "+str)};
        $rdf.log.error = function(str) {print("error: "+str)};
    }
    if (setTimeout == undefined) var setTimeout = function(f,t) {f()};
    
        
    kb = $rdf.graph();
    var x = kb.sym('#foo');
    var foaf = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
    kb.add(x, foaf('type'), foaf('Person'));
    kb.add(x, foaf('name'), "Fred");
    kb.add(x, foaf('mbox'), kb.sym('mailto:fred@example.com'))

    q = new $rdf.Query('test', 3);

    var who = $rdf.variable('who');
    var email = $rdf.variable('email');
    var name = $rdf.variable('name');

    q.pat.add(who,  foaf('type'), foaf('Person'));

    var opt1 = $rdf.graph();
    opt1.add(who,  foaf('mbox'), email);
    q.pat.optional.push(opt1);
    
    var opt2 = $rdf.graph();
    opt2.add(who,  foaf('name'), name);
    q.pat.optional.push(opt2);
    
    dump('Test:');
    kb.query(q, function(result) {
        print('TEST OK - CALLBACK');
        var str = "Result: ";
        for (var v in result) {
            str += "   "+v+'->'+result[v];
        }
        print(str);
              
    });
    
    
