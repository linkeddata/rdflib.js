// Matching a formula against another formula
//
//
// W3C open source licence 2005.
//
// This builds on term.js, match.js (and identity.js?)
// to allow a query of a formula.
//
// Here we introduce for the first time a subclass of term: variable.
//
// SVN ID: $Id: query.js 25116 2008-11-15 16:13:48Z timbl $

//  Variable
//
// Compare with BlankNode.  They are similar, but a variable
// stands for something whose value is to be returned.
// Also, users name variables and want the same name back when stuff is printed

/*jsl:option explicit*/ // Turn on JavaScriptLint variable declaration checking


// The Query object.  Should be very straightforward.
//
// This if for tracking queries the user has in the UI.
//
$rdf.Query = function (name, id) {
    this.pat = new $rdf.IndexedFormula(); // The pattern to search for
    this.vars = []; // Used by UI code but not in query.js
//    this.orderBy = []; // Not used yet
    this.name = name;
    this.id = id;
}

/**The QuerySource object stores a set of listeners and a set of queries.
 * It keeps the listeners aware of those queries that the source currently
 * contains, and it is then up to the listeners to decide what to do with
 * those queries in terms of displays.
 * Not used 2010-08 -- TimBL
 * @constructor
 * @author jambo
 */
$rdf.QuerySource = function() {
    /**stores all of the queries currently held by this source, indexed by ID number.
     */
    this.queries=[];
    /**stores the listeners for a query object.
     * @see TabbedContainer
     */
    this.listeners=[];

    /**add a Query object to the query source--It will be given an ID number
     * and a name, if it doesn't already have one. This subsequently adds the
     * query to all of the listeners the QuerySource knows about.
     */
    this.addQuery = function(q) {
        var i;
        if(q.name==null || q.name=="")
				    q.name="Query #"+(this.queries.length+1);
        q.id=this.queries.length;
        this.queries.push(q);
        for(i=0; i<this.listeners.length; i++) {
            if(this.listeners[i]!=null)
                this.listeners[i].addQuery(q);
        }
    };

    /**Remove a Query object from the source.  Tells all listeners to also
     * remove the query.
     */
    this.removeQuery = function(q) {
        var i;
        for(i=0; i<this.listeners.length; i++) {
            if(this.listeners[i]!=null)
                this.listeners[i].removeQuery(q);
        }
        if(this.queries[q.id]!=null)
            delete this.queries[q.id];
    };

    /**adds a "Listener" to this QuerySource - that is, an object
     * which is capable of both adding and removing queries.
     * Currently, only the TabbedContainer class is added.
     * also puts all current queries into the listener to be used.
     */
    this.addListener = function(listener) {
        var i;
        this.listeners.push(listener);
        for(i=0; i<this.queries.length; i++) {
            if(this.queries[i]!=null)
                listener.addQuery(this.queries[i]);
        }
    };
    /**removes listener from the array of listeners, if it exists! Also takes
     * all of the queries from this source out of the listener.
     */
    this.removeListener = function(listener) {
        var i;
        for(i=0; i<this.queries.length; i++) {
            if(this.queries[i]!=null)
                listener.removeQuery(this.queries[i]);
        }

        for(i=0; i<this.listeners.length; i++) {
            if(this.listeners[i]===listener) {
                delete this.listeners[i];
            }
        } 
    };
}

$rdf.Variable.prototype.isVar = 1;
$rdf.BlankNode.prototype.isVar = 1;
$rdf.BlankNode.prototype.isBlank = 1;
$rdf.Symbol.prototype.isVar = 0;
$rdf.Literal.prototype.isVar = 0;
$rdf.Formula.prototype.isVar = 0;
$rdf.Collection.prototype.isVar = 0;


/**
 * This function will match a pattern to the current kb
 * 
 * The callback function is called whenever a match is found
 * When fetcher is supplied this will be called to satisfy any resource requests 
 * currently not in the kb. The fetcher function needs to be defined manualy and
 * should call $rdf.Util.AJAR_handleNewTerm to process the requested resource. 
 * 
 * @param	myQuery,	a knowledgebase containing a pattern to use as query
 * @param	callback, 	whenever the pattern in myQuery is met this is called with 
 * 						the binding as parameter
 * @param	fetcher,	whenever a resource needs to be loaded this gets called
 */
$rdf.IndexedFormula.prototype.query = function(myQuery, callback, fetcher) {
    var kb = this;
    dump("Query:"+myQuery.pat+", fetcher="+fetcher+"\n");
    //FUNCTIONS!! 
    //TODO:  Do these work here?


// Unification: see also 
//  http://www.w3.org/2000/10/swap/term.py
// for similar things in python
//
// Unification finds all bindings such that when the binding is applied
// to one term it is equal to the other.


    function RDFUnifyTerm(self, other, bindings, formula) {
        var actual = bindings[self];
        if (typeof actual == 'undefined') { // Not mapped
            if (self.isVar) {
                    /*if (self.isBlank)  //bnodes are existential variables
                    {
                            if (self.toString() == other.toString()) return [[ [], null]];
                            else return [];
                    }*/
                var b = [];
                b[self] = other;
                return [[  b, null ]]; // Match
            }
            actual = self;
        }
        if (!actual.complexType) {
            if (formula.redirections[actual]) actual = formula.redirections[actual];
            if (formula.redirections[other])  other  = formula.redirections[other];
            if (actual.sameTerm(other)) return [[ [], null]];
            return [];
        }
        if (self instanceof Array) {
            if (!(other instanceof Array)) return [];
            return RDFArrayUnifyContents(self, other, bindings)
        };
        throw("query.js: oops - code not written yet");
        return undefined;  // for lint 
    //    return actual.unifyContents(other, bindings)
    }; //RDFUnifyTerm



    function RDFArrayUnifyContents(self, other, bindings, formula) {
        if (self.length != other.length) return []; // no way
        if (!self.length) return [[ [], null ]]; // Success
        var nbs = RDFUnifyTerm(self[0], other[0], bindings, formula);
        if (nbs == []) return nbs;
        var res = [];
        var i, n=nbs.length, nb, b2, j, m, v, nb2;
        for (i=0; i<n; i++) { // for each possibility from the first term
            nb = nbs[i][0]; // new bindings
            var bindings2 = [];
            for (v in nb) {
                bindings2[v] = nb[v]; // copy
            }
            for (v in bindings) bindings2[v] = bindings[v]; // copy
            var nbs2 = RDFArrayUnifyContents(self.slice(1), other.slice(1), bindings2, formula);
            m = nbs2.length;
            for (j=0; j<m; j++) {
                var nb2 = nbs2[j][0];   //@@@@ no idea whether this is used or right
                for (v in nb) nb2[v]=nb[v];
                res.push([nb2, null]);
            }
        }
        return res;
    } //RDFArrayUnifyContents



    //  Matching
    //
    // Matching finds all bindings such that when the binding is applied
    // to one term it is equal to the other term.  We only match formulae.

    /** if x is not in the bindings array, return the var; otherwise, return the bindings **/
    function RDFBind(x, binding) {
        var y = binding[x];
        if (typeof y == 'undefined') return x;
        return y;
    }



    /** prepare -- sets the index of the item to the possible matches
        * @param f - formula
        * @param item - an Statement, possibly w/ vars in it
        * @param bindings - 
    * @returns true if the query fails -- there are no items that match **/
    function prepare(f, item, bindings) {
        item.nvars = 0;
        item.index = null;
        if (!f.statements) $rdf.log.warn("@@@ prepare: f is "+f);
    //    $rdf.log.debug("Prepare: f has "+ f.statements.length);
        $rdf.log.debug("Prepare: Kb size "+f.statements.length+" Preparing "+item);
        
        var t,c,terms = [item.subject,item.predicate,item.object],ind = [f.subjectIndex,f.predicateIndex,f.objectIndex];
        for (i=0;i<3;i++)
        {
            //alert("Prepare "+terms[i]+" "+(terms[i] in bindings));
            if (terms[i].isVar && !(terms[i] in bindings)) {
                    item.nvars++;
            } else {
                    var t = RDFBind(terms[i], bindings); //returns the RDF binding if bound, otherwise itself
                    //if (terms[i]!=RDFBind(terms[i],bindings) alert("Term: "+terms[i]+"Binding: "+RDFBind(terms[i], bindings));
                    if (f.redirections[t.hashString()]) t = f.redirections[t.hashString()]; //redirect
                    termIndex=ind[i]
                    item.index = termIndex[t.hashString()];
                    if (typeof item.index == 'undefined') {
                    $rdf.log.debug("prepare: no occurrence [yet?] of term: "+ t);
                    item.index = [];
                    }
            }
        }
            
        if (item.index == null) item.index = f.statements;
        // $rdf.log.debug("Prep: index length="+item.index.length+" for "+item)
        $rdf.log.debug("prepare: index length "+item.index.length +" for "+ item);
        return false;
    } //prepare
        
    /** sorting function -- negative if self is easier **/
    // We always prefer to start with a URI to be able to browse a graph
    // this is why we put off items with more variables till later.
    function easiestQuery(self, other) {
        if (self.nvars != other.nvars) return self.nvars - other.nvars;
        return self.index.length - other.index.length;
    }

    var match_index = 0; //index
    /** matches a pattern formula against the knowledge base, e.g. to find matches for table-view
    *
    * @param f - knowledge base formula
    * @param g - pattern formula (may have vars)
    * @param bindingsSoFar  - bindings accumulated in matching to date
    * @param level - spaces to indent stuff also lets you know what level of recursion you're at
    * @param fetcher - function (term, requestedBy) - myFetcher / AJAR_handleNewTerm / the sort
    * @returns nothing 
    *
    * Will fetch linked data from the web iff the knowledge base an associated source fetcher (f.sf)
    ***/
    function match(f, g, bindingsSoFar, level, fetcher, callback, branchCount) {
        var sf = null;
        if( typeof f.sf != 'undefined' ) {
            sf = f.sf;
        }
        //$rdf.log.debug("match: f has "+f.statements.length+", g has "+g.statements.length)
        var pattern = g.statements;
        if (pattern.length == 0) { //when it's satisfied all the pattern triples
            //$rdf.log.msg("REACHED CALLBACK WITH BINDINGS:")
            for (var b in bindingsSoFar) {
                //$rdf.log.msg("b=" + b + ", bindingsSoFar[b]=" + bindingsSoFar[b])
            }
            if (callback) callback(bindingsSoFar,g)
            branchCount.count--
            branchCount.success=true
            //$rdf.log.debug("Branch Count at end: "+branchCount.count)
            return [[ [], null ]]; // Success
        }
        var item, i, n=pattern.length;
        //$rdf.log.debug(level + "Match "+n+" left, bs so far:"+bindingDebug(bindingsSoFar))

        // Follow links from variables in query
        if (fetcher) {   //Fetcher is used to fetch URIs, function first term is a URI term, second is the requester
            var id = "match" + match_index++;
            var fetchResource = function (requestedTerm, id) {
                var path = requestedTerm.uri;
                if(path.indexOf("#")!=-1) {
                    path=path.split("#")[0];
                }
                if( sf ) {
                    sf.addCallback('done', function(uri) {
                        if ((kb.canon(kb.sym(uri)).uri != path) && (uri != kb.canon(kb.sym(path)))) {
                            return true
                        }

                        match(f, g, bindingsSoFar, level, fetcher, // @@tbl was match2
                                          callback, branchCount)
                        return false
                    })
                }
                fetcher(requestedTerm, id)	    
            }
            for (i=0; i<n; i++) {
                item = pattern[i];  //for each of the triples in the query
                if (item.subject in bindingsSoFar 
                    && bindingsSoFar[item.subject].uri
                    && sf && sf.getState($rdf.Util.uri.docpart(bindingsSoFar[item.subject].uri)) == "unrequested") {
                    //fetch the subject info and return to id
                    fetchResource(bindingsSoFar[item.subject],id)
                    return; //@@tbl
                } else if (item.object in bindingsSoFar
                           && bindingsSoFar[item.object].uri
                           && sf && sf.getState($rdf.Util.uri.docpart(bindingsSoFar[item.object].uri)) == "unrequested") {
                    fetchResource(bindingsSoFar[item.object], id)
                    return; //@@tbl
                }
            }
            match2(f, g, bindingsSoFar, level, fetcher, callback, branchCount)
        }
        return; //when the sources have been fetched, match2 will be called
    }

    /** match2 -- stuff after the fetch **/
    function match2(f, g, bindingsSoFar, level, fetcher, callback, branchCount) //post-fetch
    {
        var pattern = g.statements, n = pattern.length, i;
        for (i=0; i<n; i++) {  //For each statement left in the query, run prepare
            item = pattern[i];
            $rdf.log.info("match2: item=" + item + ", bindingsSoFar=" + bindingDebug(bindingsSoFar));
            prepare(f, item, bindingsSoFar);
        }
        pattern.sort(easiestQuery);
        // $rdf.log.debug("Sorted pattern:\n"+pattern)
        var item = pattern[0];
        var rest = f.formula();
        rest.optional = g.optional;
        rest.constraints = g.constraints;
        rest.statements = pattern.slice(1); // No indexes: we will not query g. 
        $rdf.log.debug(level + "Match2 searching "+item.index.length+ " for "+item+
                "; bindings so far="+bindingDebug(bindingsSoFar));
        //var results = [];
        var c, nc=item.index.length, nbs1, x;
        for (c=0; c<nc; c++) {   // For each candidate statement
            var st = item.index[c]; //for each statement in the item's index, spawn a new match with that binding 
            nbs1 = RDFArrayUnifyContents(
                    [item.subject, item.predicate, item.object],
            [st.subject, st.predicate, st.object], bindingsSoFar, f);
            $rdf.log.info(level+" From first: "+nbs1.length+": "+bindingsDebug(nbs1))
            var k, nk=nbs1.length, nb1, v;
            branchCount.count+=nk;
            for (k=0; k<nk; k++) {  // For each way that statement binds
                var bindings2 = [];
                var newBindings1 = nbs1[k][0]; 
                if (!constraintsSatisfied(newBindings1,g.constraints)) {branchCount--; continue;}
                for (v in newBindings1){
                    bindings2[v] = newBindings1[v]; // copy
                }
                for (v in bindingsSoFar) {
                    bindings2[v] = bindingsSoFar[v]; // copy
                }
                match(f, rest, bindings2, level+ '  ', fetcher, callback, branchCount); //call match
            }
        }
        branchCount.count--;
        $rdf.log.debug("BranchCount: "+branchCount.count);
        if (branchCount.count == 0 && !branchCount.success)
        {
            branchCount.numTasks.val--;
            //alert(branchCount.numTasks.val)
            $rdf.log.debug("Branch finished. Tasks remaining: "+branchCount.numTasks.val+" Optional array length: "+g.optional.length);
            if (branchCount.numTasks.val==0) branchCount.onFail();
            //if (g.optional.length == 0 && branchCount.numTasks.val < 1) { branchCount.onComplete();}
            //if (!branchCount.optional && branchCount.numTasks.val == -1) branchCount.onComplete();
        }
        //return results;
    } //match

    function constraintsSatisfied(bindings,constraints)
    {
            var res=true;
            for (x in bindings) {
                    if (constraints[x]) {
                            var test = constraints[x].test;
                            if (test && !test(bindings[x]))
                                    res=false;
            }
            }
            return res;
    }

    ///////////// Debug strings

    function bindingsDebug(nbs) {
        var str = "Bindings:\n";
        var i, n=nbs.length;
        for (i=0; i<n; i++) {
            str+= bindingDebug(nbs[i][0])+'\n';
        };
        return str;
    } //bindingsDebug

    function bindingDebug(b) {
            var str = "", v;
            for (v in b) {
                str += "    "+v+" -> "+b[v];
            }
            return str;
    }

    //////////////////////////// Body of query()  ///////////////////////
    
    if(!fetcher) {
        fetcher=function (x, requestedBy) {
            if (x == null) {
                return;
            } else {
                $rdf.Util.AJAR_handleNewTerm(kb, x, requestedBy);
            }
        };
    } 
    //prepare, oncallback: match1
    //match1: fetcher, oncallback: match2
    //match2, oncallback: populatetable
    //    $rdf.log.debug("Query F length"+this.statements.length+" G="+myQuery)
    var f = this;
    $rdf.log.debug("Query on "+this.statements.length)
//    if (kb != this) alert("@@@@??? this="+ this)
	
	//kb.remoteQuery(myQuery,'http://jena.hpl.hp.com:3040/backstage',callback);
	//return;
	function branchCount ()
	{
		this.count = 1;
		var tcount = function () { this.val = 1; return this }
		this.numTasks = tcount();
		this.success = false;
		this.onFail = function(){};
		return this;
	}
	
	function optionalCallback (bindings,pat)
	{
		if (pat.optional.length==0) callback(bindings);
		//alert("OPTIONAL: "+pat.optional)
		var tcount = function () { this.val = pat.optional.length; return this};
		var tc = new tcount();
		for (x in pat.optional)
		{
			var bc = new branchCount();
			bc.onFail = function(){ callback(bindings); }
			bc.numTasks = tc;
			match(f,pat.optional[x],bindings,'',fetcher,optionalCallback,bc)
		}
		return this;
	}
	//alert("INIT OPT: "+myQuery.pat.optional);
    setTimeout(function() { match(f, myQuery.pat, myQuery.pat.initBindings, '', fetcher, optionalCallback, new branchCount()); }, 0);
    //match(this, myQuery, [], '', fetcher, callback);
    //    $rdf.log.debug("Returning from query length="+res.length+" bindings: "+bindingsDebug(res))
    /*var r, nr=res.length, b, v;
    for (r=0; r<nr; r++) {
        b = res[r][0];
        for (v in b) {
            if (v[0] == '_') { // bnodes' bindings are not to be returned
                delete res[r][0][v];
            }
        }
    }
    $rdf.log.debug("Returning from query length="+res.length+" bindings: "+bindingsDebug(res));
        
    return res;
    */
    return; //returns nothing; callback does the work
}; //query
