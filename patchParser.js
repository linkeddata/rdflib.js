
// Parse a simple SPARL-Update syntax for patches.
// 
//  This parses 
//   WHERE {xxx} DELETE {yyy} INSERT DATA {zzz} 
// as though it were the n3
//   <#query> patch:where {xxx}; patch:delete {yyy}; patch:insert {zzz}.

$rdf.spaqlUpdateParser = function(store, str, base) {
    var i,j,k;
    var keywords = [ 'INSERT', 'DELETE', 'WHERE' ]
    var SQNS = $rdf.Namespace('http://www.w3.org/ns/pim/patch#');
    var p = $rdf.N3Parser(store, store, base, base, null, null, "", null);
    // p.loadBuf("<#s> <#p> (1 2 2).");
    res = [];
    var clauses = {};
    i = 0;
    var j = p.skipSpace(str, i);
    if (j < 0) {
        throw p.BadSyntax(p._thisDoc, p.lines, str, j, "needed INSERT, DELETE etc, found end.");
    }
    var q = kb.sym(base+ '#query');  // Invent a URI for the query
    
    for (k=0;  k< keywords.length; k++) {
        key = keywords[k];
        if (str.slice(j, j + key.length) === key) {
            i = p.skipSpace(str, j+5);
            if (i < 0) {
                throw p.BadSyntax(p._thisDoc, p.lines, str, i, "needed {...} after "+key);
            };
            if (key === 'INSERT' && str.slice(i, i+4) === 'DATA') { // Some wanted 'DATA'. Whatever
                i = p.skipSpace(str, i+4);
                if (i < 0) {
                    throw p.BadSyntax(p._thisDoc, p.lines, str, i, "needed {...} after INSERT DATA "+key);
                };
            }
            var res2 = [];
            i = p.node(str, i, res2);
            if (i < 0) {
                throw p.BadSyntax(p._thisDoc, p.lines, str, i,
                        "bad syntax or EOF in {...} after " + key);
            }
            clauses[key] = res2[0];
            print("res2[0] for "+key+ " is " + res2[0]);  //   @@ debug
            store.add(query, SQNS(key.lower), res2[0]);
            // key is the keyword and res2 has the contents
        }
    };
    return q, clauses


}; // End of spaqlUpdateParser



$rdf.applySparqlPatch = function(kb, doc, query) {
    var where = kb.any(query, SQNS('where');
    if (where) {
        q2 = $rdf.query()
        q.pat = where;
        for 
    }
}

////////  Bits of node.js server

$rdf.patchServer = function(uriBase, fileBase) {
    var fs = require('fs');
    var requestListener = function(request, response) {
        var uri = request.url;
        if (uri.slice(0, uriBase.length) !== uriBase) {
            throw "URI not starting with base: " + uriBase;
        }
        var filename = fileBase + uri.slice(uriBase.length);
        switch(request.method) {
        case 'GET':
            break;
        case 'PATCH':
            switch(request.headers['content-type']) {
            case 'application/sparql-update':
                try {
                    q = sparqlUpdateParser(kb, str, uri);
                } catch(e) {
                    return fail(409, "Patch syntax error:" + e); // @@ check status numbers
                }
                fs.readFile(filename, 'utf8', function (err,data) {
                    if (err) {
                        return fail(404, "Patch: Original file read error:"err);
                    }

                    patchFile(filename, uri, q);
                    fs = require('fs');
                    fs.writeFile(filename, data, 'utf8', function(err){
                        return success(200, "Patch applied OK");
                    }); // end write done
                }); // end read done
                    
            break;
            }
            break;
        case 'POST':
            break;   
        default:
            fail(500, "Unhandled HTTP method")
        }
    
    }; // end requestListener

}





// ends
