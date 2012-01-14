// RDFS Inference
//
// These are hand-written implementations of a backward-chaining reasoner over the RDFS axioms
// These RDFS bits were moved from panes/categoryPane.js to a js/rdf/rdfs.js

// @param seeds:   a hash of NTs of classes to start with
// @param predicate: The property to trace though
// @param inverse: trace inverse direction

$rdf.Formula.prototype.transitiveClosure = function(seeds, predicate, inverse){
    var done = {}; // Classes we have looked up
    var agenda = {};
    for (var t in seeds) agenda[t] = seeds[t]; // Take a copy
    for(;;) {
        var t = (function(){for (var pickOne in agenda) {return pickOne;} return undefined}());
        if (t == undefined)  return done;
        var sups = inverse  ? this.each(undefined, predicate, this.fromNT(t))
                            : this.each(this.fromNT(t), predicate);
        for (var i=0; i<sups.length; i++) {
            var s = sups[i].toNT();
            if (s in done) continue;
            if (s in agenda) continue;
            agenda[s] = agenda[t];
        }
        done[t] = agenda[t];
        delete agenda[t];
    }
};


// Find members of classes
//
// For this class or any subclass, anything which has it is its type
// or is the object of something which has the tpe as its range, or subject
// of something which has the type as its domain
// We don't bother doing subproperty (yet?)as it doesn't seeem to be used much.

$rdf.Formula.prototype.findMembersNT = function (thisClass) {
    var seeds = {}; seeds [thisClass.toNT()] = true;
    var types = this.transitiveClosure(seeds,
        this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true);
    var members = {};
    var kb = this;
    for (t in types) {
        this.statementsMatching(undefined, this.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), this.fromNT(t))
            .map(function(st){members[st.subject.toNT()] = st});
        this.each(undefined, this.sym('http://www.w3.org/2000/01/rdf-schema#domain'), this.fromNT(t))
            .map(function(pred){
                kb.statementsMatching(undefined, pred).map(function(st){members[st.subject.toNT()] = st});
            });
        this.each(undefined, this.sym('http://www.w3.org/2000/01/rdf-schema#range'), this.fromNT(t))
            .map(function(pred){
                kb.statementsMatching(undefined, pred).map(function(st){members[st.object.toNT()] = st});
            });
    }
    return members;
};

// Get all the Classes of which we can RDFS-infer the subject is a member
// @returns  a hash of URIS

$rdf.Formula.prototype.findTypeURIs = function (subject) {
    return this.NTtoURI(this.findTypesNT(subject));
}

$rdf.Formula.prototype.NTtoURI = function (t) {
    var uris = {};
    for (nt in t) {
        if (nt[0] == '<') uris[nt.slice(1,-1)] = t[nt];
    }
    return uris;
}

$rdf.Formula.prototype.findTypesNT = function (subject) {
// Get all the Classes of which we can RDFS-infer the subject is a member
// ** @@ This will loop is there is a class subclass loop (Sublass loops are not illegal)
// Returns a hash table where key is NT of type and value is statement why we think so.
// Does NOT return terms, returns URI strings.
// We use NT representations inthis version because they handle blank nodes.

    var sts = this.statementsMatching(subject, undefined, undefined); // fast
    var rdftype = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    var types = [];
    for (var i=0; i < sts.length; i++) {
        st = sts[i];
        if (st.predicate.uri == rdftype) {
            types[st.object.toNT()] = st;
        } else {
            // $rdf.log.warn('types: checking predicate ' + st.predicate.uri);
            var ranges = this.each(st.predicate, this.sym('http://www.w3.org/2000/01/rdf-schema#domain'))
            for (var j=0; j<ranges.length; j++) {
                types[ranges[j].toNT()] = st; // A pointer to one part of the inference only
            }
        }
    }
    var sts = this.statementsMatching(undefined, undefined, subject); // fast
    for (var i=0; i < sts.length; i++) {
        st = sts[i];
        var domains = this.each(st.predicate, this.sym('http://www.w3.org/2000/01/rdf-schema#range'))
        for (var j=0; j < domains.length; j++) {
            types[domains[j].toNT()] = st;
        }
    }
    return this.transitiveClosure(types,
        this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false);
};
        
/* Find the types in the list which have no *stored* supertypes
** We exclude the universal class, owl:Things and rdf:Resource, as it is not information-free.*/
        
$rdf.Formula.prototype.topTypeURIs = function(types) {
    var tops = [];
    for (var u in types) {
        var sups = this.each(this.sym(u), this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'));
        var k = 0
        for (var j=0; j < sups.length; j++) {
            if (sups[j].uri != 'http://www.w3.org/2000/01/rdf-schema#Resource') {
                k++; break;
            }
        }
        if (!k) tops[u] = types[u];
    }
    if (tops['http://www.w3.org/2000/01/rdf-schema#Resource'])
        delete tops['http://www.w3.org/2000/01/rdf-schema#Resource'];
    if (tops['http://www.w3.org/2002/07/owl#Thing'])
        delete tops['http://www.w3.org/2002/07/owl#Thing'];
    return tops;
}

/* Find the types in the list which have no *stored* subtypes
** These are a set of classes which provide by themselves complete
** information -- the other classes are redundant for those who
** know the class DAG.
*/
    
$rdf.Formula.prototype.bottomTypeURIs = function(types) {
    var bots = [];
    for (var u in types) {
        var subs = this.each(undefined, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'),this.sym(u));
        var bottom = true;
        for (var i=0; i<subs.length; i++) {
            if (subs[i].uri in types) {
                bottom = false;
                break;
            }
        }
        if (bottom) bots[u] = types[u];
    }
    return bots;
}
   
    

//ends


