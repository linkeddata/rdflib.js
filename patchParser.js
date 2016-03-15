// Parse a simple SPARL-Update subset syntax for patches.
//
//  This parses
//   WHERE {xxx} DELETE {yyy} INSERT DATA {zzz}
// (not necessarily in that order)
// as though it were the n3
//   <#query> patch:where {xxx}; patch:delete {yyy}; patch:insert {zzz}.

$rdf.sparqlUpdateParser = function(str, kb, base) {
    var i,j,k;
    var keywords = [ 'INSERT', 'DELETE', 'WHERE' ]
    var SQNS = $rdf.Namespace('http://www.w3.org/ns/pim/patch#');
    var p = $rdf.N3Parser(kb, kb, base, base, null, null, "", null);
    var clauses = {};

    var badSyntax = function (uri, lines, str, i, why) {
        return  ("Line " +  ( lines + 1 ) + " of <" + uri + ">: Bad syntax:\n   " +
                why + "\n   at: \"" + str.slice(i, (i + 30))  + "\"" ) ;
    };

    var check = function(next, last, message) {
        if (next < 0) {
            throw badSyntax(p._thisDoc, p.lines, str, j, last, message);
        };
        return next;
    };


    i = 0;
    var query = kb.sym(base+ '#query');  // Invent a URI for the query
    clauses['query'] = query; // A way of accessing it in its N3 model.

    while (true) {
        // console.log("A Now at i = " + i)
        var j = p.skipSpace(str, i);
        if (j < 0) {
            return clauses
        }
        // console.log("B After space at j= " + j)
        if (str[j] === ';') {
            i = p.skipSpace(str, j + 1);
            if ( i < 0) {
                return clauses ; // Allow end in a ;
            }
            j = i;
        }
        var found = false;
        for (k=0;  k< keywords.length; k++) {
            var key = keywords[k];
            if (str.slice(j, j + key.length) === key) {
                // console.log("C got one " + key);
                i = p.skipSpace(str, j+ key.length);
                // console.log("D after space at i= " + i);
                if (i < 0) {
                    throw badSyntax(p._thisDoc, p.lines, str, j+ key.length, "found EOF, needed {...} after "+key);
                };
                if (((key === 'INSERT') || (key === 'DELETE')) && str.slice(i, i+4) === 'DATA') { // Some wanted 'DATA'. Whatever
                    j = p.skipSpace(str, i+4);
                    if (j < 0) {
                        throw badSyntax(p._thisDoc, p.lines, str, i+4, "needed {...} after INSERT DATA "+key);
                    };
                    i = j;
                }
                var res2 = [];
                j = p.node(str, i, res2);
                // console.log("M Now at j= " + j + " i= " + i)

                if (j < 0) {
                    throw badSyntax(p._thisDoc, p.lines, str, i,
                            "bad syntax or EOF in {...} after " + key);
                }
                clauses[key.toLowerCase()] = res2[0];
                // print("res2[0] for "+key+ " is " + res2[0]);  //   @@ debug @@@@@@
                kb.add(query, SQNS(key.toLowerCase()), res2[0]);
                // key is the keyword and res2 has the contents
                found = true;
                i = j;
            }
        };
        if (!found  && str.slice(j, j+7) === '@prefix') {
            var i = p.directive(str, j);
            if (i < 0) {
            throw badSyntax(p._thisDoc, p.lines, str, i,
                    "bad syntax or EOF after @prefix ");
            }
            // console.log("P before dot i= " + i)
            i = p.checkDot(str, i);
            // console.log("Q after dot i= " + i)
            found = true;
        }
        if (!found) {
            // console.log("Bad syntax " + j)
            throw badSyntax(p._thisDoc, p.lines, str, j,
                    "Unknown syntax at start of statememt: '" + str.slice(j).slice(0,20) +"'")
        }

    } // while
    //return clauses


}; // End of sparqlUpdateParser


//////////////// Apply a patch

$rdf.IndexedFormula.prototype.applyPatch = function(patch, target, patchCallback) { // patchCallback(err)
    var targetKB = this;
    var doPatch = function(onDonePatch) {
        // $rdf.log.info("doPatch ...")

        if (patch['delete']) {
            // $rdf.log.info("doPatch delete "+patch['delete'])
            var ds =  patch['delete']
            if (bindings) ds = ds.substitute(bindings);
            ds = ds.statements;
            var bad = [];
            var ds2 = ds.map(function(st){ // Find the actual statemnts in the store
                var sts = targetKB.statementsMatching(st.subject, st.predicate, st.object, target);
                if (sts.length === 0) {
                    // $rdf.log.info("NOT FOUND deletable " + st);
                    bad.push(st);
                    return null;
                } else {
                    // $rdf.log.info("Found deletable " + st);
                    return sts[0]
                }
            });
            if (bad.length) {
                return patchCallback("Couldn't find to delete: " + bad[0])
            }
            ds2.map(function(st){
                targetKB.remove(st);
            });
        };

        if (patch['insert']) {
            // $rdf.log.info("doPatch insert "+patch['insert'])
            var ds =  patch['insert'];
            if (bindings) ds = ds.substitute(bindings);
            ds = ds.statements;
            ds.map(function(st){st.why = target;
                targetKB.add(st.subject, st.predicate, st.object, st.why);
            });
        };
        onDonePatch();
    };

    var bindings = null;
    if (patch.where) {
        // $rdf.log.info("Processing WHERE: " + patch.where + '\n');

        var query = new $rdf.Query('patch');
        query.pat = patch.where;
        query.pat.statements.map(function(st){st.why = target});

        var bindingsFound = [];
        // $rdf.log.info("Processing WHERE - launching query: " + query.pat);

        targetKB.query(query, function onBinding(binding) {
            bindingsFound.push(binding)
        },
        targetKB.fetcher,
        function onDone() {
            if (bindingsFound.length == 0) {
                return patchCallback("No match found to be patched:" + patch.where);
            }
            if (bindingsFound.length > 1) {
                return patchCallback("Patch ambiguous. No patch done.");
            }
            bindings = bindingsFound[0];
            doPatch(patchCallback);
        });
    } else {
        doPatch(patchCallback)
    };
};




// ends
