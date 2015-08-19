// Parse a N3 store dumo.
// 
//  This parses things like
//
//   <foo.ttl>  log:metadata { ... }; log:sematics { ...} .
// 
// (not necessarily in that order)
// as though it were the n3
//

$rdf.dumpParser.prototype = new $rdf.n3Parser(); 

$rdf.dumpParser = function (store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why){
    $rdf.n3Parser.prototype.call(this, store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why);
    this._context = null; // Normally not allowed in base class init
};
    



$rdf.dumpParser.prototype.node = function(str, i, res, subjectAlready) {
    if (typeof subjectAlready == 'undefined') subjectAlready=null;
    
    var subj = subjectAlready;
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    var i = j;
    var ch = pyjslib_slice(str, i,  ( i + 1 ) );
    if ((ch !== "{" || !this.dumpTarget)) {
        return $n3Parser.prototype.node(str, i, res, subjectAlready);
    } else {
        var oldSource = this.source;
        this.source = this.dumpTarget;
        var result = $n3Parser.prototype.node.call(this, str, i, res, subjectAlready);
        this.source = oldSource;
        return result;
    } // braces
}


$rdf.dumpParser.prototype.statement = function(str, i) {
    var r = new pyjslib_List([]);
    var i = this.object(str, i, r);
    if ((i < 0)) {
        return i;
    }
    
    this.dumpTarget = this._context ?  null : r[0]; // pass on to node() on outermost level only
    
    var j = this.property_list(str, i, r[0]);
    if ((j < 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "expected propertylist");
    }
    return j;
};

// @@@@@@@@@@ Move to the normal file
$rdf.n3parser.prototype.feedString = function(str) {
    /*
    Feed an string to the parser
    
    if BadSyntax is raised, the string
    passed in the exception object is the
    remainder after any statements have been parsed.
    So if there is more data to feed to the
    parser, it should be straightforward to recover.*/
    
    var i = 0;
    while ((i >= 0)) {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            return;
        }
        var i = this.directiveOrStatement(str, j);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected directive or statement");
        }
    }
};

$rdf.IndexedFormula.prototype.restoreFromBuffer = function(buf, baseURI, flags) {
    p = new $rdf.dumpParser(str, null, 'meta:', baseURI, flags);
    p.feed(buf);
}

$rdf.IndexedFormula.prototype.restoreFromString = function(str, baseURI, flags) {
    p = new $rdf.dumpParser(str, null, 'meta:', baseURI, flags);
    p.feedString(str);
}

// ends
