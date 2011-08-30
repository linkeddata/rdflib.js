$rdf = function() {
/**
* Utility functions for $rdf and the $rdf object itself
 */

if (typeof tabulator.isExtension == 'undefined') tabulator.isExtension = false; // stand-alone library

if( typeof $rdf == 'undefined' ) {
    var $rdf = {};
} else {
    dump("Internal error: RDF libray has already been loaded\n");
    dump("Internal error: $rdf type is "+typeof $rdf+"\n");
    dump("Internal error: $rdf.log type is "+typeof $rdf.log+"\n");
    dump("Internal error: $rdf.log.error type is "+typeof $rdf.log.error+"\n");
    return $rdf;

    throw "Internal error: RDF libray has already been loaded: $rdf already exists";
};

/**
 * @class a dummy logger
 
 Note to implement this using the Firefox error console see
  https://developer.mozilla.org/en/nsIConsoleService
 */

dump("@@ rdf/util.js test RESET RDF LOGGER  $rdf.log.error)\n");
if($rdf.log != undefined) {
    dump("WTF util.js:" + $rdf.log);
    throw "Internal Error: $rdf.log already defined,  util.js: " + $rdf.log;
}

$rdf.log = {    
    'debug':function(x) {return;},
    'warn':function(x) {return;},
    'info':function(x) {return;},
    'error':function(x) {return;},
    'success':function(x) {return;},
    'msg':function(x) {return;}
}

 
/**
* @class A utility class
 */


$rdf.Util = {
    /** A simple debugging function */         
    'output': function (o) {
	    var k = document.createElement('div')
	    k.textContent = o
	    document.body.appendChild(k)
	},
    /**
    * A standard way to add callback functionality to an object
     **
     ** Callback functions are indexed by a 'hook' string.
     **
     ** They return true if they want to be called again.
     **
     */
    'callbackify': function (obj,callbacks) {
	    obj.callbacks = {}
	    for (var x=callbacks.length-1; x>=0; x--) {
            obj.callbacks[callbacks[x]] = []
	    }
	    
	    obj.addHook = function (hook) {
            if (!obj.callbacks[hook]) { obj.callbacks[hook] = [] }
	    }
        
	    obj.addCallback = function (hook, func) {
            obj.callbacks[hook].push(func)
	    }
        
        obj.removeCallback = function (hook, funcName) {
            for (var i=0;i<obj.callbacks[hook].length;i++){
                //alert(obj.callbacks[hook][i].name);
                if (obj.callbacks[hook][i].name==funcName){
                    
                    obj.callbacks[hook].splice(i,1);
                    return true;
                }
            }
            return false; 
        }
        obj.insertCallback=function (hook,func){
            obj.callbacks[hook].unshift(func);
        }
	    obj.fireCallbacks = function (hook, args) {
            var newCallbacks = []
            var replaceCallbacks = []
            var len = obj.callbacks[hook].length
            //	    $rdf.log.info('!@$ Firing '+hook+' call back with length'+len);
            for (var x=len-1; x>=0; x--) {
                //		    $rdf.log.info('@@ Firing '+hook+' callback '+ obj.callbacks[hook][x])
                if (obj.callbacks[hook][x].apply(obj,args)) {
                    newCallbacks.push(obj.callbacks[hook][x])
                }
            }
            
            for (var x=newCallbacks.length-1; x>=0; x--) {
                replaceCallbacks.push(newCallbacks[x])
            }
            
            for (var x=len; x<obj.callbacks[hook].length; x++) {
                replaceCallbacks.push(obj.callbacks[hook][x])
            }
            
            obj.callbacks[hook] = replaceCallbacks
	    }
	},
    
    /**
    * A standard way to create XMLHttpRequest objects
     */
	'XMLHTTPFactory': function () {
        if (tabulator.isExtension) {
            return Components.
            classes["@mozilla.org/xmlextras/xmlhttprequest;1"].
            createInstance().QueryInterface(Components.interfaces.nsIXMLHttpRequest);
        } else if (window.XMLHttpRequest) {
            try {
                return new XMLHttpRequest()
            } catch (e) {
                return false
            }
	    }
	    else if (window.ActiveXObject) {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP")
            } catch (e) {
                try {
                    return new ActiveXObject("Microsoft.XMLHTTP")
                } catch (e) {
                    return false
                }
            }
	    }
	    else {
            return false
	    }
	},

	'DOMParserFactory': function () {
        if(tabulator.isExtension) {
            return Components.classes["@mozilla.org/xmlextras/domparser;1"]
            .getService(Components.interfaces.nsIDOMParser);
        } else if ( window.DOMParser ){
		    return new DOMParser();
        } else if ( window.ActiveXObject ) {
            return new ActiveXObject( "Microsoft.XMLDOM" );
        } else {
            return false;
	    }
	},
    /**
    * Returns a hash of headers and values
    **
    ** @@ Bug: Assumes that each header only occurs once
    ** Also note that a , in a header value is just the same as having two headers.
     */
	'getHTTPHeaders': function (xhr) {
	    var lines = xhr.getAllResponseHeaders().split("\n")
	    var headers = {}
	    var last = undefined
	    for (var x=0; x<lines.length; x++) {
            if (lines[x].length > 0) {
                var pair = lines[x].split(': ')
                if (typeof pair[1] == "undefined") { // continuation
                    headers[last] += "\n"+pair[0]
                } else {
                    last = pair[0].toLowerCase()
                    headers[last] = pair[1]
                }
            }
	    }
	    return headers
	},
    
    'dtstamp': function () {
	    var now = new Date();
	    var year  = now.getYear() + 1900;
	    var month = now.getMonth() + 1;
	    var day  = now.getDate();
	    var hour = now.getUTCHours();
	    var minute = now.getUTCMinutes();
	    var second = now.getSeconds();
	    if (month < 10) month = "0" + month;
	    if (day < 10) day = "0" + day;
	    if (hour < 10) hour = "0" + hour;
	    if (minute < 10) minute = "0" + minute;
	    if (second < 10) second = "0" + second;
	    return year + "-" + month + "-" + day + "T"
            + hour + ":" + minute + ":" + second + "Z";
	},
    
    'enablePrivilege': ((typeof netscape != 'undefined') && netscape.security.PrivilegeManager.enablePrivilege) || function() { return; },
    'disablePrivilege': ((typeof netscape != 'undefined') && netscape.security.PrivilegeManager.disablePrivilege) || function() { return; },



    'RDFArrayRemove': function(a, x) {  //removes all statements equal to x from a
        for(var i=0; i<a.length; i++) {
            //TODO: This used to be the following, which didnt always work..why
            //if(a[i] == x)
            if (a[i].subject.sameTerm( x.subject ) && 
                a[i].predicate.sameTerm( x.predicate ) && 
                a[i].object.sameTerm( x.object ) &&
                a[i].why.sameTerm( x.why )) {
                a.splice(i,1);
                return;
            }
        }
        throw "RDFArrayRemove: Array did not contain " + x;
    },

    'string_startswith': function(str, pref) { // missing library routines
        return (str.slice(0, pref.length) == pref);
    },

    // This is the callback from the kb to the fetcher which is used to 
    // load ontologies of the data we load.
    'AJAR_handleNewTerm': function(kb, p, requestedBy) {
        var sf = null;
        if( typeof kb.sf != 'undefined' ) {
            sf = kb.sf;
        } else {
            return;
        }
        if (p.termType != 'symbol') return;
        var docuri = $rdf.Util.uri.docpart(p.uri);
        var fixuri;
        if (p.uri.indexOf('#') < 0) { // No hash
            
            // @@ major hack for dbpedia Categories, which spread indefinitely
            if ($rdf.Util.string_startswith(p.uri, 'http://dbpedia.org/resource/Category:')) return;  
            
            /*
              if (string_startswith(p.uri, 'http://xmlns.com/foaf/0.1/')) {
              fixuri = "http://dig.csail.mit.edu/2005/ajar/ajaw/test/foaf"
              // should give HTTP 303 to ontology -- now is :-)
              } else
            */
            if ($rdf.Util.string_startswith(p.uri, 'http://purl.org/dc/elements/1.1/')
                || $rdf.Util.string_startswith(p.uri, 'http://purl.org/dc/terms/')) {
                fixuri = "http://dublincore.org/2005/06/13/dcq";
                //dc fetched multiple times
            } else if ($rdf.Util.string_startswith(p.uri, 'http://xmlns.com/wot/0.1/')) {
            fixuri = "http://xmlns.com/wot/0.1/index.rdf";
            } else if ($rdf.Util.string_startswith(p.uri, 'http://web.resource.org/cc/')) {
                //            $rdf.log.warn("creative commons links to html instead of rdf. doesn't seem to content-negotiate.");
                fixuri = "http://web.resource.org/cc/schema.rdf";
            }
        }
        if (fixuri) {
            docuri = fixuri
        }
        if (sf && sf.getState(docuri) != 'unrequested') return;
        
        if (fixuri) {   // only give warning once: else happens too often
            $rdf.log.warn("Assuming server still broken, faking redirect of <" + p.uri +
                               "> to <" + docuri + ">")	
                }
        sf.requestURI(docuri, requestedBy);
    }, //AJAR_handleNewTerm
    'ArrayIndexOf': function(arr, item, i) {
        i || (i = 0);
        var length = arr.length;
        if (i < 0) i = length + i;
        for (; i < length; i++)
            if (arr[i] === item) return i;
        return -1;
    }
    
};

//////////////////////String Utility
// substitutes given terms for occurrnces of %s
// not well named. Used??? - tim
//
$rdf.Util.string = {
    //C++, python style %s -> subs
    'template': function(base, subs){
        var baseA = base.split("%s");
        var result = "";
        for (var i=0;i<subs.length;i++){
            subs[i] += '';
            result += baseA[i] + subs[i];
        }
        return result + baseA.slice(subs.length).join(); 
    }
};

// from http://dev.jquery.com/browser/trunk/jquery/src/core.js
// Overlap with JQuery -- we try to keep the rdflib.js and jquery libraries separate at the moment.
$rdf.Util.extend = function () {
    // copy reference to target object
    var target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false,
        options, name, src, copy;

    // Handle a deep copy situation
    if (typeof target === "boolean") {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && !jQuery.isFunction(target)) {
        target = {};
    }

    // extend jQuery itself if only one argument is passed
    if (length === i) {
        target = this;
        --i;
    }

    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop
                if (target === copy) {
                    continue;
                }

                // Recurse if we're merging object values
                if (deep && copy && typeof copy === "object" && !copy.nodeType) {
                    var clone;

                    if (src) {
                        clone = src;
                    } else if (jQuery.isArray(copy)) {
                        clone = [];
                    } else if (jQuery.isObject(copy)) {
                        clone = {};
                    } else {
                        clone = copy;
                    }

                    // Never move original objects, clone them
                    target[name] = jQuery.extend(deep, clone, copy);

                    // Don't bring in undefined values
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
};





//  Implementing URI-specific functions
//
//	See RFC 2386
//
// This is or was   http://www.w3.org/2005/10/ajaw/uri.js
// 2005 W3C open source licence
//
//
//  Take a URI given in relative or absolute form and a base
//  URI, and return an absolute URI
//
//  See also http://www.w3.org/2000/10/swap/uripath.py
//

if (typeof $rdf.Util.uri == "undefined") { $rdf.Util.uri = {}; };

$rdf.Util.uri.join = function (given, base) {
    // if (typeof $rdf.log.debug != 'undefined') $rdf.log.debug("   URI given="+given+" base="+base)
    var baseHash = base.indexOf('#')
    if (baseHash > 0) base = base.slice(0, baseHash)
    if (given.length==0) return base // before chopping its filename off
    if (given.indexOf('#')==0) return base + given
    var colon = given.indexOf(':')
    if (colon >= 0) return given	// Absolute URI form overrides base URI
    var baseColon = base.indexOf(':')
    if (base == "") return given;
    if (baseColon < 0) {
        alert("Invalid base: "+ base + ' in join with ' +given);
        return given
    }
    var baseScheme = base.slice(0,baseColon+1)  // eg http:
    if (given.indexOf("//") == 0)     // Starts with //
	return baseScheme + given;
    if (base.indexOf('//', baseColon)==baseColon+1) {  // Any hostpart?
	    var baseSingle = base.indexOf("/", baseColon+3)
	if (baseSingle < 0) {
	    if (base.length-baseColon-3 > 0) {
		return base + "/" + given
	    } else {
		return baseScheme + given
	    }
	}
    } else {
	var baseSingle = base.indexOf("/", baseColon+1)
	if (baseSingle < 0) {
	    if (base.length-baseColon-1 > 0) {
		return base + "/" + given
	    } else {
		return baseScheme + given
	    }
	}
    }

    if (given.indexOf('/') == 0)	// starts with / but not //
	return base.slice(0, baseSingle) + given
    
    var path = base.slice(baseSingle)
    var lastSlash = path.lastIndexOf("/")
    if (lastSlash <0) return baseScheme + given
    if ((lastSlash >=0) && (lastSlash < (path.length-1)))
	path = path.slice(0, lastSlash+1) // Chop trailing filename from base
    
    path = path + given
    while (path.match(/[^\/]*\/\.\.\//)) // must apply to result of prev
	path = path.replace( /[^\/]*\/\.\.\//, '') // ECMAscript spec 7.8.5
    path = path.replace( /\.\//g, '') // spec vague on escaping
    path = path.replace( /\/\.$/, '/' )
    return base.slice(0, baseSingle) + path
}

if (tabulator.isExtension) {
    $rdf.Util.uri.join2 = function (given, base){
        var tIOService = Components.classes['@mozilla.org/network/io-service;1']
                        .getService(Components.interfaces.nsIIOService);

        var baseURI = tIOService.newURI(base, null, null);
        return tIOService.newURI(baseURI.resolve(given), null, null).spec;
    }
} else
    $rdf.Util.uri.join2 = $rdf.Util.uri.join;
    
//  refTo:    Make a URI relative to a given base
//
// based on code in http://www.w3.org/2000/10/swap/uripath.py
//
$rdf.Util.uri.commonHost = new RegExp("^[-_a-zA-Z0-9.]+:(//[^/]*)?/[^/]*$");
$rdf.Util.uri.refTo = function(base, uri) {
    if (!base) return uri;
    if (base == uri) return "";
    var i =0; // How much are they identical?
    while (i<uri.length && i < base.length)
        if (uri[i] == base[i]) i++;
        else break;
    if (base.slice(0,i).match($rdf.Util.uri.commonHost)) {
        var k = uri.indexOf('//');
        if (k<0) k=-2; // no host
        var l = uri.indexOf('/', k+2);   // First *single* slash
        if (uri.slice(l+1, l+2) != '/' && base.slice(l+1, l+2) != '/'
                           && uri.slice(0,l) == base.slice(0,l)) // common path to single slash
            return uri.slice(l); // but no other common path segments
    }
     // fragment of base?
    if (uri.slice(i, i+1) == '#' && base.length == i) return uri.slice(i);
    while (i>0 && uri[i-1] != '/') i--;

    if (i<3) return uri; // No way
    if ((base.indexOf('//', i-2) > 0) || uri.indexOf('//', i-2) > 0)
        return uri; // an unshared '//'
    if (base.indexOf(':', i) >0) return uri; // unshared ':'
    var n = 0;
    for (var j=i; j<base.length; j++) if (base[j]=='/') n++;
    if (n==0 && i < uri.length && uri[i] =='#') return './' + uri.slice(i);
    if (n==0 && i == uri.length) return './';
    var str = '';
    for (var j=0; j<n; j++) str+= '../';
    return str + uri.slice(i);
}


/** returns URI without the frag **/
$rdf.Util.uri.docpart = function (uri) {
    var i = uri.indexOf("#")
    if (i < 0) return uri
    return uri.slice(0,i)
} 

/** The document in which something a thing defined  **/
$rdf.Util.uri.document = function (x) {
    return $rdf.sym($rdf.Util.uri.docpart(x.uri));
} 

/** return the protocol of a uri **/
/** return null if there isn't one **/
$rdf.Util.uri.protocol = function (uri) {
    var index = uri.indexOf(':');
    if (index >= 0)
        return uri.slice(0, index);
    else
        return null;
} //protocol

//ends
// These are the classes corresponding to the RDF and N3 data models
//
// Designed to look like rdflib and cwm designs.
//
// Issues: Should the names start with RDF to make them
//      unique as program-wide symbols?
//
// W3C open source licence 2005.
//

//	Symbol

$rdf.Empty = function() {
	return this;
};

$rdf.Empty.prototype.termType = 'empty';
$rdf.Empty.prototype.toString = function () { return "()" };
$rdf.Empty.prototype.toNT = $rdf.Empty.prototype.toString;

$rdf.Symbol = function( uri ) {
    this.uri = uri;
    this.value = uri;   // -- why? -tim
    return this;
}

$rdf.Symbol.prototype.termType = 'symbol';
$rdf.Symbol.prototype.toString = function () { return ("<" + this.uri + ">"); };
$rdf.Symbol.prototype.toNT = $rdf.Symbol.prototype.toString;

//  Some precalculated symbols
$rdf.Symbol.prototype.XSDboolean = new $rdf.Symbol('http://www.w3.org/2001/XMLSchema#boolean');
$rdf.Symbol.prototype.XSDdecimal = new $rdf.Symbol('http://www.w3.org/2001/XMLSchema#decimal');
$rdf.Symbol.prototype.XSDfloat = new $rdf.Symbol('http://www.w3.org/2001/XMLSchema#float');
$rdf.Symbol.prototype.XSDinteger = new $rdf.Symbol('http://www.w3.org/2001/XMLSchema#integer');
$rdf.Symbol.prototype.XSDdateTime = new $rdf.Symbol('http://www.w3.org/2001/XMLSchema#dateTime');
$rdf.Symbol.prototype.integer = new $rdf.Symbol('http://www.w3.org/2001/XMLSchema#integer'); // Used?

//	Blank Node

if (typeof $rdf.NextId != 'undefined') {
    $rdf.log.error('Attempt to re-zero existing blank node id counter at '+$rdf.NextId);
} else {
    $rdf.NextId = 0;  // Global genid
}
$rdf.NTAnonymousNodePrefix = "_:n";

$rdf.BlankNode = function ( id ) {
    /*if (id)
    	this.id = id;
    else*/
    this.id = $rdf.NextId++
    this.value = id ? id : this.id.toString();
    return this
};

$rdf.BlankNode.prototype.termType = 'bnode';
$rdf.BlankNode.prototype.toNT = function() {
    return $rdf.NTAnonymousNodePrefix + this.id
};
$rdf.BlankNode.prototype.toString = $rdf.BlankNode.prototype.toNT;

//	Literal

$rdf.Literal = function (value, lang, datatype) {
    this.value = value
    if (lang == "" || lang == null) this.lang = undefined;
    else this.lang = lang;	  // string
    if (datatype == null) this.datatype = undefined;
    else this.datatype = datatype;  // term
    return this;
}

$rdf.Literal.prototype.termType = 'literal'    
$rdf.Literal.prototype.toString = function() {
    return ''+this.value;
};
$rdf.Literal.prototype.toNT = function() {
    var str = this.value
    if (typeof str != 'string') {
        if (typeof str == 'number') return ''+str;
	throw Error("Value of RDF literal is not string: "+str)
    }
    str = str.replace(/\\/g, '\\\\');  // escape backslashes
    str = str.replace(/\"/g, '\\"');    // escape quotes
    str = str.replace(/\n/g, '\\n');    // escape newlines
    str = '"' + str + '"'  //';

    if (this.datatype){
        str = str + '^^' + this.datatype.toNT()
    }
    if (this.lang) {
        str = str + "@" + this.lang;
    }
    return str;
};

$rdf.Collection = function() {
    this.id = $rdf.NextId++;  // Why need an id? For hashstring.
    this.elements = [];
    this.closed = false;
};

$rdf.Collection.prototype.termType = 'collection';

$rdf.Collection.prototype.toNT = function() {
    return $rdf.NTAnonymousNodePrefix + this.id
};

$rdf.Collection.prototype.toString = function() {
    var str='(';
    for (var i=0; i<this.elements.length; i++)
        str+= this.elements[i] + ' ';
    return str + ')';
};

$rdf.Collection.prototype.append = function (el) {
    this.elements.push(el)
}
$rdf.Collection.prototype.unshift=function(el){
    this.elements.unshift(el);
}
$rdf.Collection.prototype.shift=function(){
    return this.elements.shift();
}
        
$rdf.Collection.prototype.close = function () {
    this.closed = true
}


//      Convert Javascript representation to RDF term object
//
$rdf.term = function(val) {
    if (typeof val == 'object')
        if (val instanceof Date) {
            var d2=function(x) {return(''+(100+x)).slice(1,3)};  // format as just two digits
            return new $rdf.Literal(
                    ''+ val.getUTCFullYear() + '-'+
                    d2(val.getUTCMonth()+1) +'-'+d2(val.getUTCDate())+
                    'T'+d2(val.getUTCHours())+':'+d2(val.getUTCMinutes())+
                    ':'+d2(val.getUTCSeconds())+'Z',
            undefined, $rdf.Symbol.prototype.XSDdateTime);

        }
        else if (val instanceof Array) {
            var x = new $rdf.Collection();
            for (var i=0; i<val.length; i++) x.append($rdf.term(val[i]));
            return x;
        }
        else return val;
    if (typeof val == 'string') return new $rdf.Literal(val);
    if (typeof val == 'number') {
        var dt;
        if ((''+val).indexOf('e')>=0) dt = $rdf.Symbol.prototype.XSDfloat;
        else if ((''+val).indexOf('.')>=0) dt = $rdf.Symbol.prototype.XSDdecimal;
        else dt = $rdf.Symbol.prototype.XSDinteger;
        return new $rdf.Literal(val, undefined, dt);
    }
    if (typeof val == 'boolean') return new $rdf.Literal(val?"1":"0", undefined, 
                                                       $rdf.Symbol.prototype.XSDboolean);
    if (typeof val == 'undefined') return undefined;
    throw ("Can't make term from " + val + " of type " + typeof val);
}

//	Statement
//
//  This is a triple with an optional reason.
//
//   The reason can point to provenece or inference
//

$rdf.Statement = function(subject, predicate, object, why) {
    this.subject = $rdf.term(subject)
    this.predicate = $rdf.term(predicate)
    this.object = $rdf.term(object)
    if (typeof why !='undefined') {
        this.why = why;
    }
    return this;
}

$rdf.st= function(subject, predicate, object, why) {
    return new $rdf.Statement(subject, predicate, object, why);
};

$rdf.Statement.prototype.toNT = function() {
    return (this.subject.toNT() + " "
            + this.predicate.toNT() + " "
            +  this.object.toNT() +" .");
};

$rdf.Statement.prototype.toString = $rdf.Statement.prototype.toNT;

//	Formula
//
//	Set of statements.

$rdf.Formula = function() {
    this.statements = []
    this.constraints = []
    this.initBindings = []
    this.optional = []
    return this;
};


$rdf.Formula.prototype.termType = 'formula';
$rdf.Formula.prototype.toNT = function() {
    return "{" + this.statements.join('\n') + "}"
};
$rdf.Formula.prototype.toString = $rdf.Formula.prototype.toNT;

$rdf.Formula.prototype.add = function(subj, pred, obj, why) {
    this.statements.push(new $rdf.Statement(subj, pred, obj, why))
}

// Convenience methods on a formula allow the creation of new RDF terms:

$rdf.Formula.prototype.sym = function(uri,name) {
    if (name != null) {
        throw "This feature (kb.sym with 2 args) is removed. Do not assume prefix mappings."
        if (!$rdf.ns[uri]) throw 'The prefix "'+uri+'" is not set in the API';
        uri = $rdf.ns[uri] + name
    }
    return new $rdf.Symbol(uri)
}

$rdf.sym = function(uri) { return new $rdf.Symbol(uri); };

$rdf.Formula.prototype.literal = function(val, lang, dt) {
    return new $rdf.Literal(val.toString(), lang, dt)
}
$rdf.lit = $rdf.Formula.prototype.literal;

$rdf.Formula.prototype.bnode = function(id) {
    return new $rdf.BlankNode(id)
}

$rdf.Formula.prototype.formula = function() {
    return new $rdf.Formula()
}

$rdf.Formula.prototype.collection = function () { // obsolete
    return new $rdf.Collection()
}

$rdf.Formula.prototype.list = function (values) {
    li = new $rdf.Collection();
    if (values) {
        for(var i = 0; i<values.length; i++) {
            li.append(values[i]);
        }
    }
    return li;
}

/*  Variable
**
** Variables are placeholders used in patterns to be matched.
** In cwm they are symbols which are the formula's list of quantified variables.
** In sparl they are not visibily URIs.  Here we compromise, by having
** a common special base URI for variables. Their names are uris,
** but the ? nottaion has an implicit base uri of 'varid:'
*/

$rdf.Variable = function(rel) {
    this.base = "varid:"; // We deem variabe x to be the symbol varid:x 
    this.uri = $rdf.Util.uri.join(rel, this.base);
    return this;
}

$rdf.Variable.prototype.termType = 'variable';
$rdf.Variable.prototype.toNT = function() {
    if (this.uri.slice(0, this.base.length) == this.base) {
	return '?'+ this.uri.slice(this.base.length);} // @@ poor man's refTo
    return '?' + this.uri;
};

$rdf.Variable.prototype.toString = $rdf.Variable.prototype.toNT;
$rdf.Variable.prototype.classOrder = 7;

$rdf.variable = $rdf.Formula.prototype.variable = function(name) {
    return new $rdf.Variable(name);
};

$rdf.Variable.prototype.hashString = $rdf.Variable.prototype.toNT;


// The namespace function generator 

$rdf.Namespace = function (nsuri) {
    return function(ln) { return new $rdf.Symbol(nsuri+(ln===undefined?'':ln)) }
}

$rdf.Formula.prototype.ns = function(nsuri) {
    return function(ln) { return new $rdf.Symbol(nsuri+(ln===undefined?'':ln)) }
}


// Parse a single token
//
// The bnode bit should not be used on program-external values; designed
// for internal work such as storing a bnode id in an HTML attribute.
// This will only parse the strings generated by the vaious toNT() methods.

$rdf.Formula.prototype.fromNT = function(str) {
    var len = str.length
    var ch = str.slice(0,1)
    if (ch == '<') return $rdf.sym(str.slice(1,len-1))
    if (ch == '"') {
        var lang = undefined;
        var dt = undefined;
        var k = str.lastIndexOf('"');
        if (k < len-1) {
            if (str[k+1] == '@') lang = str.slice(k+2,len);
            else if (str.slice(k+1,k+3) == '^^') dt = $rdf.fromNT(str.slice(k+3,len));
            else throw "Can't convert string from NT: "+str
        }
        var str = (str.slice(1,k));
        str = str.replace(/\\"/g, '"');    // unescape quotes '
        str = str.replace(/\\n/g, '\n');    // unescape newlines
        str = str.replace(/\\\\/g, '\\');  // unescape backslashes 
        return $rdf.lit(str, lang, dt);
    }
    if (ch == '_') {
	var x = new $rdf.BlankNode();
	x.id = parseInt(str.slice(3));
	$rdf.NextId--
	return x
    }
    if (ch == '?') {
        var x = new $rdf.Variable(str.slice(1));
        return x;
    }
    throw "Can't convert from NT: "+str;
    
}
$rdf.fromNT = $rdf.Formula.prototype.fromNT; // Not for inexpert user

// Convenience - and more conventional name:

$rdf.graph = function(){return new $rdf.IndexedFormula();};

// ends
// Matching a statement against a formula
//
//
// W3C open source licence 2005.
//
// We retpresent a set as an associative array whose value for
// each member is set to true.


$rdf.Symbol.prototype.sameTerm = function(other) {
    if (!other) { return false }
    return ((this.termType == other.termType) && (this.uri == other.uri))
}

$rdf.BlankNode.prototype.sameTerm = function(other) {
    if (!other) { return false }
    return ((this.termType == other.termType) && (this.id == other.id))
}

$rdf.Literal.prototype.sameTerm = function(other) {
    if (!other) { return false }
    return ((this.termType == other.termType)
	    && (this.value == other.value)
	    && (this.lang == other.lang) &&
	    ((!this.datatype && !other.datatype)
	     || (this.datatype && this.datatype.sameTerm(other.datatype))))
}

$rdf.Variable.prototype.sameTerm = function (other) {
    if (!other) { return false }
    return((this.termType == other.termType) && (this.uri == other.uri))
}

$rdf.Collection.prototype.sameTerm = $rdf.BlankNode.prototype.sameTerm

$rdf.Formula.prototype.sameTerm = function (other) {
    return this.hashString() == other.hashString();
}
//  Comparison for ordering
//
// These compare with ANY term
//
//
// When we smush nodes we take the lowest value. This is not
// arbitrary: we want the value actually used to be the literal
// (or list or formula). 

$rdf.Literal.prototype.classOrder = 1
$rdf.Collection.prototype.classOrder = 3
$rdf.Formula.prototype.classOrder = 4
$rdf.Symbol.prototype.classOrder = 5
$rdf.BlankNode.prototype.classOrder = 6

//  Compaisons return  sign(self - other)
//  Literals must come out before terms for smushing

$rdf.Literal.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) return -1
    if (this.classOrder > other.classOrder) return +1
    if (this.value < other.value) return -1
    if (this.value > other.value) return +1
    return 0
} 

$rdf.Symbol.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) return -1
    if (this.classOrder > other.classOrder) return +1
    if (this.uri < other.uri) return -1
    if (this.uri > other.uri) return +1
    return 0
} 

$rdf.BlankNode.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) return -1
    if (this.classOrder > other.classOrder) return +1
    if (this.id < other.id) return -1
    if (this.id > other.id) return +1
    return 0
} 

$rdf.Collection.prototype.compareTerm = $rdf.BlankNode.prototype.compareTerm

//  Convenience routines

// Only one of s p o can be undefined, and w is optional.
$rdf.Formula.prototype.each = function(s,p,o,w) {
    var results = []
    var st, sts = this.statementsMatching(s,p,o,w,false)
    var i, n=sts.length
    if (typeof s == 'undefined') {
	for (i=0; i<n; i++) {st=sts[i]; results.push(st.subject)}
    } else if (typeof p == 'undefined') {
	for (i=0; i<n; i++) {st=sts[i]; results.push(st.predicate)}
    } else if (typeof o == 'undefined') {
	for (i=0; i<n; i++) {st=sts[i]; results.push(st.object)}
    } else if (typeof w == 'undefined') {
	for (i=0; i<n; i++) {st=sts[i]; results.push(st.why)}
    }
    return results
}

$rdf.Formula.prototype.any = function(s,p,o,w) {
    var st = this.anyStatementMatching(s,p,o,w)
    if (typeof st == 'undefined') return undefined;
    
    if (typeof s == 'undefined') return st.subject;
    if (typeof p == 'undefined') return st.predicate;
    if (typeof o == 'undefined') return st.object;

    return undefined
}

$rdf.Formula.prototype.holds = function(s,p,o,w) {
    var st = this.anyStatementMatching(s,p,o,w)
    if (typeof st == 'undefined') return false;
    return true;
}

$rdf.Formula.prototype.the = function(s,p,o,w) {
    // the() should contain a check there is only one
    var x = this.any(s,p,o,w)
    if (typeof x == 'undefined')
	$rdf.log.error("No value found for the(){" + s + " " + p + " " + o + "}.")
    return x
}

$rdf.Formula.prototype.whether = function(s,p,o,w) {
    return this.statementsMatching(s,p,o,w,false).length;
}
/**
 * @fileoverview
 * TABULATOR RDF PARSER
 *
 * Version 0.1
 *  Parser believed to be in full positive RDF/XML parsing compliance
 *  with the possible exception of handling deprecated RDF attributes
 *  appropriately. Parser is believed to comply fully with other W3C
 *  and industry standards where appropriate (DOM, ECMAScript, &c.)
 *
 *  Author: David Sheets <dsheets@mit.edu>
 *  SVN ID: $Id$
 *
 * W3C® SOFTWARE NOTICE AND LICENSE
 * http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231
 * This work (and included software, documentation such as READMEs, or
 * other related items) is being provided by the copyright holders under
 * the following license. By obtaining, using and/or copying this work,
 * you (the licensee) agree that you have read, understood, and will
 * comply with the following terms and conditions.
 * 
 * Permission to copy, modify, and distribute this software and its
 * documentation, with or without modification, for any purpose and
 * without fee or royalty is hereby granted, provided that you include
 * the following on ALL copies of the software and documentation or
 * portions thereof, including modifications:
 * 
 * 1. The full text of this NOTICE in a location viewable to users of
 * the redistributed or derivative work.
 * 2. Any pre-existing intellectual property disclaimers, notices, or terms and
 * conditions. If none exist, the W3C Software Short Notice should be
 * included (hypertext is preferred, text is permitted) within the body
 * of any redistributed or derivative code.
 * 3. Notice of any changes or modifications to the files, including the
 * date changes were made. (We recommend you provide URIs to the location
 * from which the code is derived.)
 * 
 * THIS SOFTWARE AND DOCUMENTATION IS PROVIDED "AS IS," AND COPYRIGHT
 * HOLDERS MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR FITNESS
 * FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR
 * DOCUMENTATION WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS,
 * TRADEMARKS OR OTHER RIGHTS.
 * 
 * COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL
 * OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR
 * DOCUMENTATION.
 * 
 * The name and trademarks of copyright holders may NOT be used in
 * advertising or publicity pertaining to the software without specific,
 * written prior permission. Title to copyright in this software and any
 * associated documentation will at all times remain with copyright
 * holders.
 */
/**
 * @class Class defining an RDFParser resource object tied to an RDFStore
 *  
 * @author David Sheets <dsheets@mit.edu>
 * @version 0.1
 * 
 * @constructor
 * @param {RDFStore} store An RDFStore object
 */
$rdf.RDFParser = function (store) {
    var RDFParser = {};

    /** Standard namespaces that we know how to handle @final
     *  @member RDFParser
     */
    RDFParser['ns'] = {'RDF':
		       "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
		       'RDFS':
		       "http://www.w3.org/2000/01/rdf-schema#"}
    /** DOM Level 2 node type magic numbers @final
     *  @member RDFParser
     */
    RDFParser['nodeType'] = {'ELEMENT': 1, 'ATTRIBUTE': 2, 'TEXT': 3,
			     'CDATA_SECTION': 4, 'ENTITY_REFERENCE': 5,
			     'ENTITY': 6, 'PROCESSING_INSTRUCTION': 7,
			     'COMMENT': 8, 'DOCUMENT': 9, 'DOCUMENT_TYPE': 10,
			     'DOCUMENT_FRAGMENT': 11, 'NOTATION': 12}

    /**
     * Frame class for namespace and base URI lookups
     * Base lookups will always resolve because the parser knows
     * the default base.
     *
     * @private
     */
    this['frameFactory'] = function (parser, parent, element) {
	return {'NODE': 1,
		'ARC': 2,
		'parent': parent,
		'parser': parser,
		'store': parser['store'],
		'element': element,
		'lastChild': 0,
		'base': null,
		'lang': null,
		'node': null,
		'nodeType': null,
		'listIndex': 1,
		'rdfid': null,
		'datatype': null,
		'collection': false,

	/** Terminate the frame and notify the store that we're done */
		'terminateFrame': function () {
		    if (this['collection']) {
			this['node']['close']()
		    }
		},
	
	/** Add a symbol of a certain type to the this frame */
		'addSymbol': function (type, uri) {
		    uri = $rdf.Util.uri.join(uri, this['base'])
		    this['node'] = this['store']['sym'](uri)
		    this['nodeType'] = type
		},
	
	/** Load any constructed triples into the store */
		'loadTriple': function () {
		    if (this['parent']['parent']['collection']) {
			this['parent']['parent']['node']['append'](this['node'])
		    }
		    else {
			this['store']['add'](this['parent']['parent']['node'],
				       this['parent']['node'],
				       this['node'],
				       this['parser']['why'])
		    }
		    if (this['parent']['rdfid'] != null) { // reify
			var triple = this['store']['sym'](
			    $rdf.Util.uri.join("#"+this['parent']['rdfid'],
					  this['base']))
			this['store']['add'](triple,
					     this['store']['sym'](
						 RDFParser['ns']['RDF']
						     +"type"),
					     this['store']['sym'](
						 RDFParser['ns']['RDF']
						     +"Statement"),
					     this['parser']['why'])
			this['store']['add'](triple,
					     this['store']['sym'](
						 RDFParser['ns']['RDF']
						     +"subject"),
					     this['parent']['parent']['node'],
					     this['parser']['why'])
			this['store']['add'](triple,
					     this['store']['sym'](
						 RDFParser['ns']['RDF']
						     +"predicate"),
					     this['parent']['node'],
					     this['parser']['why'])
			this['store']['add'](triple,
					     this['store']['sym'](
						 RDFParser['ns']['RDF']
						     +"object"),
					     this['node'],
					     this['parser']['why'])
		    }
		},

	/** Check if it's OK to load a triple */
		'isTripleToLoad': function () {
		    return (this['parent'] != null
			    && this['parent']['parent'] != null
			    && this['nodeType'] == this['NODE']
			    && this['parent']['nodeType'] == this['ARC']
			    && this['parent']['parent']['nodeType']
			    == this['NODE'])
		},

	/** Add a symbolic node to this frame */
		'addNode': function (uri) {
		    this['addSymbol'](this['NODE'],uri)
		    if (this['isTripleToLoad']()) {
			this['loadTriple']()
		    }
		},

	/** Add a collection node to this frame */
		'addCollection': function () {
		    this['nodeType'] = this['NODE']
		    this['node'] = this['store']['collection']()
		    this['collection'] = true
		    if (this['isTripleToLoad']()) {
			this['loadTriple']()
		    }
		},

	/** Add a collection arc to this frame */
		'addCollectionArc': function () {
		    this['nodeType'] = this['ARC']
		},

	/** Add a bnode to this frame */
		'addBNode': function (id) {
		    if (id != null) {
			if (this['parser']['bnodes'][id] != null) {
			    this['node'] = this['parser']['bnodes'][id]
			} else {
			    this['node'] = this['parser']['bnodes'][id] = this['store']['bnode']()
			}
		    } else { this['node'] = this['store']['bnode']() }
		    
		    this['nodeType'] = this['NODE']
		    if (this['isTripleToLoad']()) {
			this['loadTriple']()
		    }
		},

	/** Add an arc or property to this frame */
		'addArc': function (uri) {
		    if (uri == RDFParser['ns']['RDF']+"li") {
			uri = RDFParser['ns']['RDF']+"_"+this['parent']['listIndex']++
		    }
		    this['addSymbol'](this['ARC'], uri)
		},

	/** Add a literal to this frame */
		'addLiteral': function (value) {
		    if (this['parent']['datatype']) {
			this['node'] = this['store']['literal'](
			    value, "", this['store']['sym'](
				this['parent']['datatype']))
		    }
		    else {
			this['node'] = this['store']['literal'](
			    value, this['lang'])
		    }
		    this['nodeType'] = this['NODE']
		    if (this['isTripleToLoad']()) {
			this['loadTriple']()
		    }
		}
	       }
    }

    //from the OpenLayers source .. needed to get around IE problems.
    this['getAttributeNodeNS'] = function(node, uri, name) {
        var attributeNode = null;
        if(node.getAttributeNodeNS) {
            attributeNode = node.getAttributeNodeNS(uri, name);
        } else {
            var attributes = node.attributes;
            var potentialNode, fullName;
            for(var i=0; i<attributes.length; ++i) {
                potentialNode = attributes[i];
                if(potentialNode.namespaceURI == uri) {
                    fullName = (potentialNode.prefix) ?
                               (potentialNode.prefix + ":" + name) : name;
                    if(fullName == potentialNode.nodeName) {
                        attributeNode = potentialNode;
                        break;
                    }
                }
            }
        }
        return attributeNode;
    }

    /** Our triple store reference @private */
    this['store'] = store
    /** Our identified blank nodes @private */
    this['bnodes'] = {}
    /** A context for context-aware stores @private */
    this['why'] = null
    /** Reification flag */
    this['reify'] = false

    /**
     * Build our initial scope frame and parse the DOM into triples
     * @param {DOMTree} document The DOM to parse
     * @param {String} base The base URL to use 
     * @param {Object} why The context to which this resource belongs
     */
    this['parse'] = function (document, base, why) {
        // alert('parse base:'+base);
	var children = document['childNodes']

	// clean up for the next run
	this['cleanParser']()

	// figure out the root element
	//var root = document.documentElement; //this is faster, I think, cross-browser issue? well, DOM 2
	if (document['nodeType'] == RDFParser['nodeType']['DOCUMENT']) {
	    for (var c=0; c<children['length']; c++) {
		if (children[c]['nodeType']
		    == RDFParser['nodeType']['ELEMENT']) {
		    var root = children[c]
		    break
		}
	    }	    
	}
	else if (document['nodeType'] == RDFParser['nodeType']['ELEMENT']) {
	    var root = document
	}
	else {
	    throw new Error("RDFParser: can't find root in " + base
			    + ". Halting. ")
	    return false
	}
	
	this['why'] = why
        

	// our topmost frame

	var f = this['frameFactory'](this)
        this['base'] = base
	f['base'] = base
	f['lang'] = ''
	
	this['parseDOM'](this['buildFrame'](f,root))
	return true
    }
    this['parseDOM'] = function (frame) {
	// a DOM utility function used in parsing
	var elementURI = function (el) {
        var result = "";
            if (el['namespaceURI'] == null) {
                throw new Error("RDF/XML syntax error: No namespace for "
                            +el['localName']+" in "+this.base)
            }
        if( el['namespaceURI'] ) {
            result = result + el['namespaceURI'];
        }
        if( el['localName'] ) {
            result = result + el['localName'];
        } else if( el['nodeName'] ) {
            if(el['nodeName'].indexOf(":")>=0)
                result = result + el['nodeName'].split(":")[1];
            else
                result = result + el['nodeName'];
        }
	    return result;
	}
	var dig = true // if we'll dig down in the tree on the next iter

	while (frame['parent']) {
	    var dom = frame['element']
	    var attrs = dom['attributes']

	    if (dom['nodeType']
		== RDFParser['nodeType']['TEXT']
		|| dom['nodeType']
		== RDFParser['nodeType']['CDATA_SECTION']) {//we have a literal
		frame['addLiteral'](dom['nodeValue'])
	    }
	    else if (elementURI(dom)
		     != RDFParser['ns']['RDF']+"RDF") { // not root
		if (frame['parent'] && frame['parent']['collection']) {
		    // we're a collection element
		    frame['addCollectionArc']()
		    frame = this['buildFrame'](frame,frame['element'])
		    frame['parent']['element'] = null
		}
                if (!frame['parent'] || !frame['parent']['nodeType']
		    || frame['parent']['nodeType'] == frame['ARC']) {
		    // we need a node
            var about =this['getAttributeNodeNS'](dom,
			RDFParser['ns']['RDF'],"about")
		    var rdfid =this['getAttributeNodeNS'](dom,
			RDFParser['ns']['RDF'],"ID")
		    if (about && rdfid) {
			throw new Error("RDFParser: " + dom['nodeName']
					+ " has both rdf:id and rdf:about."
					+ " Halting. Only one of these"
					+ " properties may be specified on a"
					+ " node.");
		    }
		    if (about == null && rdfid) {
			frame['addNode']("#"+rdfid['nodeValue'])
			dom['removeAttributeNode'](rdfid)
		    }
		    else if (about == null && rdfid == null) {
                var bnid = this['getAttributeNodeNS'](dom,
			    RDFParser['ns']['RDF'],"nodeID")
			if (bnid) {
			    frame['addBNode'](bnid['nodeValue'])
			    dom['removeAttributeNode'](bnid)
			} else { frame['addBNode']() }
		    }
		    else {
			frame['addNode'](about['nodeValue'])
			dom['removeAttributeNode'](about)
		    }
		
		    // Typed nodes
		    var rdftype = this['getAttributeNodeNS'](dom,
			RDFParser['ns']['RDF'],"type")
		    if (RDFParser['ns']['RDF']+"Description"
			!= elementURI(dom)) {
			rdftype = {'nodeValue': elementURI(dom)}
		    }
		    if (rdftype != null) {
			this['store']['add'](frame['node'],
					     this['store']['sym'](
						 RDFParser['ns']['RDF']+"type"),
					     this['store']['sym'](
						 $rdf.Util.uri.join(
						     rdftype['nodeValue'],
						     frame['base'])),
					     this['why'])
			if (rdftype['nodeName']){
			    dom['removeAttributeNode'](rdftype)
			}
		    }
		    
		    // Property Attributes
		    for (var x = attrs['length']-1; x >= 0; x--) {
			this['store']['add'](frame['node'],
					     this['store']['sym'](
						 elementURI(attrs[x])),
					     this['store']['literal'](
						 attrs[x]['nodeValue'],
						 frame['lang']),
					     this['why'])
		    }
		}
		else { // we should add an arc (or implicit bnode+arc)
		    frame['addArc'](elementURI(dom))

		    // save the arc's rdf:ID if it has one
		    if (this['reify']) {
            var rdfid = this['getAttributeNodeNS'](dom,
			    RDFParser['ns']['RDF'],"ID")
			if (rdfid) {
			    frame['rdfid'] = rdfid['nodeValue']
			    dom['removeAttributeNode'](rdfid)
			}
		    }

		    var parsetype = this['getAttributeNodeNS'](dom,
			RDFParser['ns']['RDF'],"parseType")
		    var datatype = this['getAttributeNodeNS'](dom,
			RDFParser['ns']['RDF'],"datatype")
		    if (datatype) {
			frame['datatype'] = datatype['nodeValue']
			dom['removeAttributeNode'](datatype)
		    }

		    if (parsetype) {
			var nv = parsetype['nodeValue']
			if (nv == "Literal") {
			    frame['datatype']
				= RDFParser['ns']['RDF']+"XMLLiteral"
			    // (this.buildFrame(frame)).addLiteral(dom)
			    // should work but doesn't
			    frame = this['buildFrame'](frame)
			    frame['addLiteral'](dom)
			    dig = false
			}
			else if (nv == "Resource") {
			    frame = this['buildFrame'](frame,frame['element'])
			    frame['parent']['element'] = null
			    frame['addBNode']()
			}
			else if (nv == "Collection") {
			    frame = this['buildFrame'](frame,frame['element'])
			    frame['parent']['element'] = null
			    frame['addCollection']()
			}
			dom['removeAttributeNode'](parsetype)
		    }

		    if (attrs['length'] != 0) {
            var resource = this['getAttributeNodeNS'](dom,
			    RDFParser['ns']['RDF'],"resource")
			var bnid = this['getAttributeNodeNS'](dom,
			    RDFParser['ns']['RDF'],"nodeID")

			frame = this['buildFrame'](frame)
			if (resource) {
			    frame['addNode'](resource['nodeValue'])
			    dom['removeAttributeNode'](resource)
			} else {
			    if (bnid) {
				frame['addBNode'](bnid['nodeValue'])
				dom['removeAttributeNode'](bnid)
			    } else { frame['addBNode']() }
			}

			for (var x = attrs['length']-1; x >= 0; x--) {
			    var f = this['buildFrame'](frame)
			    f['addArc'](elementURI(attrs[x]))
			    if (elementURI(attrs[x])
				==RDFParser['ns']['RDF']+"type"){
				(this['buildFrame'](f))['addNode'](
				    attrs[x]['nodeValue'])
			    } else {
				(this['buildFrame'](f))['addLiteral'](
				    attrs[x]['nodeValue'])
			    }
			}
		    }
		    else if (dom['childNodes']['length'] == 0) {
			(this['buildFrame'](frame))['addLiteral']("")
		    }
		}
	    } // rdf:RDF

	    // dig dug
	    dom = frame['element']
	    while (frame['parent']) {
		var pframe = frame
		while (dom == null) {
		    frame = frame['parent']
		    dom = frame['element']
		}
		var candidate = dom['childNodes'][frame['lastChild']]
		if (candidate == null || !dig) {
		    frame['terminateFrame']()
		    if (!(frame = frame['parent'])) { break } // done
		    dom = frame['element']
		    dig = true
		}
		else if ((candidate['nodeType']
			  != RDFParser['nodeType']['ELEMENT']
			  && candidate['nodeType']
			  != RDFParser['nodeType']['TEXT']
			  && candidate['nodeType']
			  != RDFParser['nodeType']['CDATA_SECTION'])
			 || ((candidate['nodeType']
			      == RDFParser['nodeType']['TEXT']
			      || candidate['nodeType']
			      == RDFParser['nodeType']['CDATA_SECTION'])
			     && dom['childNodes']['length'] != 1)) {
		    frame['lastChild']++
		}
		else { // not a leaf
		    frame['lastChild']++
		    frame = this['buildFrame'](pframe,
					       dom['childNodes'][frame['lastChild']-1])
		    break
		}
	    }
	} // while
    }

    /**
     * Cleans out state from a previous parse run
     * @private
     */
    this['cleanParser'] = function () {
	this['bnodes'] = {}
	this['why'] = null
    }

    /**
     * Builds scope frame 
     * @private
     */
    this['buildFrame'] = function (parent, element) {
	var frame = this['frameFactory'](this,parent,element)
	if (parent) {
	    frame['base'] = parent['base']
	    frame['lang'] = parent['lang']
	}
	if (element == null
	    || element['nodeType'] == RDFParser['nodeType']['TEXT']
	    || element['nodeType'] == RDFParser['nodeType']['CDATA_SECTION']) {
	    return frame
	}

	var attrs = element['attributes']

	var base = element['getAttributeNode']("xml:base")
	if (base != null) {
	    frame['base'] = base['nodeValue']
	    element['removeAttribute']("xml:base")
	}
	var lang = element['getAttributeNode']("xml:lang")
	if (lang != null) {
	    frame['lang'] = lang['nodeValue']
	    element['removeAttribute']("xml:lang")
	}

	// remove all extraneous xml and xmlns attributes
	for (var x = attrs['length']-1; x >= 0; x--) {
	    if (attrs[x]['nodeName']['substr'](0,3) == "xml") {
                if (attrs[x].name.slice(0,6)=='xmlns:') {
                    var uri = attrs[x].nodeValue;
                    // alert('base for namespac attr:'+this.base);
                    if (this.base) uri = $rdf.Util.uri.join(uri, this.base);
                    this.store.setPrefixForURI(attrs[x].name.slice(6),
                                                uri);
                }
//		alert('rdfparser: xml atribute: '+attrs[x].name) //@@
		element['removeAttributeNode'](attrs[x])
	    }
	}
	return frame
    }
}
/*
 * jQuery RDFa @VERSION
 *                                U N T E S T E D      T R I A L    O N L Y
 *                                P O R T   I N   P R O G R E S S
 *
 * Copyright (c) 2008,2009 Jeni Tennison
 * Licensed under the MIT (MIT-LICENSE.txt)
 * 2010-06-11 Taken from http://code.google.com/p/rdfquery/source/checkout TBL
 * Callbacks for new triples removed -- should more logically be on the store
 * so as to make common for all sources
 *
 * Depends:
 *  uri.js
 *  term.js
 *  identity.js
 *  
 *  jquery.rdf.js
 */
/**
 * @fileOverview jQuery RDFa processing
 * @author <a href="mailto:jeni@jenitennison.com">Jeni Tennison</a>
 * @copyright (c) 2008,2009 Jeni Tennison
 * @license MIT license (MIT-LICENSE.txt)
 * @version 1.0
 * @requires jquery.uri.js
 * @requires jquery.xmlns.js
 * @requires jquery.curie.js
 * @requires jquery.datatype.js
 * @requires jquery.rdf.js
 */
 





/*
 * jQuery CURIE @VERSION
 * 
 * Copyright (c) 2008 Jeni Tennison
 * Licensed under the MIT (MIT-LICENSE.txt)
 *
 * Depends:
 *	jquery.uri.js
 *  jquery.xmlns.js
 */
/*global jQuery */

$rdf.curie = {};
$rdf.curie.parse = function (curie, options) {
    var
    opts = $rdf.extend({}, $rdf.curie.defaults, options || {}),
        m = /^(([^:]*):)?(.+)$/.exec(curie),
        prefix = m[2],
        local = m[3],
        ns = opts.namespaces[prefix];
    if (prefix) {
        if (ns === undefined) {
            throw "Malformed CURIE: No namespace binding for " + prefix + " in CURIE " + curie;
        }
    } else if (opts.reserved.length && $rdf.Util.inArray(curie, opts.reserved) >= 0) {
        ns = opts.reservedNamespace;
        local = curie;
    } else if (opts.defaultNamespace === undefined) {
        // the default namespace is provided by the application; it's not clear whether
        // the default XML namespace should be used if there's a colon but no prefix
        throw "Malformed CURIE: No prefix and no default namespace for unprefixed CURIE " + curie;
    } else {
        ns = opts.defaultNamespace;
    }
    return $rdf.sym(ns + local);
};

$rdf.curie.defaults = {
    namespaces: {},
    reserved: [],
    reservedNamespace: undefined,
    defaultNamespace: undefined
};

$rdf.curie.safeCurie = function (safeCurie, options) {
    var m = /^\[([^\]]+)\]$/.exec(safeCurie);
    return m ? $rdf.curie(m[1], options) : $rdf.sym(safeCurie);
};

$rdf.curie.createCurie = function (uri, options) {
    var opts = $rdf.extend({}, $rdf.curie.defaults, options || {}),
        ns = opts.namespaces,
        curie;
    uri = $rdf.sym(uri).toString();
    for (var prefix in ns) {
        var namespace = ns[prefix];
        if (uri.substring(0, namespace.toString().length) === namespace.toString()) {
            curie = prefix + ':' + uri.substring(namespace.toString().length);
            return null;
        }
    };
    if (curie === undefined) {
        throw "No Namespace Binding: There's no appropriate namespace binding for generating a CURIE from " + uri;
    } else {
        return curie;
    }
};

$rdf.curie = function (curie, options) {
    var opts = $rdf.extend({}, $rdf.curie.defaults, {
        namespaces: thisElement.xmlns()
    }, options || {});
    return $rdf.curie(curie, opts);
};

$rdf.safeCurie = function (safeCurie, options) {
    var opts = $rdf.extend({}, $rdf.curie.defaults, {
        namespaces: thisElement.xmlns()
    }, options || {});
    return $rdf.curie.safeCurie(safeCurie, opts);
};

$rdf.createCurie = function (uri, options) {
    var opts = $rdf.extend({}, $rdf.curie.defaults, {
        namespaces: thisElement.xmlns()
    }, options || {});
    return $rdf.curie.createCurie(uri, opts);
};

$rdf.curie.defaults = {
    reserved: ['alternate', 'appendix', 'bookmark', 'cite', 'chapter', 'contents', 'copyright', 'first', 'glossary', 'help', 'icon', 'index', 'last', 'license', 'meta', 'next', 'p3pv1', 'prev', 'role', 'section', 'stylesheet', 'subsection', 'start', 'top', 'up'],
    reservedNamespace: 'http://www.w3.org/1999/xhtml/vocab#',
    defaultNamespace: undefined
};

$rdf.safeCurie = function (safeCurie, options) {
    var opts = $rdf.extend({}, $rdf.curie.defaults, {
        namespaces: thisElement.xmlns()
    }, options || {});
    return $rdf.safeCurie(safeCurie, opts);
};



//////////////////////////////////////////////////////////////////////////////

$rdf.rdfa = {};

$rdf.rdfa.parse = function (dom, kb, baseUri, doc) {
    this.kb = kb;
    this.baseUri = baseUri;
    thisElement = dom;
 

// Agenda:
//    fn.curie.
//   docResource   (relies on database-wide document base)
//  Replace all $jq.rdf.   with equivalent $rdf.
//
//  Note: The original jQuery "$" is now $jq in this code.
////////////////////////////////////////////////////

  //if ($ == undefined && tabulator && tabulator.jq) $ = tabulator.jq; // not sure hot this is upposed to be wired - tbl

  var
    ns = {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      xsd: "http://www.w3.org/2001/XMLSchema#",
      xml: 'http://www.w3.org/XML/1998/namespace',
      xmlns: 'http://www.w3.org/2000/xmlns/'
    },
    
    rdfXMLLiteral = ns.rdf + 'XMLLiteral',
    rdfXMLLiteralSym = kb.sym(rdfXMLLiteral),

    rdfaCurieDefaults = $rdf.curie.defaults,
    relReserved = [
      'alternate', 'appendix', 'bookmark', 'cite', 'chapter', 'contents', 'copyright',
      'first', 'glossary', 'help', 'icon', 'index', 'last', 'license', 'meta', 'next',
      'p3pv1', 'prev', 'role', 'section', 'stylesheet', 'subsection', 'start', 'top', 'up'
    ],

    attRegex = /\s([^ =]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^ >]+))/g,
    
    ncNameChar = '[-A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u10000-\uEFFFF\.0-9\u00B7\u0300-\u036F\u203F-\u2040]',
    ncNameStartChar = '[\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3\u4E00-\u9FA5\u3007\u3021-\u3029_]', //"
    ncNameRegex = new RegExp('^' + ncNameStartChar + ncNameChar + '*$'),

    docResource = kb.sym(baseUri),
    bnodeMap = {};
    
    var type = kb.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
    var why = docResource;

   parseEntities = function (string) {
      var result = "", m, entity;
      if (!/&/.test(string)) {
         return string;
      }
      while (string.length > 0) {
        m = /([^&]*)(&([^;]+);)(.*)/g.exec(string);
        if (m === null) {
          result += string;
          break;
        }
        result += m[1];
        entity = m[3];
        string = m[4];
        if (entity.charAt(0) === '#') {
          if (entity.charAt(1) === 'x') {
              result += String.fromCharCode(parseInt(entity.substring(2), 16));
          } else {
              result += String.fromCharCode(parseInt(entity.substring(1), 10));
          }
        } else {
          switch(entity) {
            case 'amp':
              result += '&';
              break;
            case 'nbsp':
              result += String.fromCharCode(160);
              break;
            case 'quot':
              result += '"';
              break;
            case 'apos':
              result += "'";
              break;
            default:
              result += '&' + entity + ';';
          }
        }
      }
      return result;
    };


    getAttributes = function (elem) {
        var i, e, a, tag, name, value, attMap, prefix,
            atts = {},
            nsMap = {};
        var e = elem[0];
        nsMap[':length'] = 0;
      
        if (e.attributes && e.attributes.getNamedItemNS) {
            attMap = e.attributes;
            for (i = 0; i < attMap.length; i += 1) {
                a = attMap[i];
                if (/^xmlns(:(.+))?$/.test(a.nodeName) && a.nodeValue !== '') {
                    prefix = /^xmlns(:(.+))?$/.exec(a.nodeName)[2] || '';
                    if (ncNameRegex.test(prefix) && (prefix !== 'xml' || a.nodeValue === ns.xml) && (a.nodeValue !== ns.xml || prefix === 'xml') && prefix !== 'xmlns' && a.nodeValue !== ns.xmlns) {
                        nsMap[prefix] = $rdf.sym(a.nodeValue);
                        nsMap[':length'] += 1;
                    }
//              } else if (/rel|rev|lang|xml:lang/.test(a.nodeName)) {
//                      atts[a.nodeName] = a.nodeValue === '' ? undefined : a.nodeValue;
                } else if (/rel|rev|lang|xml:lang|about|href|src|resource|property|typeof|content|datatype/.test(a.nodeName)) {
                    atts[a.nodeName] = a.nodeValue === null ? undefined : a.nodeValue;
                }
            }
        } else { //   For IE, which hides namespaces to carefully
            tag = /<[^>]+>/.exec(e.outerHTML);
            a = attRegex.exec(tag);
            while (a !== null) {
                name = a[1];
                value = a[2] || a[3] || a[4];
                if (/^xmlns/.test(name) && name !== 'xmlns:' && value !== '') {
                    prefix = /^xmlns(:(.+))?$/.exec(name)[2] || '';
                    if (ncNameRegex.test(prefix) && (prefix !== 'xml' || a.nodeValue === ns.xml) && (a.nodeValue !== ns.xml || prefix === 'xml') && prefix !== 'xmlns' && a.nodeValue !== ns.xmlns) {
                        nsMap[prefix] = $rdf.sym(value);
                        nsMap[':length'] += 1;
                    }
                } else if (/about|href|src|resource|property|typeof|content|datatype|rel|rev|lang|xml:lang/.test(name)) {
                    atts[name] = parseEntities(value);
                }
                a = attRegex.exec(tag);
            }
            attRegex.lastIndex = 0;
        }
        return { atts: atts, namespaces: nsMap };
    };

    getAttribute = function (elem, attr) {
        var val = elem[0].getAttribute(attr);
//          if (attr === 'rev' || attr === 'rel' || attr === 'lang' || attr === 'xml:lang') {
//          val = val === '' ? undefined : val;
//          }
        return val === null ? undefined : val;
    };

    resourceFromUri = function (uri) {
      return kb.sym(uri);
    };

    resourceFromCurie = function (curie, elem, noblanks, options) {
      if (curie.substring(0, 2) === '_:') {
        if (noblanks) {
          return undefined;
        }
        var bn = bnodeMap[curie]
        if (bn) return bn;
        var bn = kb.bnode();
        bnodeMap[curie] = bn
        return bn;
      } else {
        try {
          return resourceFromUri($rdf.curie.parse(curie, options));
        } catch (e) {
          return undefined;
        }
      }
    },

    resourceFromSafeCurie = function (safeCurie, elem, options) {
      var m = /^\[(.*)\]$/.exec(safeCurie),
        base = options.base || elem.base();
      return m ? resourceFromCurie(m[1], elem, false, options) : resourceFromUri($rdf.sym(safeCurie, base));
    },

    resourcesFromCuries = function (curies, elem, noblanks, options) {
      var i, resource, resources = [];
      curies = curies && curies.split ? curies.split(/[ \t\n\r\x0C]+/g) : [];
      for (i = 0; i < curies.length; i += 1) {
        if (curies[i] !== '') {
          resource = resourceFromCurie(curies[i], elem, noblanks, options);
          if (resource !== undefined) {
            resources.push(resource);
          }
        }
      }
      return resources;
    },

    /* @@ suppressed for now as we only read not change them -- timbl
    removeCurie = function (curies, resource, options) {
      var i, r, newCuries = [];
      resource = resource.type === 'uri' ? resource : $jq.rdf.resource(resource, options);
      curies = curies && curies.split ? curies.split(/\s+/) : [];
      for (i = 0; i < curies.length; i += 1) {
        if (curies[i] !== '') {
          r = resourceFromCurie(curies[i], null, false, options);
          if (r !== resource) {
            newCuries.push(curies[i]);
          }
        }
      }
      return newCuries.reverse().join(' ');
    },
    */

    $rdf.rdfaParser = function(kb, baseUri) {
        this.kb = kb;
        this.baseUri = baseUri;
        return true;
    }
    
    getObjectResource = function (elem, context, relation) {
        var r, resource, atts, curieOptions;
        context = context || {};
        atts = context.atts || getAttributes(elem).atts;
        r = relation === undefined ? atts.rel !== undefined || atts.rev !== undefined : relation;
        resource = atts.resource;
        resource = resource === undefined ? atts.href : resource;
        if (resource === undefined) {
            resource = r ? kb.bnode() : resource;
        } else {
            curieOptions = context.curieOptions || $rdf.Util.extend(
            {}, rdfaCurieDefaults, { namespaces: elem.xmlns() });
            resource = resourceFromSafeCurie(resource, elem, curieOptions);
        }
        return resource;
    };

    getSubject = function (elem, context, relation) {
      var r, atts, curieOptions, subject, skip = false;
      context = context || {};
      atts = context.atts || getAttributes(elem).atts;
      curieOptions = context.curieOptions || $rdf.Util.extend({},
            rdfaCurieDefaults, { namespaces: elem.xmlns(), base: elem.base() });
      r = relation === undefined ? atts.rel !== undefined || atts.rev !== undefined : relation;
      if (atts.about !== undefined) {
        subject = resourceFromSafeCurie(atts.about, elem, curieOptions);
      }
      if (subject === undefined && atts.src !== undefined) {
        subject = resourceFromSafeCurie(atts.src, elem, curieOptions);
      }
      if (!r && subject === undefined && atts.resource !== undefined) {
        subject = resourceFromSafeCurie(atts.resource, elem, curieOptions);
      }
      if (!r && subject === undefined && atts.href !== undefined) {
        subject = resourceFromSafeCurie(atts.href, elem, curieOptions);
      }
      if (subject === undefined) {
        if (/^(head|body)$/i.test(elem[0].nodeName)) {
          subject = docResource;
        } else if (atts['typeof'] !== undefined) {
          subject = kb.bnode();
        } else if (elem[0].parentNode.nodeType === 1) {
          subject = context.object || getObjectResource(elem.parent()) || getSubject(elem.parent()).subject;
          skip = !r && atts.property === undefined;
        } else {
          subject = docResource;
        }
      }
      return { subject: subject, skip: skip };
    };

    getLang = function (elem, context) {
      var lang;
      context = context || {};
      if (context.atts) {
        lang = context.atts.lang;
        lang = lang || context.atts['xml:lang'];
      } else {
        lang = elem[0].getAttribute('lang');
        try {
          lang = (lang === null || lang === '') ? elem[0].getAttribute('xml:lang') : lang;
        } catch (e) {
        }
        lang = (lang === null || lang === '') ? undefined : lang;
      }
      if (lang === undefined) {
        if (context.lang) {
          lang = context.lang;
        } else {
          if (elem[0].parentNode.nodeType === 1) {
            lang = getLang(elem.parent());
          }
        }
      }
      return lang;
    };

    entity = function (c) {
        switch (c) {
        case '<':
            return '&lt;';
        case '"':
            return '&quot;';
        case '&':
            return '&amp;';
        }
    };

    serialize = function (elem, ignoreNs) {
        var i, string = '', atts, a, name, ns, tag;
            elem.contents().each(function () {
        var j = $(thisElement), // @@@ ?   Use of "this'?
            e = j[0];
        if (e.nodeType === 1) { // tests whether the node is an element
            name = e.nodeName.toLowerCase();
            string += '<' + name;
            if (e.outerHTML) {
                tag = /<[^>]+>/.exec(e.outerHTML);
                a = attRegex.exec(tag);
                while (a !== null) {
                if (!/^jQuery/.test(a[1])) {
                    string += ' ' + a[1] + '=';
                    string += a[2] ? a[3] : '"' + a[1] + '"';
                }
                a = attRegex.exec(tag);
            }
            attRegex.lastIndex = 0;
        } else {
            atts = e.attributes;
            for (i = 0; i < atts.length; i += 1) {
                a = atts.item(i);
                string += ' ' + a.nodeName + '="';
                string += a.nodeValue.replace(/[<"&]/g, entity);
                string += '"'; //'
            }
        }
        if (!ignoreNs) {
            ns = j.xmlns('');
            if (ns !== undefined && j.attr('xmlns') === undefined) {
                string += ' xmlns="' + ns + '"';
            }
        }
          string += '>';
          string += serialize(j, true);
          string += '</' + name + '>';
        } else if (e.nodeType === 8) { // tests whether the node is a comment
            string += '<!--';
            string += e.nodeValue;
            string += '-->';
        } else {
            string += e.nodeValue;
        }
      });
      return string;
    },

    // Originally:
    // This is the main function whcih extracts te RDFA
    // 'this' is the element
    // $rdf.rdfaParser(kb).rdfa.call(element or document)
    // parseElement = function(element) {
    //     this.rdfa.call(element);
    // };
    
    
    parse = function (thisElement, context) {
      var i, subject, resource, lang, datatype, content, text,
        types, object, triple, parent,
        properties, rels, revs,
        forward, backward,
        triples = [],
        callback, relCurieOptions,
        attsAndNs, atts, namespaces, ns,
        children = thisElement.childNodes;
      context = context || {};
      forward = context.forward || [];
      backward = context.backward || [];
      callback = context.callback || function () { return thisElement; };
      attsAndNs = getAttributes(thisElement);
      atts = attsAndNs.atts;
      context.atts = atts;
      namespaces = context.namespaces || thisElement.xmlns();
      if (attsAndNs.namespaces[':length'] > 0) {
        namespaces = $rdf.Util.extend({}, namespaces);
        for (ns in attsAndNs.namespaces) {
          if (ns != ':length') {
            namespaces[ns] = attsAndNs.namespaces[ns];
          }
        }
      }
      context.curieOptions = $rdf.Util.extend({},
        rdfaCurieDefaults, { reserved: [], namespaces: namespaces, base: thisElement.base() });
      relCurieOptions = $rdf.Util.extend({}, context.curieOptions, { reserved: relReserved });
      subject = getSubject(thisElement, context);
      lang = getLang(thisElement, context);
      if (subject.skip) {
        rels = context.forward;
        revs = context.backward;
        subject = context.subject;
        resource = context.object;
      } else {
        subject = subject.subject;
        if (forward.length > 0 || backward.length > 0) {
          parent = context.subject || getSubject(thisElement.parent()).subject; // @@
          for (i = 0; i < forward.length; i += 1) {
            kb.add(parent, forward[i], subject, why);
            // triple = callback.call(triple, thisElement.get(0), triple);
            //if (triple !== undefined && triple !== null) {
            //  triples = triples.concat(triple);
            //}
          }
          for (i = 0; i < backward.length; i += 1) {
            kb.add(subject, backward[i], parent, why);
            //triple = callback.call(triple, thisElement.get(0), triple);
            //if (triple !== undefined && triple !== null) {
            //  triples = triples.concat(triple);
            //}
          }
        }
        resource = getObjectResource(thisElement, context);
        types = resourcesFromCuries(atts['typeof'], thisElement, false, context.curieOptions);
        for (i = 0; i < types.length; i += 1) {
          kb.add(subject, type, types[i], why);
          //triple = callback.call(triple, thisElement.get(0), triple);
          //if (triple !== undefined && triple !== null) {
          //  triples = triples.concat(triple);
          //}
        }
        properties = resourcesFromCuries(atts.property, thisElement, true, context.curieOptions);
        if (properties.length > 0) {
          datatype = atts.datatype;
          content = atts.content;
          text = thisElement.text().replace(/"/g, '\\"'); //'
          if (datatype !== undefined && datatype !== '') {
            datatype = $rdf.curie.parse(datatype, context.curieOptions);
            if (datatype.toString() === rdfXMLLiteral) {
              object = kb.literal(serialize(thisElement), undefined, rdfXMLLiteralSym );
            } else if (content !== undefined) {
              object = kb.literal(content, kb.sym(datatype));
            } else {
              object = kb.literal(text, kb.sym(datatype));
            }
          } else if (content !== undefined) {
            if (lang === undefined) {
              object = kb.literal(content);
            } else {
              object = kb.literal(content, lang);
            }
          } else if (children.length === 0 ||
                     datatype === '') {
            lang = getLang(thisElement, context);
            if (lang === undefined) {
              object = kb.literal('"' + text + '"');    //@@ added double quote marks??
            } else {
              object = kb.literal(text, undefined, lang);
            }
          } else {
            object = kb.literal(serialize(thisElement), kb.sym(rdfXMLLiteral));
          }
          for (i = 0; i < properties.length; i += 1) {
            kb.add(subject, properties[i], object, why);
          }
        }
        rels = resourcesFromCuries(atts.rel, thisElement, true, relCurieOptions);
        revs = resourcesFromCuries(atts.rev, thisElement, true, relCurieOptions);
        if (atts.resource !== undefined || atts.href !== undefined) {
          // make the triples immediately
          if (rels !== undefined) {
            for (i = 0; i < rels.length; i += 1) {
              kb.add(subject, rels[i], resource, why);
            }
          }
          rels = [];
          if (revs !== undefined) {
            for (i = 0; i < revs.length; i += 1) {
              kb.add(resource, revs[i], subject, why);
            }
          }
          revs = [];
        }
      }
      children.each(function () {
        triples = triples.concat(rdfa.call($(thisElement), { forward: rels, backward: revs,
            subject: subject, object: resource || subject,
            lang: lang, namespaces: namespaces, callback: callback }));
      });
      return triples;
    };

    // Ad to list of gleaners @@@
    gleaner = function (options) {
      var type, atts;
      if (options && options.about !== undefined) {
        atts = getAttributes(thisElement).atts;
        if (options.about === null) {
          return atts.property !== undefined ||
                 atts.rel !== undefined ||
                 atts.rev !== undefined ||
                 atts['typeof'] !== undefined;
        } else {
          return getSubject(thisElement, {atts: atts}).subject.value === options.about;
        }
      } else if (options && options.type !== undefined) {
            type = getAttribute(thisElement, 'typeof');
        if (type !== undefined) {
            return options.type === null ? true : this.curie(type) === options.type;
        }
            return false;
        } else {
            return parse(thisElement, options);
        }
    }
    
    return;     // debug later   @@@@@@@@
    
    return parse(dom); 
    // End of Parser object

}


  /**
   * Creates a {@link jQuery.rdf} object containing the RDF triples parsed from the RDFa found in the current jQuery selection or adds the specified triple as RDFa markup on each member of the current jQuery selection. To create an {@link jQuery.rdf} object, you will usually want to use {@link jQuery#rdf} instead, as this may perform other useful processing (such as of microformats used within the page).
   * @methodOf jQuery#
   * @name jQuery#rdfa
   * @param {jQuery.rdf.triple} [triple] The RDF triple to be added to each item in the jQuery selection.
   * @returns {jQuery.rdf}
   * @example
   * // Extract RDFa markup from all span elements contained inside #main
   * rdf = $('#main > span').rdfa();
   * @example
   * // Add RDFa markup to a particular element
   *  var span = $('#main > p > span');
   *  span.rdfa('&lt;> dc:date "2008-10-19"^^xsd:date .');
   */
   /*
   // 'this' is a jq bject whcih wraps an element
  $jq.fn.rdfa = function (triple) {
    if (triple === undefined) {
      var triples = $jq.map($(thisElement), function (elem) {
        return rdfa.call($(elem));
      });
      return $jq.rdf({ triples: triples });
    } else {
      $(thisElement).each(function () {
        addRDFa.call($(thisElement), triple);
      });
      return thisElement;
    }
  };
  */

  /**
   * Removes the specified RDFa markup from each of the items in the current jQuery selection. The input parameter can be either an object or an array of objects. The objects can either have a <code>type</code> property, in which case the specified type is removed from the RDFa provided on the selected elements, or a <code>property</code> property, in which case the specified property is removed from the RDFa provided on the selected elements.
   * @methodOf jQuery#
   * @name jQuery#removeRdfa
   * @param {Object|Object[]} triple The RDFa markup items to be removed
   * from the items in the jQuery selection.
   * @returns {jQuery} The original jQuery object.
   * @example 
   * // To remove a property resource or relation from an element 
   * $('#main > p > a').removeRdfa({ property: "dc:creator" });
   * @example
   * // To remove a type from an element
   * $('#main >p > a').removeRdfa({ type: "foaf:Person" });
   * @example
   * // To remove multiple triples from an element
   * $('#main > p > a').removeRdfa([{ property: "foaf:depicts" }, { property: "dc:creator" }]);
   */
   /*
  $jq.fn.removeRdfa = function (triple) {
    $(thisElement).each(function () {
      removeRDFa.call($(thisElement), triple);
    });
    return thisElement;
  };

  $jq.rdf.gleaners.push(gleaner);
*/
/*
$rdf.parseRdfa = function(element, kb, baseUri) {
    var p = new $rdf.RDFaParser(kb, baseUri);
    p.rdfa.call(element);
};
*/
/**
*
*  UTF-8 data encode / decode
*  http://www.webtoolkit.info/
*
**/

$rdf.N3Parser = function () {

function hexify(str) { // also used in parser
  return encodeURI(str);
}

var Utf8 = {

    // public method for url encoding
    encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                    utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // public method for url decoding
    decode : function (utftext) {
        var string = "";
        var i = 0;

        while ( i < utftext.length ) {

                var c = utftext.charCodeAt(i);
                if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                }
                else if((c > 191) && (c < 224)) {
                        string += String.fromCharCode(((c & 31) << 6)
                            | (utftext.charCodeAt(i+1) & 63));
                        i += 2;
                }
                else {
                        string += String.fromCharCode(((c & 15) << 12)
                            | ((utftext.charCodeAt(i+1) & 63) << 6)
                            | (utftext.charCodeAt(i+2) & 63));
                        i += 3;
                }
        }
        return string;
    }

}// Things we need to define to make converted pythn code work in js
// environment of $rdf

var RDFSink_forSomeSym = "http://www.w3.org/2000/10/swap/log#forSome";
var RDFSink_forAllSym = "http://www.w3.org/2000/10/swap/log#forAll";
var Logic_NS = "http://www.w3.org/2000/10/swap/log#";

//  pyjs seems to reference runtime library which I didn't find

var pyjslib_Tuple = function(theList) { return theList };

var pyjslib_List = function(theList) { return theList };

var pyjslib_Dict = function(listOfPairs) {
    if (listOfPairs.length > 0)
	throw "missing.js: oops nnonempty dict not imp";
    return [];
}

var pyjslib_len = function(s) { return s.length }

var pyjslib_slice = function(str, i, j) {
    if (typeof str.slice == 'undefined')
        throw '@@ mising.js: No .slice function for '+str+' of type '+(typeof str) 
    if ((typeof j == 'undefined') || (j ==null)) return str.slice(i);
    return str.slice(i, j) // @ exactly the same spec?
}
var StopIteration = Error('dummy error stop iteration');

var pyjslib_Iterator = function(theList) {
    this.last = 0;
    this.li = theList;
    this.next = function() {
	if (this.last == this.li.length) throw StopIteration;
	return this.li[this.last++];
    }
    return this;
};

var ord = function(str) {
    return str.charCodeAt(0)
}

var string_find = function(str, s) {
    return str.indexOf(s)
}

var assertFudge = function(condition, desc) {
    if (condition) return;
    if (desc) throw "python Assertion failed: "+desc;
    throw "(python) Assertion failed.";  
}


var stringFromCharCode = function(uesc) {
    return String.fromCharCode(uesc);
}


String.prototype.encode = function(encoding) {
    if (encoding != 'utf-8') throw "UTF8_converter: can only do utf-8"
    return Utf8.encode(this);
}
String.prototype.decode = function(encoding) {
    if (encoding != 'utf-8') throw "UTF8_converter: can only do utf-8"
    //return Utf8.decode(this);
    return this;
}



var uripath_join = function(base, given) {
    return $rdf.Util.uri.join(given, base)  // sad but true
}

var becauseSubexpression = null; // No reason needed
var diag_tracking = 0;
var diag_chatty_flag = 0;
var diag_progress = function(str) { /*$rdf.log.debug(str);*/ }

// why_BecauseOfData = function(doc, reason) { return doc };


var RDF_type_URI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
var DAML_sameAs_URI = "http://www.w3.org/2002/07/owl#sameAs";

/*
function SyntaxError(details) {
    return new __SyntaxError(details);
}
*/

function __SyntaxError(details) {
    this.details = details
}

/*

$Id: n3parser.js 14561 2008-02-23 06:37:26Z kennyluck $

HAND EDITED FOR CONVERSION TO JAVASCRIPT

This module implements a Nptation3 parser, and the final
part of a notation3 serializer.

See also:

Notation 3
http://www.w3.org/DesignIssues/Notation3

Closed World Machine - and RDF Processor
http://www.w3.org/2000/10/swap/cwm

To DO: See also "@@" in comments

- Clean up interfaces
______________________________________________

Module originally by Dan Connolly, includeing notation3
parser and RDF generator. TimBL added RDF stream model
and N3 generation, replaced stream model with use
of common store/formula API.  Yosi Scharf developped
the module, including tests and test harness.

*/

var ADDED_HASH = "#";
var LOG_implies_URI = "http://www.w3.org/2000/10/swap/log#implies";
var INTEGER_DATATYPE = "http://www.w3.org/2001/XMLSchema#integer";
var FLOAT_DATATYPE = "http://www.w3.org/2001/XMLSchema#double";
var DECIMAL_DATATYPE = "http://www.w3.org/2001/XMLSchema#decimal";
var BOOLEAN_DATATYPE = "http://www.w3.org/2001/XMLSchema#boolean";
var option_noregen = 0;
var _notQNameChars = "\t\r\n !\"#$%&'()*.,+/;<=>?@[\\]^`{|}~";
var _notNameChars =  ( _notQNameChars + ":" ) ;
var _rdfns = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var N3CommentCharacter = "#";
var eol = new RegExp("^[ \\t]*(#[^\\n]*)?\\r?\\n", 'g');
var eof = new RegExp("^[ \\t]*(#[^\\n]*)?$", 'g');
var ws = new RegExp("^[ \\t]*", 'g');
var signed_integer = new RegExp("^[-+]?[0-9]+", 'g');
var number_syntax = new RegExp("^([-+]?[0-9]+)(\\.[0-9]+)?(e[-+]?[0-9]+)?", 'g');
var digitstring = new RegExp("^[0-9]+", 'g');
var interesting = new RegExp("[\\\\\\r\\n\\\"]", 'g');
var langcode = new RegExp("^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)?", 'g');
function SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why) {
    return new __SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why);
}
function __SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why) {
    if (typeof openFormula == 'undefined') openFormula=null;
    if (typeof thisDoc == 'undefined') thisDoc="";
    if (typeof baseURI == 'undefined') baseURI=null;
    if (typeof genPrefix == 'undefined') genPrefix="";
    if (typeof metaURI == 'undefined') metaURI=null;
    if (typeof flags == 'undefined') flags="";
    if (typeof why == 'undefined') why=null;
    /*
    note: namespace names should *not* end in #;
    the # will get added during qname processing */
    
    this._bindings = new pyjslib_Dict([]);
    this._flags = flags;
    if ((thisDoc != "")) {
        assertFudge((thisDoc.indexOf(":") >= 0),  ( "Document URI not absolute: " + thisDoc ) );
        this._bindings[""] = (  ( thisDoc + "#" ) );
    }
    this._store = store;
    if (genPrefix) {
        store.setGenPrefix(genPrefix);
    }
    this._thisDoc = thisDoc;
    this.source = store.sym(thisDoc);
    this.lines = 0;
    this.statementCount = 0;
    this.startOfLine = 0;
    this.previousLine = 0;
    this._genPrefix = genPrefix;
    this.keywords = new pyjslib_List(["a", "this", "bind", "has", "is", "of", "true", "false"]);
    this.keywordsSet = 0;
    this._anonymousNodes = new pyjslib_Dict([]);
    this._variables = new pyjslib_Dict([]);
    this._parentVariables = new pyjslib_Dict([]);
    this._reason = why;
    this._reason2 = null;
    if (diag_tracking) {
        this._reason2 = why_BecauseOfData(store.sym(thisDoc), this._reason);
    }
    if (baseURI) {
        this._baseURI = baseURI;
    }
    else {
        if (thisDoc) {
            this._baseURI = thisDoc;
        }
        else {
            this._baseURI = null;
        }
    }
    assertFudge(!(this._baseURI) || (this._baseURI.indexOf(":") >= 0));
    if (!(this._genPrefix)) {
        if (this._thisDoc) {
            this._genPrefix =  ( this._thisDoc + "#_g" ) ;
        }
        else {
            this._genPrefix = RDFSink_uniqueURI();
        }
    }
    if ((openFormula == null)) {
        if (this._thisDoc) {
            this._formula = store.formula( ( thisDoc + "#_formula" ) );
        }
        else {
            this._formula = store.formula();
        }
    }
    else {
        this._formula = openFormula;
    }
    this._context = this._formula;
    this._parentContext = null;
}
__SinkParser.prototype.here = function(i) {
    return  (  (  (  ( this._genPrefix + "_L" )  + this.lines )  + "C" )  +  (  ( i - this.startOfLine )  + 1 )  ) ;
};
__SinkParser.prototype.formula = function() {
    return this._formula;
};
__SinkParser.prototype.loadStream = function(stream) {
    return this.loadBuf(stream.read());
};
__SinkParser.prototype.loadBuf = function(buf) {
    /*
    Parses a buffer and returns its top level formula*/
    
    this.startDoc();
    this.feed(buf);
    return this.endDoc();
};
__SinkParser.prototype.feed = function(octets) {
    /*
    Feed an octet stream tothe parser
    
    if BadSyntax is raised, the string
    passed in the exception object is the
    remainder after any statements have been parsed.
    So if there is more data to feed to the
    parser, it should be straightforward to recover.*/
    
    var str = octets.decode("utf-8");
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
__SinkParser.prototype.directiveOrStatement = function(str, h) {
    var i = this.skipSpace(str, h);
    if ((i < 0)) {
        return i;
    }
    var j = this.directive(str, i);
    if ((j >= 0)) {
        return this.checkDot(str, j);
    }
    var j = this.statement(str, i);
    if ((j >= 0)) {
        return this.checkDot(str, j);
    }
    return j;
};
__SinkParser.prototype.tok = function(tok, str, i) {
    /*
    Check for keyword.  Space must have been stripped on entry and
    we must not be at end of file.*/
    var whitespace = "\t\n\v\f\r ";
    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "@")) {
        var i =  ( i + 1 ) ;
    }
    else {
        if (($rdf.Util.ArrayIndexOf(this.keywords,tok) < 0)) {
            return -1;
        }
    }
    var k =  ( i + pyjslib_len(tok) ) ;
    if ((pyjslib_slice(str, i, k) == tok) && (_notQNameChars.indexOf(str.charAt(k)) >= 0)) {
        return k;
    }
    else {
        return -1;
    }
};
__SinkParser.prototype.directive = function(str, i) {
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    var res = new pyjslib_List([]);
    var j = this.tok("bind", str, i);
    if ((j > 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "keyword bind is obsolete: use @prefix");
    }
    var j = this.tok("keywords", str, i);
    if ((j > 0)) {
        var i = this.commaSeparatedList(str, j, res, false);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "'@keywords' needs comma separated list of words");
        }
        this.setKeywords(pyjslib_slice(res, null, null));
        if ((diag_chatty_flag > 80)) {
            diag_progress("Keywords ", this.keywords);
        }
        return i;
    }
    var j = this.tok("forAll", str, i);
    if ((j > 0)) {
        var i = this.commaSeparatedList(str, j, res, true);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad variable list after @forAll");
        }
        
        var __x = new pyjslib_Iterator(res);
        try {
            while (true) {
                var x = __x.next();
                
                
                if ($rdf.Util.ArrayIndexOf(this._variables,x) < 0 || ($rdf.Util.ArrayIndexOf(this._parentVariables,x) >= 0)) {
                    this._variables[x] = ( this._context.newUniversal(x));
                }
                
            }
        } catch (e) {
            if (e != StopIteration) {
                throw e;
            }
        }
        
        return i;
    }
    var j = this.tok("forSome", str, i);
    if ((j > 0)) {
        var i = this.commaSeparatedList(str, j, res, this.uri_ref2);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad variable list after @forSome");
        }
        
        var __x = new pyjslib_Iterator(res);
        try {
            while (true) {
                var x = __x.next();
                
                
                this._context.declareExistential(x);
                
            }
        } catch (e) {
            if (e != StopIteration) {
                throw e;
            }
        }
        
        return i;
    }
    var j = this.tok("prefix", str, i);
    if ((j >= 0)) {
        var t = new pyjslib_List([]);
        var i = this.qname(str, j, t);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected qname after @prefix");
        }
        var j = this.uri_ref2(str, i, t);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "expected <uriref> after @prefix _qname_");
        }
        var ns = t[1].uri;
        if (this._baseURI) {
            var ns = uripath_join(this._baseURI, ns);
        }
        else {
            assertFudge((ns.indexOf(":") >= 0), "With no base URI, cannot handle relative URI for NS");
        }
        assertFudge((ns.indexOf(":") >= 0));
        this._bindings[t[0][0]] = ( ns);
        
        this.bind(t[0][0], hexify(ns));
        return j;
    }
    var j = this.tok("base", str, i);
    if ((j >= 0)) {
        var t = new pyjslib_List([]);
        var i = this.uri_ref2(str, j, t);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected <uri> after @base ");
        }
        var ns = t[0].uri;
        if (this._baseURI) {
            var ns = uripath_join(this._baseURI, ns);
        }
        else {
            throw BadSyntax(this._thisDoc, this.lines, str, j,  (  ( "With no previous base URI, cannot use relative URI in @base  <" + ns )  + ">" ) );
        }
        assertFudge((ns.indexOf(":") >= 0));
        this._baseURI = ns;
        return i;
    }
    return -1;
};
__SinkParser.prototype.bind = function(qn, uri) {
    if ((qn == "")) {
    }
    else {
        this._store.setPrefixForURI(qn, uri);
    }
};
__SinkParser.prototype.setKeywords = function(k) {
    /*
    Takes a list of strings*/
    
    if ((k == null)) {
        this.keywordsSet = 0;
    }
    else {
        this.keywords = k;
        this.keywordsSet = 1;
    }
};
__SinkParser.prototype.startDoc = function() {
};
__SinkParser.prototype.endDoc = function() {
    /*
    Signal end of document and stop parsing. returns formula*/
    
    return this._formula;
};
__SinkParser.prototype.makeStatement = function(quad) {
    quad[0].add(quad[2], quad[1], quad[3], this.source);
    this.statementCount += 1;
};
__SinkParser.prototype.statement = function(str, i) {
    var r = new pyjslib_List([]);
    var i = this.object(str, i, r);
    if ((i < 0)) {
        return i;
    }
    var j = this.property_list(str, i, r[0]);
    if ((j < 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "expected propertylist");
    }
    return j;
};
__SinkParser.prototype.subject = function(str, i, res) {
    return this.item(str, i, res);
};
__SinkParser.prototype.verb = function(str, i, res) {
    /*
    has _prop_
    is _prop_ of
    a
    =
    _prop_
    >- prop ->
    <- prop -<
    _operator_*/
    
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    var r = new pyjslib_List([]);
    var j = this.tok("has", str, i);
    if ((j >= 0)) {
        var i = this.prop(str, j, r);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected property after 'has'");
        }
        res.push(new pyjslib_Tuple(["->", r[0]]));
        return i;
    }
    var j = this.tok("is", str, i);
    if ((j >= 0)) {
        var i = this.prop(str, j, r);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "expected <property> after 'is'");
        }
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "End of file found, expected property after 'is'");
            return j;
        }
        var i = j;
        var j = this.tok("of", str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "expected 'of' after 'is' <prop>");
        }
        res.push(new pyjslib_Tuple(["<-", r[0]]));
        return j;
    }
    var j = this.tok("a", str, i);
    if ((j >= 0)) {
        res.push(new pyjslib_Tuple(["->", this._store.sym(RDF_type_URI)]));
        return j;
    }
    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == "<=")) {
        res.push(new pyjslib_Tuple(["<-", this._store.sym( ( Logic_NS + "implies" ) )]));
        return  ( i + 2 ) ;
    }
    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "=")) {
        if ((pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) ) == ">")) {
            res.push(new pyjslib_Tuple(["->", this._store.sym( ( Logic_NS + "implies" ) )]));
            return  ( i + 2 ) ;
        }
        res.push(new pyjslib_Tuple(["->", this._store.sym(DAML_sameAs_URI)]));
        return  ( i + 1 ) ;
    }
    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == ":=")) {
        res.push(new pyjslib_Tuple(["->",  ( Logic_NS + "becomes" ) ]));
        return  ( i + 2 ) ;
    }
    var j = this.prop(str, i, r);
    if ((j >= 0)) {
        res.push(new pyjslib_Tuple(["->", r[0]]));
        return j;
    }
    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == ">-") || (pyjslib_slice(str, i,  ( i + 2 ) ) == "<-")) {
        throw BadSyntax(this._thisDoc, this.lines, str, j, ">- ... -> syntax is obsolete.");
    }
    return -1;
};
__SinkParser.prototype.prop = function(str, i, res) {
    return this.item(str, i, res);
};
__SinkParser.prototype.item = function(str, i, res) {
    return this.path(str, i, res);
};
__SinkParser.prototype.blankNode = function(uri) {
    return this._context.bnode(uri, this._reason2);
};
__SinkParser.prototype.path = function(str, i, res) {
    /*
    Parse the path production.
    */
    
    var j = this.nodeOrLiteral(str, i, res);
    if ((j < 0)) {
        return j;
    }
    while (("!^.".indexOf(pyjslib_slice(str, j,  ( j + 1 ) )) >= 0)) {
        var ch = pyjslib_slice(str, j,  ( j + 1 ) );
        if ((ch == ".")) {
            var ahead = pyjslib_slice(str,  ( j + 1 ) ,  ( j + 2 ) );
            if (!(ahead) || (_notNameChars.indexOf(ahead) >= 0) && (":?<[{(".indexOf(ahead) < 0)) {
                break;
            }
        }
        var subj = res.pop();
        var obj = this.blankNode(this.here(j));
        var j = this.node(str,  ( j + 1 ) , res);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found in middle of path syntax");
        }
        var pred = res.pop();
        if ((ch == "^")) {
            this.makeStatement(new pyjslib_Tuple([this._context, pred, obj, subj]));
        }
        else {
            this.makeStatement(new pyjslib_Tuple([this._context, pred, subj, obj]));
        }
        res.push(obj);
    }
    return j;
};
__SinkParser.prototype.anonymousNode = function(ln) {
    /*
    Remember or generate a term for one of these _: anonymous nodes*/
    
    var term = this._anonymousNodes[ln];
    if (term) {
        return term;
    }
    var term = this._store.bnode(this._context, this._reason2);
    this._anonymousNodes[ln] = ( term);
    return term;
};
__SinkParser.prototype.node = function(str, i, res, subjectAlready) {
    if (typeof subjectAlready == 'undefined') subjectAlready=null;
    /*
    Parse the <node> production.
    Space is now skipped once at the beginning
    instead of in multipe calls to self.skipSpace().
    */
    
    var subj = subjectAlready;
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    var i = j;
    var ch = pyjslib_slice(str, i,  ( i + 1 ) );
    if ((ch == "[")) {
        var bnodeID = this.here(i);
        var j = this.skipSpace(str,  ( i + 1 ) );
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF after '['");
        }
        if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "=")) {
            var i =  ( j + 1 ) ;
            var objs = new pyjslib_List([]);
            var j = this.objectList(str, i, objs);
            
            if ((j >= 0)) {
                var subj = objs[0];
                if ((pyjslib_len(objs) > 1)) {
                    
                    var __obj = new pyjslib_Iterator(objs);
                    try {
                        while (true) {
                            var obj = __obj.next();
                            
                            
                            this.makeStatement(new pyjslib_Tuple([this._context, this._store.sym(DAML_sameAs_URI), subj, obj]));
                            
                        }
                    } catch (e) {
                        if (e != StopIteration) {
                            throw e;
                        }
                    }
                    
                }
                var j = this.skipSpace(str, j);
                if ((j < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF when objectList expected after [ = ");
                }
                if ((pyjslib_slice(str, j,  ( j + 1 ) ) == ";")) {
                    var j =  ( j + 1 ) ;
                }
            }
            else {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "objectList expected after [= ");
            }
        }
        if ((subj == null)) {
            var subj = this.blankNode(bnodeID);
        }
        var i = this.property_list(str, j, subj);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "property_list expected");
        }
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF when ']' expected after [ <propertyList>");
        }
        if ((pyjslib_slice(str, j,  ( j + 1 ) ) != "]")) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "']' expected");
        }
        res.push(subj);
        return  ( j + 1 ) ;
    }
    if ((ch == "{")) {
        var ch2 = pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) );
        if ((ch2 == "$")) {
            i += 1;
            var j =  ( i + 1 ) ;
            var mylist = new pyjslib_List([]);
            var first_run = true;
            while (1) {
                var i = this.skipSpace(str, j);
                if ((i < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "needed '$}', found end.");
                }
                if ((pyjslib_slice(str, i,  ( i + 2 ) ) == "$}")) {
                    var j =  ( i + 2 ) ;
                    break;
                }
                if (!(first_run)) {
                    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == ",")) {
                        i += 1;
                    }
                    else {
                        throw BadSyntax(this._thisDoc, this.lines, str, i, "expected: ','");
                    }
                }
                else {
                    var first_run = false;
                }
                var item = new pyjslib_List([]);
                var j = this.item(str, i, item);
                if ((j < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "expected item in set or '$}'");
                }
                mylist.push(item[0]);
            }
            res.push(this._store.newSet(mylist, this._context));
            return j;
        }
        else {
            var j =  ( i + 1 ) ;
            var oldParentContext = this._parentContext;
            this._parentContext = this._context;
            var parentAnonymousNodes = this._anonymousNodes;
            var grandParentVariables = this._parentVariables;
            this._parentVariables = this._variables;
            this._anonymousNodes = new pyjslib_Dict([]);
            this._variables = this._variables.slice();
            var reason2 = this._reason2;
            this._reason2 = becauseSubexpression;
            if ((subj == null)) {
                var subj = this._store.formula();
            }
            this._context = subj;
            while (1) {
                var i = this.skipSpace(str, j);
                if ((i < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "needed '}', found end.");
                }
                if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "}")) {
                    var j =  ( i + 1 ) ;
                    break;
                }
                var j = this.directiveOrStatement(str, i);
                if ((j < 0)) {
                    throw BadSyntax(this._thisDoc, this.lines, str, i, "expected statement or '}'");
                }
            }
            this._anonymousNodes = parentAnonymousNodes;
            this._variables = this._parentVariables;
            this._parentVariables = grandParentVariables;
            this._context = this._parentContext;
            this._reason2 = reason2;
            this._parentContext = oldParentContext;
            res.push(subj.close());
            return j;
        }
    }
    if ((ch == "(")) {
        var thing_type = this._store.list;
        var ch2 = pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) );
        if ((ch2 == "$")) {
            var thing_type = this._store.newSet;
            i += 1;
        }
        var j =  ( i + 1 ) ;
        var mylist = new pyjslib_List([]);
        while (1) {
            var i = this.skipSpace(str, j);
            if ((i < 0)) {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "needed ')', found end.");
            }
            if ((pyjslib_slice(str, i,  ( i + 1 ) ) == ")")) {
                var j =  ( i + 1 ) ;
                break;
            }
            var item = new pyjslib_List([]);
            var j = this.item(str, i, item);
            if ((j < 0)) {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "expected item in list or ')'");
            }
            mylist.push(item[0]);
        }
        res.push(thing_type(mylist, this._context));
        return j;
    }
    var j = this.tok("this", str, i);
    if ((j >= 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "Keyword 'this' was ancient N3. Now use @forSome and @forAll keywords.");
        res.push(this._context);
        return j;
    }
    var j = this.tok("true", str, i);
    if ((j >= 0)) {
        res.push(true);
        return j;
    }
    var j = this.tok("false", str, i);
    if ((j >= 0)) {
        res.push(false);
        return j;
    }
    if ((subj == null)) {
        var j = this.uri_ref2(str, i, res);
        if ((j >= 0)) {
            return j;
        }
    }
    return -1;
};
__SinkParser.prototype.property_list = function(str, i, subj) {
    /*
    Parse property list
    Leaves the terminating punctuation in the buffer
    */
    
    while (1) {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF found when expected verb in property list");
            return j;
        }
        if ((pyjslib_slice(str, j,  ( j + 2 ) ) == ":-")) {
            var i =  ( j + 2 ) ;
            var res = new pyjslib_List([]);
            var j = this.node(str, i, res, subj);
            if ((j < 0)) {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "bad {} or () or [] node after :- ");
            }
            var i = j;
            continue;
        }
        var i = j;
        var v = new pyjslib_List([]);
        var j = this.verb(str, i, v);
        if ((j <= 0)) {
            return i;
        }
        var objs = new pyjslib_List([]);
        var i = this.objectList(str, j, objs);
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "objectList expected");
        }
        
        var __obj = new pyjslib_Iterator(objs);
        try {
            while (true) {
                var obj = __obj.next();
                
                
                var pairFudge = v[0];
                var dir = pairFudge[0];
                var sym = pairFudge[1];
                if ((dir == "->")) {
                    this.makeStatement(new pyjslib_Tuple([this._context, sym, subj, obj]));
                }
                else {
                    this.makeStatement(new pyjslib_Tuple([this._context, sym, obj, subj]));
                }
                
            }
        } catch (e) {
            if (e != StopIteration) {
                throw e;
            }
        }
        
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found in list of objects");
            return j;
        }
        if ((pyjslib_slice(str, i,  ( i + 1 ) ) != ";")) {
            return i;
        }
        var i =  ( i + 1 ) ;
    }
};
__SinkParser.prototype.commaSeparatedList = function(str, j, res, ofUris) {
    /*
    return value: -1 bad syntax; >1 new position in str
    res has things found appended
    
    Used to use a final value of the function to be called, e.g. this.bareWord
    but passing the function didn't work fo js converion pyjs
    */
    
    var i = this.skipSpace(str, j);
    if ((i < 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF found expecting comma sep list");
        return i;
    }
    if ((str.charAt(i) == ".")) {
        return j;
    }
    if (ofUris) {
        var i = this.uri_ref2(str, i, res);
    }
    else {
        var i = this.bareWord(str, i, res);
    }
    if ((i < 0)) {
        return -1;
    }
    while (1) {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            return j;
        }
        var ch = pyjslib_slice(str, j,  ( j + 1 ) );
        if ((ch != ",")) {
            if ((ch != ".")) {
                return -1;
            }
            return j;
        }
        if (ofUris) {
            var i = this.uri_ref2(str,  ( j + 1 ) , res);
        }
        else {
            var i = this.bareWord(str,  ( j + 1 ) , res);
        }
        if ((i < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i, "bad list content");
            return i;
        }
    }
};
__SinkParser.prototype.objectList = function(str, i, res) {
    var i = this.object(str, i, res);
    if ((i < 0)) {
        return -1;
    }
    while (1) {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found after object");
            return j;
        }
        if ((pyjslib_slice(str, j,  ( j + 1 ) ) != ",")) {
            return j;
        }
        var i = this.object(str,  ( j + 1 ) , res);
        if ((i < 0)) {
            return i;
        }
    }
};
__SinkParser.prototype.checkDot = function(str, i) {
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return j;
    }
    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == ".")) {
        return  ( j + 1 ) ;
    }
    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "}")) {
        return j;
    }
    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "]")) {
        return j;
    }
    throw BadSyntax(this._thisDoc, this.lines, str, j, "expected '.' or '}' or ']' at end of statement");
    return i;
};
__SinkParser.prototype.uri_ref2 = function(str, i, res) {
    /*
    Generate uri from n3 representation.
    
    Note that the RDF convention of directly concatenating
    NS and local name is now used though I prefer inserting a '#'
    to make the namesapces look more like what XML folks expect.
    */
    
    var qn = new pyjslib_List([]);
    var j = this.qname(str, i, qn);
    if ((j >= 0)) {
        var pairFudge = qn[0];
        var pfx = pairFudge[0];
        var ln = pairFudge[1];
        if ((pfx == null)) {
            assertFudge(0, "not used?");
            var ns =  ( this._baseURI + ADDED_HASH ) ;
        }
        else {
            var ns = this._bindings[pfx];
            if (!(ns)) {
                if ((pfx == "_")) {
                    res.push(this.anonymousNode(ln));
                    return j;
                }
                throw BadSyntax(this._thisDoc, this.lines, str, i,  (  ( "Prefix " + pfx )  + " not bound." ) );
            }
        }
        var symb = this._store.sym( ( ns + ln ) );
        if (($rdf.Util.ArrayIndexOf(this._variables, symb) >= 0)) {
            res.push(this._variables[symb]);
        }
        else {
            res.push(symb);
        }
        return j;
    }
    var i = this.skipSpace(str, i);
    if ((i < 0)) {
        return -1;
    }
    if ((str.charAt(i) == "?")) {
        var v = new pyjslib_List([]);
        var j = this.variable(str, i, v);
        if ((j > 0)) {
            res.push(v[0]);
            return j;
        }
        return -1;
    }
    else if ((str.charAt(i) == "<")) {
        var i =  ( i + 1 ) ;
        var st = i;
        while ((i < pyjslib_len(str))) {
            if ((str.charAt(i) == ">")) {
                var uref = pyjslib_slice(str, st, i);
                if (this._baseURI) {
                    var uref = uripath_join(this._baseURI, uref);
                }
                else {
                    assertFudge((uref.indexOf(":") >= 0), "With no base URI, cannot deal with relative URIs");
                }
                if ((pyjslib_slice(str,  ( i - 1 ) , i) == "#") && !((pyjslib_slice(uref, -1, null) == "#"))) {
                    var uref =  ( uref + "#" ) ;
                }
                var symb = this._store.sym(uref);
                if (($rdf.Util.ArrayIndexOf(this._variables,symb) >= 0)) {
                    res.push(this._variables[symb]);
                }
                else {
                    res.push(symb);
                }
                return  ( i + 1 ) ;
            }
            var i =  ( i + 1 ) ;
        }
        throw BadSyntax(this._thisDoc, this.lines, str, j, "unterminated URI reference");
    }
    else if (this.keywordsSet) {
        var v = new pyjslib_List([]);
        var j = this.bareWord(str, i, v);
        if ((j < 0)) {
            return -1;
        }
        if (($rdf.Util.ArrayIndexOf(this.keywords, v[0]) >= 0)) {
            throw BadSyntax(this._thisDoc, this.lines, str, i,  (  ( "Keyword \"" + v[0] )  + "\" not allowed here." ) );
        }
        res.push(this._store.sym( ( this._bindings[""] + v[0] ) ));
        return j;
    }
    else {
        return -1;
    }
};
__SinkParser.prototype.skipSpace = function(str, i) {
    /*
    Skip white space, newlines and comments.
    return -1 if EOF, else position of first non-ws character*/
    var tmp = str;
    var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
    for (var j = (i ? i : 0); j < str.length; j++) {
        if (whitespace.indexOf(str.charAt(j)) === -1) {
            if( str.charAt(j)==='#' ) {
                str = str.slice(i).replace(/^[^\n]*\n/,"");
                i=0;
                j=-1;
            } else {
                break;
            }
        }
    }
    val = (tmp.length - str.length) + j;
    if( val === tmp.length ) {
        return -1;
    }
    return val;
};
__SinkParser.prototype.variable = function(str, i, res) {
    /*
    ?abc -> variable(:abc)
    */
    
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return -1;
    }
    if ((pyjslib_slice(str, j,  ( j + 1 ) ) != "?")) {
        return -1;
    }
    var j =  ( j + 1 ) ;
    var i = j;
    if (("0123456789-".indexOf(str.charAt(j)) >= 0)) {
        throw BadSyntax(this._thisDoc, this.lines, str, j,  (  ( "Varible name can't start with '" + str.charAt(j) )  + "s'" ) );
        return -1;
    }
    while ((i < pyjslib_len(str)) && (_notNameChars.indexOf(str.charAt(i)) < 0)) {
        var i =  ( i + 1 ) ;
    }
    if ((this._parentContext == null)) {
        throw BadSyntax(this._thisDoc, this.lines, str, j,  ( "Can't use ?xxx syntax for variable in outermost level: " + pyjslib_slice(str,  ( j - 1 ) , i) ) );
    }
    res.push(this._store.variable(pyjslib_slice(str, j, i)));
    return i;
};
__SinkParser.prototype.bareWord = function(str, i, res) {
    /*
    abc -> :abc
    */
    
    var j = this.skipSpace(str, i);
    if ((j < 0)) {
        return -1;
    }
    var ch = str.charAt(j);
    if (("0123456789-".indexOf(ch) >= 0)) {
        return -1;
    }
    if ((_notNameChars.indexOf(ch) >= 0)) {
        return -1;
    }
    var i = j;
    while ((i < pyjslib_len(str)) && (_notNameChars.indexOf(str.charAt(i)) < 0)) {
        var i =  ( i + 1 ) ;
    }
    res.push(pyjslib_slice(str, j, i));
    return i;
};
__SinkParser.prototype.qname = function(str, i, res) {
    /*
    
    xyz:def -> ('xyz', 'def')
    If not in keywords and keywordsSet: def -> ('', 'def')
    :def -> ('', 'def')    
    */
    
    var i = this.skipSpace(str, i);
    if ((i < 0)) {
        return -1;
    }
    var c = str.charAt(i);
    if (("0123456789-+".indexOf(c) >= 0)) {
        return -1;
    }
    if ((_notNameChars.indexOf(c) < 0)) {
        var ln = c;
        var i =  ( i + 1 ) ;
        while ((i < pyjslib_len(str))) {
            var c = str.charAt(i);
            if ((_notNameChars.indexOf(c) < 0)) {
                var ln =  ( ln + c ) ;
                var i =  ( i + 1 ) ;
            }
            else {
                break;
            }
        }
    }
    else {
        var ln = "";
    }
    if ((i < pyjslib_len(str)) && (str.charAt(i) == ":")) {
        var pfx = ln;
        var i =  ( i + 1 ) ;
        var ln = "";
        while ((i < pyjslib_len(str))) {
            var c = str.charAt(i);
            if ((_notNameChars.indexOf(c) < 0)) {
                var ln =  ( ln + c ) ;
                var i =  ( i + 1 ) ;
            }
            else {
                break;
            }
        }
        res.push(new pyjslib_Tuple([pfx, ln]));
        return i;
    }
    else {
        if (ln && this.keywordsSet && ($rdf.Util.ArrayIndexOf(this.keywords, ln) < 0)) {
            res.push(new pyjslib_Tuple(["", ln]));
            return i;
        }
        return -1;
    }
};
__SinkParser.prototype.object = function(str, i, res) {
    var j = this.subject(str, i, res);
    if ((j >= 0)) {
        return j;
    }
    else {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            return -1;
        }
        else {
            var i = j;
        }
        if ((str.charAt(i) == "\"")) {
            if ((pyjslib_slice(str, i,  ( i + 3 ) ) == "\"\"\"")) {
                var delim = "\"\"\"";
            }
            else {
                var delim = "\"";
            }
            var i =  ( i + pyjslib_len(delim) ) ;
            var pairFudge = this.strconst(str, i, delim);
            var j = pairFudge[0];
            var s = pairFudge[1];
            res.push(this._store.literal(s));
            diag_progress("New string const ", s, j);
            return j;
        }
        else {
            return -1;
        }
    }
};
__SinkParser.prototype.nodeOrLiteral = function(str, i, res) {
    var j = this.node(str, i, res);
    if ((j >= 0)) {
        return j;
    }
    else {
        var j = this.skipSpace(str, i);
        if ((j < 0)) {
            return -1;
        }
        else {
            var i = j;
        }
        var ch = str.charAt(i);
        if (("-+0987654321".indexOf(ch) >= 0)) {
            number_syntax.lastIndex = 0;
            var m = number_syntax.exec(str.slice(i));
            if ((m == null)) {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad number syntax");
            }
            var j =  ( i + number_syntax.lastIndex ) ;
            var val = pyjslib_slice(str, i, j);
            if ((val.indexOf("e") >= 0)) {
                res.push(this._store.literal(parseFloat(val), undefined, this._store.sym(FLOAT_DATATYPE)));
            }
            else if ((pyjslib_slice(str, i, j).indexOf(".") >= 0)) {
                res.push(this._store.literal(parseFloat(val), undefined, this._store.sym(DECIMAL_DATATYPE)));
            }
            else {
                res.push(this._store.literal(parseInt(val), undefined, this._store.sym(INTEGER_DATATYPE)));
            }
            return j;
        }
        if ((str.charAt(i) == "\"")) {
            if ((pyjslib_slice(str, i,  ( i + 3 ) ) == "\"\"\"")) {
                var delim = "\"\"\"";
            }
            else {
                var delim = "\"";
            }
            var i =  ( i + pyjslib_len(delim) ) ;
            var dt = null;
            var pairFudge = this.strconst(str, i, delim);
            var j = pairFudge[0];
            var s = pairFudge[1];
            var lang = null;
            if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "@")) {
                langcode.lastIndex = 0;
                
                var m = langcode.exec(str.slice( ( j + 1 ) ));
                if ((m == null)) {
                    throw BadSyntax(this._thisDoc, startline, str, i, "Bad language code syntax on string literal, after @");
                }
                var i =  (  ( langcode.lastIndex + j )  + 1 ) ;
                
                var lang = pyjslib_slice(str,  ( j + 1 ) , i);
                var j = i;
            }
            if ((pyjslib_slice(str, j,  ( j + 2 ) ) == "^^")) {
                var res2 = new pyjslib_List([]);
                var j = this.uri_ref2(str,  ( j + 2 ) , res2);
                var dt = res2[0];
            }
            res.push(this._store.literal(s, lang, dt));
            return j;
        }
        else {
            return -1;
        }
    }
};
__SinkParser.prototype.strconst = function(str, i, delim) {
    /*
    parse an N3 string constant delimited by delim.
    return index, val
    */
    
    var j = i;
    var ustr = "";
    var startline = this.lines;
    while ((j < pyjslib_len(str))) {
        var i =  ( j + pyjslib_len(delim) ) ;
        if ((pyjslib_slice(str, j, i) == delim)) {
            return new pyjslib_Tuple([i, ustr]);
        }
        if ((str.charAt(j) == "\"")) {
            var ustr =  ( ustr + "\"" ) ;
            var j =  ( j + 1 ) ;
            continue;
        }
        interesting.lastIndex = 0;
        var m = interesting.exec(str.slice(j));
        if (!(m)) {
            throw BadSyntax(this._thisDoc, startline, str, j,  (  (  ( "Closing quote missing in string at ^ in " + pyjslib_slice(str,  ( j - 20 ) , j) )  + "^" )  + pyjslib_slice(str, j,  ( j + 20 ) ) ) );
        }
        var i =  (  ( j + interesting.lastIndex )  - 1 ) ;
        var ustr =  ( ustr + pyjslib_slice(str, j, i) ) ;
        var ch = str.charAt(i);
        if ((ch == "\"")) {
            var j = i;
            continue;
        }
        else if ((ch == "\r")) {
            var j =  ( i + 1 ) ;
            continue;
        }
        else if ((ch == "\n")) {
            if ((delim == "\"")) {
                throw BadSyntax(this._thisDoc, startline, str, i, "newline found in string literal");
            }
            this.lines =  ( this.lines + 1 ) ;
            var ustr =  ( ustr + ch ) ;
            var j =  ( i + 1 ) ;
            this.previousLine = this.startOfLine;
            this.startOfLine = j;
        }
        else if ((ch == "\\")) {
            var j =  ( i + 1 ) ;
            var ch = pyjslib_slice(str, j,  ( j + 1 ) );
            if (!(ch)) {
                throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal (2)");
            }
            var k = string_find("abfrtvn\\\"", ch);
            if ((k >= 0)) {
                var uch = "\a\b\f\r\t\v\n\\\"".charAt(k);
                var ustr =  ( ustr + uch ) ;
                var j =  ( j + 1 ) ;
            }
            else if ((ch == "u")) {
                var pairFudge = this.uEscape(str,  ( j + 1 ) , startline);
                var j = pairFudge[0];
                var ch = pairFudge[1];
                var ustr =  ( ustr + ch ) ;
            }
            else if ((ch == "U")) {
                var pairFudge = this.UEscape(str,  ( j + 1 ) , startline);
                var j = pairFudge[0];
                var ch = pairFudge[1];
                var ustr =  ( ustr + ch ) ;
            }
            else {
                throw BadSyntax(this._thisDoc, this.lines, str, i, "bad escape");
            }
        }
    }
    throw BadSyntax(this._thisDoc, this.lines, str, i, "unterminated string literal");
};
__SinkParser.prototype.uEscape = function(str, i, startline) {
    var j = i;
    var count = 0;
    var value = 0;
    while ((count < 4)) {
        var chFudge = pyjslib_slice(str, j,  ( j + 1 ) );
        var ch = chFudge.toLowerCase();
        var j =  ( j + 1 ) ;
        if ((ch == "")) {
            throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal(3)");
        }
        var k = string_find("0123456789abcdef", ch);
        if ((k < 0)) {
            throw BadSyntax(this._thisDoc, startline, str, i, "bad string literal hex escape");
        }
        var value =  (  ( value * 16 )  + k ) ;
        var count =  ( count + 1 ) ;
    }
    var uch = String.fromCharCode(value);
    return new pyjslib_Tuple([j, uch]);
};
__SinkParser.prototype.UEscape = function(str, i, startline) {
    var j = i;
    var count = 0;
    var value = "\\U";
    while ((count < 8)) {
        var chFudge = pyjslib_slice(str, j,  ( j + 1 ) );
        var ch = chFudge.toLowerCase();
        var j =  ( j + 1 ) ;
        if ((ch == "")) {
            throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal(3)");
        }
        var k = string_find("0123456789abcdef", ch);
        if ((k < 0)) {
            throw BadSyntax(this._thisDoc, startline, str, i, "bad string literal hex escape");
        }
        var value =  ( value + ch ) ;
        var count =  ( count + 1 ) ;
    }
    var uch = stringFromCharCode( (  ( "0x" + pyjslib_slice(value, 2, 10) )  - 0 ) );
    return new pyjslib_Tuple([j, uch]);
};
function OLD_BadSyntax(uri, lines, str, i, why) {
    return new __OLD_BadSyntax(uri, lines, str, i, why);
}
function __OLD_BadSyntax(uri, lines, str, i, why) {
    this._str = str.encode("utf-8");
    this._str = str;
    this._i = i;
    this._why = why;
    this.lines = lines;
    this._uri = uri;
}
__OLD_BadSyntax.prototype.toString = function() {
    var str = this._str;
    var i = this._i;
    var st = 0;
    if ((i > 60)) {
        var pre = "...";
        var st =  ( i - 60 ) ;
    }
    else {
        var pre = "";
    }
    if (( ( pyjslib_len(str) - i )  > 60)) {
        var post = "...";
    }
    else {
        var post = "";
    }
    return "Line %i of <%s>: Bad syntax (%s) at ^ in:\n\"%s%s^%s%s\"" % new pyjslib_Tuple([ ( this.lines + 1 ) , this._uri, this._why, pre, pyjslib_slice(str, st, i), pyjslib_slice(str, i,  ( i + 60 ) ), post]);
};
function BadSyntax(uri, lines, str, i, why) {
    return  (  (  (  (  (  (  (  ( "Line " +  ( lines + 1 )  )  + " of <" )  + uri )  + ">: Bad syntax: " )  + why )  + "\nat: \"" )  + pyjslib_slice(str, i,  ( i + 30 ) ) )  + "\"" ) ;
}


function stripCR(str) {
    var res = "";
    
    var __ch = new pyjslib_Iterator(str);
    try {
        while (true) {
            var ch = __ch.next();
            
            
            if ((ch != "\r")) {
                var res =  ( res + ch ) ;
            }
            
        }
    } catch (e) {
        if (e != StopIteration) {
            throw e;
        }
    }
    
    return res;
}


function dummyWrite(x) {
}

return SinkParser;

}();
//  Identity management and indexing for RDF
//
// This file provides  IndexedFormula a formula (set of triples) which
// indexed by predicate, subject and object.
//
// It "smushes"  (merges into a single node) things which are identical 
// according to owl:sameAs or an owl:InverseFunctionalProperty
// or an owl:FunctionalProperty
//
//
//  2005-10 Written Tim Berners-Lee
//  2007    Changed so as not to munge statements from documents when smushing
//
// 

/*jsl:option explicit*/ // Turn on JavaScriptLint variable declaration checking

$rdf.IndexedFormula = function() {

var owl_ns = "http://www.w3.org/2002/07/owl#";
// var link_ns = "http://www.w3.org/2007/ont/link#";

/* hashString functions are used as array indeces. This is done to avoid
** conflict with existing properties of arrays such as length and map.
** See issue 139.
*/
$rdf.Literal.prototype.hashString = $rdf.Literal.prototype.toNT;
$rdf.Symbol.prototype.hashString = $rdf.Symbol.prototype.toNT;
$rdf.BlankNode.prototype.hashString = $rdf.BlankNode.prototype.toNT;
$rdf.Collection.prototype.hashString = $rdf.Collection.prototype.toNT;


//Stores an associative array that maps URIs to functions
$rdf.IndexedFormula = function(features) {
    this.statements = [];    // As in Formula
    this.optional = [];
    this.propertyActions = []; // Array of functions to call when getting statement with {s X o}
    //maps <uri> to [f(F,s,p,o),...]
    this.classActions = [];   // Array of functions to call when adding { s type X }
    this.redirections = [];   // redirect to lexically smaller equivalent symbol
    this.aliases = [];   // reverse mapping to redirection: aliases for this
    this.HTTPRedirects = []; // redirections we got from HTTP
    this.subjectIndex = [];  // Array of statements with this X as subject
    this.predicateIndex = [];  // Array of statements with this X as subject
    this.objectIndex = [];  // Array of statements with this X as object
    this.whyIndex = [];     // Array of statements with X as provenance
    this.index = [ this.subjectIndex, this.predicateIndex, this.objectIndex, this.whyIndex ];
    this.namespaces = {} // Dictionary of namespace prefixes
    if (features === undefined) features = ["sameAs",
                    "InverseFunctionalProperty", "FunctionalProperty"];
//    this.features = features
    // Callbackify?
    function handleRDFType(formula, subj, pred, obj, why) {
        if (formula.typeCallback != undefined)
            formula.typeCallback(formula, obj, why);

        var x = formula.classActions[obj.hashString()];
        var done = false;
        if (x) {
            for (var i=0; i<x.length; i++) {                
                done = done || x[i](formula, subj, pred, obj, why);
            }
        }
        return done; // statement given is not needed if true
    } //handleRDFType

    //If the predicate is #type, use handleRDFType to create a typeCallback on the object
    this.propertyActions[
	'<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>'] = [ handleRDFType ];

    // Assumption: these terms are not redirected @@fixme
    if ($rdf.Util.ArrayIndexOf(features,"sameAs") >= 0)
        this.propertyActions['<http://www.w3.org/2002/07/owl#sameAs>'] = [
	function(formula, subj, pred, obj, why) {
            // tabulator.log.warn("Equating "+subj.uri+" sameAs "+obj.uri);  //@@
            formula.equate(subj,obj);
            return true; // true if statement given is NOT needed in the store
	}]; //sameAs -> equate & don't add to index

    if ($rdf.Util.ArrayIndexOf(features,"InverseFunctionalProperty") >= 0)
        this.classActions["<"+owl_ns+"InverseFunctionalProperty>"] = [
            function(formula, subj, pred, obj, addFn) {
                return formula.newPropertyAction(subj, handle_IFP); // yes subj not pred!
            }]; //IFP -> handle_IFP, do add to index

    if ($rdf.Util.ArrayIndexOf(features,"FunctionalProperty") >= 0)
        this.classActions["<"+owl_ns+"FunctionalProperty>"] = [
            function(formula, subj, proj, obj, addFn) {
                return formula.newPropertyAction(subj, handle_FP);
            }]; //FP => handleFP, do add to index

    function handle_IFP(formula, subj, pred, obj)  {
        var s1 = formula.any(undefined, pred, obj);
        if (s1 == undefined) return false; // First time with this value
        // tabulator.log.warn("Equating "+s1.uri+" and "+subj.uri + " because IFP "+pred.uri);  //@@
        formula.equate(s1, subj);
        return true;
    } //handle_IFP

    function handle_FP(formula, subj, pred, obj)  {
        var o1 = formula.any(subj, pred, undefined);
        if (o1 == undefined) return false; // First time with this value
        // tabulator.log.warn("Equating "+o1.uri+" and "+obj.uri + " because FP "+pred.uri);  //@@
        formula.equate(o1, obj);
        return true ;
    } //handle_FP

} /* end IndexedFormula */

$rdf.IndexedFormula.prototype = new $rdf.Formula();
$rdf.IndexedFormula.prototype.constructor = $rdf.IndexedFormula;
$rdf.IndexedFormula.SuperClass = $rdf.Formula;

$rdf.IndexedFormula.prototype.newPropertyAction = function newPropertyAction(pred, action) {
    //$rdf.log.debug("newPropertyAction:  "+pred);
    var hash = pred.hashString();
    if (this.propertyActions[hash] == undefined)
        this.propertyActions[hash] = [];
    this.propertyActions[hash].push(action);
    // Now apply the function to to statements already in the store
    var toBeFixed = this.statementsMatching(undefined, pred, undefined);
    done = false;
    for (var i=0; i<toBeFixed.length; i++) { // NOT optimized - sort toBeFixed etc
        done = done || action(this, toBeFixed[i].subject, pred, toBeFixed[i].object);
    }
    return done;
}

$rdf.IndexedFormula.prototype.setPrefixForURI = function(prefix, nsuri) {
    //TODO:This is a hack for our own issues, which ought to be fixed post-release
    //See http://dig.csail.mit.edu/cgi-bin/roundup.cgi/$rdf/issue227
    if(prefix=="tab" && this.namespaces["tab"]) {
        return;
    }
    this.namespaces[prefix] = nsuri
}

// Deprocated ... name too generic
$rdf.IndexedFormula.prototype.register = function(prefix, nsuri) {
    this.namespaces[prefix] = nsuri
}


/** simplify graph in store when we realize two identifiers are equivalent

We replace the bigger with the smaller.

*/
$rdf.IndexedFormula.prototype.equate = function(u1, u2) {
    // tabulator.log.warn("Equating "+u1+" and "+u2); // @@
    //@@JAMBO Must canonicalize the uris to prevent errors from a=b=c
    //03-21-2010
    u1 = this.canon( u1 );
    u2 = this.canon( u2 );
    var d = u1.compareTerm(u2);
    if (!d) return true; // No information in {a = a}
    var big, small;
    if (d < 0)  {  // u1 less than u2
	    return this.replaceWith(u2, u1);
    } else {
	    return this.replaceWith(u1, u2);
    }
}

// Replace big with small, obsoleted with obsoleting.
//
$rdf.IndexedFormula.prototype.replaceWith = function(big, small) {
    //$rdf.log.debug("Replacing "+big+" with "+small) // @@
    var oldhash = big.hashString();
    var newhash = small.hashString();

    var moveIndex = function(ix) {
        var oldlist = ix[oldhash];
        if (oldlist == undefined) return; // none to move
        var newlist = ix[newhash];
        if (newlist == undefined) {
            ix[newhash] = oldlist;
        } else {
            ix[newhash] = oldlist.concat(newlist);
        }
        delete ix[oldhash];    
    }
    
    // the canonical one carries all the indexes
    for (var i=0; i<4; i++) {
        moveIndex(this.index[i]);
    }

    this.redirections[oldhash] = small;
    if (big.uri) {
        //@@JAMBO: must update redirections,aliases from sub-items, too.
	    if (this.aliases[newhash] == undefined)
	        this.aliases[newhash] = [];
	    this.aliases[newhash].push(big); // Back link
        
        if( this.aliases[oldhash] ) {
            for( var i = 0; i < this.aliases[oldhash].length; i++ ) {
                this.redirections[this.aliases[oldhash][i].hashString()] = small;
                this.aliases[newhash].push(this.aliases[oldhash][i]);
            }            
        }
        
	    this.add(small, this.sym('http://www.w3.org/2007/ont/link#uri'), big.uri)
        
	    // If two things are equal, and one is requested, we should request the other.
	    if (this.sf) {
	        this.sf.nowKnownAs(big, small)
	    }    
    }
    
    moveIndex(this.classActions);
    moveIndex(this.propertyActions);

    //$rdf.log.debug("Equate done. "+big+" to be known as "+small)    
    return true;  // true means the statement does not need to be put in
};

// Return the symbol with canonical URI as smushed
$rdf.IndexedFormula.prototype.canon = function(term) {
    if (term == undefined) return term;
    var y = this.redirections[term.hashString()];
    if (y == undefined) return term;
    return y;
}

// Compare by canonical URI as smushed
$rdf.IndexedFormula.prototype.sameThings = function(x, y) {
    if (x.sameTerm(y)) return true;
    var x1 = this.canon(x);
//    alert('x1='+x1);
    if (x1 == undefined) return false;
    var y1 = this.canon(y);
//    alert('y1='+y1); //@@
    if (y1 == undefined) return false;
    return (x1.uri == y1.uri);
}

// A list of all the URIs by which this thing is known
$rdf.IndexedFormula.prototype.uris = function(term) {
    var cterm = this.canon(term)
    var terms = this.aliases[cterm.hashString()];
    if (!cterm.uri) return []
    var res = [ cterm.uri ]
    if (terms != undefined) {
	for (var i=0; i<terms.length; i++) {
	    res.push(terms[i].uri)
	}
    }
    return res
}

// On input parameters, convert constants to terms
// 
function RDFMakeTerm(formula,val, canonicalize) {
    if (typeof val != 'object') {   
	    if (typeof val == 'string')
	        return new $rdf.Literal(val);
        if (typeof val == 'number')
            return new $rdf.Literal(val); // @@ differet types
        if (typeof val == 'boolean')
            return new $rdf.Literal(val?"1":"0", undefined, 
                                    $rdf.Symbol.prototype.XSDboolean);
	    else if (typeof val == 'number')
	        return new $rdf.Literal(''+val);   // @@ datatypes
	    else if (typeof val == 'undefined')
	        return undefined;
	    else    // @@ add converting of dates and numbers
	        throw "Can't make Term from " + val + " of type " + typeof val; 
    }
    return val;
}

// Add a triple to the store
//
//  Returns the statement added
// (would it be better to return the original formula for chaining?)
//
$rdf.IndexedFormula.prototype.add = function(subj, pred, obj, why) {
    var actions, st;
    if (why == undefined) why = this.fetcher ? this.fetcher.appNode: this.sym("chrome:theSession"); //system generated
                               //defined in source.js, is this OK with identity.js only user?
    subj = RDFMakeTerm(this, subj);
    pred = RDFMakeTerm(this, pred);
    obj = RDFMakeTerm(this, obj);
    why = RDFMakeTerm(this, why);
    
    var hash = [ this.canon(subj).hashString(), this.canon(pred).hashString(),
            this.canon(obj).hashString(), this.canon(why).hashString()];


    if (this.predicateCallback != undefined)
	this.predicateCallback(this, pred, why);
	
    // Action return true if the statement does not need to be added
    var actions = this.propertyActions[hash[1]]; // Predicate hash
    var done = false;
    if (actions) {
        // alert('type: '+typeof actions +' @@ actions='+actions);
        for (var i=0; i<actions.length; i++) {
            done = done || actions[i](this, subj, pred, obj, why);
        }
    }
    
    //If we are tracking provenanance, every thing should be loaded into the store
    //if (done) return new Statement(subj, pred, obj, why); // Don't put it in the store
                                                             // still return this statement for owl:sameAs input
    var st = new $rdf.Statement(subj, pred, obj, why);
    for (var i=0; i<4; i++) {
        var ix = this.index[i];
        var h = hash[i];
        if (ix[h] == undefined) ix[h] = [];
        ix[h].push(st); // Set of things with this as subject, etc
    }
    
    //$rdf.log.debug("ADDING    {"+subj+" "+pred+" "+obj+"} "+why);
    this.statements.push(st);
    return st;
}; //add


// Find out whether a given URI is used as symbol in the formula
$rdf.IndexedFormula.prototype.mentionsURI = function(uri) {
    var hash = '<' + uri + '>';
    return (!!this.subjectIndex[hash] || !!this.objectIndex[hash]
            || !!this.predicateIndex[hash]);
}

// Find an unused id for a file being edited: return a symbol
// (Note: Slow iff a lot of them -- could be O(log(k)) )
$rdf.IndexedFormula.prototype.nextSymbol = function(doc) {
    for(var i=0;;i++) {
        var uri = doc.uri + '#n' + i;
        if (!this.mentionsURI(uri)) return this.sym(uri);
    }
}


$rdf.IndexedFormula.prototype.anyStatementMatching = function(subj,pred,obj,why) {
    var x = this.statementsMatching(subj,pred,obj,why,true);
    if (!x || x == []) return undefined;
    return x[0];
};


// Return statements matching a pattern
// ALL CONVENIENCE LOOKUP FUNCTIONS RELY ON THIS!
$rdf.IndexedFormula.prototype.statementsMatching = function(subj,pred,obj,why,justOne) {
    //$rdf.log.debug("Matching {"+subj+" "+pred+" "+obj+"}");
    
    var pat = [ subj, pred, obj, why ];
    var pattern = [];
    var hash = [];
    var wild = []; // wildcards
    var given = []; // Not wild
    for (var p=0; p<4; p++) {
        pattern[p] = this.canon(RDFMakeTerm(this, pat[p]));
        if (pattern[p] == undefined) {
            wild.push(p);
        } else {
            given.push(p);
            hash[p] = pattern[p].hashString();
        }
    }
    if (given.length == 0) {
        return this.statements;
    }
    if (given.length == 1) {  // Easy too, we have an index for that
        var p = given[0];
        var list = this.index[p][hash[p]];
        if(list && justOne) {
            if(list.length>1)
                list = list.slice(0,1);
        }
        return list == undefined ? [] : list;
    }
    
    // Now given.length is 2, 3 or 4.
    // We hope that the scale-free nature of the data will mean we tend to get
    // a short index in there somewhere!
    
    var best = 1e10; // really bad
    var best_i;
    for (var i=0; i<given.length; i++) {
        var p = given[i]; // Which part we are dealing with
        var list = this.index[p][hash[p]];
        if (list == undefined) return []; // No occurrences
        if (list.length < best) {
            best = list.length;
            best_i = i;  // (not p!)
        }
    }
    
    // Ok, we have picked the shortest index but now we have to filter it
    var best_p = given[best_i];
    var possibles = this.index[best_p][hash[best_p]];
    var check = given.slice(0, best_i).concat(given.slice(best_i+1)) // remove best_i
    var results = [];
    var parts = [ 'subject', 'predicate', 'object', 'why'];
    for (var j=0; j<possibles.length; j++) {
        var st = possibles[j];
        for (var i=0; i <check.length; i++) { // for each position to be checked
            var p = check[i];
            if (!this.canon(st[parts[p]]).sameTerm(pattern[p])) {
                st = null; 
                break;
            }
        }
        if (st != null) results.push(st);
    }

    if(justOne) {
        if(results.length>1)
            results = results.slice(0,1);
    }
    return results;
}; // statementsMatching

/** remove a particular statement from the bank **/
$rdf.IndexedFormula.prototype.remove = function (st) {
    //$rdf.log.debug("entering remove w/ st=" + st);
    var term = [ st.subject, st.predicate, st.object, st.why];
    for (var p=0; p<4; p++) {
        var c = this.canon(term[p]);
        var h = c.hashString();
        if (this.index[p][h] == undefined) {
            //$rdf.log.warn ("Statement removal: no index '+p+': "+st);
        } else {
            $rdf.Util.RDFArrayRemove(this.index[p][h], st);
        }
    }
    $rdf.Util.RDFArrayRemove(this.statements, st);
}; //remove

/** remove all statements matching args (within limit) **/
$rdf.IndexedFormula.prototype.removeMany = function (subj, pred, obj, why, limit) {
    //$rdf.log.debug("entering removeMany w/ subj,pred,obj,why,limit = " + subj +", "+ pred+", " + obj+", " + why+", " + limit);
    var sts = this.statementsMatching (subj, pred, obj, why, false);
    //This is a subtle bug that occcured in updateCenter.js too.
    //The fact is, this.statementsMatching returns this.whyIndex instead of a copy of it
    //but for perfromance consideration, it's better to just do that
    //so make a copy here.
    var statements = [];
    for (var i=0;i<sts.length;i++) statements.push(sts[i]);
    if (limit) statements = statements.slice(0, limit);
    for (var i=0;i<statements.length;i++) this.remove(statements[i]);
}; //removeMany

/** Utility**/

/*  @method: copyTo
    @description: replace @template with @target and add appropriate triples (no triple removed)
                  one-direction replication 
*/ 
$rdf.IndexedFormula.prototype.copyTo = function(template,target,flags){
    if (!flags) flags=[];
    var statList=this.statementsMatching(template);
    if ($rdf.Util.ArrayIndexOf(flags,'two-direction')!=-1) 
        statList.concat(this.statementsMatching(undefined,undefined,template));
    for (var i=0;i<statList.length;i++){
        var st=statList[i];
        switch (st.object.termType){
            case 'symbol':
                this.add(target,st.predicate,st.object);
                break;
            case 'literal':
            case 'bnode':
            case 'collection':
                this.add(target,st.predicate,st.object.copy(this));
        }
        if ($rdf.Util.ArrayIndexOf(flags,'delete')!=-1) this.remove(st);
    }
};
//for the case when you alter this.value (text modified in userinput.js)
$rdf.Literal.prototype.copy = function(){ 
    return new $rdf.Literal(this.value,this.lang,this.datatype);
};
$rdf.BlankNode.prototype.copy = function(formula){ //depends on the formula
    var bnodeNew=new $rdf.BlankNode();
    formula.copyTo(this,bnodeNew);
    return bnodeNew;
}
/**  Full N3 bits  -- placeholders only to allow parsing, no functionality! **/

$rdf.IndexedFormula.prototype.newUniversal = function(uri) {
    var x = this.sym(uri);
    if (!this._universalVariables) this._universalVariables = [];
    this._universalVariables.push(x);
    return x;
}

$rdf.IndexedFormula.prototype.newExistential = function(uri) {
    if (!uri) return this.bnode();
    var x = this.sym(uri);
    return this.declareExistential(x);
}

$rdf.IndexedFormula.prototype.declareExistential = function(x) {
    if (!this._existentialVariables) this._existentialVariables = [];
    this._existentialVariables.push(x);
    return x;
}

$rdf.IndexedFormula.prototype.formula = function(features) {
    return new $rdf.IndexedFormula(features);
}

$rdf.IndexedFormula.prototype.close = function() {
    return this;
}

$rdf.IndexedFormula.prototype.hashString = $rdf.IndexedFormula.prototype.toNT;

return $rdf.IndexedFormula;

}();
// ends
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
 * @param       onDone          callback when 
 */
$rdf.IndexedFormula.prototype.query = function(myQuery, callback, fetcher, onDone) {
    var kb = this;
    $rdf.log.info("Query:"+myQuery.pat+", fetcher="+fetcher+"\n");
        tabulator.log.error("@@@@ query.js 4: "+$rdf.log.error); // @@ works
        $rdf.log.error("@@@@ query.js 5");  // @@

    ///////////// Debug strings

    function bindingsDebug(nbs) {
        var str = "Bindings: ";
        var i, n=nbs.length;
        for (i=0; i<n; i++) {
            str+= bindingDebug(nbs[i][0])+';\n\t';
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


// Unification: see also 
//  http://www.w3.org/2000/10/swap/term.py
// for similar things in python
//
// Unification finds all bindings such that when the binding is applied
// to one term it is equal to the other.
// Returns: a list of bindings, where a binding is an associative array
//  mapping variuable to value.


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
    } // RDFArrayUnifyContents



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
        // if (!f.statements) $rdf.log.warn("@@@ prepare: f is "+f);
    //    $rdf.log.debug("Prepare: f has "+ f.statements.length);
        //$rdf.log.debug("Prepare: Kb size "+f.statements.length+" Preparing "+item);
        
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
                    // $rdf.log.debug("prepare: no occurrence [yet?] of term: "+ t);
                    item.index = [];
                    }
            }
        }
            
        if (item.index == null) item.index = f.statements;
        // $rdf.log.debug("Prep: index length="+item.index.length+" for "+item)
        // $rdf.log.debug("prepare: index length "+item.index.length +" for "+ item);
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
    * @param localCallback - function(bindings, pattern, branch) called on sucess
    * @returns nothing 
    *
    * Will fetch linked data from the web iff the knowledge base an associated source fetcher (f.sf)
    ***/
    function match(f, g, bindingsSoFar, level, fetcher, localCallback, branch) {
        $rdf.log.debug("Match begins, Branch count now: "+branch.count+" for "+branch.pattern_debug);
        var sf = null;
        if( typeof f.sf != 'undefined' ) {
            sf = f.sf;
        }
        //$rdf.log.debug("match: f has "+f.statements.length+", g has "+g.statements.length)
        var pattern = g.statements;
        if (pattern.length == 0) { //when it's satisfied all the pattern triples

            $rdf.log.debug("FOUND MATCH WITH BINDINGS:"+bindingDebug(bindingsSoFar));
            if (g.optional.length==0) branch.reportMatch(bindingsSoFar);
            else {
                $rdf.log.debug("OPTIONAL: "+g.optional);
                var junction = new OptionalBranchJunction(callback, bindingsSoFar); // @@ won't work with nested optionals? nest callbacks
                var br = [], b;
                for (b =0; b < g.optional.length; b++) {
                    br[b] = new OptionalBranch(junction); // Allocate branches to prevent premature ending
                    br[b].pattern_debug = g.optional[b]; // for diagnotics only
                }
                for (b =0; b < g.optional.length; b++) {
                    br[b].count =  br[b].count + 1;  // Count how many matches we have yet to complete
                    match(f, g.optional[b], bindingsSoFar, '', fetcher, callback, br[b]);
                }
            }
            branch.count--;
            $rdf.log.debug("Match ends -- success , Branch count now: "+branch.count+" for "+branch.pattern_debug);
            return; // Success
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

                        match(f, g, bindingsSoFar, level, fetcher, // match not match2 to look up any others necessary.
                                          localCallback, branch)
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
                    return; // only look up one per line this time, but we will come back again though match
                } else if (item.object in bindingsSoFar
                           && bindingsSoFar[item.object].uri
                           && sf && sf.getState($rdf.Util.uri.docpart(bindingsSoFar[item.object].uri)) == "unrequested") {
                    fetchResource(bindingsSoFar[item.object], id)
                    return;
                }
            }
        } // if fetcher
        match2(f, g, bindingsSoFar, level, fetcher, localCallback, branch)        
        return;
    } // match

    /** match2 -- stuff after the fetch **/
    function match2(f, g, bindingsSoFar, level, fetcher, callback, branch) //post-fetch
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
        $rdf.log.debug(level + "match2 searching "+item.index.length+ " for "+item+
                "; bindings so far="+bindingDebug(bindingsSoFar));
        //var results = [];
        var c, nc=item.index.length, nbs1;
        //var x;
        for (c=0; c<nc; c++) {   // For each candidate statement
            var st = item.index[c]; //for each statement in the item's index, spawn a new match with that binding 
            nbs1 = RDFArrayUnifyContents(
                    [item.subject, item.predicate, item.object],
            [st.subject, st.predicate, st.object], bindingsSoFar, f);
            $rdf.log.info(level+" From first: "+nbs1.length+": "+bindingsDebug(nbs1))
            var k, nk=nbs1.length, nb1, v;
            //branch.count += nk;
            //$rdf.log.debug("Branch count bumped "+nk+" to: "+branch.count);
            for (k=0; k<nk; k++) {  // For each way that statement binds
                var bindings2 = [];
                var newBindings1 = nbs1[k][0]; 
                if (!constraintsSatisfied(newBindings1,g.constraints)) {
                    //branch.count--;
                    $rdf.log.debug("Branch count CS: "+branch.count);
                    continue;}
                for (var v in newBindings1){
                    bindings2[v] = newBindings1[v]; // copy
                }
                for (var v in bindingsSoFar) {
                    bindings2[v] = bindingsSoFar[v]; // copy
                }
                
                branch.count++;  // Count how many matches we have yet to complete
                match(f, rest, bindings2, level+ '  ', fetcher, callback, branch); //call match
            }
        }
        branch.count--;
        $rdf.log.debug("Match2 ends, Branch count: "+branch.count +" for "+branch.pattern_debug);
        if (branch.count == 0)
        {
            $rdf.log.debug("Branch finished.");
            branch.reportDone(branch);
        }
    } //match2

    function constraintsSatisfied(bindings,constraints)
    {
        var res=true;
        for (var x in bindings) {
            if (constraints[x]) {
                var test = constraints[x].test;
                if (test && !test(bindings[x]))
                        res=false;
            }
        }
        return res;
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


    // When there are OPTIONAL clauses, we must return bindings without them if none of them
    // succeed. However, if any of them do succeed, we should not.  (This is what branchCount()
    // tracked. The problem currently is (2011/7) that when several optionals exist, and they
    // all match, multiple sets of bindings are returned, each with one optional filled in.)
    
    union = function(a,b) {
       var c= {};
       var x;
       for (x in a) c[x] = a[x];
       for (x in b) c[x] = b[x];
       return c
    }
    
    function OptionalBranchJunction(originalCallback, trunkBindings) {
        this.trunkBindings = trunkBindings;
        this.originalCallback = originalCallback;
        this.branches = [];
        //this.results = []; // result[i] is an array of bindings for branch i
        //this.done = {};  // done[i] means all/any results are in for branch i
        //this.count = {};
        return this;
    }

    OptionalBranchJunction.prototype.checkAllDone = function() {
        for (var i=0; i<this.branches.length; i++) if (!this.branches[i].done) return;
        $rdf.log.debug("OPTIONAL BIDNINGS ALL DONE:");
        this.doCallBacks(this.branches.length-1, this.trunkBindings);
    
    };
    // Recrursively generate the cross product of the bindings
    OptionalBranchJunction.prototype.doCallBacks = function(b, bindings) {
        if (b < 0) return this.originalCallback(bindings); 
        for (var j=0; j < this.branches[b].results.length; j++) {
            this.doCallBacks(b-1, union(bindings, this.branches[b].results[j]));
        }
    };
    
    // A mandatory branch is the normal one, where callbacks
    // are made immediately and no junction is needed.
    // Might be useful for onFinsihed callback for query API.
    function MandatoryBranch(callback, onDone) {
        this.count = 0;
        this.success = false;
        this.done = false;
        // this.results = [];
        this.callback = callback;
        this.onDone = onDone;
        // this.junction = junction;
        // junction.branches.push(this);
        return this;
    }
    
    MandatoryBranch.prototype.reportMatch = function(bindings) {
        tabulator.log.error("@@@@ query.js 1"); // @@
        $rdf.log.error("@@@@ query.js 2");  // @@
        this.callback(bindings);
        this.success = true;
    };

    MandatoryBranch.prototype.reportDone = function(b) {
        this.done = true;
        $rdf.log.info("Mandatory query branch finished.***")
        if (this.onDone != undefined) this.onDone();
    };


    // An optional branch hoards its results.
    function OptionalBranch(junction) {
        this.count = 0;
        this.done = false;
        this.results = [];
        this.junction = junction;
        junction.branches.push(this);
        return this;
    }
    
    OptionalBranch.prototype.reportMatch = function(bindings) {
        this.results.push(bindings);
    };

    OptionalBranch.prototype.reportDone = function() {
        $rdf.log.debug("Optional branch finished - results.length = "+this.results.length);
        if (this.results.length == 0) {// This is what optional means: if no hits,
            this.results.push({});  // mimic success, but with no bindings
            $rdf.log.debug("Optional branch FAILED - that's OK.");
        }
        this.done = true;
        this.junction.checkAllDone();
    };

    var trunck = new MandatoryBranch(callback, onDone);
    trunck.count++; // count one branch to complete at the moment
    setTimeout(function() { match(f, myQuery.pat, myQuery.pat.initBindings, '', fetcher, callback, trunck /*branch*/ ); }, 0);
    
    return; //returns nothing; callback does the work
}; //query
//Converting between SPARQL queries and the $rdf query API

/*

function SQuery ()
{
	this.terms = [];
	return this;
}
	
STerm.prototype.toString = STerm.val;
SQuery.prototype.add = function (str) {this.terms.push()}*/

$rdf.queryToSPARQL = function(query)
{	
	var indent=0;
	function getSelect (query)
	{
		var str=addIndent()+"SELECT ";
		for (i=0;i<query.vars.length;i++)
			str+=query.vars[i]+" ";
		str+="\n";
		return str;
	}
	
	function getPattern (pat)
	{
		var str = "";
		var st = pat.statements;
		for (x in st)
		{
			$rdf.log.debug("Found statement: "+st)
			str+=addIndent()+st[x]+"\n";
		}
		return str;
	}
	
	function getConstraints (pat)
	{
		var str="";
		for (v in pat.constraints)
		{
			var foo = pat.constraints[v]
			str+=addIndent()+"FILTER ( "+foo.describe(v)+" ) "+"\n"
		}
		return str;
	}
	
	function getOptionals (pat)
	{
		var str = ""
		for (var x=0;x<pat.optional.length;x++)
		{
			//alert(pat.optional.termType)
			$rdf.log.debug("Found optional query")
			str+= addIndent()+"OPTIONAL { "+"\n";
			indent++;
			str+= getPattern (pat.optional[x])
			str+= getConstraints (pat.optional[x])
			str+= getOptionals (pat.optional[x])
			indent--;
			str+=addIndent()+"}"+"\n";
		}
	return str;
	}
	
	function getWhere (pat)
	{
		var str = addIndent() + "WHERE \n" + "{ \n";
		indent++;
		str+= getPattern (pat);
		str+= getConstraints (pat);
		str+= getOptionals (pat);
		indent--;
		str+="}"
		return str;
	}
	
	function addIndent()
	{
		var str="";
		for (i=0;i<indent;i++)
			str+="    ";
		return str;
	}
	
	function getSPARQL (query)
	{
		return getSelect(query) + getWhere(query.pat);
	}
		
	return getSPARQL (query)
}

/**
 * @SPARQL: SPARQL text that is converted to a query object which is returned.
 * @testMode: testing flag. Prevents loading of sources.
 */
 
$rdf.SPARQLToQuery = function(SPARQL, testMode, kb)
{
	//AJAR_ClearTable();
	var variableHash = []
	function makeVar(name) {
		if (variableHash[name])
			return variableHash[name]
		var newVar = kb.variable(name);
		variableHash[name] = newVar;
		return newVar
	}
	
	//term type functions			
	function isRealText(term) { return (typeof term == 'string' && term.match(/[^ \n\t]/)) }
	function isVar(term) { return (typeof term == 'string' && term.match(/^[\?\$]/)) }
	function fixSymbolBrackets(term) { if (typeof term == 'string') return term.replace(/^&lt;/,"<").replace(/&gt;$/,">"); else return term }
	function isSymbol(term) { return (typeof term == 'string' && term.match(/^<[^>]*>$/)) }
	function isBnode(term) { return (typeof term == 'string' && (term.match(/^_:/)||term.match(/^$/))) }
	function isPrefix(term) { return (typeof term == 'string' && term.match(/:$/)) }
	function isPrefixedSymbol(term) { return (typeof term == 'string' && term.match(/^:|^[^_][^:]*:/)) } 
	function getPrefix(term) { var a = term.split(":"); return a[0] }
	function getSuffix(term) { var a = term.split(":"); return a[1] }
	function removeBrackets(term) { if (isSymbol(term)) {return term.slice(1,term.length-1)} else return term }	
	//takes a string and returns an array of strings and Literals in the place of literals
	function parseLiterals (str)
	{
		//var sin = (str.indexOf(/[ \n]\'/)==-1)?null:str.indexOf(/[ \n]\'/), doub = (str.indexOf(/[ \n]\"/)==-1)?null:str.indexOf(/[ \n]\"/);
		var sin = (str.indexOf("'")==-1)?null:str.indexOf("'"), doub = (str.indexOf('"')==-1)?null:str.indexOf('"');
		//alert("S: "+sin+" D: "+doub);
		if (!sin && !doub)
		{
			var a = new Array(1);
			a[0]=str;
			return a;
		}	
		var res = new Array(2);
		if (!sin || (doub && doub<sin)) {var br='"'; var ind = doub}
		else if (!doub || (sin && sin<doub)) {var br="'"; var ind = sin}
		else {$rdf.log.error ("SQARQL QUERY OOPS!"); return res}
		res[0] = str.slice(0,ind);
		var end = str.slice(ind+1).indexOf(br);
		if (end==-1) 
		{
			$rdf.log.error("SPARQL parsing error: no matching parentheses in literal "+str);
			return str;
		}
		//alert(str.slice(end+ind+2).match(/^\^\^/))
		if (str.slice(end+ind+2).match(/^\^\^/))
		{
			var end2 = str.slice(end+ind+2).indexOf(" ")
			//alert(end2)
			res[1]=kb.literal(str.slice(ind+1,ind+1+end),"",kb.sym(removeBrackets(str.slice(ind+4+end,ind+2+end+end2))))
			//alert(res[1].datatype.uri)
			res = res.concat(parseLiterals(str.slice(end+ind+3+end2)));
		}
		else if (str.slice(end+ind+2).match(/^@/))
		{
			var end2 = str.slice(end+ind+2).indexOf(" ")
			//alert(end2)
			res[1]=kb.literal(str.slice(ind+1,ind+1+end),str.slice(ind+3+end,ind+2+end+end2),null)
			//alert(res[1].datatype.uri)
			res = res.concat(parseLiterals(str.slice(end+ind+2+end2)));
		}
		
		else 
		{
		res[1]=kb.literal(str.slice(ind+1,ind+1+end),"",null)
		$rdf.log.info("Literal found: "+res[1]);
		res = res.concat(parseLiterals(str.slice(end+ind+2))); //finds any other literals
		}
		return res;
	}
	
	
	function spaceDelimit (str)
	{
		var str = str.replace(/\(/g," ( ").replace(/\)/g," ) ").replace(/</g," <").replace(/>/g,"> ").replace(/{/g," { ").replace(/}/g," } ").replace(/[\t\n\r]/g," ").replace(/; /g," ; ").replace(/\. /g," . ").replace(/, /g," , ");
		$rdf.log.info("New str into spaceDelimit: \n"+str)
		var res=[];
		var br = str.split(" ");
		for (x in br)
		{
			if (isRealText(br[x]))
				res = res.concat(br[x]);
		}
		return res;
	}
	
	function replaceKeywords(input) {
		var strarr = input;
		for (var x=0;x<strarr.length;x++)
		{
			if (strarr[x]=="a") strarr[x] = "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>";
			if (strarr[x]=="is" && strarr[x+2]=="of") 
			{
				strarr.splice(x,1);
				strarr.splice(x+1,1) ;
				var s = strarr[x-1];
				strarr[x-1] = strarr[x+1];
				strarr[x+1] = s;
			}
		}
		return strarr;
	}
	
	function toTerms (input)
	{
		var res = []
		for (var x=0;x<input.length;x++)
		{
			if (typeof input[x] != 'string') { res[x]=input[x]; continue }
			input[x]=fixSymbolBrackets(input[x])
			if (isVar(input[x]))
				res[x] = makeVar(input[x].slice(1));
			else if (isBnode(input[x]))
			{
				$rdf.log.info(input[x]+" was identified as a bnode.")
				res[x] = kb.bnode();
			}
			else if (isSymbol(input[x]))
			{
				$rdf.log.info(input[x]+" was identified as a symbol.");
				res[x] = kb.sym(removeBrackets(input[x]));
			}
			else if (isPrefixedSymbol(input[x]))
			{
				$rdf.log.info(input[x]+" was identified as a prefixed symbol");
				if (prefixes[getPrefix(input[x])])
					res[x] = kb.sym(input[x] = prefixes[getPrefix(input[x])]+getSuffix(input[x]));
				else
				{
					$rdf.log.error("SPARQL error: "+input[x]+" with prefix "+getPrefix(input[x])+" does not have a correct prefix entry.")
					res[x]=input[x]
				}
			}
			else res[x]=input[x];
		}
		return res;
	}
	
	function tokenize (str)
	{
		var token1 = parseLiterals(str);
		var token2=[];
		for (x in token1)
		{
			if (typeof token1[x] == 'string')
				token2=token2.concat(spaceDelimit(token1[x]));
			else
				token2=token2.concat(token1[x])
		}
	token2 = replaceKeywords(token2);
	$rdf.log.info("SPARQL Tokens: "+token2);
	return token2;
    }
    
    //CASE-INSENSITIVE
	function arrayIndexOf (str,arr)
	{
		for (i=0; i<arr.length; i++)
		{
			if (typeof arr[i] != 'string') continue;
			if (arr[i].toLowerCase()==str.toLowerCase())
				return i;
		}
		//$rdf.log.warn("No instance of "+str+" in array "+arr);
		return null;
	}
	
	//CASE-INSENSITIVE
	function arrayIndicesOf (str,arr)
	{
		var ind = [];
		for (i=0; i<arr.length; i++)
		{
			if (typeof arr[i] != 'string') continue;
			if (arr[i].toLowerCase()==str.toLowerCase())
				ind.push(i)
		}
		return ind;
	}
				
	
	function setVars (input,query)
	{
		$rdf.log.info("SPARQL vars: "+input);
		for (x in input)
		{
			if (isVar(input[x]))
			{
				$rdf.log.info("Added "+input[x]+" to query variables from SPARQL");
				var v = makeVar(input[x].slice(1));
				query.vars.push(v);
				v.label=input[x].slice(1);

			}
			else
				$rdf.log.warn("Incorrect SPARQL variable in SELECT: "+input[x]);
		}
	}
	

	function getPrefixDeclarations (input)
	{
		
		var prefInd = arrayIndicesOf ("PREFIX",input), res = [];
		for (i in prefInd)
		{
			var a = input[prefInd[i]+1], b = input[prefInd[i]+2];
			if (!isPrefix(a))
				$rdf.log.error("Invalid SPARQL prefix: "+a);
			else if (!isSymbol(b))
				$rdf.log.error("Invalid SPARQL symbol: "+b);
			else
			{
				$rdf.log.info("Prefix found: "+a+" -> "+b);
				var pref = getPrefix(a), symbol = removeBrackets(b);
				res[pref]=symbol;
			}
		}
		return res;
	}
	
	function getMatchingBracket(arr,open,close)
	{
		$rdf.log.info("Looking for a close bracket of type "+close+" in "+arr);
		var index = 0
		for (i=0;i<arr.length;i++)
		{
			if (arr[i]==open) index++;
			if (arr[i]==close) index--;
			if (index<0) return i;
		}
		$rdf.log.error("Statement had no close parenthesis in SPARQL query");
		return 0;
	}
	

	
    function constraintGreaterThan (value)
    {
        this.describe = function (varstr) { return varstr + " > "+value.toNT() }
        this.test = function (term) {
            if (term.value.match(/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/))
                return (parseFloat(term.value) > parseFloat(value)); 
            else return (term.toNT() > value.toNT()); 
        }
        return this;
    }
    
    function constraintLessThan (value) //this is not the recommended usage. Should only work on literal, numeric, dateTime
    {
        this.describe = function (varstr) { return varstr + " < "+value.toNT() }
        this.test = function (term) {
            //this.describe = function (varstr) { return varstr + " < "+value }
            if (term.value.match(/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/))
                return (parseFloat(term.value) < parseFloat(value)); 
            else return (term.toNT() < value.toNT()); 
        }
        return this;
    }
    
    function constraintEqualTo (value) //This should only work on literals but doesn't.
    {
        this.describe = function (varstr) { return varstr + " = "+value.toNT() }
        this.test = function (term) {
            return value.sameTerm(term)
        }
        return this;
    }
    
    function constraintRegexp (value) //value must be a literal
    {
        this.describe = function (varstr) { return "REGEXP( '"+value+"' , "+varstr+" )"}
        this.test=function(term) { 
            var str = value;
            //str = str.replace(/^//,"").replace(//$/,"")
            var rg = new RegExp(str); 
            if (term.value) return rg.test(term.value); 
            else return false;
        }
    }					
	

	function setConstraint(input,pat)
	{
		if (input.length == 3 && input[0].termType=="variable" && (input[2].termType=="symbol" || input[2].termType=="literal"))
		{
			if (input[1]=="=")
			{
				$rdf.log.debug("Constraint added: "+input)
				pat.constraints[input[0]]=new constraintEqualTo(input[2])
			}
			else if (input[1]==">")
			{
				$rdf.log.debug("Constraint added: "+input)
				pat.constraints[input[0]]=new constraintGreaterThan(input[2])
			}
			else if (input[1]=="<")
			{
				$rdf.log.debug("Constraint added: "+input)
				pat.constraints[input[0]]=new constraintLessThan(input[2])
			}
			else
				$rdf.log.warn("I don't know how to handle the constraint: "+input);
		}
		else if (input.length == 6 && typeof input[0] == 'string' && input[0].toLowerCase() == 'regexp' 
					&& input[1] == '(' && input[5] == ')' && input[3] == ',' && input[4].termType == 'variable'
					&& input[2].termType == 'literal')
					{
						$rdf.log.debug("Constraint added: "+input)
						pat.constraints[input[4]]=new constraintRegexp(input[2].value)
					}
		
			//$rdf.log.warn("I don't know how to handle the constraint: "+input);
		
		//alert("length: "+input.length+" input 0 type: "+input[0].termType+" input 1: "+input[1]+" input[2] type: "+input[2].termType);
	}
	

	
	function setOptional (terms, pat)
	{
		$rdf.log.debug("Optional query: "+terms+" not yet implemented.");
		var opt = kb.formula();
		setWhere (terms, opt)
		pat.optional.push(opt);
	}
	
	function setWhere (input,pat)
	{
		var terms = toTerms(input)
		$rdf.log.debug("WHERE: "+terms)
		//var opt = arrayIndicesOf("OPTIONAL",terms);
		while (arrayIndexOf("OPTIONAL",terms))
		{
			opt = arrayIndexOf("OPTIONAL",terms)
			$rdf.log.debug("OPT: "+opt+" "+terms[opt]+" in "+terms);
			if (terms[opt+1]!="{") $rdf.log.warn("Bad optional opening bracket in word "+opt)
			var end = getMatchingBracket(terms.slice(opt+2),"{","}")
			if (end == -1) $rdf.log.error("No matching bracket in word "+opt)
			else
			{
				setOptional(terms.slice(opt+2,opt+2+end),pat);
				//alert(pat.statements[0].toNT())
				opt = arrayIndexOf("OPTIONAL",terms)
				end = getMatchingBracket(terms.slice(opt+2),"{","}")
				terms.splice(opt,end+3)
			}
		}
		$rdf.log.debug("WHERE after optionals: "+terms)
		while (arrayIndexOf("FILTER",terms))
		{
			var filt = arrayIndexOf("FILTER",terms);
			if (terms[filt+1]!="(") $rdf.log.warn("Bad filter opening bracket in word "+filt);
			var end = getMatchingBracket(terms.slice(filt+2),"(",")")
			if (end == -1) $rdf.log.error("No matching bracket in word "+filt)
			else
			{
				setConstraint(terms.slice(filt+2,filt+2+end),pat);
				filt = arrayIndexOf("FILTER",terms)
				end = getMatchingBracket(terms.slice(filt+2),"(",")")
				terms.splice(filt,end+3)
			}
		}
		$rdf.log.debug("WHERE after filters and optionals: "+terms)
		extractStatements (terms,pat)	
	}
	
	function extractStatements (terms, formula)
	{
		var arrayZero = new Array(1); arrayZero[0]=-1;  //this is just to add the beginning of the where to the periods index.
		var per = arrayZero.concat(arrayIndicesOf(".",terms));
		var stat = []
		for (var x=0;x<per.length-1;x++)
			stat[x]=terms.slice(per[x]+1,per[x+1])
		//Now it's in an array of statements
		for (x in stat)                             //THIS MUST BE CHANGED FOR COMMA, SEMICOLON
		{
			$rdf.log.info("s+p+o "+x+" = "+stat[x])
			var subj = stat[x][0]
			stat[x].splice(0,1)
			var sem = arrayZero.concat(arrayIndicesOf(";",stat[x]))
			sem.push(stat[x].length);
			var stat2 = []
			for (y=0;y<sem.length-1;y++)
				stat2[y]=stat[x].slice(sem[y]+1,sem[y+1])
			for (x in stat2)
			{
				$rdf.log.info("p+o "+x+" = "+stat[x])
				var pred = stat2[x][0]
				stat2[x].splice(0,1)
				var com = arrayZero.concat(arrayIndicesOf(",",stat2[x]))
				com.push(stat2[x].length);
				var stat3 = []
				for (y=0;y<com.length-1;y++)
					stat3[y]=stat2[x].slice(com[y]+1,com[y+1])
				for (x in stat3)
				{
					var obj = stat3[x][0]
					$rdf.log.info("Subj="+subj+" Pred="+pred+" Obj="+obj)
					formula.add(subj,pred,obj)
				}
			}
		}
	}
		
	//*******************************THE ACTUAL CODE***************************//	
	$rdf.log.info("SPARQL input: \n"+SPARQL);
	var q = new $rdf.Query();
	var sp = tokenize (SPARQL); //first tokenize everything
	var prefixes = getPrefixDeclarations(sp);
	if (!prefixes["rdf"]) prefixes["rdf"]="http://www.w3.org/1999/02/22-rdf-syntax-ns#";
	if (!prefixes["rdfs"]) prefixes["rdfs"]="http://www.w3.org/2000/01/rdf-schema#";
	var selectLoc = arrayIndexOf("SELECT", sp), whereLoc = arrayIndexOf("WHERE", sp);
	if (selectLoc<0 || whereLoc<0 || selectLoc>whereLoc)
	{
		$rdf.log.error("Invalid or nonexistent SELECT and WHERE tags in SPARQL query");
		return false;
	}
	setVars (sp.slice(selectLoc+1,whereLoc),q);

	setWhere (sp.slice(whereLoc+2,sp.length-1),q.pat);
	
    if (testMode) return q;
    for (x in q.pat.statements)
    {
	var st = q.pat.statements[x]
	if (st.subject.termType == 'symbol'
	    /*&& sf.isPending(st.subject.uri)*/) { //This doesn't work.
	    //sf.requestURI(st.subject.uri,"sparql:"+st.subject) Kenny: I remove these two
	    if($rdf.sf) $rdf.sf.lookUpThing(st.subject,"sparql:"+st.subject);
	}
	if (st.object.termType == 'symbol'
	    /*&& sf.isPending(st.object.uri)*/) {
	    //sf.requestURI(st.object.uri,"sparql:"+st.object)
	    if($rdf.sf) $rdf.sf.lookUpThing(st.object,"sparql:"+st.object);
	}
    }
    //alert(q.pat);
    return q;
    //checkVars()
    
    //*******************************************************************//
}

$rdf.SPARQLResultsInterpreter = function (xml, callback, doneCallback)
{

	function isVar(term) { return (typeof term == 'string' && term.match(/^[\?\$]/)) }
	function fixSymbolBrackets(term) { if (typeof term == 'string') return term.replace(/^&lt;/,"<").replace(/&gt;$/,">"); else return term }
	function isSymbol(term) { return (typeof term == 'string' && term.match(/^<[^>]*>$/)) }
	function isBnode(term) { return (typeof term == 'string' && (term.match(/^_:/)||term.match(/^$/))) }
	function isPrefix(term) { return (typeof term == 'string' && term.match(/:$/)) }
	function isPrefixedSymbol(term) { return (typeof term == 'string' && term.match(/^:|^[^_][^:]*:/)) } 
	function getPrefix(term) { var a = term.split(":"); return a[0] }
	function getSuffix(term) { var a = term.split(":"); return a[1] }
	function removeBrackets(term) { if (isSymbol(term)) {return term.slice(1,term.length-1)} else return term }	
	
	function parsePrefix(attribute)
	{
		if (!attribute.name.match(/^xmlns/))
			return false;
		
		var pref = attribute.name.replace(/^xmlns/,"").replace(/^:/,"").replace(/ /g,"");
		prefixes[pref]=attribute.value;
		$rdf.log.info("Prefix: "+pref+"\nValue: "+attribute.value);
	}
	
	function handleP (str)  //reconstructs prefixed URIs
	{
		if (isPrefixedSymbol(str))
			var pref = getPrefix(str), suf = getSuffix(str);
		else
			var pref = "", suf = str;
		if (prefixes[pref])
			return prefixes[pref]+suf;
		else
			$rdf.log.error("Incorrect SPARQL results - bad prefix");
	}
	
	function xmlMakeTerm(node)
	{
		//alert("xml Node name: "+node.nodeName+"\nxml Child value: "+node.childNodes[0].nodeValue);
		var val=node.childNodes[0]
		for (var x=0; x<node.childNodes.length;x++)
			if (node.childNodes[x].nodeType==3) { val=node.childNodes[x]; break; }
		
		if (handleP(node.nodeName) == spns+"uri") 
			return kb.sym(val.nodeValue);
		else if (handleP(node.nodeName) == spns+"literal")
			return kb.literal(val.nodeValue);
		else if (handleP(node.nodeName) == spns+"unbound")
			return 'unbound'
		
		else $rdf.log.warn("Don't know how to handle xml binding term "+node);
		return false
	}
	function handleResult (result)
	{
		var resultBindings = [],bound=false;
		for (var x=0;x<result.childNodes.length;x++)
		{
			//alert(result[x].nodeName);
			if (result.childNodes[x].nodeType != 1) continue;
			if (handleP(result.childNodes[x].nodeName) != spns+"binding") {$rdf.log.warn("Bad binding node inside result"); continue;}
			var bind = result.childNodes[x];
			var bindVar = makeVar(bind.getAttribute('name'));
			var binding = null
			for (var y=0;y<bind.childNodes.length;y++)
				if (bind.childNodes[y].nodeType == 1) { binding = xmlMakeTerm(bind.childNodes[y]); break }
			if (!binding) { $rdf.log.warn("Bad binding"); return false }
			$rdf.log.info("var: "+bindVar+" binding: "+binding);
			bound=true;
			if (binding != 'unbound')
			resultBindings[bindVar]=binding;
		}
		
		//alert(callback)
		if (bound && callback) setTimeout(function(){callback(resultBindings)},0)
		bindingList.push(resultBindings);
		return;
	}
	
	//****MAIN CODE**********
	var prefixes = [], bindingList=[], head, results, sparql = xml.childNodes[0], spns = "http://www.w3.org/2005/sparql-results#";
	prefixes[""]="";
	
	if (sparql.nodeName != 'sparql') { $rdf.log.error("Bad SPARQL results XML"); return }
	
	for (var x=0;x<sparql.attributes.length;x++)  //deals with all the prefixes beforehand
		parsePrefix(sparql.attributes[x]);
		
	for (var x=0;x<sparql.childNodes.length;x++) //looks for the head and results childNodes
	{
		$rdf.log.info("Type: "+sparql.childNodes[x].nodeType+"\nName: "+sparql.childNodes[x].nodeName+"\nValue: "+sparql.childNodes[x].nodeValue);
		
		if (sparql.childNodes[x].nodeType==1 && handleP(sparql.childNodes[x].nodeName)== spns+"head")
			head = sparql.childNodes[x];
		else if (sparql.childNodes[x].nodeType==1 && handleP(sparql.childNodes[x].nodeName)==spns+"results")
			results = sparql.childNodes[x];
	}
	
	if (!results && !head) { $rdf.log.error("Bad SPARQL results XML"); return }
	
	for (var x=0;x<head.childNodes.length;x++) //@@does anything need to be done with these? Should we check against query vars?
	{
		if (head.childNodes[x].nodeType == 1 && handleP(head.childNodes[x].nodeName) == spns+"variable")
			$rdf.log.info("Var: "+head.childNodes[x].getAttribute('name'))
	}
	
	for (var x=0;x<results.childNodes.length;x++)
	{
		if (handleP(results.childNodes[x].nodeName)==spns+"result")
		{
			$rdf.log.info("Result # "+x);
			handleResult(results.childNodes[x]);
		}
	}
	
	if (doneCallback) doneCallback();
	return bindingList;
	//****END OF MAIN CODE*****
}
// Joe Presbrey <presbrey@mit.edu>
// 2007-07-15
// 2010-08-08 TimBL folded in Kenny's WEBDAV 
// 2010-12-07 TimBL addred local file write code

$rdf.sparqlUpdate = function() {

    var anonymize = function (obj) {
        return (obj.toNT().substr(0,2) == "_:")
        ? "?" + obj.toNT().substr(2)
        : obj.toNT();
    }

    var anonymizeNT = function(stmt) {
        return anonymize(stmt.subject) + " " +
        anonymize(stmt.predicate) + " " +
        anonymize(stmt.object) + " .";
    }

    var sparql = function(store) {
        this.store = store;
        this.ifps = {};
        this.fps = {};
        this.ns = {};
        this.ns.link = $rdf.Namespace("http://www.w3.org/2007/ont/link#");
        this.ns.http = $rdf.Namespace("http://www.w3.org/2007/ont/http#");
        this.ns.httph = $rdf.Namespace("http://www.w3.org/2007/ont/httph#");
        this.ns.rdf =  $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
        this.ns.rdfs = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
        this.ns.rdf = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
        this.ns.owl = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
    }


    // Returns The method string SPARQL or DAV or LOCALFILE or false if known, undefined if not known.
    //
    // Files have to have a specific annotaton that they are machine written, for safety.
    // We don't actually check for write access on files.
    //
    sparql.prototype.editable = function(uri, kb) {
        // dump("sparql.prototype.editable: CALLED for "+uri+"\n")
        if (uri.slice(0,8) == 'file:///') {
            if (kb.holds(kb.sym(uri), tabulator.ns.rdf('type'), tabulator.ns.link('MachineEditableDocument')))
                return 'LOCALFILE';
            var sts = kb.statementsMatching(kb.sym(uri),undefined,undefined);
            
            tabulator.log.warn("sparql.editable: Not MachineEditableDocument file "+uri+"\n");
            tabulator.log.warn(sts.map(function(x){return x.toNT();}).join('\n'))
            return false;
        //@@ Would be nifty of course to see whether we actually have write acess first.
        }
        
        if (!kb) kb = this.store;
        if (!uri) return false; // Eg subject is bnode, no knowm doc to write to
        var request = kb.any(undefined, this.ns.link("requestedURI"), $rdf.Util.uri.docpart(uri));
        if (request !== undefined) {
            var response = kb.any(request, this.ns.link("response"));
            if (request !== undefined) {
                var author_via = kb.each(response, this.ns.httph("ms-author-via"));
                if (author_via.length) {
                    for (var i = 0; i < author_via.length; i++) {
                        var method = author_via[i].value.trim();
                        if (author_via[i].value == "SPARQL" || author_via[i].value == "DAV")
                            // dump("sparql.editable: Success for "+uri+": "+author_via[i] +"\n");
                            return author_via[i].value;
                    }
                }
                var status = kb.each(response, this.ns.http("status"));
                if (status.length) {
                    for (var i = 0; i < status.length; i++) {
                        if (status[i] == 200 || status[i] == 404) {
                            return false; // A definitive answer
                        }
                    }
                }
            } else {
                tabulator.log.warn("sparql.editable: No response for "+uri+"\n");
            }
        } else {
            tabulator.log.warn("sparql.editable: No request for "+uri+"\n");
        }
        tabulator.log.warn("sparql.editable: inconclusive for "+uri+"\n");
        return undefined; // We don't know (yet) as we haven't had a response (yet)
    }

    ///////////  The identification of bnodes

    sparql.prototype._statement_bnodes = function(st) {
        return [st.subject, st.predicate, st.object].filter(function(x){return x.isBlank});
    }

    sparql.prototype._statement_array_bnodes = function(sts) {
        var bnodes = [];
        for (var i=0; i<sts.length;i++) bnodes = bnodes.concat(this._statement_bnodes(sts[i]));
        bnodes.sort(); // in place sort - result may have duplicates
        bnodes2 = [];
        for (var j=0; j<bnodes.length; j++)
            if (j==0 || !bnodes[j].sameTermAs(bnodes[j-1])) bnodes2.push(bnodes[j]);
        return bnodes2;
    }

    sparql.prototype._cache_ifps = function() {
        // Make a cached list of [Inverse-]Functional properties
        // Call this once before calling context_statements
        this.ifps = {};
        var a = this.store.each(undefined, this.ns.rdf('type'), this.ns.owl('InverseFunctionalProperty'))
        for (var i=0; i<a.length; i++) {
            this.ifps[a[i].uri] = true;
        }
        this.fps = {};
        var a = this.store.each(undefined, this.ns.rdf('type'), this.ns.owl('FunctionalProperty'))
        for (var i=0; i<a.length; i++) {
            this.fps[a[i].uri] = true;
        }
    }

    sparql.prototype._bnode_context2 = function(x, source, depth) {
        // Return a list of statements which indirectly identify a node
        //  Depth > 1 if try further indirection.
        //  Return array of statements (possibly empty), or null if failure
        var sts = this.store.statementsMatching(undefined, undefined, x, source); // incoming links
        for (var i=0; i<sts.length; i++) {
            if (this.fps[sts[i].predicate.uri]) {
                var y = sts[i].subject;
                if (!y.isBlank)
                    return [ sts[i] ];
                if (depth) {
                    var res = this._bnode_context2(y, source, depth-1);
                    if (res != null)
                        return res.concat([ sts[i] ]);
                }
            }        
        }
        var sts = this.store.statementsMatching(x, undefined, undefined, source); // outgoing links
        for (var i=0; i<sts.length; i++) {
            if (this.ifps[sts[i].predicate.uri]) {
                var y = sts[i].object;
                if (!y.isBlank)
                    return [ sts[i] ];
                if (depth) {
                    var res = this._bnode_context2(y, source, depth-1);
                    if (res != undefined)
                        return res.concat([ sts[i] ]);
                }
            }        
        }
        return null; // Failure
    }


    sparql.prototype._bnode_context = function(x, source) {
        // Return a list of statements which indirectly identify a node
        //   Breadth-first
        for (var depth = 0; depth < 3; depth++) { // Try simple first 
            var con = this._bnode_context2(x, source, depth);
            if (con != null) return con;
        }
        throw ('Unable to uniquely identify bnode: '+ x.toNT());
    }

    sparql.prototype._bnode_context = function(bnodes) {
        var context = [];
        if (bnodes.length) {
            if (this.store.statementsMatching(st.subject.isBlank?undefined:st.subject,
                                      st.predicate.isBlank?undefined:st.predicate,
                                      st.object.isBlank?undefined:st.object,
                                      st.why).length <= 1) {
                context = context.concat(st);
            } else {
                this._cache_ifps();
                for (x in bnodes) {
                    context = context.concat(this._bnode_context(bnodes[x], st.why));
                }
            }
        }
        return context;
    }

    sparql.prototype._statement_context = function(st) {
        var bnodes = this._statement_bnodes(st);
        return this._bnode_context(bnodes);
    }

    sparql.prototype._context_where = function(context) {
            return (context == undefined || context.length == 0)
            ? ""
            : "WHERE { " + context.map(anonymizeNT).join("\n") + " }\n";
    }

    sparql.prototype._fire = function(uri, query, callback) {
        if (!uri) throw "No URI given for remote editing operation: "+query;
        tabulator.log.info("sparql: sending update to <"+uri+">\n   query="+query+"\n");
        var xhr = $rdf.Util.XMLHTTPFactory();

        xhr.onreadystatechange = function() {
            //dump("SPARQL update ready state for <"+uri+"> readyState="+xhr.readyState+"\n"+query+"\n");
            if (xhr.readyState == 4) {
                var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300));
                if (!success) tabulator.log.error("sparql: update failed for <"+uri+"> status="+
                    xhr.status+", "+xhr.statusText+", body length="+xhr.responseText.length+"\n   for query: "+query);
                else  tabulator.log.debug("sparql: update Ok for <"+uri+">");
                callback(uri, success, xhr.responseText);
            }
        }

        if(!tabulator.isExtension) {
            try {
                $rdf.Util.enablePrivilege("UniversalBrowserRead")
            } catch(e) {
                alert("Failed to get privileges: " + e)
            }
        }
        
        xhr.open('POST', uri, true);  // async=true
        xhr.setRequestHeader('Content-type', 'application/sparql-query');
        xhr.send(query);
    }

    // This does NOT update the statement.
    // It returns an object whcih includes
    //  function which can be used to change the object of the statement.
    //
    sparql.prototype.update_statement = function(statement) {
        if (statement && statement.why == undefined) return;

        var sparql = this;
        var context = this._statement_context(statement);

        return {
            statement: statement?[statement.subject, statement.predicate, statement.object, statement.why]:undefined,
            statementNT: statement?anonymizeNT(statement):undefined,
            where: sparql._context_where(context),

            set_object: function(obj, callback) {
                query = this.where;
                query += "DELETE DATA { " + this.statementNT + " } ;\n";
                query += "INSERT DATA { " +
                    anonymize(this.statement[0]) + " " +
                    anonymize(this.statement[1]) + " " +
                    anonymize(obj) + " " + " . }\n";
     
                sparql._fire(this.statement[3].uri, query, callback);
            }
        }
    }

    sparql.prototype.insert_statement = function(st, callback) {
        var st0 = st instanceof Array ? st[0] : st;
        var query = this._context_where(this._statement_context(st0));
        
        if (st instanceof Array) {
            var stText="";
            for (var i=0;i<st.length;i++) stText+=st[i]+'\n';
            //query += "INSERT DATA { "+st.map(RDFStatement.prototype.toNT.call).join('\n')+" }\n";
            //the above should work, but gives an error "called on imcompatible XUL...scope..."
            query += "INSERT DATA { " + stText + " }\n";
        } else {
            query += "INSERT DATA { " +
                anonymize(st.subject) + " " +
                anonymize(st.predicate) + " " +
                anonymize(st.object) + " " + " . }\n";
        }
        
        this._fire(st0.why.uri, query, callback);
    }

    sparql.prototype.delete_statement = function(st, callback) {
        var query = this._context_where(this._statement_context(st));
        
        query += "DELETE DATA { " + anonymizeNT(st) + " }\n";
        
        this._fire(st instanceof Array?st[0].why.uri:st.why.uri, query, callback);
    }

    // This high-level function updates the local store iff the web is changed successfully. 
    //
    //  - deletions, insertions may be undefined or single statements or lists or formulae.
    //
    //  - callback is called as callback(uri, success, errorbody)
    //
    sparql.prototype.update = function(deletions, insertions, callback) {
        var kb = this.store;
        tabulator.log.info("update called")
        var ds =  deletions == undefined ? []
                    : deletions instanceof $rdf.IndexedFormula ? deletions.statements
                    : deletions instanceof Array ? deletions : [ deletions ];
        var is =  insertions == undefined? []
                    : insertions instanceof $rdf.IndexedFormula ? insertions.statements
                    : insertions instanceof Array ? insertions : [ insertions ];
        if (! (ds instanceof Array)) throw "Type Error "+(typeof ds)+": "+ds;
        if (! (is instanceof Array)) throw "Type Error "+(typeof is)+": "+is;
        var doc = ds.length ? ds[0].why : is[0].why;
        
        ds.map(function(st){if (!doc.sameTerm(st.why)) throw "sparql update: destination "+doc+" inconsitent with ds "+st.why;});
        is.map(function(st){if (!doc.sameTerm(st.why)) throw "sparql update: destination "+doc+" inconsitent with is "+st.why;});

        var protocol = this.editable(doc.uri, kb);
        if (!protocol) throw "Can't make changes in uneditable "+doc;

        if (protocol.indexOf('SPARQL') >=0) {
            var bnodes = []
            if (ds.length) bnodes = this._statement_array_bnodes(ds);
            if (is.length) bnodes = bnodes.concat(this._statement_array_bnodes(is));
            var context = this._bnode_context(bnodes);
            var whereClause = this._context_where(context);
            var query = ""
            if (whereClause.length) { // Is there a WHERE clause?
                if (ds.length) {
                    query += "DELETE { ";
                    for (var i=0; i<ds.length;i++) query+= anonymizeNT(ds[i])+"\n";
                    query += " }\n";
                }
                if (is.length) {
                    query += "INSERT { ";
                    for (var i=0; i<is.length;i++) query+= anonymizeNT(is[i])+"\n";
                    query += " }\n";
                }
                query += whereClause;
            } else { // no where clause
                if (ds.length) {
                    query += "DELETE DATA { ";
                    for (var i=0; i<ds.length;i++) query+= anonymizeNT(ds[i])+"\n";
                    query += " } \n";
                }
                if (is.length) {
                    if (ds.length) query += " ; ";
                    query += "INSERT DATA { ";
                    for (var i=0; i<is.length;i++) query+= anonymizeNT(is[i])+"\n";
                    query += " }\n";
                }
            }
            this._fire(doc.uri, query,
                function(uri, success, body) {
                    tabulator.log.info("\t sparql: Return "+success+" for query "+query+"\n");
                    if (success) {
                        for (var i=0; i<ds.length;i++) kb.remove(ds[i]);
                        for (var i=0; i<is.length;i++)
                            kb.add(is[i].subject, is[i].predicate, is[i].object, doc); 
                    }
                    callback(uri, success, body);
                });
            
        } else if (protocol.indexOf('DAV') >=0) {

            // The code below is derived from Kenny's UpdateCenter.js
            var documentString;
            var request = kb.any(doc, this.ns.link("request"));
            if (!request) throw "No record of our HTTP GET request for document: "+doc; //should not happen
            var response =  kb.any(request, this.ns.link("response"));
            if (!response)  return null; // throw "No record HTTP GET response for document: "+doc;
            var content_type = kb.the(response, this.ns.httph("content-type")).value;            

            //prepare contents of revised document
            var newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice(); // copy!
            for (var i=0;i<ds.length;i++) $rdf.Util.RDFArrayRemove(newSts, ds[i]);
            for (var i=0;i<is.length;i++) newSts.push(is[i]);                                     
            
            //serialize to te appropriate format
            var sz = $rdf.Serializer(kb);
            sz.suggestNamespaces(kb.namespaces);
            sz.setBase(doc.uri);//?? beware of this - kenny (why? tim)                   
            switch(content_type){
                case 'application/rdf+xml': 
                    documentString = sz.statementsToXML(newSts);
                    break;
                case 'text/rdf+n3': // Legacy
                case 'text/n3':
                case 'text/turtle':
                case 'application/x-turtle': // Legacy
                case 'application/n3': // Legacy
                    documentString = sz.statementsToN3(newSts);
                    break;
                default:
                    throw "Content-type "+content_type +" not supported for data write";                                                                            
            }
            
            // Write the new version back
            
            var candidateTarget = kb.the(response, this.ns.httph("content-location"));
            if (candidateTarget) targetURI = Util.uri.join(candidateTarget.value, targetURI);
            var xhr = Util.XMLHTTPFactory();
            xhr.onreadystatechange = function (){
                if (xhr.readyState == 4){
                    //formula from sparqlUpdate.js, what about redirects?
                    var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300));
                    if (success) {
                        for (var i=0; i<ds.length;i++) kb.remove(ds[i]);
                        for (var i=0; i<is.length;i++)
                            kb.add(is[i].subject, is[i].predicate, is[i].object, doc);                
                    }
                    callback(doc.uri, success, xhr.responseText);
                }
            };
            xhr.open('PUT', targetURI, true);
            //assume the server does PUT content-negotiation.
            xhr.setRequestHeader('Content-type', content_type);//OK?
            xhr.send(documentString);

        } else if (protocol.indexOf('LOCALFILE') >=0) {
            try {
                tabulator.log.info("Writing back to local file\n");
                // See http://simon-jung.blogspot.com/2007/10/firefox-extension-file-io.html
                //prepare contents of revised document
                var newSts = kb.statementsMatching(undefined, undefined, undefined, doc).slice(); // copy!
                for (var i=0;i<ds.length;i++) $rdf.Util.RDFArrayRemove(newSts, ds[i]);
                for (var i=0;i<is.length;i++) newSts.push(is[i]);                                     
                
                //serialize to the appropriate format
                var documentString;
                var sz = $rdf.Serializer(kb);
                sz.suggestNamespaces(kb.namespaces);
                sz.setBase(doc.uri);//?? beware of this - kenny (why? tim)
                var dot = doc.uri.lastIndexOf('.');
                if (dot < 1) throw "Rewriting file: No filename extension: "+doc.uri;
                var ext = doc.uri.slice(dot+1);                  
                switch(ext){
                    case 'rdf': 
                    case 'owl':  // Just my experence   ...@@ we should keep the format in which it was parsed
                    case 'xml': 
                        documentString = sz.statementsToXML(newSts);
                        break;
                    case 'n3':
                    case 'nt':
                    case 'ttl':
                        documentString = sz.statementsToN3(newSts);
                        break;
                    default:
                        throw "File extension ."+ext +" not supported for data write";                                                                            
                }
                
                // Write the new version back
                
                //create component for file writing
                dump("Writing back: <<<"+documentString+">>>\n")
                var filename = doc.uri.slice(7); // chop off   file://  leaving /path
                //tabulator.log.warn("Writeback: Filename: "+filename+"\n")
                var file = Components.classes["@mozilla.org/file/local;1"]
                    .createInstance(Components.interfaces.nsILocalFile);
                file.initWithPath(filename);
                if(!file.exists()) throw "Rewriting file <"+doc.uri+"> but it does not exist!";
                    
                //{
                //file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
                //}
                    //create file output stream and use write/create/truncate mode
                //0x02 writing, 0x08 create file, 0x20 truncate length if exist
                var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Components.interfaces.nsIFileOutputStream);

                stream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);

                //write data to file then close output stream
                stream.write(documentString, documentString.length);
                stream.close();

                for (var i=0; i<ds.length;i++) kb.remove(ds[i]);
                for (var i=0; i<is.length;i++)
                    kb.add(is[i].subject, is[i].predicate, is[i].object, doc); 
                                
                callback(doc.uri, true, ""); // success!
            } catch(e) {
                callback(doc.uri, false, 
                "Exception trying to write back file <"+doc.uri+">\n"+
                        tabulator.Util.stackString(e))
            }
            
        } else throw "Unhandled edit method: '"+protocol+"' for "+doc;
    };



    return sparql;

}();
$rdf.jsonParser = function() {

    return {
        parseJSON: function( data, source, store ) {
            var subject, predicate, object;
            var bnodes = {};
            var why = store.sym(source);
            for (x in data) {
                if( x.indexOf( "_:") === 0 ) {
                    if( bnodes[x] ) {
                        subject = bnodes[x];
                    } else {
                        subject = store.bnode(x);
                        bnodes[x]=subject;
                    }
                } else {
                    subject = store.sym(x);
                }
                var preds = data[x];
                for (y in preds) {
                    var objects = preds[y];
                    predicate = store.sym(y);
                    for( z in objects ) {
                        var obj = objects[z];
                        if( obj.type === "uri" ) {
                            object = store.sym(obj.value);
                            store.add( subject, predicate, object, why );                            
                        } else if( obj.type === "bnode" ) {
                            if( bnodes[obj.value] ) {
                                object = bnodes[obj.value];
                            } else {
                                object = store.bnode(obj.value);
                                bnodes[obj.value] = object;
                            }
                            store.add( subject, predicate, object, why );
                        } else if( obj.type === "literal" ) {
                            var datatype;
                            if( obj.datatype ) {
                                object = store.literal(obj.value, undefined, store.sym(obj.datatype));
                            } else if ( obj.lang ) {
                                object = store.literal(obj.value, obj.lang);                                
                            } else {
                                object = store.literal(obj.value);
                            }
                            store.add( subject, predicate, object, why );
                        } else {
                            throw "error: unexpected termtype: "+z.type;
                        }
                    }
                }
            }
        }
    }
}();
/*      Serialization of RDF Graphs
**
** Tim Berners-Lee 2006
** This is or was http://dig.csail.mit.edu/2005/ajar/ajaw/js/rdf/serialize.js
**
** Bug: can't serialize  http://data.semanticweb.org/person/abraham-bernstein/rdf 
** in XML (from mhausenblas)
*/

// @@@ Check the whole toStr thing tosee whetehr it still makes sense -- tbl
// 
$rdf.Serializer = function() {

var __Serializer = function( store ){
    this.flags = "";
    this.base = null;
    this.prefixes = [];
    this.keywords = ['a']; // The only one we generate at the moment
    this.prefixchars = "abcdefghijklmnopqustuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.incoming = null;  // Array not calculated yet
    this.formulas = [];  // remebering original formulae from hashes 
    this.store = store;

    /* pass */
}

var Serializer = function( store ) {return new __Serializer( store )}; 

__Serializer.prototype.setBase = function(base)
    { this.base = base };

__Serializer.prototype.setFlags = function(flags)
    { this.flags = flags?flags: '' };


__Serializer.prototype.toStr = function(x) {
        var s = x.toNT();
        if (x.termType == 'formula') {
            this.formulas[s] = x; // remember as reverse does not work
        }
        return s;
};
    
__Serializer.prototype.fromStr = function(s) {
        if (s[0] == '{') {
            var x = this.formulas[s];
            if (!x) alert('No formula object for '+s)
            return x;
        }
        return this.store.fromNT(s);
};
    




/* Accumulate Namespaces
** 
** These are only hints.  If two overlap, only one gets used
** There is therefore no guarantee in general.
*/

__Serializer.prototype.suggestPrefix = function(prefix, uri) {
    this.prefixes[uri] = prefix;
}

// Takes a namespace -> prefix map
__Serializer.prototype.suggestNamespaces = function(namespaces) {
    for (var px in namespaces) {
        this.prefixes[namespaces[px]] = px;
    }
}

// Make up an unused prefix for a random namespace
__Serializer.prototype.makeUpPrefix = function(uri) {
    var p = uri;
    var namespaces = [];
    var pok;
    var sz = this;
    
    function canUse(pp) {
        if (namespaces[pp]) return false; // already used

        sz.prefixes[uri] = pp;
        pok = pp;
        return true
    }
    for (var ns in sz.prefixes) {
        namespaces[sz.prefixes[ns]] = ns; // reverse index
    }
    if ('#/'.indexOf(p[p.length-1]) >= 0) p = p.slice(0, -1);
    var slash = p.lastIndexOf('/');
    if (slash >= 0) p = p.slice(slash+1);
    var i = 0;
    while (i < p.length)
        if (sz.prefixchars.indexOf(p[i])) i++; else break;
    p = p.slice(0,i);
    if (p.length < 6 && canUse(p)) return pok; // exact i sbest
    if (canUse(p.slice(0,3))) return pok;
    if (canUse(p.slice(0,2))) return pok;
    if (canUse(p.slice(0,4))) return pok;
    if (canUse(p.slice(0,1))) return pok;
    if (canUse(p.slice(0,5))) return pok;
    for (var i=0;; i++) if (canUse(p.slice(0,3)+i)) return pok; 
}



// Todo:
//  - Sort the statements by subject, pred, object
//  - do stuff about the docu first and then (or first) about its primary topic.

__Serializer.prototype.rootSubjects = function(sts) {
    var incoming = [];
    var subjects = [];
    var sz = this;
    var allBnodes = {};

/* This scan is to find out which nodes will have to be the roots of trees
** in the serialized form. This will be any symbols, and any bnodes
** which hve more or less than one incoming arc, and any bnodes which have
** one incoming arc but it is an uninterrupted loop of such nodes back to itself.
** This should be kept linear time with repect to the number of statements.
** Note it does not use any indexing of the store.
*/


    tabulator.log.debug('serialize.js Find bnodes with only one incoming arc\n')
    for (var i = 0; i<sts.length; i++) {
        var st = sts[i];
        [ st.subject, st.predicate, st.object].map(function(y){
            if (y.termType =='bnode'){allBnodes[y.toNT()] = true}});
        var x = sts[i].object;
        if (!incoming[x]) incoming[x] = [];
        incoming[x].push(st.subject) // List of things which will cause this to be printed
        var ss =  subjects[sz.toStr(st.subject)]; // Statements with this as subject
        if (!ss) ss = [];
        ss.push(st);
        subjects[this.toStr(st.subject)] = ss; // Make hash. @@ too slow for formula?
        //$rdf.log.debug(' sz potential subject: '+sts[i].subject)
    }

    var roots = [];
    for (var xNT in subjects) {
        var x = sz.fromStr(xNT);
        if ((x.termType != 'bnode') || !incoming[x] || (incoming[x].length != 1)){
            roots.push(x);
            //$rdf.log.debug(' sz actual subject -: ' + x)
            continue;
        }
    }
    this.incoming = incoming; // Keep for serializing @@ Bug for nested formulas
    
//////////// New bit for CONNECTED bnode loops:frootshash

// This scans to see whether the serialization is gpoing to lead to a bnode loop
// and at the same time accumulates a list of all bnodes mentioned.
// This is in fact a cut down N3 serialization
/*
    tabulator.log.debug('serialize.js Looking for connected bnode loops\n')
    for (var i=0; i<sts.length; i++) { // @@TBL
        // dump('\t'+sts[i]+'\n');
    }
    var doneBnodesNT = {};
    function dummyPropertyTree(subject, subjects, rootsHash) {
        // dump('dummyPropertyTree('+subject+'...)\n');
        var sts = subjects[sz.toStr(subject)]; // relevant statements
        for (var i=0; i<sts.length; i++) {
            dummyObjectTree(sts[i].object, subjects, rootsHash);
        }
    }

    // Convert a set of statements into a nested tree of lists and strings
    // @param force,    "we know this is a root, do it anyway. It isn't a loop."
    function dummyObjectTree(obj, subjects, rootsHash, force) { 
        // dump('dummyObjectTree('+obj+'...)\n');
        if (obj.termType == 'bnode' && (subjects[sz.toStr(obj)]  &&
            (force || (rootsHash[obj.toNT()] == undefined )))) {// and there are statements
            if (doneBnodesNT[obj.toNT()]) { // Ah-ha! a loop
                throw "Serializer: Should be no loops "+obj;
            }
            doneBnodesNT[obj.toNT()] = true;
            return  dummyPropertyTree(obj, subjects, rootsHash);
        }
        return dummyTermToN3(obj, subjects, rootsHash);
    }
    
    // Scan for bnodes nested inside lists too
    function dummyTermToN3(expr, subjects, rootsHash) {
        if (expr.termType == 'bnode') doneBnodesNT[expr.toNT()] = true;
        tabulator.log.debug('serialize: seen '+expr);
        if (expr.termType == 'collection') {
            for (i=0; i<expr.elements.length; i++) {
                if (expr.elements[i].termType == 'bnode')
                    dummyObjectTree(expr.elements[i], subjects, rootsHash);
            }
        return;             
        }
    }

    // The tree for a subject
    function dummySubjectTree(subject, subjects, rootsHash) {
        // dump('dummySubjectTree('+subject+'...)\n');
        if (subject.termType == 'bnode' && !incoming[subject])
            return dummyObjectTree(subject, subjects, rootsHash, true); // Anonymous bnode subject
        dummyTermToN3(subject, subjects, rootsHash);
        dummyPropertyTree(subject, subjects, rootsHash);
    }
*/    
    // Now do the scan using existing roots
    tabulator.log.debug('serialize.js Dummy serialize to check for missing nodes')
    var rootsHash = {};
    for (var i = 0; i< roots.length; i++) rootsHash[roots[i].toNT()] = true;
/*
    for (var i=0; i<roots.length; i++) {
        var root = roots[i];
        dummySubjectTree(root, subjects, rootsHash);
    }
    // dump('Looking for mising bnodes...\n')
    
// Now in new roots for anythig not acccounted for
// Now we check for any bndoes which have not been covered.
// Such bnodes must be in isolated rings of pure bnodes.
// They each have incoming link of 1.

    tabulator.log.debug('serialize.js Looking for connected bnode loops\n')
    for (;;) {
        var bnt;
        var found = null;
        for (bnt in allBnodes) { // @@ Note: not repeatable. No canonicalisation
            if (doneBnodesNT[bnt]) continue;
            found = bnt; // Ah-ha! not covered
            break;
        }
        if (found == null) break; // All done - no bnodes left out/
        // dump('Found isolated bnode:'+found+'\n');
        doneBnodesNT[bnt] = true;
        var root = this.store.fromNT(found);
        roots.push(root); // Add a new root
        rootsHash[found] = true;
        tabulator.log.debug('isolated bnode:'+found+', subjects[found]:'+subjects[found]+'\n');
        if (subjects[found] == undefined) {
            for (var i=0; i<sts.length; i++) {
                // dump('\t'+sts[i]+'\n');
            }
            throw "Isolated node should be a subject" +found;
        }
        dummySubjectTree(root, subjects, rootsHash); // trace out the ring
    }
    // dump('Done bnode adjustments.\n')
*/
    return {'roots':roots, 'subjects':subjects, 
                'rootsHash': rootsHash, 'incoming': incoming};
}

////////////////////////////////////////////////////////

__Serializer.prototype.toN3 = function(f) {
    return this.statementsToN3(f.statements);
}

__Serializer.prototype._notQNameChars = "\t\r\n !\"#$%&'()*.,+/;<=>?@[\\]^`{|}~";
__Serializer.prototype._notNameChars = 
                    ( __Serializer.prototype._notQNameChars + ":" ) ;

    
__Serializer.prototype.statementsToN3 = function(sts) {
    var indent = 4;
    var width = 80;
    var sz = this;

    var namespaceCounts = []; // which have been used

    predMap = {
        'http://www.w3.org/2002/07/owl#sameAs': '=',
        'http://www.w3.org/2000/10/swap/log#implies': '=>',
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'a'
    }
    

    
    
    ////////////////////////// Arrange the bits of text 

    var spaces=function(n) {
        var s='';
        for(var i=0; i<n; i++) s+=' ';
        return s
    }

    treeToLine = function(tree) {
        var str = '';
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            var s2 = (typeof branch == 'string') ? branch : treeToLine(branch);
            if (i!=0 && s2 != ',' && s2 != ';' && s2 != '.') str += ' ';
            str += s2;
        }
        return str;
    }
    
    // Convert a nested tree of lists and strings to a string
    treeToString = function(tree, level) {
        var str = '';
        var lastLength = 100000;
        if (!level) level = 0;
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            if (typeof branch != 'string') {
                var substr = treeToString(branch, level +1);
                if (
                    substr.length < 10*(width-indent*level)
                    && substr.indexOf('"""') < 0) {// Don't mess up multiline strings
                    var line = treeToLine(branch);
                    if (line.length < (width-indent*level)) {
                        branch = '   '+line; //   @@ Hack: treat as string below
                        substr = ''
                    }
                }
                if (substr) lastLength = 10000;
                str += substr;
            }
            if (typeof branch == 'string') {
                if (branch.length == '1' && str.slice(-1) == '\n') {
                    if (",.;".indexOf(branch) >=0) {
                        str = str.slice(0,-1) + branch + '\n'; //  slip punct'n on end
                        lastLength += 1;
                        continue;
                    } else if ("])}".indexOf(branch) >=0) {
                        str = str.slice(0,-1) + ' ' + branch + '\n';
                        lastLength += 2;
                        continue;
                    }
                }
                if (lastLength < (indent*level+4)) { // continue
                    str = str.slice(0,-1) + ' ' + branch + '\n';
                    lastLength += branch.length + 1;
                } else {
                    var line = spaces(indent*level) +branch;
                    str += line +'\n'; 
                    lastLength = line.length;
                }
 
            } else { // not string
            }
        }
        return str;
    };

    ////////////////////////////////////////////// Structure for N3
    
    
    // Convert a set of statements into a nested tree of lists and strings
    function statementListToTree(statements) {
        // print('Statement tree for '+statements.length);
        var res = [];
        var stats = sz.rootSubjects(statements);
        var roots = stats.roots;
        var results = []
        for (var i=0; i<roots.length; i++) {
            var root = roots[i];
            results.push(subjectTree(root, stats))
        }
        return results;
    }
    
    // The tree for a subject
    function subjectTree(subject, stats) {
        if (subject.termType == 'bnode' && !stats.incoming[subject])
            return objectTree(subject, stats, true).concat(["."]); // Anonymous bnode subject
        return [ termToN3(subject, stats) ].concat([propertyTree(subject, stats)]).concat(["."]);
    }
    

    // The property tree for a single subject or anonymous node
    function propertyTree(subject, stats) {
        // print('Proprty tree for '+subject);
        var results = []
        var lastPred = null;
        var sts = stats.subjects[sz.toStr(subject)]; // relevant statements
        if (typeof sts == 'undefined') {
            throw('Cant find statements for '+subject);
        }
        sts.sort();
        var objects = [];
        for (var i=0; i<sts.length; i++) {
            var st = sts[i];
            if (st.predicate.uri == lastPred) {
                objects.push(',');
            } else {
                if (lastPred) {
                    results=results.concat([objects]).concat([';']);
                    objects = [];
                }
                results.push(predMap[st.predicate.uri] ?
                            predMap[st.predicate.uri] : termToN3(st.predicate, stats));
            }
            lastPred = st.predicate.uri;
            objects.push(objectTree(st.object, stats));
        }
        results=results.concat([objects]);
        return results;
    }

    function objectTree(obj, stats, force) {
        if (obj.termType == 'bnode' &&
                stats.subjects[sz.toStr(obj)] && // and there are statements
                (force || stats.rootsHash[obj.toNT()] == undefined)) // and not a root
            return  ['['].concat(propertyTree(obj, stats)).concat([']']);
        return termToN3(obj, stats);
    }
    
    function termToN3(expr, stats) {
        switch(expr.termType) {
            case 'bnode':
            case 'variable':  return expr.toNT();
            case 'literal':
                var str = stringToN3(expr.value);
                if (expr.lang) str+= '@' + expr.lang;
                if (expr.datatype) str+= '^^' + termToN3(expr.datatype, stats);
                return str;
            case 'symbol':
                return symbolToN3(expr.uri);
            case 'formula':
                var res = ['{'];
                res = res.concat(statementListToTree(expr.statements));
                return  res.concat(['}']);
            case 'collection':
                var res = ['('];
                for (i=0; i<expr.elements.length; i++) {
                    res.push(   [ objectTree(expr.elements[i], stats) ]);
                }
                res.push(')');
                return res;
                
           default:
                throw "Internal: termToN3 cannot handle "+expr+" of termType+"+expr.termType
                return ''+expr;
        }
    }
    
    ////////////////////////////////////////////// Atomic Terms
    
    //  Deal with term level things and nesting with no bnode structure
    
    function symbolToN3(uri) {  // c.f. symbolString() in notation3.py
        var j = uri.indexOf('#');
        if (j<0 && sz.flags.indexOf('/') < 0) {
            j = uri.lastIndexOf('/');
        }
        if (j >= 0 && sz.flags.indexOf('p') < 0)  { // Can split at namespace
            var canSplit = true;
            for (var k=j+1; k<uri.length; k++) {
                if (__Serializer.prototype._notNameChars.indexOf(uri[k]) >=0) {
                    canSplit = false; break;
                }
            }
            if (canSplit) {
                var localid = uri.slice(j+1);
                var namesp = uri.slice(0,j+1);
                if (sz.defaultNamespace && sz.defaultNamespace == namesp
                    && sz.flags.indexOf('d') < 0) {// d -> suppress default
                    if (sz.flags.indexOf('k') >= 0 &&
                        sz.keyords.indexOf(localid) <0)
                        return localid; 
                    return ':' + localid;
                }
                var prefix = sz.prefixes[namesp];
                if (prefix) {
                    namespaceCounts[namesp] = true;
                    return prefix + ':' + localid;
                }
                if (uri.slice(0, j) == sz.base)
                    return '<#' + localid + '>';
                // Fall though if can't do qname
            }
        }
        if (sz.flags.indexOf('r') < 0 && sz.base)
            uri = $rdf.Util.uri.refTo(sz.base, uri);
        else if (sz.flags.indexOf('u') >= 0)
            uri = backslashUify(uri);
        else uri = hexify(uri);
        return '<'+uri+'>';
    }
    
    function prefixDirectives() {
        str = '';
	if (sz.defaultNamespace)
	  str += '@prefix : <'+sz.defaultNamespace+'>.\n';
        for (var ns in namespaceCounts) {
            str += '@prefix ' + sz.prefixes[ns] + ': <'+ns+'>.\n';
        }
        return str + '\n';
    }
    
    //  stringToN3:  String escaping for N3
    //
    var forbidden1 = new RegExp(/[\\"\b\f\r\v\t\n\u0080-\uffff]/gm);
    var forbidden3 = new RegExp(/[\\"\b\f\r\v\u0080-\uffff]/gm);
    function stringToN3(str, flags) {
        if (!flags) flags = "e";
        var res = '', i=0, j=0;
        var delim;
        var forbidden;
        if (str.length > 20 // Long enough to make sense
                && str.slice(-1) != '"'  // corner case'
                && flags.indexOf('n') <0  // Force single line
                && (str.indexOf('\n') >0 || str.indexOf('"') > 0)) {
            delim = '"""';
            forbidden =  forbidden3;
        } else {
            delim = '"';
            forbidden = forbidden1;
        }
        for(i=0; i<str.length;) {
            forbidden.lastIndex = 0;
            var m = forbidden.exec(str.slice(i));
            if (m == null) break;
            j = i + forbidden.lastIndex -1;
            res += str.slice(i,j);
            var ch = str[j];
            if (ch=='"' && delim == '"""' &&  str.slice(j,j+3) != '"""') {
                res += ch;
            } else {
                var k = '\b\f\r\t\v\n\\"'.indexOf(ch); // No escaping of bell (7)?
                if (k >= 0) {
                    res += "\\" + 'bfrtvn\\"'[k];
                } else  {
                    if (flags.indexOf('e')>=0) {
                        res += '\\u' + ('000'+
                         ch.charCodeAt(0).toString(16).toLowerCase()).slice(-4)
                    } else { // no 'e' flag
                        res += ch;
                    }
                }
            }
            i = j+1;
        }
        return delim + res + str.slice(i) + delim
    }

    // Body of toN3:
    
    var tree = statementListToTree(sts);
    return prefixDirectives() + treeToString(tree, -1);
    
}

// String ecaping utilities 

function hexify(str) { // also used in parser
//     var res = '';
//     for (var i=0; i<str.length; i++) {
//         k = str.charCodeAt(i);
//         if (k>126 || k<33)
//             res += '%' + ('0'+n.toString(16)).slice(-2); // convert to upper?
//         else
//             res += str[i];
//     }
//     return res;
  return encodeURI(str);
}


function backslashUify(str) {
    var res = '';
    for (var i=0; i<str.length; i++) {
        k = str.charCodeAt(i);
        if (k>65535)
            res += '\\U' + ('00000000'+n.toString(16)).slice(-8); // convert to upper?
        else if (k>126) 
            res += '\\u' + ('0000'+n.toString(16)).slice(-4);
        else
            res += str[i];
    }
    return res;
}






//////////////////////////////////////////////// XML serialization

__Serializer.prototype.statementsToXML = function(sts) {
    var indent = 4;
    var width = 80;
    var sz = this;

    var namespaceCounts = []; // which have been used
    namespaceCounts['http://www.w3.org/1999/02/22-rdf-syntax-ns#'] = true;

    ////////////////////////// Arrange the bits of XML text 

    var spaces=function(n) {
        var s='';
        for(var i=0; i<n; i++) s+=' ';
        return s
    }

    XMLtreeToLine = function(tree) {
        var str = '';
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            var s2 = (typeof branch == 'string') ? branch : XMLtreeToLine(branch);
            str += s2;
        }
        return str;
    }
    
    // Convert a nested tree of lists and strings to a string
    XMLtreeToString = function(tree, level) {
        var str = '';
        var lastLength = 100000;
        if (!level) level = 0;
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            if (typeof branch != 'string') {
                var substr = XMLtreeToString(branch, level +1);
                if (
                    substr.length < 10*(width-indent*level)
                    && substr.indexOf('"""') < 0) {// Don't mess up multiline strings
                    var line = XMLtreeToLine(branch);
                    if (line.length < (width-indent*level)) {
                        branch = '   '+line; //   @@ Hack: treat as string below
                        substr = ''
                    }
                }
                if (substr) lastLength = 10000;
                str += substr;
            }
            if (typeof branch == 'string') {
                if (lastLength < (indent*level+4)) { // continue
                    str = str.slice(0,-1) + ' ' + branch + '\n';
                    lastLength += branch.length + 1;
                } else {
                    var line = spaces(indent*level) +branch;
                    str += line +'\n'; 
                    lastLength = line.length;
                }
 
            } else { // not string
            }
        }
        return str;
    };

    function statementListToXMLTree(statements) {
        sz.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
        var stats = sz.rootSubjects(statements);
        var roots = stats.roots;
        results = []
        for (var i=0; i<roots.length; i++) {
            root = roots[i];
            results.push(subjectXMLTree(root, stats))
        }
        return results;
    }
    
    function escapeForXML(str) {
        if (typeof str == 'undefined') return '@@@undefined@@@@';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    }

    function relURI(term) {
        return escapeForXML((sz.base) ? $rdf.Util.uri.refTo(this.base, term.uri) : term.uri);
    }

    // The tree for a subject
    function subjectXMLTree(subject, stats) {
        var start
        if (subject.termType == 'bnode') {
            if (!stats.incoming[subject]) { // anonymous bnode
                var start = '<rdf:Description>';
            } else {
                var start = '<rdf:Description rdf:nodeID="'+subject.toNT().slice(2)+'">';
            }
        } else {
            var start = '<rdf:Description rdf:about="'+ relURI(subject)+'">';
        }

        return [ start ].concat(
                [propertyXMLTree(subject, stats)]).concat(["</rdf:Description>"]);
    }
    function collectionXMLTree(subject, stats) {
        res = []
        for (var i=0; i< subject.elements.length; i++) {
            res.push(subjectXMLTree(subject.elements[i], stats));
         }
         return res;
    }   

    // The property tree for a single subject or anonymos node
    function propertyXMLTree(subject, stats) {
        var results = []
        var sts = stats.subjects[sz.toStr(subject)]; // relevant statements
        if (sts == undefined) return results;  // No relevant statements
        sts.sort();
        for (var i=0; i<sts.length; i++) {
            var st = sts[i];
            switch (st.object.termType) {
                case 'bnode':
                    if(stats.rootsHash[st.object.toNT()]) { // This bnode has been done as a root -- no content here @@ what bout first time
                        results = results.concat(['<'+qname(st.predicate)+' rdf:nodeID="'+st.object.toNT().slice(2)+'">',
                        '</'+qname(st.predicate)+'>']);
                    } else { 
                    results = results.concat(['<'+qname(st.predicate)+' rdf:parseType="Resource">', 
                        propertyXMLTree(st.object, stats),
                        '</'+qname(st.predicate)+'>']);
                    }
                    break;
                case 'symbol':
                    results = results.concat(['<'+qname(st.predicate)+' rdf:resource="'
                            + relURI(st.object)+'"/>']); 
                    break;
                case 'literal':
                    results = results.concat(['<'+qname(st.predicate)
                        + (st.object.datatype ? ' rdf:datatype="'+escapeForXML(st.object.datatype.uri)+'"' : '') 
                        + (st.object.lang ? ' xml:lang="'+st.object.lang+'"' : '') 
                        + '>' + escapeForXML(st.object.value)
                        + '</'+qname(st.predicate)+'>']);
                    break;
                case 'collection':
                    results = results.concat(['<'+qname(st.predicate)+' rdf:parseType="Collection">', 
                        collectionXMLTree(st.object, stats),
                        '</'+qname(st.predicate)+'>']);
                    break;
                default:
                    throw "Can't serialize object of type "+st.object.termType +" into XML";
                
            } // switch
        }
        return results;
    }

    function qname(term) {
        var uri = term.uri;

        var j = uri.indexOf('#');
        if (j<0 && sz.flags.indexOf('/') < 0) {
            j = uri.lastIndexOf('/');
        }
        if (j < 0) throw ("Cannot make qname out of <"+uri+">")

        var canSplit = true;
        for (var k=j+1; k<uri.length; k++) {
            if (__Serializer.prototype._notNameChars.indexOf(uri[k]) >=0) {
                throw ('Invalid character "'+uri[k] +'" cannot be in XML qname for URI: '+uri); 
            }
        }
        var localid = uri.slice(j+1);
        var namesp = uri.slice(0,j+1);
        if (sz.defaultNamespace && sz.defaultNamespace == namesp
            && sz.flags.indexOf('d') < 0) {// d -> suppress default
            return localid;
        }
        var prefix = sz.prefixes[namesp];
        if (!prefix) prefix = sz.makeUpPrefix(namesp);
        namespaceCounts[namesp] = true;
        return prefix + ':' + localid;
//        throw ('No prefix for namespace "'+namesp +'" for XML qname for '+uri+', namespaces: '+sz.prefixes+' sz='+sz); 
    }

    // Body of toXML:
    
    var tree = statementListToXMLTree(sts);
    var str = '<rdf:RDF';
    if (sz.defaultNamespace)
      str += ' xmlns="'+escapeForXML(sz.defaultNamespace)+'"';
    for (var ns in namespaceCounts) {
        str += '\n xmlns:' + sz.prefixes[ns] + '="'+escapeForXML(ns)+'"';
    }
    str += '>';

    var tree2 = [str, tree, '</rdf:RDF>'];  //@@ namespace declrations
    return XMLtreeToString(tree2, -1);


} // End @@ body

return Serializer;

}();

/************************************************************
 * 
 * Project: rdflib, part of Tabulator project
 * 
 * File: web.js
 * 
 * Description: contains functions for requesting/fetching/retracting
 *  This implements quite a lot of the web architecture.
 * A fetcher is bound to a specific knowledge base graph, into which
 * it loads stuff and into which it writes its metadata
 * @@ The metadata should be optionally a separate graph
 *
 * - implements semantics of HTTP headers, Internet Content Types
 * - selects parsers for rdf/xml, n3, rdfa, grddl
 * 
 * needs: util.js uri.js term.js match.js rdfparser.js rdfa.js n3parser.js
 * identity.js rdfs.js sparql.js jsonparser.js
 * 
 *  Was: js/tab/sources.js
 ************************************************************/

/**
 * Things to test: callbacks on request, refresh, retract
 *   loading from HTTP, HTTPS, FTP, FILE, others?
 */

$rdf.Fetcher = function(store, timeout, async) {
    this.store = store
    this.thisURI = "http://dig.csail.mit.edu/2005/ajar/ajaw/rdf/sources.js" + "#SourceFetcher" // -- Kenny
//    this.timeout = timeout ? timeout : 300000
    this.timeout = timeout ? timeout : 30000
    this.async = async != null ? async : true
    this.appNode = this.store.bnode(); // Denoting this session
    this.store.fetcher = this; //Bi-linked
    this.requested = {}
    this.lookedUp = {}
    this.handlers = []
    this.mediatypes = {}
    var sf = this
    var kb = this.store;
    var ns = {} // Convenience namespaces needed in this module:
    // These are delibertely not exported as the user application should
    // make its own list and not rely on the prefixes used here,
    // and not be tempted to add to them, and them clash with those of another
    // application.
    ns.link = $rdf.Namespace("http://www.w3.org/2007/ont/link#");
    ns.http = $rdf.Namespace("http://www.w3.org/2007/ont/http#");
    ns.httph = $rdf.Namespace("http://www.w3.org/2007/ont/httph#");
    ns.rdf = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    ns.rdfs = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
    ns.dc = $rdf.Namespace("http://purl.org/dc/elements/1.1/");

    $rdf.Fetcher.RDFXMLHandler = function(args) {
        if (args) {
            this.dom = args[0]
        }
        this.recv = function(xhr) {
            xhr.handle = function(cb) {
                var kb = sf.store
                if (!this.dom) {
                    var dparser;
                    if ((tabulator !=undefined && tabulator.isExtension)) {
                        dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(Components.interfaces.nsIDOMParser);
                    } else {
                        dparser = new DOMParser()
                    }
                    //strange things happen when responseText is empty
                    this.dom = dparser.parseFromString(xhr.responseText, 'application/xml')
                }

                var root = this.dom.documentElement;
                //some simple syntax issue should be dealt here, I think
                if (root.nodeName == 'parsererror') { //@@ Mozilla only See issue/issue110
                    sf.failFetch(xhr, "Badly formed XML in " + xhr.uri.uri); //have to fail the request
                    throw new Error("Badly formed XML in " + xhr.uri.uri); //@@ Add details
                }
                // Find the last URI we actual URI in a series of redirects
                // (xhr.uri.uri is the original one)
                var lastRequested = kb.any(xhr.req, ns.link('requestedURI'));
                //dump('lastRequested 1:'+lastRequested+'\n')
                if (!lastRequested) {
                    //dump("Eh? No last requested for "+xhr.uri+"\n");
                    lastRequested = xhr.uri;
                } else {
                    lastRequested = kb.sym(lastRequested.value);
                    //dump('lastRequested 2:'+lastRequested+'\n')
                }
                //dump('lastRequested 3:'+lastRequested+'\n')
                var parser = new $rdf.RDFParser(kb);
                sf.addStatus(xhr.req, 'parsing as RDF/XML...');
                parser.parse(this.dom, lastRequested.uri, lastRequested);
                kb.add(lastRequested, ns.rdf('type'), ns.link('RDFDocument'), sf.appNode);
                cb();
            }
        }
    }
    $rdf.Fetcher.RDFXMLHandler.term = this.store.sym(this.thisURI + ".RDFXMLHandler")
    $rdf.Fetcher.RDFXMLHandler.toString = function() {
        return "RDFXMLHandler"
    }
    $rdf.Fetcher.RDFXMLHandler.register = function(sf) {
        sf.mediatypes['application/rdf+xml'] = {}
    }
    $rdf.Fetcher.RDFXMLHandler.pattern = new RegExp("application/rdf\\+xml");

    // This would much better use on-board XSLT engine. @@
    $rdf.Fetcher.doGRDDL = function(kb, doc, xslturi, xmluri) {
        sf.requestURI('http://www.w3.org/2005/08/' + 'online_xslt/xslt?' + 'xslfile=' + escape(xslturi) + '&xmlfile=' + escape(xmluri), doc)
    }

    $rdf.Fetcher.XHTMLHandler = function(args) {
        if (args) {
            this.dom = args[0]
        }
        this.recv = function(xhr) {
            xhr.handle = function(cb) {
                if (!this.dom) {
                    var dparser;
                    if (tabulator !=undefined && tabulator.isExtension) {
                        dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(Components.interfaces.nsIDOMParser);
                    } else {
                        dparser = new DOMParser()
                    }
                    this.dom = dparser.parseFromString(xhr.responseText, 'application/xml')
                }
                var kb = sf.store;

                // dc:title
                var title = this.dom.getElementsByTagName('title')
                if (title.length > 0) {
                    kb.add(xhr.uri, ns.dc('title'), kb.literal(title[0].textContent), xhr.uri)
                    // $rdf.log.info("Inferring title of " + xhr.uri)
                }

                // link rel
                var links = this.dom.getElementsByTagName('link');
                for (var x = links.length - 1; x >= 0; x--) {
                    sf.linkData(xhr, links[x].getAttribute('rel'), links[x].getAttribute('href'));
                }

                //GRDDL
                var head = this.dom.getElementsByTagName('head')[0]
                if (head) {
                    var profile = head.getAttribute('profile');
                    if (profile && $rdf.Util.uri.protocol(profile) == 'http') {
                        // $rdf.log.info("GRDDL: Using generic " + "2003/11/rdf-in-xhtml-processor.");
                         $rdf.Fetcher.doGRDDL(kb, xhr.uri, "http://www.w3.org/2003/11/rdf-in-xhtml-processor", xhr.uri.uri)
/*			sf.requestURI('http://www.w3.org/2005/08/'
					  + 'online_xslt/xslt?'
					  + 'xslfile=http://www.w3.org'
					  + '/2003/11/'
					  + 'rdf-in-xhtml-processor'
					  + '&xmlfile='
					  + escape(xhr.uri.uri),
				      xhr.uri)
                        */
                    } else {
                        // $rdf.log.info("GRDDL: No GRDDL profile in " + xhr.uri)
                    }
                }
                kb.add(xhr.uri, ns.rdf('type'), ns.link('WebPage'), sf.appNode);
                // @@ Do RDFa here
                //var p = $rdf.RDFaParser(kb, xhr.uri.uri);
                $rdf.rdfa.parse(this.dom, kb, xhr.uri.uri);  // see rdfa.js
            }
        }
    }
    $rdf.Fetcher.XHTMLHandler.term = this.store.sym(this.thisURI + ".XHTMLHandler")
    $rdf.Fetcher.XHTMLHandler.toString = function() {
        return "XHTMLHandler"
    }
    $rdf.Fetcher.XHTMLHandler.register = function(sf) {
        sf.mediatypes['application/xhtml+xml'] = {
            'q': 0.3
        }
    }
    $rdf.Fetcher.XHTMLHandler.pattern = new RegExp("application/xhtml")


    /******************************************************/

    $rdf.Fetcher.XMLHandler = function() {
        this.recv = function(xhr) {
            xhr.handle = function(cb) {
                var kb = sf.store
                var dparser;
                if (tabulator !=undefined && tabulator.isExtension) {
                    dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(Components.interfaces.nsIDOMParser);
                } else {
                    dparser = new DOMParser()
                }
                var dom = dparser.parseFromString(xhr.responseText, 'application/xml')

                // XML Semantics defined by root element namespace
                // figure out the root element
                for (var c = 0; c < dom.childNodes.length; c++) {
                    // is this node an element?
                    if (dom.childNodes[c].nodeType == 1) {
                        // We've found the first element, it's the root
                        var ns = dom.childNodes[c].namespaceURI;

                        // Is it RDF/XML?
                        if (ns == ns['rdf']) {
                            sf.addStatus(xhr.req, "Has XML root element in the RDF namespace, so assume RDF/XML.")
                            sf.switchHandler('RDFXMLHandler', xhr, cb, [dom])
                            return
                        }
                        // it isn't RDF/XML or we can't tell
                        // Are there any GRDDL transforms for this namespace?
                        // @@ assumes ns documents have already been loaded
                        var xforms = kb.each(kb.sym(ns), kb.sym("http://www.w3.org/2003/g/data-view#namespaceTransformation"));
                        for (var i = 0; i < xforms.length; i++) {
                            var xform = xforms[i];
                            // $rdf.log.info(xhr.uri.uri + " namespace " + ns + " has GRDDL ns transform" + xform.uri);
                             $rdf.Fetcher.doGRDDL(kb, xhr.uri, xform.uri, xhr.uri.uri);
                        }
                        break
                    }
                }

                // Or it could be XHTML?
                // Maybe it has an XHTML DOCTYPE?
                if (dom.doctype) {
                    // $rdf.log.info("We found a DOCTYPE in " + xhr.uri)
                    if (dom.doctype.name == 'html' && dom.doctype.publicId.match(/^-\/\/W3C\/\/DTD XHTML/) && dom.doctype.systemId.match(/http:\/\/www.w3.org\/TR\/xhtml/)) {
                        sf.addStatus(xhr.req,"Has XHTML DOCTYPE. Switching to XHTML Handler.\n")
                        sf.switchHandler('XHTMLHandler', xhr, cb)
                        return
                    }
                }

                // Or what about an XHTML namespace?
                var html = dom.getElementsByTagName('html')[0]
                if (html) {
                    var xmlns = html.getAttribute('xmlns')
                    if (xmlns && xmlns.match(/^http:\/\/www.w3.org\/1999\/xhtml/)) {
                        sf.addStatus(xhr.req, "Has a default namespace for " + "XHTML. Switching to XHTMLHandler.\n")
                        sf.switchHandler('XHTMLHandler', xhr, cb)
                        return
                    }
                }

                // At this point we should check the namespace document (cache it!) and
                // look for a GRDDL transform
                // @@  Get namespace document <n>, parse it, look for  <n> grddl:namespaceTransform ?y
                // Apply ?y to   dom
                // We give up. What dialect is this?
                sf.failFetch(xhr, "unsupportedDialect")
            }
        }
    }
    $rdf.Fetcher.XMLHandler.term = this.store.sym(this.thisURI + ".XMLHandler")
    $rdf.Fetcher.XMLHandler.toString = function() {
        return "XMLHandler"
    }
    $rdf.Fetcher.XMLHandler.register = function(sf) {
        sf.mediatypes['text/xml'] = {
            'q': 0.2
        }
        sf.mediatypes['application/xml'] = {
            'q': 0.2
        }
    }
    $rdf.Fetcher.XMLHandler.pattern = new RegExp("(text|application)/(.*)xml")

    $rdf.Fetcher.HTMLHandler = function() {
        this.recv = function(xhr) {
            xhr.handle = function(cb) {
                var rt = xhr.responseText
                // We only handle XHTML so we have to figure out if this is XML
                // $rdf.log.info("Sniffing HTML " + xhr.uri + " for XHTML.");

                if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
                    sf.addStatus(xhr.req, "Has an XML declaration. We'll assume " +
                        "it's XHTML as the content-type was text/html.\n")
                    sf.switchHandler('XHTMLHandler', xhr, cb)
                    return
                }

                // DOCTYPE
                // There is probably a smarter way to do this
                if (rt.match(/.*<!DOCTYPE\s+html[^<]+-\/\/W3C\/\/DTD XHTML[^<]+http:\/\/www.w3.org\/TR\/xhtml[^<]+>/)) {
                    sf.addStatus(xhr.req, "Has XHTML DOCTYPE. Switching to XHTMLHandler.\n")
                    sf.switchHandler('XHTMLHandler', xhr, cb)
                    return
                }

                // xmlns
                if (rt.match(/[^(<html)]*<html\s+[^<]*xmlns=['"]http:\/\/www.w3.org\/1999\/xhtml["'][^<]*>/)) {
                    sf.addStatus(xhr.req, "Has default namespace for XHTML, so switching to XHTMLHandler.\n")
                    sf.switchHandler('XHTMLHandler', xhr, cb)
                    return
                }


                // dc:title	                       //no need to escape '/' here
                var titleMatch = (new RegExp("<title>([\\s\\S]+?)</title>", 'im')).exec(rt);
                if (titleMatch) {
                    var kb = sf.store;
                    kb.add(xhr.uri, ns.dc('title'), kb.literal(titleMatch[1]), xhr.uri); //think about xml:lang later
                    kb.add(xhr.uri, ns.rdf('type'), ns.link('WebPage'), sf.appNode);
                    cb(); //doneFetch, not failed
                    return;
                }

                sf.failFetch(xhr, "Sorry, can't yet parse non-XML HTML")
            }
        }
    }
    $rdf.Fetcher.HTMLHandler.term = this.store.sym(this.thisURI + ".HTMLHandler")
    $rdf.Fetcher.HTMLHandler.toString = function() {
        return "HTMLHandler"
    }
    $rdf.Fetcher.HTMLHandler.register = function(sf) {
        sf.mediatypes['text/html'] = {
            'q': 0.3
        }
    }
    $rdf.Fetcher.HTMLHandler.pattern = new RegExp("text/html")

    /***********************************************/

    $rdf.Fetcher.TextHandler = function() {
        this.recv = function(xhr) {
            xhr.handle = function(cb) {
                // We only speak dialects of XML right now. Is this XML?
                var rt = xhr.responseText

                // Look for an XML declaration
                if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
                    sf.addStatus(xhr.req, "Warning: "+xhr.uri + " has an XML declaration. We'll assume " 
                        + "it's XML but its content-type wasn't XML.\n")
                    sf.switchHandler('XMLHandler', xhr, cb)
                    return
                }

                // Look for an XML declaration
                if (rt.slice(0, 500).match(/xmlns:/)) {
                    sf.addStatus(xhr.req, "May have an XML namespace. We'll assume "
                            + "it's XML but its content-type wasn't XML.\n")
                    sf.switchHandler('XMLHandler', xhr, cb)
                    return
                }

                // We give up finding semantics - this is not an error, just no data
                sf.addStatus(xhr.req, "Plain text document, no known RDF semantics.");
                sf.doneFetch(xhr, [xhr.uri.uri]);
//                sf.failFetch(xhr, "unparseable - text/plain not visibly XML")
//                dump(xhr.uri + " unparseable - text/plain not visibly XML, starts:\n" + rt.slice(0, 500)+"\n")

            }
        }
    }
    $rdf.Fetcher.TextHandler.term = this.store.sym(this.thisURI + ".TextHandler")
    $rdf.Fetcher.TextHandler.toString = function() {
        return "TextHandler"
    }
    $rdf.Fetcher.TextHandler.register = function(sf) {
        sf.mediatypes['text/plain'] = {
            'q': 0.1
        }
    }
    $rdf.Fetcher.TextHandler.pattern = new RegExp("text/plain")

    /***********************************************/

    $rdf.Fetcher.N3Handler = function() {
        this.recv = function(xhr) {
            xhr.handle = function(cb) {
                // Parse the text of this non-XML file
                var rt = xhr.responseText
                var p = $rdf.N3Parser(kb, kb, xhr.uri.uri, xhr.uri.uri, null, null, "", null)
                //                p.loadBuf(xhr.responseText)
                try {
                    p.loadBuf(xhr.responseText)

                } catch (e) {
                    var msg = ("Error trying to parse " + xhr.uri + ' as Notation3:\n' + e)
                    // dump(msg+"\n")
                    sf.failFetch(xhr, msg)
                    return;
                }

                sf.addStatus(xhr.req, 'N3 parsed: ' + p.statementCount + ' statements in ' + p.lines + ' lines.')
                sf.store.add(xhr.uri, ns.rdf('type'), ns.link('RDFDocument'), sf.appNode);
                args = [xhr.uri.uri]; // Other args needed ever?
                sf.doneFetch(xhr, args)
            }
        }
    }
    $rdf.Fetcher.N3Handler.term = this.store.sym(this.thisURI + ".N3Handler")
    $rdf.Fetcher.N3Handler.toString = function() {
        return "N3Handler"
    }
    $rdf.Fetcher.N3Handler.register = function(sf) {
        sf.mediatypes['text/n3'] = {
            'q': '1.0'
        } // as per 2008 spec
        sf.mediatypes['text/rdf+n3'] = {
            'q': 1.0
        } // pre 2008 spec
        sf.mediatypes['application/x-turtle'] = {
            'q': 1.0
        } // pre 2008
        sf.mediatypes['text/turtle'] = {
            'q': 1.0
        } // pre 2008
    }
    $rdf.Fetcher.N3Handler.pattern = new RegExp("(application|text)/(x-)?(rdf\\+)?(n3|turtle)")


    /***********************************************/





    $rdf.Util.callbackify(this, ['request', 'recv', 'load', 'fail', 'refresh', 'retract', 'done'])

/* now see ns
       this.store.setPrefixForURI('rdfs', "http://www.w3.org/2000/01/rdf-schema#")
       this.store.setPrefixForURI('owl', "http://www.w3.org/2002/07/owl#")
       this.store.setPrefixForURI('tab',"http://www.w3.org/2007/ont/link#")
       this.store.setPrefixForURI('http',"http://www.w3.org/2007/ont/http#")
       this.store.setPrefixForURI('httph',
	   "http://www.w3.org/2007/ont/httph#")
       this.store.setPrefixForURI('ical',"http://www.w3.org/2002/12/cal/icaltzd#")
       
    */
    this.addProtocol = function(proto) {
        sf.store.add(sf.appNode, ns.link("protocol"), sf.store.literal(proto), this.appNode)
    }

    this.addHandler = function(handler) {
        sf.handlers.push(handler)
        handler.register(sf)
    }

    this.switchHandler = function(name, xhr, cb, args) {
        var kb = this.store; var handler = null;
        for (var i=0; i<this.handlers.length; i++) {
            if (''+this.handlers[i] == name) {
                handler = this.handlers[i];
            }
        }
        if (handler == undefined) {
            throw 'web.js: switchHandler: name='+name+' , this.handlers ='+this.handlers+'\n' +
                    'switchHandler: switching to '+handler+'; sf='+sf +
                    '; typeof $rdf.Fetcher='+typeof $rdf.Fetcher +
                    ';\n\t $rdf.Fetcher.HTMLHandler='+$rdf.Fetcher.HTMLHandler+'\n' +
                    '\n\tsf.handlers='+sf.handlers+'\n'
        }
        (new handler(args)).recv(xhr);
        // kb.the(xhr.req, ns.link('handler')).append(handler.term)
        xhr.handle(cb)
    }

    this.addStatus = function(req, status) {
        //<Debug about="parsePerformance">
        var now = new Date();
        status = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "." + now.getMilliseconds() + "] " + status;
        //</Debug>
        var kb = this.store
        kb.the(req, ns.link('status')).append(kb.literal(status))
    }

    // Record errors in the system omn failure
    // Returns xhr so can just do return this.failfetch(...)
    this.failFetch = function(xhr, status) {
        this.addStatus(xhr.req, status)
        kb.add(xhr.uri, ns.link('error'), status)
        this.requested[$rdf.Util.uri.docpart(xhr.uri.uri)] = false
        this.fireCallbacks('fail', [xhr.requestedURI])
        xhr.abort()
        return xhr
    }

    this.linkData = function(xhr, rel, uri) {
        var x = xhr.uri;
        if (!uri) return;
        // See http://www.w3.org/TR/powder-dr/#httplink for describedby 2008-12-10
        if (rel == 'alternate' || rel == 'seeAlso' || rel == 'meta' || rel == 'describedby') {
            var join = $rdf.Util.uri.join2;
            var obj = kb.sym(join(uri, xhr.uri.uri))
            if (obj.uri != xhr.uri) {
                kb.add(xhr.uri, ns.rdfs('seeAlso'), obj, xhr.uri);
                // $rdf.log.info("Loading " + obj + " from link rel in " + xhr.uri);
            }
        }
    };


    this.doneFetch = function(xhr, args) {
        this.addStatus(xhr.req, 'done')
        // $rdf.log.info("Done with parse, firing 'done' callbacks for " + xhr.uri)
        this.requested[xhr.uri.uri] = 'done'; //Kenny
        this.fireCallbacks('done', args)
    }

    this.store.add(this.appNode, ns.rdfs('label'), this.store.literal('This Session'), this.appNode);

    ['http', 'https', 'file', 'chrome'].map(this.addProtocol); // ftp?
    [$rdf.Fetcher.RDFXMLHandler, $rdf.Fetcher.XHTMLHandler, $rdf.Fetcher.XMLHandler, $rdf.Fetcher.HTMLHandler, $rdf.Fetcher.TextHandler, $rdf.Fetcher.N3Handler, ].map(this.addHandler)


 
    /** Note two nodes are now smushed
     **
     ** If only one was flagged as looked up, then
     ** the new node is looked up again, which
     ** will make sure all the URIs are dereferenced
     */
    this.nowKnownAs = function(was, now) {
        if (this.lookedUp[was.uri]) {
            if (!this.lookedUp[now.uri]) this.lookUpThing(now, was)
        } else if (this.lookedUp[now.uri]) {
            if (!this.lookedUp[was.uri]) this.lookUpThing(was, now)
        }
    }





// Looks up something.
//
// Looks up all the URIs a things has.
// Parameters:
//
//  term:       canonical term for the thing whose URI is to be dereferenced
//  rterm:      the resource which refered to this (for tracking bad links)
//  force:      Load the data even if loaded before
//  callback:   is called as callback(uri, success, errorbody)

    this.lookUpThing = function(term, rterm, force, callback) {
        var uris = kb.uris(term) // Get all URIs
        var failed = false;
        var outstanding;
        if (typeof uris != 'undefined') {
        
            if (callback) {
                // @@@@@@@ not implemented
            }
            for (var i = 0; i < uris.length; i++) {
                this.lookedUp[uris[i]] = true;
                this.requestURI($rdf.Util.uri.docpart(uris[i]), rterm, force)
            }
        }
        return uris.length
    }


/*  Ask for a doc to be loaded if necessary then call back
    **/
    this.nowOrWhenFetched = function(uri, referringTerm, callback) {
        var sta = this.getState(uri);
        if (sta == 'fetched') return callback();
        this.addCallback('done', function(uri2) {
            if (uri2 == uri) callback();
            return (uri2 != uri); // Call me again?
        });
        if (sta == 'unrequested') this.requestURI(
        uri, referringTerm, false);
    }





    /** Requests a document URI and arranges to load the document.
     ** Parameters:
     **	    term:  term for the thing whose URI is to be dereferenced
     **      rterm:  the resource which refered to this (for tracking bad links)
     **      force:  Load the data even if loaded before
     ** Return value:
     **	    The xhr object for the HTTP access
     **      null if the protocol is not a look-up protocol,
     **              or URI has already been loaded
     */
    this.requestURI = function(docuri, rterm, force) { //sources_request_new
        if (docuri.indexOf('#') >= 0) { // hash
            throw ("requestURI should not be called with fragid: " + uri)
        }

        var pcol = $rdf.Util.uri.protocol(docuri);
        if (pcol == 'tel' || pcol == 'mailto' || pcol == 'urn') return null; // No look-up operaion on these, but they are not errors
        var force = !! force
        var kb = this.store
        var args = arguments
        //	var term = kb.sym(docuri)
        var docterm = kb.sym(docuri)
        // dump("requestURI: dereferencing " + docuri)
        //this.fireCallbacks('request',args)
        if (!force && typeof(this.requested[docuri]) != "undefined") {
            // dump("We already have requested " + docuri + ". Skipping.\n")
            return null
        }

        this.fireCallbacks('request', args); //Kenny: fire 'request' callbacks here
        // dump( "web.js: Requesting uri: " + docuri + "\n" );
        this.requested[docuri] = true

        if (rterm) {
            if (rterm.uri) { // A link betwen URIs not terms
                kb.add(docterm.uri, ns.link("requestedBy"), rterm.uri, this.appNode)
            }
        }
    
        if (rterm) {
            // $rdf.log.info('SF.request: ' + docuri + ' refd by ' + rterm.uri)
        }
        else {
            // $rdf.log.info('SF.request: ' + docuri + ' no referring doc')
        };

        var xhr = $rdf.Util.XMLHTTPFactory()
        var req = xhr.req = kb.bnode()
        xhr.uri = docterm
        xhr.requestedURI = args[0]
        var requestHandlers = kb.collection()
        var sf = this

        // The list of sources is kept in the source widget
        // kb.add(this.appNode, ns.link("source"), docterm, this.appNode)
        // kb.add(docterm, ns.link('request'), req, this.appNode)
        var now = new Date();
        var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";

        kb.add(req, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + docuri), this.appNode)
        kb.add(req, ns.link("requestedURI"), kb.literal(docuri), this.appNode)
        kb.add(req, ns.link('status'), kb.collection(), sf.req)

        // This request will have handlers probably
//        kb.add(req, ns.link('handler'), requestHandlers, sf.appNode)


        if (typeof kb.anyStatementMatching(this.appNode, ns.link("protocol"), $rdf.Util.uri.protocol(docuri)) == "undefined") {
            // update the status before we break out
            this.failFetch(xhr, "Unsupported protocol")
            return xhr
        }

        // Set up callbacks
        xhr.onreadystatechange = function() {
            // dump("@@ readystate "+xhr.readyState+" for "+xhr.uri+"\n");
            switch (xhr.readyState) {
            case 3:
                // Intermediate states
                if (!xhr.recv) {
                    xhr.recv = true
                    var handler = null
                    var thisReq = xhr.req // Might have changes by redirect
                    sf.fireCallbacks('recv', args)
                    var response = kb.bnode();
                    kb.add(thisReq, ns.link('response'), response);
                    kb.add(response, ns.http('status'), kb.literal(xhr.status), response)
                    kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                    xhr.headers = {}
                    if ($rdf.Util.uri.protocol(xhr.uri.uri) == 'http' || $rdf.Util.uri.protocol(xhr.uri.uri) == 'https') {
                        xhr.headers = $rdf.Util.getHTTPHeaders(xhr)
                        for (var h in xhr.headers) { // trim below for Safari - adds a CR!
                            kb.add(response, ns.httph(h), xhr.headers[h].trim(), response)
                        }
                    }

                    if (xhr.status >= 400) { // For extra dignostics, keep the reply
                        if (xhr.responseText.length > 10) { 
                            kb.add(response, ns.http('content'), kb.literal(xhr.responseText), response);
                            // dump("HTTP >= 400 responseText:\n"+xhr.responseText+"\n"); // @@@@
                        }
                        sf.failFetch(xhr, "HTTP error for " +xhr.uri + ": "+ xhr.status + ' ' + xhr.statusText);
                        break
                    }



                    var loc = xhr.headers['content-location'];



                    // deduce some things from the HTTP transaction
                    var addType = function(cla) { // add type to all redirected resources too
                        var prev = thisReq;
                        if (loc) {
                            var docURI = kb.any(prev, ns.link('requestedURI'));
                            if (docURI != loc) {
                                kb.add(kb.sym(doc), ns.rdf('type'), cla, sf.appNode);
                            }
                        }
                        for (;;) {
                            var doc = kb.sym(kb.any(prev, ns.link('requestedURI')))
                            kb.add(doc, ns.rdf('type'), cla, sf.appNode);
                            prev = kb.any(undefined, kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'), prev);
                            if (!prev) break;
                            var response = kb.any(prev, kb.sym('http://www.w3.org/2007/ont/link#response'));
                            if (!response) break;
                            var redirection = kb.any(response, kb.sym('http://www.w3.org/2007/ont/http#status'));
                            if (!redirection) break;
                            if (redirection != '301' && redirection != '302') break;
                        }
                    }
                    if (xhr.status == 200) {
                        addType(ns.link('Document'));
                        var ct = xhr.headers['content-type'];
                        if (!ct) throw ('No content-type on 200 response for ' + xhr.uri)
                        else {
                            if (ct.indexOf('image/') == 0) addType(kb.sym('http://purl.org/dc/terms/Image'));
                        }
                    }

                    if ($rdf.Util.uri.protocol(xhr.uri.uri) == 'file' || $rdf.Util.uri.protocol(xhr.uri.uri) == 'chrome') {
                        switch (xhr.uri.uri.split('.').pop()) {
                        case 'rdf':
                        case 'owl':
                            xhr.headers['content-type'] = 'application/rdf+xml';
                            break;
                        case 'n3':
                        case 'nt':
                        case 'ttl':
                            xhr.headers['content-type'] = 'text/n3';
                            break;
                        default:
                            xhr.headers['content-type'] = 'text/xml';
                        }
                    }

                    // If we have alread got the thing at this location, abort
                    if (loc) {
                        var udoc = $rdf.Util.uri.join(xhr.uri.uri, loc)
                        if (!force && udoc != xhr.uri.uri && sf.requested[udoc]) {
                            // should we smush too?
                            // $rdf.log.info("HTTP headers indicate we have already" + " retrieved " + xhr.uri + " as " + udoc + ". Aborting.")
                            sf.doneFetch(xhr, args)
                            xhr.abort()
                            break
                        }
                        sf.requested[udoc] = true
                    }


                    for (var x = 0; x < sf.handlers.length; x++) {
                        if (xhr.headers['content-type'].match(sf.handlers[x].pattern)) {
                            handler = new sf.handlers[x]()
                            requestHandlers.append(sf.handlers[x].term) // FYI
                            break
                        }
                    }

                    var link = xhr.headers['link']; // Only one?
                    if (link) {
                        var rel = null;
                        var arg = link.replace(/ /g, '').split(';');
                        for (var i = 0; i < arg.length; i++) {
                            lr = arg[i].split('=');
                            if (lr[0] == 'rel') rel = lr[1];
                        }
                        if (rel) // Treat just like HTML link element
                        sf.linkData(xhr, rel, arg[0]);
                    }


                    if (handler) {
                        handler.recv(xhr)
                    } else {
                        sf.failFetch(xhr, "Unhandled content type: " + xhr.headers['content-type']);
                        break
                    }
                }
                break
            case 4:
                // Final state
                // Now handle
                if (xhr.handle) {
                    if (sf.requested[xhr.uri.uri] === 'redirected') {
                        break;
                    }
                    sf.fireCallbacks('load', args)
                    xhr.handle(function() {
                        sf.doneFetch(xhr, args)
                    })
                }
                break
            }
        }

        // Get privileges for cross-domain XHR
        if (!(tabulator !=undefined && tabulator.isExtension)) {
            try {
                $rdf.Util.enablePrivilege("UniversalXPConnect UniversalBrowserRead")
            } catch (e) {
                this.failFetch(xhr, "Failed to get (UniversalXPConnect UniversalBrowserRead) privilege to read different web site: " + docuri);
                return xhr;
            }
        }

        // Map the URI to a localhost proxy if we are running on localhost
        // This is used for working offline, e.g. on planes.
        // Is the script istelf is running in localhost, then access all data in a localhost mirror.
        // Do not remove without checking with TimBL :)
        var uri2 = docuri;
        if (tabulator.preferences.get('offlineModeUsingLocalhost')) {
            // var here = '' + document.location  // This was fro online version
            //if (here.slice(0, 17) == 'http://localhost/') {
            //uri2 = 'http://localhost/' + uri2.slice(7, uri2.length)
            if (uri2.slice(0,7) == 'http://'  && uri2.slice(7,17) != 'localhost/') uri2 = 'http://localhost/' + uri2.slice(7);
                // dump("URI mapped to " + uri2)
        }

        // Setup the request
        xhr.open('GET', uri2, this.async)
        
        // Set redirect callback and request headers -- alas Firefox Only
        
        if ($rdf.Util.uri.protocol(xhr.uri.uri) == 'http' || $rdf.Util.uri.protocol(xhr.uri.uri) == 'https') {
            try {
                xhr.channel.notificationCallbacks = {
                    getInterface: function(iid) {
                        if (!(tabulator !=undefined && tabulator.isExtension)) {
                            $rdf.Util.enablePrivilege("UniversalXPConnect")
                        }
                        if (iid.equals(Components.interfaces.nsIChannelEventSink)) {
                            return {

                                onChannelRedirect: function(oldC, newC, flags) {
                                    if (!(tabulator !=undefined && tabulator.isExtension)) {
                                        $rdf.Util.enablePrivilege("UniversalXPConnect")
                                    }
                                    if (xhr.aborted) return;
                                    var kb = sf.store;
                                    var newURI = newC.URI.spec;
                                    var oldreq = xhr.req;
                                    sf.addStatus(xhr.req, "Redirected: " + xhr.status + " to <" + newURI + ">");
                                    kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req);



                                    ////////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                                    var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                                    // xhr.uri = docterm
                                    // xhr.requestedURI = args[0]
                                    // var requestHandlers = kb.collection()

                                    // kb.add(kb.sym(newURI), ns.link("request"), req, this.appNode)
                                    kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req);

                                    var now = new Date();
                                    var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
                                    kb.add(newreq, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                                    kb.add(newreq, ns.link('status'), kb.collection(), sf.req)
                                    kb.add(newreq, ns.link("requestedURI"), kb.literal(newURI), this.appNode)
                                    ///////////////

                                    
                                    //// $rdf.log.info('@@ sources onChannelRedirect'+
                                    //               "Redirected: "+ 
                                    //               xhr.status + " to <" + newURI + ">"); //@@
                                    var response = kb.bnode();
                                    // kb.add(response, ns.http('location'), newURI, response); Not on this response
                                    kb.add(oldreq, ns.link('response'), response);
                                    kb.add(response, ns.http('status'), kb.literal(xhr.status), response);
                                    if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                                    if (xhr.status - 0 != 303) kb.HTTPRedirects[xhr.uri.uri] = newURI; // same document as
                                    if (xhr.status - 0 == 301 && rterm) { // 301 Moved
                                        var badDoc = $rdf.Util.uri.docpart(rterm.uri);
                                        var msg = 'Warning: ' + xhr.uri + ' has moved to <' + newURI + '>.';
                                        if (rterm) {
                                            msg += ' Link in <' + badDoc + ' >should be changed';
                                            kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode);
                                        }
                                        // dump(msg+"\n");
                                    }
                                    xhr.abort()
                                    xhr.aborted = true

                                    sf.addStatus(oldreq, 'done') // why
                                    sf.fireCallbacks('done', args) // Are these args right? @@@
                                    sf.requested[xhr.uri.uri] = 'redirected';

                                    var hash = newURI.indexOf('#');
                                    if (hash >= 0) {
                                        var msg = ('Warning: ' + xhr.uri + ' HTTP redirects to' + newURI + ' which should not contain a "#" sign');
                                        // dump(msg+"\n");
                                        kb.add(xhr.uri, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg)
                                        newURI = newURI.slice(0, hash);
                                    }
                                    xhr2 = sf.requestURI(newURI, xhr.uri)
                                    if (xhr2 && xhr2.req) kb.add(xhr.req, kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'), xhr2.req, sf.appNode);
                                    // else dump("No xhr.req available for redirect from "+xhr.uri+" to "+newURI+"\n")
                                }
                            }
                        }
                        return Components.results.NS_NOINTERFACE
                    }
                }
            } catch (err) {
                if (tabulator != undefined && tabulator.isExtension) return sf.failFetch(xhr,
                        "Couldn't set callback for redirects: " + err);
            }

            try {
                var acceptstring = ""
                for (var type in this.mediatypes) {
                    var attrstring = ""
                    if (acceptstring != "") {
                        acceptstring += ", "
                    }
                    acceptstring += type
                    for (var attr in this.mediatypes[type]) {
                        acceptstring += ';' + attr + '=' + this.mediatypes[type][attr]
                    }
                }
                xhr.setRequestHeader('Accept', acceptstring)
                // $rdf.log.info('Accept: ' + acceptstring)

                // See http://dig.csail.mit.edu/issues/tabulator/issue65
                //if (requester) { xhr.setRequestHeader('Referer',requester) }
            } catch (err) {
                throw ("Can't set Accept header: " + err)
            }
        }

        // Fire
        try {
            xhr.send(null)
        } catch (er) {
            this.failFetch(xhr, "sendFailed:" + er)
            return xhr
        }
        this.addStatus(xhr.req, "HTTP Request sent.");

        // Drop privs
        if (!(tabulator !=undefined && tabulator.isExtension)) {
            try {
                $rdf.Util.disablePrivilege("UniversalXPConnect UniversalBrowserRead")
            } catch (e) {
                throw ("Can't drop privilege: " + e)
            }
        }

        setTimeout(function() {
            if (xhr.readyState != 4 && sf.isPending(xhr.uri.uri)) {
                sf.failFetch(xhr, "requestTimeout")
            }
        }, this.timeout)
        return xhr
    }

// this.requested[docuri]) != "undefined"

    this.objectRefresh = function(term) {
        var uris = kb.uris(term) // Get all URIs
        if (typeof uris != 'undefined') {
            for (var i = 0; i < uris.length; i++) {
                this.refresh(this.store.sym($rdf.Util.uri.docpart(uris[i])));
                //what about rterm?
            }
        }
    }

    this.unload = function(term) {
        this.store.removeMany(undefined, undefined, undefined, term)
        delete this.requested[term.uri]; // So it can be loaded again
    }
    
    this.refresh = function(term) { // sources_refresh
        this.unload(term);
        this.fireCallbacks('refresh', arguments)
        this.requestURI(term.uri, undefined, true)
    }

    this.retract = function(term) { // sources_retract
        this.store.removeMany(undefined, undefined, undefined, term)
        if (term.uri) {
            delete this.requested[$rdf.Util.uri.docpart(term.uri)]
        }
        this.fireCallbacks('retract', arguments)
    }

    this.getState = function(docuri) { // docState
        if (typeof this.requested[docuri] != "undefined") {
            if (this.requested[docuri]) {
                if (this.isPending(docuri)) {
                    return "requested"
                } else {
                    return "fetched"
                }
            } else {
                return "failed"
            }
        } else {
            return "unrequested"
        }
    }

    //doing anyStatementMatching is wasting time
    this.isPending = function(docuri) { // sources_pending
        //if it's not pending: false -> flailed 'done' -> done 'redirected' -> redirected
        return this.requested[docuri] == true;
    }
}

$rdf.fetcher = function(store, timeout, async) { return new $rdf.Fetcher(store, timeout, async) };

// Parse a string and put the result into the graph kb
$rdf.parse = function parse(str, kb, base, contentType) {
    if (contentType in ['text/n3', 'text/turtle']) {
        var p = $rdf.N3Parser(kb, kb, base, base, null, null, "", null)
        p.loadBuf(str);
        return;
    }

    if (contentType == 'application/rdf+xml') {
        var dparser;
        if ((tabulator !=undefined && tabulator.isExtension)) {
            dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(
                        Components.interfaces.nsIDOMParser);
        } else {
            dparser = new DOMParser()
        }
        var dom = dparser.parseFromString(str, 'application/xml');
        var parser = new $rdf.RDFParser(kb);
        parser.parse(dom, base, kb.sym(base));
    }
    throw "Don't know how to parse "+contentType+" yet";

};

return $rdf;}()
