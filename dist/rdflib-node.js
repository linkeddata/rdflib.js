(function(root, undef) {
/**
* Utility functions for $rdf and the $rdf object itself
 */

if (typeof tabulator != 'undefined' && typeof tabulator.isExtension == 'undefined') tabulator.isExtension = false; // stand-alone library

if( typeof $rdf == 'undefined' ) {
    var $rdf = {};
} else {
    //dump("Internal error: RDF libray has already been loaded\n");
    //dump("Internal error: $rdf type is "+typeof $rdf+"\n");
    //dump("Internal error: $rdf.log type is "+typeof $rdf.log+"\n");
    //dump("Internal error: $rdf.log.error type is "+typeof $rdf.log.error+"\n");
    return $rdf;

    throw "Internal error: RDF libray has already been loaded: $rdf already exists";
};

/**
 * @class a dummy logger

 Note to implement this using the Firefox error console see
  https://developer.mozilla.org/en/nsIConsoleService
 */

//dump("@@ rdf/util.js test RESET RDF LOGGER  $rdf.log.error)\n");
if($rdf.log != undefined) {
    //dump("WTF util.js:" + $rdf.log);
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
    callbackify: function (obj,callbacks) {
        obj.callbacks = {}
        for (var x=callbacks.length-1; x>=0; x--) {
            obj.callbacks[callbacks[x]] = [];
        }

        obj.addHook = function (hook) {
            if (!obj.callbacks[hook])
                obj.callbacks[hook] = [];
        }

        obj.addCallback = function (hook, func) {
            obj.callbacks[hook].push(func);
        }

        obj.removeCallback = function (hook, funcName) {
            for (var i=0;i<obj.callbacks[hook].length;i++){
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
    XMLHTTPFactory: function () {
      // Running inside the Tabulator Firefox extension
      if (typeof tabulator !== 'undefined' && tabulator.isExtension) {
        // Cannot use XMLHttpRequest natively, must request it through SDK
        return Components
          .classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
          .createInstance()
          .QueryInterface(Components.interfaces.nsIXMLHttpRequest)
      } else if (typeof window !== 'undefined' && 'XMLHttpRequest' in window) {
        // Running inside the browser
        var XMLHttpRequest = window.XMLHttpRequest
        return new XMLHttpRequest()
      } else if (typeof module != 'undefined' && module && module.exports) {
        // Running in Node.js
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        return new XMLHttpRequest()
      } else if (window.ActiveXObject) {
        try {
          return new ActiveXObject("Msxml2.XMLHTTP")
        } catch (e) {
          return new ActiveXObject("Microsoft.XMLHTTP")
        }
      } else {
        return false
      }
    },

	'DOMParserFactory': function () {
        if(tabulator && tabulator.isExtension) {
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

    'enablePrivilege': ((typeof netscape != 'undefined') && (typeof netscape.security.PrivilegeManager != 'undefined') && netscape.security.PrivilegeManager.enablePrivilege) || function() { return; },
    'disablePrivilege': ((typeof netscape != 'undefined') && (typeof netscape.security.PrivilegeManager != 'undefined') && netscape.security.PrivilegeManager.disablePrivilege) || function() { return; },



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
        throw "RDFArrayRemove: Array did not contain " + x + " " +  x.why;
    },

    'string_startswith': function(str, pref) { // missing library routines
        return (str.slice(0, pref.length) == pref);
    },

    // This is the callback from the kb to the fetcher which is used to
    // load ontologies of the data we load.

    'AJAR_handleNewTerm': function(kb, p, requestedBy) {
        var sf = null;
        if( typeof kb.fetcher != 'undefined' ) {
            sf = kb.fetcher;
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


////////////////// find the variables in a graph
//  SHALLOW
//  used?
//
$rdf.Util.variablesIn = function(g) {
    for (var i=0; i<g.statements.length; i++) {
        var st = g.statatements[i];
        var vars = {}
        if (st.subject instanceof $rdf.Variable) {
            vars[st.subject.toNT()] = true;
        }
        if (st.predicate instanceof $rdf.Variable) {
            vars[st.predicate.toNT()] = true;
        }
        if (st.object instanceof $rdf.Variable) {
            vars[st.object.toNT()] = true;
        }
    }
    return vars;
};

//   Heavy comparison is for repeatable canonical ordering
$rdf.Util.heavyCompare = function(x, y, g) {
    var nonBlank = function(x) {
        return (x.termType === 'bnode') ?  null : x;
    }
    var signature = function(b) {
        var lis = g.statementsMatching(x).map(function(st){
            return ('' + nonBlank(st.subject) + ' ' + nonBlank(st.predicate)
                + ' ' + nonBlank(st.object));
        }).concat(g.statementsMatching(undefined, undefined, x).map(function(st){
            return ('' + nonBlank(st.subject) + ' ' + nonBlank(st.predicate)
                + ' ' + nonBlank(st.object));
        }))
        lis.sort();
        return lis.join('\n');
    }
    if ((x.termType === 'bnode') || (y.termType === 'bnode')) {
        if (x.compareTerm(y) === 0) return 0; // Same
        if (signature(x) > signature(y)) return +1;
        if (signature(x) < signature(y)) return -1;
        return x.compareTerm(y); // Too bad -- this order not canonical.
        //throw "different bnodes indistinquishable for sorting"
    } else {
        return x.compareTerm(y);
    }
};

$rdf.Util.heavyCompareSPO = function(x, y, g) {
    var comp = $rdf.Util.heavyCompare;
    var d = comp(x.subject, y.subject, g);
    if (d) return d;
    d = comp(x.predicate, y.predicate, g);
    if (d) return d;
    return comp(x.object, y.object, g);
};


///////////////////// Parse XML
//
// Returns: A DOM
//

$rdf.Util.parseXML = function(str, options) {
    var dparser;
    options = options || {};
    if ((typeof tabulator != 'undefined' && tabulator.isExtension)) {
        dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(
                    Components.interfaces.nsIDOMParser);
    } else if (typeof module != 'undefined' && module && module.exports){ // Node.js
        //var libxmljs = require('libxmljs'); // Was jsdom before 2012-01 then libxmljs but that nonstandard
        //return libxmljs.parseXmlString(str);

        // var jsdom = require('jsdom');   2012-01 though 2015-08 no worky with new Node
        // var dom = jsdom.jsdom(str, undefined, {} );// html, level, options

        var DOMParser = require('xmldom').DOMParser; // 2015-08 on https://github.com/jindw/xmldom
        var dom = new DOMParser().parseFromString(str, options.contentType || 'text/html') // text/xml
        return dom;

    } else {
        if (typeof window !== 'undefined' && window.DOMParser ) {
            dparser = new window.DOMParser(); // seems to actually work
        } else {
            dparser = new DOMParser(); // Doc says this works
        }
    }
    return dparser.parseFromString(str, 'application/xml');
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

// Reomved 2015-08-05 timbl - unused and depended on jQuery!
// from http://dev.jquery.com/browser/trunk/jquery/src/core.js
// Dependency with JQuery -- we try to keep the rdflib.js and jquery libraries separate at the moment.
/*
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
*/
/*
 * Implements URI-specific functions
 *
 * See RFC 2386
 *
 * See also:
 *   http://www.w3.org/2005/10/ajaw/uri.js
 *   http://www.w3.org/2000/10/swap/uripath.py
 *
 */
var $rdf, base1, k, ref, v,
  hasProp = {}.hasOwnProperty;

if (typeof $rdf === "undefined" || $rdf === null) {
  $rdf = {};
}

if ($rdf.Util == null) {
  $rdf.Util = {};
}

$rdf.uri = (function() {
  function uri() {}

  uri.join = function(given, base) {
    var baseColon, baseHash, baseScheme, baseSingle, colon, lastSlash, path;
    baseHash = base.indexOf('#');
    if (baseHash > 0) {
      base = base.slice(0, baseHash);
    }
    if (given.length === 0) {
      return base;
    }
    if (given.indexOf('#') === 0) {
      return base + given;
    }
    colon = given.indexOf(':');
    if (colon >= 0) {
      return given;
    }
    baseColon = base.indexOf(':');
    if (base.length === 0) {
      return given;
    }
    if (baseColon < 0) {
      alert("Invalid base: " + base + " in join with given: " + given);
      return given;
    }
    baseScheme = base.slice(0, +baseColon + 1 || 9e9);
    if (given.indexOf('//') === 0) {
      return baseScheme + given;
    }
    if (base.indexOf('//', baseColon) === baseColon + 1) {
      baseSingle = base.indexOf('/', baseColon + 3);
      if (baseSingle < 0) {
        if (base.length - baseColon - 3 > 0) {
          return base + '/' + given;
        } else {
          return baseScheme + given;
        }
      }
    } else {
      baseSingle = base.indexOf('/', baseColon + 1);
      if (baseSingle < 0) {
        if (base.length - baseColon - 1 > 0) {
          return base + '/' + given;
        } else {
          return baseScheme + given;
        }
      }
    }
    if (given.indexOf('/') === 0) {
      return base.slice(0, baseSingle) + given;
    }
    path = base.slice(baseSingle);
    lastSlash = path.lastIndexOf('/');
    if (lastSlash < 0) {
      return baseScheme + given;
    }
    if (lastSlash >= 0 && lastSlash < path.length - 1) {
      path = path.slice(0, +lastSlash + 1 || 9e9);
    }
    path += given;
    while (path.match(/[^\/]*\/\.\.\//)) {
      path = path.replace(/[^\/]*\/\.\.\//, '');
    }
    path = path.replace(/\.\//g, '');
    path = path.replace(/\/\.$/, '/');
    return base.slice(0, baseSingle) + path;
  };

  uri.commonHost = new RegExp('^[-_a-zA-Z0-9.]+:(//[^/]*)?/[^/]*$');

  uri.hostpart = function(u) {
    var m;
    m = /[^\/]*\/\/([^\/]*)\//.exec(u);
    if (m) {
      return m[1];
    } else {
      return '';
    }
  };

  uri.refTo = function(base, uri) {
    var c, i, j, k, l, len, len1, n, o, p, q, ref, ref1, s;
    if (!base) {
      return uri;
    }
    if (base === uri) {
      return '';
    }
    for (i = o = 0, len = uri.length; o < len; i = ++o) {
      c = uri[i];
      if (c !== base[i]) {
        break;
      }
    }
    if (base.slice(0, i).match($rdf.Util.uri.commonHost)) {
      k = uri.indexOf('//');
      if (k < 0) {
        k = -2;
      }
      l = uri.indexOf('/', k + 2);
      if (uri[l + 1] !== '/' && base[l + 1] !== '/' && uri.slice(0, l) === base.slice(0, l)) {
        return uri.slice(l);
      }
    }
    if (uri[i] === '#' && base.length === i) {
      return uri.slice(i);
    }
    while (i > 0 && uri[i - 1] !== '/') {
      i--;
    }
    if (i < 3) {
      return uri;
    }
    if (base.indexOf('//', i - 2) > 0 || uri.indexOf('//', i - 2) > 0) {
      return uri;
    }
    if (base.indexOf(':', i) > 0) {
      return uri;
    }
    n = 0;
    ref = base.slice(i);
    for (p = 0, len1 = ref.length; p < len1; p++) {
      c = ref[p];
      if (c === '/') {
        n++;
      }
    }
    if (n === 0 && i < uri.length && uri[i] === '#') {
      return './' + uri.slice(i);
    }
    if (n === 0 && i === uri.length) {
      return './';
    }
    s = '';
    if (n > 0) {
      for (j = q = 1, ref1 = n; 1 <= ref1 ? q <= ref1 : q >= ref1; j = 1 <= ref1 ? ++q : --q) {
        s += '../';
      }
    }
    return s + uri.slice(i);
  };

  uri.docpart = function(uri) {
    var i;
    i = uri.indexOf('#');
    if (i < 0) {
      return uri;
    } else {
      return uri.slice(0, i);
    }
  };

  uri.document = function(x) {
    return $rdf.sym(uri.docpart(x.uri));
  };

  uri.protocol = function(uri) {
    var i;
    i = uri.indexOf(':');
    if (i < 0) {
      return null;
    } else {
      return uri.slice(0, i);
    }
  };

  return uri;

})();

$rdf.Util.uri = $rdf.uri;

if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
  if ((base1 = module.exports).Util == null) {
    base1.Util = {};
  }
  ref = $rdf.Util;
  for (k in ref) {
    if (!hasProp.call(ref, k)) continue;
    v = ref[k];
    module.exports.Util[k] = v;
  }
  module.exports.uri = $rdf.uri;
}
/*
 * These are the classes corresponding to the RDF and N3 data models
 *
 * Designed to look like rdflib and cwm
 *
 * This is coffee see http://coffeescript.org
 */
var $rdf, k, v,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

if (typeof $rdf === "undefined" || $rdf === null) {
  $rdf = {};
}


/*
  the superclass of all RDF Statement objects, that is
  $rdf.Symbol, $rdf.Literal, $rdf.BlankNode
  No class extends this yet, but it could be a place to put common behavior.
 */

$rdf.Node = (function() {
  function Node() {}

  Node.prototype.substitute = function(bindings) {
    return this;
  };

  return Node;

})();

$rdf.Empty = (function(superClass) {
  extend(Empty, superClass);

  function Empty() {
    return Empty.__super__.constructor.apply(this, arguments);
  }

  Empty.prototype.termType = 'empty';

  Empty.prototype.toString = function() {
    return '()';
  };

  Empty.prototype.toNT = Empty.prototype.toString;

  return Empty;

})($rdf.Node);


/*
   A named node in an RDF graph
    todo: badly named. 
    No, formally a URI is a string, this is a node whose name is a URI.
    Connolly pointed out it isa symbol on the language.
    @param uri the uri as string
 */

$rdf.Symbol = (function(superClass) {
  extend(Symbol, superClass);

  function Symbol(uri1) {
    this.uri = uri1;
  }

  Symbol.prototype.termType = 'symbol';

  Symbol.prototype.toString = function() {
    return "<" + this.uri + ">";
  };

  Symbol.prototype.toNT = Symbol.prototype.toString;

  Symbol.prototype.doc = function() {
    if (this.uri.indexOf('#') < 0) {
      return this;
    } else {
      return new $rdf.Symbol(this.uri.split('#')[0]);
    }
  };

  Symbol.prototype.sameTerm = function(other) {
    if (!other) {
      return false;
    }
    return (this.termType === other.termType) && (this.uri === other.uri);
  };

  Symbol.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) {
      return -1;
    }
    if (this.classOrder > other.classOrder) {
      return +1;
    }
    if (this.uri < other.uri) {
      return -1;
    }
    if (this.uri > other.uri) {
      return +1;
    }
    return 0;
  };

  Symbol.prototype.XSDboolean = new Symbol('http://www.w3.org/2001/XMLSchema#boolean');

  Symbol.prototype.XSDdecimal = new Symbol('http://www.w3.org/2001/XMLSchema#decimal');

  Symbol.prototype.XSDfloat = new Symbol('http://www.w3.org/2001/XMLSchema#float');

  Symbol.prototype.XSDinteger = new Symbol('http://www.w3.org/2001/XMLSchema#integer');

  Symbol.prototype.XSDdateTime = new Symbol('http://www.w3.org/2001/XMLSchema#dateTime');

  Symbol.prototype.integer = new Symbol('http://www.w3.org/2001/XMLSchema#integer');

  return Symbol;

})($rdf.Node);

if ($rdf.NextId != null) {
  $rdf.log.error("Attempt to re-zero existing blank node id counter at " + $rdf.NextId);
} else {
  $rdf.NextId = 0;
}

$rdf.NTAnonymousNodePrefix = "_:n";

$rdf.BlankNode = (function(superClass) {
  extend(BlankNode, superClass);

  function BlankNode(id) {
    this.id = $rdf.NextId++;
    this.value = id ? id : this.id.toString();
  }

  BlankNode.prototype.termType = 'bnode';

  BlankNode.prototype.toNT = function() {
    return $rdf.NTAnonymousNodePrefix + this.id;
  };

  BlankNode.prototype.toString = BlankNode.prototype.toNT;

  BlankNode.prototype.sameTerm = function(other) {
    if (!other) {
      return false;
    }
    return (this.termType === other.termType) && (this.id === other.id);
  };

  BlankNode.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) {
      return -1;
    }
    if (this.classOrder > other.classOrder) {
      return +1;
    }
    if (this.id < other.id) {
      return -1;
    }
    if (this.id > other.id) {
      return +1;
    }
    return 0;
  };

  return BlankNode;

})($rdf.Node);

$rdf.Literal = (function(superClass) {
  extend(Literal, superClass);

  function Literal(value1, lang1, datatype) {
    this.value = value1;
    this.lang = lang1;
    this.datatype = datatype;
    if (this.lang == null) {
      this.lang = void 0;
    }
    if (this.lang === '') {
      this.lang = void 0;
    }
    if (this.datatype == null) {
      this.datatype = void 0;
    }
  }

  Literal.prototype.termType = 'literal';

  Literal.prototype.toString = function() {
    return "" + this.value;
  };

  Literal.prototype.toNT = function() {
    var str;
    str = this.value;
    if (typeof str === !'string') {
      if (typeof str === 'number') {
        return '' + str;
      }
      throw Error("Value of RDF literal is not string: " + str);
    }
    str = str.replace(/\\/g, '\\\\');
    str = str.replace(/\"/g, '\\"');
    str = str.replace(/\n/g, '\\n');
    str = "\"" + str + "\"";
    if (this.datatype) {
      str += '^^' + this.datatype.toNT();
    }
    if (this.lang) {
      str += '@' + this.lang;
    }
    return str;
  };

  Literal.prototype.sameTerm = function(other) {
    if (!other) {
      return false;
    }
    return (this.termType === other.termType) && (this.value === other.value) && (this.lang === other.lang) && ((!this.datatype && !other.datatype) || (this.datatype && this.datatype.sameTerm(other.datatype)));
  };

  Literal.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) {
      return -1;
    }
    if (this.classOrder > other.classOrder) {
      return +1;
    }
    if (this.value < other.value) {
      return -1;
    }
    if (this.value > other.value) {
      return +1;
    }
    return 0;
  };

  return Literal;

})($rdf.Node);

$rdf.Collection = (function(superClass) {
  extend(Collection, superClass);

  function Collection(initial) {
    var i, len, s;
    this.id = $rdf.NextId++;
    this.elements = [];
    this.closed = false;
    if (typeof initial !== 'undefined') {
      for (i = 0, len = initial.length; i < len; i++) {
        s = initial[i];
        this.elements.push($rdf.term(s));
      }
    }
  }

  Collection.prototype.termType = 'collection';

  Collection.prototype.toNT = function() {
    return $rdf.NTAnonymousNodePrefix + this.id;
  };

  Collection.prototype.toString = function() {
    return '(' + this.elements.join(' ') + ')';
  };

  Collection.prototype.substitute = function(bindings) {
    var s;
    return new $rdf.Collection((function() {
      var i, len, ref, results1;
      ref = this.elements;
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        results1.push(s.substitute(bindings));
      }
      return results1;
    }).call(this));
  };

  Collection.prototype.append = function(el) {
    return this.elements.push(el);
  };

  Collection.prototype.unshift = function(el) {
    return this.elements.unshift(el);
  };

  Collection.prototype.shift = function() {
    return this.elements.shift();
  };

  Collection.prototype.close = function() {
    return this.closed = true;
  };

  return Collection;

})($rdf.Node);

$rdf.Collection.prototype.sameTerm = $rdf.BlankNode.prototype.sameTerm;

$rdf.Collection.prototype.compareTerm = $rdf.BlankNode.prototype.compareTerm;


/*
 function to transform a value into an $rdf.Node
 @param val can be an rdf.Node, a date, string, number, boolean, or undefined. RDF Nodes are returned as is,
   undefined as undefined
 */

$rdf.term = function(val) {
  var d2, dt, elt, i, len, value, x;
  switch (typeof val) {
    case 'object':
      if (val instanceof Date) {
        d2 = function(x) {
          return ('' + (100 + x)).slice(1, 3);
        };
        value = '' + val.getUTCFullYear() + '-' + d2(val.getUTCMonth() + 1) + '-' + d2(val.getUTCDate()) + 'T' + d2(val.getUTCHours()) + ':' + d2(val.getUTCMinutes()) + ':' + d2(val.getUTCSeconds()) + 'Z';
        return new $rdf.Literal(value, void 0, $rdf.Symbol.prototype.XSDdateTime);
      } else if (val instanceof Array) {
        x = new $rdf.Collection;
        for (i = 0, len = val.length; i < len; i++) {
          elt = val[i];
          x.append($rdf.term(elt));
        }
        return x;
      }
      return val;
    case 'string':
      return new $rdf.Literal(val);
    case 'number':
      if (('' + val).indexOf('e') >= 0) {
        dt = $rdf.Symbol.prototype.XSDfloat;
      } else if (('' + val).indexOf('.') >= 0) {
        dt = $rdf.Symbol.prototype.XSDdecimal;
      } else {
        dt = $rdf.Symbol.prototype.XSDinteger;
      }
      return new $rdf.Literal('' + val, void 0, dt);
    case 'boolean':
      return new $rdf.Literal((val ? '1' : '0'), void 0, $rdf.Symbol.prototype.XSDboolean);
    case 'undefined':
      return void 0;
  }
  throw ("Can't make term from " + val + " of type ") + typeof val;
};

$rdf.Statement = (function() {
  function Statement(subject, predicate, object, why) {
    this.subject = $rdf.term(subject);
    this.predicate = $rdf.term(predicate);
    this.object = $rdf.term(object);
    if (why != null) {
      this.why = why;
    }
  }

  Statement.prototype.toNT = function() {
    return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT()].join(' ') + ' .';
  };

  Statement.prototype.toString = Statement.prototype.toNT;

  Statement.prototype.substitute = function(bindings) {
    return new $rdf.Statement(this.subject.substitute(bindings), this.predicate.substitute(bindings), this.object.substitute(bindings), this.why);
  };

  return Statement;

})();

$rdf.st = function(subject, predicate, object, why) {
  return new $rdf.Statement(subject, predicate, object, why);
};

$rdf.Formula = (function(superClass) {
  extend(Formula, superClass);

  function Formula() {
    this.statements = [];
    this.constraints = [];
    this.initBindings = [];
    this.optional = [];
  }

  Formula.prototype.termType = 'formula';

  Formula.prototype.toNT = function() {
    return '{' + this.statements.join('\n') + '}';
  };

  Formula.prototype.toString = Formula.prototype.toNT;

  Formula.prototype.add = function(s, p, o, why) {
    return this.statements.push(new $rdf.Statement(s, p, o, why));
  };

  Formula.prototype.addStatement = function(st) {
    return this.statements.push(st);
  };

  Formula.prototype.substitute = function(bindings) {
    var g, i, len, ref, s;
    g = new $rdf.Formula;
    ref = this.statements;
    for (i = 0, len = ref.length; i < len; i++) {
      s = ref[i];
      g.addStatement(s.substitute(bindings));
    }
    return g;
  };

  Formula.prototype.sym = function(uri, name) {
    if (name != null) {
      throw 'This feature (kb.sym with 2 args) is removed. Do not assume prefix mappings.';
      if (!$rdf.ns[uri]) {
        throw "The prefix " + uri + " is not set in the API";
      }
      uri = $rdf.ns[uri] + name;
    }
    return new $rdf.Symbol(uri);
  };

  Formula.prototype.literal = function(val, lang, dt) {
    return new $rdf.Literal("" + val, lang, dt);
  };

  Formula.prototype.bnode = function(id) {
    return new $rdf.BlankNode(id);
  };

  Formula.prototype.formula = function() {
    return new $rdf.Formula;
  };

  Formula.prototype.collection = function() {
    return new $rdf.Collection;
  };

  Formula.prototype.list = function(values) {
    var elt, i, len, r;
    r = new $rdf.Collection;
    if (values) {
      for (i = 0, len = values.length; i < len; i++) {
        elt = values[i];
        r.append(elt);
      }
    }
    return r;
  };

  Formula.prototype.variable = function(name) {
    return new $rdf.Variable(name);
  };

  Formula.prototype.ns = function(nsuri) {
    return function(ln) {
      return new $rdf.Symbol(nsuri + (ln != null ? ln : ''));
    };
  };


  /*
  transform an NTriples string format into an $rdf.Node
  The bnode bit should not be used on program-external values; designed
  for internal work such as storing a bnode id in an HTML attribute.
  This will only parse the strings generated by the vaious toNT() methods.
   */

  Formula.prototype.fromNT = function(str) {
    var dt, k, lang, x;
    switch (str[0]) {
      case '<':
        return $rdf.sym(str.slice(1, -1));
      case '"':
        lang = void 0;
        dt = void 0;
        k = str.lastIndexOf('"');
        if (k < str.length - 1) {
          if (str[k + 1] === '@') {
            lang = str.slice(k + 2);
          } else if (str.slice(k + 1, k + 3) === '^^') {
            dt = $rdf.fromNT(str.slice(k + 3));
          } else {
            throw "Can't convert string from NT: " + str;
          }
        }
        str = str.slice(1, k);
        str = str.replace(/\\"/g, '"');
        str = str.replace(/\\n/g, '\n');
        str = str.replace(/\\\\/g, '\\');
        return $rdf.lit(str, lang, dt);
      case '_':
        x = new $rdf.BlankNode;
        x.id = parseInt(str.slice(3));
        $rdf.NextId--;
        return x;
      case '?':
        return new $rdf.Variable(str.slice(1));
    }
    throw "Can't convert from NT: " + str;
  };

  Formula.prototype.sameTerm = function(other) {
    if (!other) {
      return false;
    }
    return this.hashString() === other.hashString();
  };

  Formula.prototype.each = function(s, p, o, w) {
    var elt, i, l, len, len1, len2, len3, m, q, results, sts;
    results = [];
    sts = this.statementsMatching(s, p, o, w, false);
    if (s == null) {
      for (i = 0, len = sts.length; i < len; i++) {
        elt = sts[i];
        results.push(elt.subject);
      }
    } else if (p == null) {
      for (l = 0, len1 = sts.length; l < len1; l++) {
        elt = sts[l];
        results.push(elt.predicate);
      }
    } else if (o == null) {
      for (m = 0, len2 = sts.length; m < len2; m++) {
        elt = sts[m];
        results.push(elt.object);
      }
    } else if (w == null) {
      for (q = 0, len3 = sts.length; q < len3; q++) {
        elt = sts[q];
        results.push(elt.why);
      }
    }
    return results;
  };

  Formula.prototype.any = function(s, p, o, w) {
    var st;
    st = this.anyStatementMatching(s, p, o, w);
    if (st == null) {
      return void 0;
    } else if (s == null) {
      return st.subject;
    } else if (p == null) {
      return st.predicate;
    } else if (o == null) {
      return st.object;
    }
    return void 0;
  };

  Formula.prototype.holds = function(s, p, o, w) {
    var st;
    st = this.anyStatementMatching(s, p, o, w);
    return st != null;
  };

  Formula.prototype.holdsStatement = function(st) {
    return this.holds(st.subject, st.predicate, st.object, st.why);
  };

  Formula.prototype.the = function(s, p, o, w) {
    var x;
    x = this.any(s, p, o, w);
    if (x == null) {
      $rdf.log.error("No value found for the() {" + s + " " + p + " " + o + "}.");
    }
    return x;
  };

  Formula.prototype.whether = function(s, p, o, w) {
    return this.statementsMatching(s, p, o, w, false).length;
  };

  Formula.prototype.transitiveClosure = function(seeds, predicate, inverse) {
    var agenda, done, elt, i, k, len, s, sups, t, v;
    done = {};
    agenda = {};
    for (k in seeds) {
      if (!hasProp.call(seeds, k)) continue;
      v = seeds[k];
      agenda[k] = v;
    }
    while (true) {
      t = (function() {
        var p;
        for (p in agenda) {
          if (!hasProp.call(agenda, p)) continue;
          return p;
        }
      })();
      if (t == null) {
        return done;
      }
      sups = inverse ? this.each(void 0, predicate, this.fromNT(t)) : this.each(this.fromNT(t), predicate);
      for (i = 0, len = sups.length; i < len; i++) {
        elt = sups[i];
        s = elt.toNT();
        if (s in done) {
          continue;
        }
        if (s in agenda) {
          continue;
        }
        agenda[s] = agenda[t];
      }
      done[t] = agenda[t];
      delete agenda[t];
    }
  };


  /*
  For thisClass or any subclass, anything which has it is its type
  or is the object of something which has the type as its range, or subject
  of something which has the type as its domain
  We don't bother doing subproperty (yet?)as it doesn't seeem to be used much.
  Get all the Classes of which we can RDFS-infer the subject is a member
  @returns a hash of URIs
   */

  Formula.prototype.findMembersNT = function(thisClass) {
    var i, l, len, len1, len2, len3, len4, m, members, pred, q, ref, ref1, ref2, ref3, ref4, ref5, seeds, st, t, u;
    seeds = {};
    seeds[thisClass.toNT()] = true;
    members = {};
    ref = this.transitiveClosure(seeds, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true);
    for (t in ref) {
      if (!hasProp.call(ref, t)) continue;
      ref1 = this.statementsMatching(void 0, this.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), this.fromNT(t));
      for (i = 0, len = ref1.length; i < len; i++) {
        st = ref1[i];
        members[st.subject.toNT()] = st;
      }
      ref2 = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#domain'), this.fromNT(t));
      for (l = 0, len1 = ref2.length; l < len1; l++) {
        pred = ref2[l];
        ref3 = this.statementsMatching(void 0, pred);
        for (m = 0, len2 = ref3.length; m < len2; m++) {
          st = ref3[m];
          members[st.subject.toNT()] = st;
        }
      }
      ref4 = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#range'), this.fromNT(t));
      for (q = 0, len3 = ref4.length; q < len3; q++) {
        pred = ref4[q];
        ref5 = this.statementsMatching(void 0, pred);
        for (u = 0, len4 = ref5.length; u < len4; u++) {
          st = ref5[u];
          members[st.object.toNT()] = st;
        }
      }
    }
    return members;
  };


  /*
  transform a collection of NTriple URIs into their URI strings
  @param t some iterable colletion of NTriple URI strings
  @return a collection of the URIs as strings
  todo: explain why it is important to go through NT
   */

  Formula.prototype.NTtoURI = function(t) {
    var k, uris, v;
    uris = {};
    for (k in t) {
      if (!hasProp.call(t, k)) continue;
      v = t[k];
      if (k[0] === '<') {
        uris[k.slice(1, -1)] = v;
      }
    }
    return uris;
  };

  Formula.prototype.findTypeURIs = function(subject) {
    return this.NTtoURI(this.findTypesNT(subject));
  };

  Formula.prototype.findMemberURIs = function(subject) {
    return this.NTtoURI(this.findMembersNT(subject));
  };


  /*
  Get all the Classes of which we can RDFS-infer the subject is a member
  todo: This will loop is there is a class subclass loop (Sublass loops are not illegal)
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
   */

  Formula.prototype.findTypesNT = function(subject) {
    var domain, i, l, len, len1, len2, len3, m, q, range, rdftype, ref, ref1, ref2, ref3, st, types;
    rdftype = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    types = [];
    ref = this.statementsMatching(subject, void 0, void 0);
    for (i = 0, len = ref.length; i < len; i++) {
      st = ref[i];
      if (st.predicate.uri === rdftype) {
        types[st.object.toNT()] = st;
      } else {
        ref1 = this.each(st.predicate, this.sym('http://www.w3.org/2000/01/rdf-schema#domain'));
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          range = ref1[l];
          types[range.toNT()] = st;
        }
      }
    }
    ref2 = this.statementsMatching(void 0, void 0, subject);
    for (m = 0, len2 = ref2.length; m < len2; m++) {
      st = ref2[m];
      ref3 = this.each(st.predicate, this.sym('http://www.w3.org/2000/01/rdf-schema#range'));
      for (q = 0, len3 = ref3.length; q < len3; q++) {
        domain = ref3[q];
        types[domain.toNT()] = st;
      }
    }
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false);
  };


  /*
  Get all the Classes of which we can RDFS-infer the subject is a subclass
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
   */

  Formula.prototype.findSuperClassesNT = function(subject) {
    var types;
    types = [];
    types[subject.toNT()] = true;
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false);
  };


  /*
  Get all the Classes of which we can RDFS-infer the subject is a superclass
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
   */

  Formula.prototype.findSubClassesNT = function(subject) {
    var types;
    types = [];
    types[subject.toNT()] = true;
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true);
  };


  /*
  Find the types in the list which have no *stored* supertypes
  We exclude the universal class, owl:Things and rdf:Resource, as it is information-free.
   */

  Formula.prototype.topTypeURIs = function(types) {
    var i, j, k, len, n, ref, tops, v;
    tops = [];
    for (k in types) {
      if (!hasProp.call(types, k)) continue;
      v = types[k];
      n = 0;
      ref = this.each(this.sym(k), this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'));
      for (i = 0, len = ref.length; i < len; i++) {
        j = ref[i];
        if (j.uri !== 'http://www.w3.org/2000/01/rdf-schema#Resource') {
          n++;
          break;
        }
      }
      if (!n) {
        tops[k] = v;
      }
    }
    if (tops['http://www.w3.org/2000/01/rdf-schema#Resource']) {
      delete tops['http://www.w3.org/2000/01/rdf-schema#Resource'];
    }
    if (tops['http://www.w3.org/2002/07/owl#Thing']) {
      delete tops['http://www.w3.org/2002/07/owl#Thing'];
    }
    return tops;
  };


  /*
  Find the types in the list which have no *stored* subtypes
  These are a set of classes which provide by themselves complete
  information -- the other classes are redundant for those who
  know the class DAG.
   */

  Formula.prototype.bottomTypeURIs = function(types) {
    var bots, bottom, elt, i, k, len, ref, subs, v;
    bots = [];
    for (k in types) {
      if (!hasProp.call(types, k)) continue;
      v = types[k];
      subs = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), this.sym(k));
      bottom = true;
      for (i = 0, len = subs.length; i < len; i++) {
        elt = subs[i];
        if (ref = elt.uri, indexOf.call(types, ref) >= 0) {
          bottom = false;
          break;
        }
      }
      if (bottom) {
        bots[k] = v;
      }
    }
    return bots;
  };

  Formula.prototype.serialize = function(base, contentType, provenance) {
    var documentString, sts, sz;
    sz = $rdf.Serializer(this);
    sz.suggestNamespaces(this.namespaces);
    sz.setBase(base);
    if (provenance) {
      sts = this.statementsMatching(void 0, void 0, void 0, provenance);
    } else {
      sts = this.statements;
    }
    switch (contentType != null ? contentType : 'text/n3') {
      case 'application/rdf+xml':
        documentString = sz.statementsToXML(sts);
        break;
      case 'text/n3':
      case 'text/turtle':
        documentString = sz.statementsToN3(sts);
        break;
      default:
        throw "serialize: Content-type " + contentType(+" not supported.");
    }
    return documentString;
  };

  return Formula;

})($rdf.Node);

$rdf.sym = function(uri) {
  return new $rdf.Symbol(uri);
};

$rdf.lit = $rdf.Formula.prototype.literal;

$rdf.Namespace = $rdf.Formula.prototype.ns;

$rdf.variable = $rdf.Formula.prototype.variable;


/*
 * Variable
 *
 * Variables are placeholders used in patterns to be matched.
 * In cwm they are symbols which are the formula's list of quantified variables.
 * In sparl they are not visibily URIs.  Here we compromise, by having
 * a common special base URI for variables. Their names are uris,
 * but the ? nottaion has an implicit base uri of 'varid:'
 */

$rdf.Variable = (function(superClass) {
  extend(Variable, superClass);

  function Variable(rel) {
    this.base = 'varid:';
    this.uri = $rdf.Util.uri.join(rel, this.base);
  }

  Variable.prototype.termType = 'variable';

  Variable.prototype.toNT = function() {
    if (this.uri.slice(0, this.base.length) === this.base) {
      return '?' + this.uri.slice(this.base.length);
    }
    return "?" + this.uri;
  };

  Variable.prototype.toString = Variable.prototype.toNT;

  Variable.prototype.hashString = Variable.prototype.toNT;

  Variable.prototype.substitute = function(bindings) {
    var ref;
    return (ref = bindings[this.toNT()]) != null ? ref : this;
  };

  Variable.prototype.sameTerm = function(other) {
    if (!other) {
      false;
    }
    return (this.termType === other.termType) && (this.uri === other.uri);
  };

  return Variable;

})($rdf.Node);

$rdf.Literal.prototype.classOrder = 1;

$rdf.Collection.prototype.classOrder = 3;

$rdf.Formula.prototype.classOrder = 4;

$rdf.Symbol.prototype.classOrder = 5;

$rdf.BlankNode.prototype.classOrder = 6;

$rdf.Variable.prototype.classOrder = 7;

$rdf.fromNT = $rdf.Formula.prototype.fromNT;

$rdf.graph = function() {
  return new $rdf.IndexedFormula;
};

if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
  for (k in $rdf) {
    if (!hasProp.call($rdf, k)) continue;
    v = $rdf[k];
    module.exports[k] = v;
  }
}
/**
 * @fileoverview
 *  RDF/XML PARSER
 *
 * Version 0.1
 *  Parser believed to be in full positive RDF/XML parsing compliance
 *  with the possible exception of handling deprecated RDF attributes
 *  appropriately. Parser is believed to comply fully with other W3C
 *  and industry standards where appropriate (DOM, ECMAScript, &c.)
 *
 *  Author: David Sheets <dsheets@mit.edu>
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
 
 $rdf.RDFParser = function(store){
    var RDFParser = {};
    
    /** Standard namespaces that we know how to handle @final
     *  @member RDFParser
     */
    RDFParser.ns = {'RDF': "http://www.w3.org/1999/02/22-rdf-syntax-ns#", 'RDFS': "http://www.w3.org/2000/01/rdf-schema#"};
    
    /** DOM Level 2 node type magic numbers @final
     *  @member RDFParser
     */
    RDFParser.nodeType = {'ELEMENT': 1, 'ATTRIBUTE': 2, 'TEXT': 3,
			     'CDATA_SECTION': 4, 'ENTITY_REFERENCE': 5,
			     'ENTITY': 6, 'PROCESSING_INSTRUCTION': 7,
			     'COMMENT': 8, 'DOCUMENT': 9, 'DOCUMENT_TYPE': 10,
			     'DOCUMENT_FRAGMENT': 11, 'NOTATION': 12};

    /**
     * Frame class for namespace and base URI lookups
     * Base lookups will always resolve because the parser knows
     * the default base.
     *
     * @private
     */
    
    this.frameFactory = function(parser, parent, element){
        return {'NODE': 1, 'ARC': 2, 'parent': parent, 'parser': parser, 'store': parser.store, 'element': element, 
           'lastChild': 0, 'base': null, 'lang': null, 'node': null, 'nodeType': null, 'listIndex': 1, 'rdfid': null, 'datatype': null, 'collection': false, /** Terminate the frame and notify the store that we're done */
           'terminateFrame': function(){
            if (this.collection){
                
                this.node.close();
            }
        }
        , /** Add a symbol of a certain type to the this frame */'addSymbol': function(type, uri){
            uri = $rdf.Util.uri.join(uri, this.base);
            this.node = this.store.sym(uri);
            
            this.nodeType = type;
        }
        , /** Load any constructed triples into the store */'loadTriple': function(){
            if (this.parent.parent.collection){
                this.parent.parent.node.append(this.node);
            }
            else {
                this.store.add(this.parent.parent.node, this.parent.node, this.node, this.parser.why);
            }
            if (this.parent.rdfid != null){
                  // reify
                var triple = this.store.sym($rdf.Util.uri.join("#" + this.parent.rdfid, this.base));
                this.store.add(triple, this.store.sym(RDFParser.ns.RDF + "type"), this.store.sym(RDFParser.ns.RDF + "Statement"), this.parser.why);
                this.store.add(triple, this.store.sym(RDFParser.ns.RDF + "subject"), this.parent.parent.node, this.parser.why);
                this.store.add(triple, this.store.sym(RDFParser.ns.RDF + "predicate"), this.parent.node, this.parser.why);
                
                this.store.add(triple, this.store.sym(RDFParser.ns.RDF + "object"), this.node, this.parser.why);
            }
        }
        , /** Check if it's OK to load a triple */'isTripleToLoad': function(){
            
            return (this.parent != null && this.parent.parent != null && this.nodeType === this.NODE && this.parent.nodeType === 
               this.ARC && this.parent.parent.nodeType === this.NODE);
        }
        , /** Add a symbolic node to this frame */'addNode': function(uri){
            this.addSymbol(this.NODE, uri);
            if (this.isTripleToLoad()){
                
                this.loadTriple();
            }
        }
        , /** Add a collection node to this frame */'addCollection': function(){
            this.nodeType = this.NODE;
            this.node = this.store.collection();
            this.collection = true;
            if (this.isTripleToLoad()){
                
                this.loadTriple();
            }
        }
        , /** Add a collection arc to this frame */'addCollectionArc': function(){
            
            this.nodeType = this.ARC;
        }
        , /** Add a bnode to this frame */'addBNode': function(id){
            if (id != null){
                if (this.parser.bnodes[id] != null){
                    this.node = this.parser.bnodes[id];
                }
                else {
                    this.node = this.parser.bnodes[id] = this.store.bnode();
                }
            }
            else {
                this.node = this.store.bnode();
            }
            this.nodeType = this.NODE;
            if (this.isTripleToLoad()){
                
                this.loadTriple();
            }
        }
        , /** Add an arc or property to this frame */'addArc': function(uri){
            if (uri === RDFParser.ns.RDF + "li"){
                uri = RDFParser.ns.RDF + "_" + this.parent.listIndex;
                this.parent.listIndex++;
            }
            
            this.addSymbol(this.ARC, uri);
        }
        , /** Add a literal to this frame */'addLiteral': function(value){
            if (this.parent.datatype){
                this.node = this.store.literal(value, "", this.store.sym(this.parent.datatype));
            }
            else {
                this.node = this.store.literal(value, this.lang);
            }
            this.nodeType = this.NODE;
            if (this.isTripleToLoad()){
                this.loadTriple();
            }
        }
        };
    };
    
    //from the OpenLayers source .. needed to get around IE problems.
    this.getAttributeNodeNS = function(node, uri, name){
        var attributeNode = null;
        if (node.getAttributeNodeNS){
            attributeNode = node.getAttributeNodeNS(uri, name);
        }
        else {
            var attributes = node.attributes;
            var potentialNode, fullName;
            for (var i = 0;i < attributes.length; ++ i){
                potentialNode = attributes[i];
                if (potentialNode.namespaceURI === uri){
                    fullName = (potentialNode.prefix) ? (potentialNode.prefix +":" + name): name;
                    if (fullName === potentialNode.nodeName){
                        attributeNode = potentialNode;
                        break;
                    }
                }
            }
        }
        return attributeNode;
    };
    
    
    /** Our triple store reference @private */
    
    this.store = store;/** Our identified blank nodes @private */
    this.bnodes = {};/** A context for context-aware stores @private */
    this.why = null;/** Reification flag */
    this.reify = false;
    
    /**
     * Build our initial scope frame and parse the DOM into triples
     * @param {DOMTree} document The DOM to parse
     * @param {String} base The base URL to use 
     * @param {Object} why The context to which this resource belongs
     */
    
    this.parse = function(document, base, why){
        var children = document.childNodes;// clean up for the next run
        this.cleanParser();// figure out the root element
        var root;
        if (document.nodeType === RDFParser.nodeType.DOCUMENT){
            for (var c = 0;c < children.length;c++){
                if (children[c].nodeType === RDFParser.nodeType.ELEMENT){
                    root = children[c];
                    break;
                }
            }
        }
        else if (document.nodeType === RDFParser.nodeType.ELEMENT){
            root = document;
        }
        else {
            throw new Error("RDFParser: can't find root in " + base +". Halting. ");
            // return false;
        }
        this.why = why;// our topmost frame
        var f = this.frameFactory(this);
        this.base = base;
        f.base = base;
        f.lang = null; // was '' but can't have langs like that 2015 (!)
        this.parseDOM(this.buildFrame(f, root));
        return true;
    };
    
    this.parseDOM = function(frame){
         // a DOM utility function used in parsing
        var rdfid;
        var elementURI = function(el){
            var result = "";
            if (el.namespaceURI == null){
                throw new Error("RDF/XML syntax error: No namespace for " + el.localName + " in " + this.base);
            }
            if (el.namespaceURI){
                result = result + el.namespaceURI;
            }
            if (el.localName){
                result = result + el.localName;
            }
            else if (el.nodeName){
                if (el.nodeName.indexOf(":") >= 0)result = result + el.nodeName.split(":")[1];
                else result = result + el.nodeName;
            }
            return result;
        }.bind(this);
        var dig = true;// if we'll dig down in the tree on the next iter
        while (frame.parent){
            var dom = frame.element;
            var attrs = dom.attributes;
            if (dom.nodeType === RDFParser.nodeType.TEXT || dom.nodeType === RDFParser.nodeType.CDATA_SECTION){
                //we have a literal
                if(frame.parent.nodeType == frame.NODE) {
                    //must have had attributes, store as rdf:value
                    frame.addArc(RDFParser.ns.RDF + 'value');
                    frame = this.buildFrame(frame);
                }
                frame.addLiteral(dom.nodeValue);
            }
            else if (elementURI(dom)!== RDFParser.ns.RDF + "RDF"){
                  // not root
                if (frame.parent && frame.parent.collection){
                     // we're a collection element
                    frame.addCollectionArc();
                    frame = this.buildFrame(frame, frame.element);
                    frame.parent.element = null;
                }
                if ( ! frame.parent || ! frame.parent.nodeType || frame.parent.nodeType === frame.ARC){
                     // we need a node
                    var about = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "about");
                    rdfid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "ID");
                    if (about && rdfid){
                        throw new Error("RDFParser: " + dom.nodeName + " has both rdf:id and rdf:about." + 
                           " Halting. Only one of these" + " properties may be specified on a" + " node.");
                    }
                    if (!about && rdfid){
                        frame.addNode("#" + rdfid.nodeValue);
                        dom.removeAttributeNode(rdfid);
                    }
                    else if (about == null && rdfid == null){
                        var bnid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "nodeID");
                        if (bnid){
                            frame.addBNode(bnid.nodeValue);
                            dom.removeAttributeNode(bnid);
                        }
                        else {
                            frame.addBNode();
                        }
                    }
                    else {
                        frame.addNode(about.nodeValue);
                        dom.removeAttributeNode(about);
                    }
                    // Typed nodes
                    var rdftype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "type");
                    if (RDFParser.ns.RDF + "Description" !== elementURI(dom)){
                        rdftype = {'nodeValue': elementURI(dom)};
                    }
                    if (rdftype != null){
                        this.store.add(frame.node, this.store.sym(RDFParser.ns.RDF + "type"), this.store.sym($rdf.Util.uri.join(rdftype.nodeValue, 
                           frame.base)), this.why);
                        if (rdftype.nodeName){
                            dom.removeAttributeNode(rdftype);
                        }
                    }
                    // Property Attributes
                    for (var x = attrs.length - 1;x >= 0;x--){
                        this.store.add(frame.node, this.store.sym(elementURI(attrs[x])), this.store.literal(attrs[x].nodeValue, 
                           frame.lang), this.why);
                    }
                }
                else {
                      // we should add an arc (or implicit bnode+arc)
                    frame.addArc(elementURI(dom));// save the arc's rdf:ID if it has one
                    if (this.reify){
                        rdfid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "ID");
                        if (rdfid){
                            frame.rdfid = rdfid.nodeValue;
                            dom.removeAttributeNode(rdfid);
                        }
                    }
                    var parsetype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "parseType");
                    var datatype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "datatype");
                    if (datatype){
                        frame.datatype = datatype.nodeValue;
                        dom.removeAttributeNode(datatype);
                    }
                    if (parsetype){
                        var nv = parsetype.nodeValue;
                        if (nv === "Literal"){
                            frame.datatype = RDFParser.ns.RDF + "XMLLiteral";// (this.buildFrame(frame)).addLiteral(dom)
                               // should work but doesn't
                            frame = this.buildFrame(frame);
                            frame.addLiteral(dom);
                            dig = false;
                        }
                        else if (nv === "Resource"){
                            frame = this.buildFrame(frame, frame.element);
                            frame.parent.element = null;
                            frame.addBNode();
                        }
                        else if (nv === "Collection"){
                            frame = this.buildFrame(frame, frame.element);
                            frame.parent.element = null;
                            frame.addCollection();
                        }
                        dom.removeAttributeNode(parsetype);
                    }
                    if (attrs.length !== 0){
                        var resource = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "resource");
                        var bnid2 = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "nodeID");
                        frame = this.buildFrame(frame);
                        if (resource){
                            frame.addNode(resource.nodeValue);
                            dom.removeAttributeNode(resource);
                        }
                        else {
                            if (bnid2){
                                frame.addBNode(bnid2.nodeValue);
                                dom.removeAttributeNode(bnid2);
                            }
                            else {
                                frame.addBNode();
                            }
                        }
                        for (var x1 = attrs.length - 1; x1 >= 0; x1--){
                            var f = this.buildFrame(frame);
                            f.addArc(elementURI(attrs[x1]));
                            if (elementURI(attrs[x1])=== RDFParser.ns.RDF + "type"){
                                (this.buildFrame(f)).addNode(attrs[x1].nodeValue);
                            }
                            else {
                                (this.buildFrame(f)).addLiteral(attrs[x1].nodeValue);
                            }
                        }
                    }
                    else if (dom.childNodes.length === 0){
                        (this.buildFrame(frame)).addLiteral("");
                    }
                }
            }// rdf:RDF
               // dig dug
            dom = frame.element;
            while (frame.parent){
                var pframe = frame;
                while (dom == null){
                    frame = frame.parent;
                    dom = frame.element;
                }
                var candidate = dom.childNodes && dom.childNodes[frame.lastChild];
                if (!candidate || ! dig){
                    frame.terminateFrame();
                    if ( ! (frame = frame.parent)){
                        break;
                    }// done
                    dom = frame.element;
                    dig = true;
                }
                else if ((candidate.nodeType !== RDFParser.nodeType.ELEMENT &&
                        candidate.nodeType !== RDFParser.nodeType.TEXT && 
                        candidate.nodeType !== RDFParser.nodeType.CDATA_SECTION) ||
                    ((candidate.nodeType === RDFParser.nodeType.TEXT ||
                        candidate.nodeType === RDFParser.nodeType.CDATA_SECTION) && 
                        dom.childNodes.length !== 1)){
                    frame.lastChild++;
                }
                else {
                      // not a leaf
                    frame.lastChild++;
                    frame = this.buildFrame(pframe, dom.childNodes[frame.lastChild - 1]);
                    break;
                }
            }
        }// while
    };
    
    /**
     * Cleans out state from a previous parse run
     * @private
     */
    this.cleanParser = function(){
        this.bnodes = {};
        this.why = null;
    };
    
    /**
     * Builds scope frame 
     * @private
     */
    this.buildFrame = function(parent, element){
        var frame = this.frameFactory(this, parent, element);
        if (parent){
            frame.base = parent.base;
            frame.lang = parent.lang;
        }
        if (!element || element.nodeType === RDFParser.nodeType.TEXT ||
                element.nodeType === RDFParser.nodeType.CDATA_SECTION){
            return frame;
        }
        var attrs = element.attributes;
        var base = element.getAttributeNode("xml:base");
        if (base != null){
            frame.base = base.nodeValue;
            element.removeAttribute("xml:base");
        }
        var lang = element.getAttributeNode("xml:lang");
        if (lang != null){
            frame.lang = lang.nodeValue;
            element.removeAttribute("xml:lang");
        }
        // remove all extraneous xml and xmlns attributes
        for (var x = attrs.length - 1;x >= 0;x--){
            if (attrs[x].nodeName.substr(0, 3) === "xml"){
                if (attrs[x].name.slice(0, 6) === 'xmlns:'){
                    var uri = attrs[x].nodeValue;// alert('base for namespac attr:'+this.base);
                    if (this.base) uri = $rdf.Util.uri.join(uri, this.base);
                    this.store.setPrefixForURI(attrs[x].name.slice(6), uri);
                }
                //		alert('rdfparser: xml atribute: '+attrs[x].name) //@@
                element.removeAttributeNode(attrs[x]);
            }
        }
        return frame;
    };
};
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
var DATE_DATATYPE = "http://www.w3.org/2001/XMLSchema#date";
var DATETIME_DATATYPE = "http://www.w3.org/2001/XMLSchema#dateTime";
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
var datetime_syntax = new RegExp('^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9](T[0-9][0-9]:[0-9][0-9](:[0-9][0-9](\\.[0-9]*)?)?)?Z?');

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

    var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
    for (var j = (i ? i : 0); j < str.length; j++) {
        var ch = str.charAt(j);
        // console.log("    skipspace j= "+j + " i= " + i + " n= " + str.length);
        // console.log(" skipspace ch <" + ch + ">");
        if (whitespace.indexOf(ch) < 0 ) { //not ws
            // console.log(" skipspace 2 ch <" + ch + ">");
            if( str.charAt(j)==='#' ) {
                for (;; j++) {
                    // console.log("    skipspace2 j= "+j + " i= " + i + " n= " + str.length);
                    if (j === str.length) {
                        return -1; // EOF
                    }
                    if (str.charAt(j) === '\n') {
                        this.lines = this.lines + 1;
                        break;
                    }
                }; 
            } else { // Not hash - something interesting
                // console.log(" skipspace 3 ch <" + ch + ">");
                return j
            }
        } else { // Whitespace
            // console.log(" skipspace 5 ch <" + ch + ">");
            if (str.charAt(j) === '\n') {
                this.lines = this.lines + 1;
            }
        }
    } // next j
    return -1; // EOF
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
	
	    datetime_syntax.lastIndex = 0;
            var m = datetime_syntax.exec(str.slice(i));
            if ((m != null)) {
		// j =  ( i + datetime_syntax.lastIndex ) ;
		var val = m[0];
		j = i + val.length;
		if ((val.indexOf("T") >= 0)) {
		    res.push(this._store.literal(val, undefined, this._store.sym(DATETIME_DATATYPE)));
		} else {
		    res.push(this._store.literal(val, undefined, this._store.sym(DATE_DATATYPE)));
		}	
	
	    } else {
		number_syntax.lastIndex = 0;
		var m = number_syntax.exec(str.slice(i));
		if ((m == null)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad number or date syntax");
		}
		j =  ( i + number_syntax.lastIndex ) ;
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
	    };
	    return j; // Where we have got up to
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
            // $rdf.log.warn("Equating "+subj.uri+" sameAs "+obj.uri);  //@@
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
        // $rdf.log.warn("Equating "+s1.uri+" and "+subj.uri + " because IFP "+pred.uri);  //@@
        formula.equate(s1, subj);
        return true;
    } //handle_IFP

    function handle_FP(formula, subj, pred, obj)  {
        var o1 = formula.any(subj, pred, undefined);
        if (o1 == undefined) return false; // First time with this value
        // $rdf.log.warn("Equating "+o1.uri+" and "+obj.uri + " because FP "+pred.uri);  //@@
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
    var done = false;
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
    } // There are files around with long badly generated prefixes like this
    if (prefix.slice(0,2) === 'ns' || prefix.slice(0,7) === 'default') {
        return;
    };
    this.namespaces[prefix] = nsuri;
}

// Deprocated ... name too generic
$rdf.IndexedFormula.prototype.register = function(prefix, nsuri) {
    this.namespaces[prefix] = nsuri
}


/** simplify graph in store when we realize two identifiers are equivalent

We replace the bigger with the smaller.

*/
$rdf.IndexedFormula.prototype.equate = function(u1, u2) {
    // $rdf.log.warn("Equating "+u1+" and "+u2); // @@
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
};

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
	    if (this.fetcher) {
	        this.fetcher.nowKnownAs(big, small)
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


// Add a triple to the store
//
//  Returns the statement added
// (would it be better to return the original formula for chaining?)
//
$rdf.IndexedFormula.prototype.add = function(subj, pred, obj, why) {
    if (arguments.length === 1) {
        if (subj instanceof Array) {
            for (var i=0; i < subj.length; i++) {
                this.add(subj[i]);
            }
        } else if (subj instanceof $rdf.Statement) {
            this.add(subj.subject, subj.predicate, subj.object, subj.why);
        } else if (subj instanceof $rdf.IndexedFormula) {
            this.add(subj.statements)
        }
        return this;
    }
    var actions, st;
    if (why == undefined) why = this.fetcher ? this.fetcher.appNode: this.sym("chrome:theSession"); //system generated
                //defined in source.js, is this OK with identity.js only user?
    subj = $rdf.term(subj);
    pred = $rdf.term(pred);
    obj = $rdf.term(obj);
    why = $rdf.term(why);

    if (this.predicateCallback != undefined)
	this.predicateCallback(this, pred, why);
	
    // Action return true if the statement does not need to be added
    var predHash = this.canon(pred).hashString()
    var actions = this.propertyActions[predHash]; // Predicate hash
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
    var hash = [ this.canon(subj).hashString(), predHash,
            this.canon(obj).hashString(), this.canon(why).hashString()];
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
        pattern[p] = this.canon($rdf.term(pat[p]));
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
        if (st != null) {
          results.push(st);
          if(justOne) break;
        }
    }

    return results;
}; // statementsMatching


/** Remove all statemnts in a doc
**
**/
$rdf.IndexedFormula.prototype.removeDocument = function (doc) {
    var sts = this.statementsMatching(undefined, undefined, undefined, doc).slice();// Take a copy as this is the actual index
    for (var i=0; i< sts.length; i++) {
        this.removeStatement(sts[i]);
    }
    return this;
}


/** Find a statement object and remove it 
**
** Or array of statements or graph
**/
$rdf.IndexedFormula.prototype.remove = function (st) {
    if (st instanceof Array) {
        for (var i=0; i< st.length; i++) {
            this.remove(st[i]);
        }
        return this;
    }
    if (st instanceof $rdf.IndexedFormula) {
        return this.remove(st.statements);
    }
    var sts = this.statementsMatching(st.subject, st.predicate, st.object, st.why);
    if (!sts.length) {
        throw "Statement to be removed is not on store: " + st;
    }
    this.removeStatement(sts[0]);
    return this;
}


$rdf.IndexedFormula.prototype.removeMatches = function (subject, predicate, object, why) {
    this.removeStatements(this.staementsMatching(subject, predicate, object, why));
    return this;
}

$rdf.IndexedFormula.prototype.removeStatements = function (sts) {
    for (var i=0; i < sts.length; i++) {
        this.remove(sts[i]);
    }
    return this;
}


/** Remove a particular statement object from the store
**
** st    a statement which is already in the store and indexed.
**      Make sure you only use this for these.
**    Otherwise, you should use remove() above.
**/
$rdf.IndexedFormula.prototype.removeStatement = function (st) {
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
    return this;
}; //remove



//////////////////// Self-consistency checking for diagnostis only


// Is each statement properly indexed?
$rdf.IndexedFormula.prototype.checkStatementList = function(sts, from) {
    var names = ['subject', 'predicate', 'object', 'why'];
    var origin = " found in " + names[from] + " index.";
    for (var j=0; j < sts.length; j++) {
        st = sts[j];
        var term = [ st.subject, st.predicate, st.object, st.why];

        var arrayContains = function(a, x) {
            for(var i=0; i<a.length; i++) {
            if (a[i].subject.sameTerm( x.subject ) && 
                a[i].predicate.sameTerm( x.predicate ) && 
                a[i].object.sameTerm( x.object ) &&
                a[i].why.sameTerm( x.why )) {
                    return true;
                }
            };
        };

        for (var p=0; p<4; p++) {
            var c = this.canon(term[p]);
            var h = c.hashString();
            if (this.index[p][h] == undefined) {
                throw new Error("No " + name[p] + " index for statement " + st + "@" + st.why + origin)
            } else {
                if (!arrayContains(this.index[p][h], st)) {
                    throw new Error("Index for " + name[p] + " does not have statement " + st + "@" + st.why + origin)
                }
            }
        };
        if (!arrayContains(this.statements, st)) {
            throw new Error("Statement list does not statement " + st + "@" + st.why + origin)
        
        }
    };
}

$rdf.IndexedFormula.prototype.check = function() {
    this.checkStatementList(this.statements);
    for (var p=0; p<4; p++) {
        var ix = this.index[p];
        for (var key in ix) {
            if (ix.hasOwnProperty(key)) {
                this.checkStatementList(ix[key], p);
            }
        };
    };
 };   



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
//  RDF/A Parser for rdflib.js

// Originally by: Alex Milowski
// Converted: timbl 2015-08-25 not yet working
// Was taken from:  https://github.com/alexmilowski/green-turtle


// See http://www.w3.org/TR/rdfa-syntax/  etc

// $rdf.RDFaProcessor.prototype = new Object(); // Was URIResolver

//$rdf.RDFaProcessor.prototype.constructor=$rdf.RDFaProcessor;

// options.base = base URI    not really an option, shopuld always be set.
//



if(typeof Node === 'undefined') { //  @@@@@@ Global. Interface to xmldom.
    var Node = {
      ELEMENT_NODE: 1,
      ATTRIBUTE_NODE: 2,
      TEXT_NODE: 3,
      CDATA_SECTION_NODE: 4,
      ENTITY_REFERENCE_NODE: 5,
      ENTITY_NODE: 6,
      PROCESSING_INSTRUCTION_NODE: 7,
      COMMENT_NODE: 8,
      DOCUMENT_NODE: 9,
      DOCUMENT_TYPE_NODE: 10,
      DOCUMENT_FRAGMENT_NODE: 11,
      NOTATION_NODE:12
    };
}

////////////////////////////////

$rdf.RDFaProcessor = function RDFaProcessor(kb, options) {
    this.options = options || {};
    this.kb = kb;
    this.target = options.target || {
        graph: {
            subjects: {},
            prefixes: {},
            terms: {}
        }
    };

    console.log("base URI " + this.options.base)
    var mode = options.mode || 'html';
    this.inXHTMLMode = false;
    this.inHTMLMode = false;
    
    this.theOne = "_:"+(new Date()).getTime();
    this.language = null;
    this.vocabulary = null;
    this.blankCounter = 0;
    this.langAttributes = [ { namespaceURI: "http://www.w3.org/XML/1998/namespace", localName: "lang" } ];
    this.inXHTMLMode = false;
    this.absURIRE = /[\w\_\-]+:\S+/;
    this.finishedHandlers = [];
    this.init();
}

$rdf.RDFaProcessor.prototype.newBlankNode = function() {
   this.blankCounter++;
   return "_:"+this.blankCounter;
}

$rdf.RDFaProcessor.XMLLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral"; 
$rdf.RDFaProcessor.HTMLLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML"; 
$rdf.RDFaProcessor.PlainLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
$rdf.RDFaProcessor.objectURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
$rdf.RDFaProcessor.typeURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

$rdf.RDFaProcessor.nameChar = '[-A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u10000-\uEFFFF\.0-9\u00B7\u0300-\u036F\u203F-\u2040]';
$rdf.RDFaProcessor.nameStartChar = '[\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3\u4E00-\u9FA5\u3007\u3021-\u3029_]';
$rdf.RDFaProcessor.NCNAME = new RegExp('^' + $rdf.RDFaProcessor.nameStartChar + $rdf.RDFaProcessor.nameChar + '*$');

$rdf.RDFaProcessor.trim = function(str) {
   return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

$rdf.RDFaProcessor.prototype.tokenize = function(str) {
   return $rdf.RDFaProcessor.trim(str).split(/\s+/);
}


$rdf.RDFaProcessor.prototype.parseSafeCURIEOrCURIEOrURI = function(value,prefixes,base) {
   value = $rdf.RDFaProcessor.trim(value);
   if (value.charAt(0)=='[' && value.charAt(value.length-1)==']') {
      value = value.substring(1,value.length-1);
      value = value.trim(value);
      if (value.length==0) {
         return null;
      }
      if (value=="_:") {
         // the one node
         return this.theOne;
      }
      return this.parseCURIE(value,prefixes,base);
   } else {
      return this.parseCURIEOrURI(value,prefixes,base);
   }
}

$rdf.RDFaProcessor.prototype.parseCURIE = function(value,prefixes,base) {
   var colon = value.indexOf(":");
   if (colon>=0) {
      var prefix = value.substring(0,colon);
      if (prefix=="") {
         // default prefix
         var uri = prefixes[""];
         return uri ? uri+value.substring(colon+1) : null;
      } else if (prefix=="_") {
         // blank node
         return "_:"+value.substring(colon+1);
      } else if ($rdf.RDFaProcessor.NCNAME.test(prefix)) {
         var uri = prefixes[prefix];
         if (uri) {
            return uri + value.substring(colon+1);
         }
      }
   }
   return null;
}

$rdf.RDFaProcessor.prototype.parseCURIEOrURI = function(value,prefixes,base) {
   var curie = this.parseCURIE(value,prefixes,base);
   if (curie) {
      return curie;
   }
   return this.resolveAndNormalize(base,value);
}

$rdf.RDFaProcessor.prototype.parsePredicate = function(value,defaultVocabulary,terms,prefixes,base,ignoreTerms) {
   if (value=="") {
      return null;
   }
   var predicate = this.parseTermOrCURIEOrAbsURI(value,defaultVocabulary,ignoreTerms ? null : terms,prefixes,base);
   if (predicate && predicate.indexOf("_:")==0) {
      return null;
   }
   return predicate;
}

$rdf.RDFaProcessor.prototype.parseTermOrCURIEOrURI = function(value,defaultVocabulary,terms,prefixes,base) {
   //alert("Parsing "+value+" with default vocab "+defaultVocabulary);
   value = $rdf.RDFaProcessor.trim(value);
   var curie = this.parseCURIE(value,prefixes,base);
   if (curie) {
      return curie;
   } else {
       var term = terms[value];
       if (term) {
          return term;
       }
       var lcvalue = value.toLowerCase();
       term = terms[lcvalue];
       if (term) {
          return term;
       }
       if (defaultVocabulary && !this.absURIRE.exec(value)) {
          return defaultVocabulary+value
       }
   }
   return this.resolveAndNormalize(base,value);
}

$rdf.RDFaProcessor.prototype.parseTermOrCURIEOrAbsURI = function(value,defaultVocabulary,terms,prefixes,base) {
   //alert("Parsing "+value+" with default vocab "+defaultVocabulary);
   value = $rdf.RDFaProcessor.trim(value);
   var curie = this.parseCURIE(value,prefixes,base);
   if (curie) {
      return curie;
   } else if (terms) {
       if (defaultVocabulary && !this.absURIRE.exec(value)) {
          return defaultVocabulary+value
       }
       var term = terms[value];
       if (term) {
          return term;
       }
       var lcvalue = value.toLowerCase();
       term = terms[lcvalue];
       if (term) {
          return term;
       }
   }
   if (this.absURIRE.exec(value)) {
      return this.resolveAndNormalize(base,value);
   }
   return null;
}

/*
$rdf.RDFaProcessor.prototype.resolveAndNormalize = function(base,href) {
   var u = base.resolve(href);
   var parsed = this.parseURI(u);
   parsed.normalize();
   return parsed.spec;
}
*/

$rdf.RDFaProcessor.prototype.parsePrefixMappings = function(str,target) {
   var values = this.tokenize(str);
   var prefix = null;
   var uri = null;
   for (var i=0; i<values.length; i++) {
      if (values[i][values[i].length-1]==':') {
         prefix = values[i].substring(0,values[i].length-1);
      } else if (prefix) {
         target[prefix] = this.options.base ? $rdf.uri.join(values[i], this.options.base) : values[i];
         prefix = null;
      }
   }
}

$rdf.RDFaProcessor.prototype.copyMappings = function(mappings) {
   var newMappings = {};
   for (var k in mappings) {
      newMappings[k] = mappings[k];
   }
   return newMappings;
}

$rdf.RDFaProcessor.prototype.ancestorPath = function(node) {
   var path = "";
   while (node && node.nodeType!=Node.DOCUMENT_NODE) {
      path = "/"+node.localName+path;
      node = node.parentNode;
   }
   return path;
}

$rdf.RDFaProcessor.prototype.setContext = function(node) {

   // We only recognized XHTML+RDFa 1.1 if the version is set propertyly
   if (node.localName=="html" && node.getAttribute("version")=="XHTML+RDFa 1.1") {
      this.setXHTMLContext();
   } else if (node.localName=="html" || node.namespaceURI=="http://www.w3.org/1999/xhtml") {
      if (typeof document !== 'undefined' && document.doctype) {
         if (document.doctype.publicId=="-//W3C//DTD XHTML+RDFa 1.0//EN" && document.doctype.systemId=="http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd") {
            console.log("WARNING: RDF 1.0 is not supported.  Defaulting to HTML5 mode.");
            this.setHTMLContext();
         } else if (document.doctype.publicId=="-//W3C//DTD XHTML+RDFa 1.1//EN" && document.doctype.systemId=="http://www.w3.org/MarkUp/DTD/xhtml-rdfa-2.dtd") {
            this.setXHTMLContext();
         } else {
            this.setHTMLContext();
         }
      } else {
         this.setHTMLContext();
      }
   } else {
      this.setXMLContext();
   }

}

$rdf.RDFaProcessor.prototype.setInitialContext = function() {
   this.vocabulary = null;
   // By default, the prefixes are terms are loaded to the RDFa 1.1. standard within the graph constructor
   this.langAttributes = [ { namespaceURI: "http://www.w3.org/XML/1998/namespace", localName: "lang" } ];
}

$rdf.RDFaProcessor.prototype.setXMLContext = function() {
   this.setInitialContext();
   this.inXHTMLMode = false;
   this.inHTMLMode = false;
}

$rdf.RDFaProcessor.prototype.setHTMLContext = function() {
   this.setInitialContext();
   this.langAttributes = [ { namespaceURI: "http://www.w3.org/XML/1998/namespace", localName: "lang" },
                           { namespaceURI: null, localName: "lang" }];
   this.inXHTMLMode = false;
   this.inHTMLMode = true;
}

$rdf.RDFaProcessor.prototype.setXHTMLContext = function() {

   this.setInitialContext();
   
   this.inXHTMLMode = true;
   this.inHTMLMode = false;
   
   this.langAttributes = [ { namespaceURI: "http://www.w3.org/XML/1998/namespace", localName: "lang" },
                           { namespaceURI: null, localName: "lang" }];

   // From http://www.w3.org/2011/rdfa-context/xhtml-rdfa-1.1
   this.target.graph.terms["alternate"] = "http://www.w3.org/1999/xhtml/vocab#alternate";
   this.target.graph.terms["appendix"] = "http://www.w3.org/1999/xhtml/vocab#appendix";
   this.target.graph.terms["bookmark"] = "http://www.w3.org/1999/xhtml/vocab#bookmark";
   this.target.graph.terms["cite"] = "http://www.w3.org/1999/xhtml/vocab#cite"
   this.target.graph.terms["chapter"] = "http://www.w3.org/1999/xhtml/vocab#chapter";
   this.target.graph.terms["contents"] = "http://www.w3.org/1999/xhtml/vocab#contents";
   this.target.graph.terms["copyright"] = "http://www.w3.org/1999/xhtml/vocab#copyright";
   this.target.graph.terms["first"] = "http://www.w3.org/1999/xhtml/vocab#first";
   this.target.graph.terms["glossary"] = "http://www.w3.org/1999/xhtml/vocab#glossary";
   this.target.graph.terms["help"] = "http://www.w3.org/1999/xhtml/vocab#help";
   this.target.graph.terms["icon"] = "http://www.w3.org/1999/xhtml/vocab#icon";
   this.target.graph.terms["index"] = "http://www.w3.org/1999/xhtml/vocab#index";
   this.target.graph.terms["last"] = "http://www.w3.org/1999/xhtml/vocab#last";
   this.target.graph.terms["license"] = "http://www.w3.org/1999/xhtml/vocab#license";
   this.target.graph.terms["meta"] = "http://www.w3.org/1999/xhtml/vocab#meta";
   this.target.graph.terms["next"] = "http://www.w3.org/1999/xhtml/vocab#next";
   this.target.graph.terms["prev"] = "http://www.w3.org/1999/xhtml/vocab#prev";
   this.target.graph.terms["previous"] = "http://www.w3.org/1999/xhtml/vocab#previous";
   this.target.graph.terms["section"] = "http://www.w3.org/1999/xhtml/vocab#section";
   this.target.graph.terms["stylesheet"] = "http://www.w3.org/1999/xhtml/vocab#stylesheet";
   this.target.graph.terms["subsection"] = "http://www.w3.org/1999/xhtml/vocab#subsection";
   this.target.graph.terms["start"] = "http://www.w3.org/1999/xhtml/vocab#start";
   this.target.graph.terms["top"] = "http://www.w3.org/1999/xhtml/vocab#top";
   this.target.graph.terms["up"] = "http://www.w3.org/1999/xhtml/vocab#up";
   this.target.graph.terms["p3pv1"] = "http://www.w3.org/1999/xhtml/vocab#p3pv1";

   // other
   this.target.graph.terms["related"] = "http://www.w3.org/1999/xhtml/vocab#related";
   this.target.graph.terms["role"] = "http://www.w3.org/1999/xhtml/vocab#role";
   this.target.graph.terms["transformation"] = "http://www.w3.org/1999/xhtml/vocab#transformation";
}

$rdf.RDFaProcessor.prototype.init = function() {
}

$rdf.RDFaProcessor.prototype.newSubjectOrigin = function(origin,subject) {
    console.log("@@@@ newSubjectOrigin @@ what should this do? ")
}

$rdf.RDFaProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
    function convert(x) {
        console.log("convert term " + typeof x );
        if (typeof x === 'string') {
            console.log("    string is " + x);
            console.log("    sym is " + $rdf.sym(x));
            return $rdf.sym(x);
        }
        if (typeof x === 'undefined') return undefined;
        console.log("    type is " + x.type);
        switch(object.type) {
        case $rdf.RDFaProcessor.objectURI:
            return $rdf.sym(x.value);
        case $rdf.RDFaProcessor.PlainLiteralURI:
            return $rdf.term(x.value); // @@ types?
        default:
        }
        throw "internal type " + x.type
    }
    var su, ob, pr, or
    if (typeof subject === 'undefined') {
        su = $rdf.sym(this.options.base); // this document is default sub???
    } else { 
        su = convert(subject);
    }
    pr = convert(predicate);
    ob = convert(object);
    // or = convert(origin);
    or = $rdf.sym(this.options.base);
    console.log('Adding { '+ su + ' ' + pr + ' ' + ob + ' ' + or + ' }');
    this.kb.add(su, pr, ob, or);
}

$rdf.RDFaProcessor.prototype.resolveAndNormalize = function(uri, base) {
    // console.log("Joining " + uri + " to " + uri + " making " +  $rdf.uri.join(uri, base)); 
    return $rdf.uri.join(uri, base); // @@ normalize?
}


$rdf.RDFaProcessor.prototype.parseURI = function(uri) {
    return uri; // We just use strings as URIs, not objects now.
}

$rdf.RDFaProcessor.dateTimeTypes = [
   { pattern: /-?P(?:[0-9]+Y)?(?:[0-9]+M)?(?:[0-9]+D)?(?:T(?:[0-9]+H)?(?:[0-9]+M)?(?:[0-9]+(?:\.[0-9]+)?S)?)?/,
     type: "http://www.w3.org/2001/XMLSchema#duration" },
   { pattern: /-?(?:[1-9][0-9][0-9][0-9]|0[1-9][0-9][0-9]|00[1-9][0-9]|000[1-9])-[0-9][0-9]-[0-9][0-9]T(?:[0-1][0-9]|2[0-4]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?(?:Z|[+\-][0-9][0-9]:[0-9][0-9])?/,
     type: "http://www.w3.org/2001/XMLSchema#dateTime" },
   { pattern: /-?(?:[1-9][0-9][0-9][0-9]|0[1-9][0-9][0-9]|00[1-9][0-9]|000[1-9])-[0-9][0-9]-[0-9][0-9](?:Z|[+\-][0-9][0-9]:[0-9][0-9])?/,
     type: "http://www.w3.org/2001/XMLSchema#date" },
   { pattern: /(?:[0-1][0-9]|2[0-4]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?(?:Z|[+\-][0-9][0-9]:[0-9][0-9])?/,
     type: "http://www.w3.org/2001/XMLSchema#time" },
   { pattern: /-?(?:[1-9][0-9][0-9][0-9]|0[1-9][0-9][0-9]|00[1-9][0-9]|000[1-9])-[0-9][0-9]/,
     type: "http://www.w3.org/2001/XMLSchema#gYearMonth" },
   { pattern: /-?[1-9][0-9][0-9][0-9]|0[1-9][0-9][0-9]|00[1-9][0-9]|000[1-9]/,
     type: "http://www.w3.org/2001/XMLSchema#gYear" }
];

$rdf.RDFaProcessor.deriveDateTimeType = function(value) {
   for (var i=0; i<$rdf.RDFaProcessor.dateTimeTypes.length; i++) {
      //console.log("Checking "+value+" against "+$rdf.RDFaProcessor.dateTimeTypes[i].type);
      var matched = $rdf.RDFaProcessor.dateTimeTypes[i].pattern.exec(value);
      if (matched && matched[0].length==value.length) {
         //console.log("Matched!");
         return $rdf.RDFaProcessor.dateTimeTypes[i].type;
      }
   }
   return null;
}

$rdf.RDFaProcessor.prototype.process = function(node, processOptions) {

   console.log("node.baseURI 0 " + node.baseURI);

   /*
   if (!window.console) {
      window.console = { log: function() {} };
   }*/
   var base;
   if (node.nodeType==Node.DOCUMENT_NODE) {
      base = node.baseURI;
      node = node.documentElement;
      node.baseURI = base;
      this.setContext(node);
   } else if (node.parentNode.nodeType==Node.DOCUMENT_NODE) {
      this.setContext(node);
   } 
   var queue = [];
   
   // Fix for Firefox that includes the hash in the base URI
   var removeHash = function(baseURI) {
      return baseURI.split('#')[0];
   }
   
   console.log("node.baseURI 1 " + node.baseURI);
   queue.push({ current: node, context: this.push(null,removeHash(node.baseURI))});
   while (queue.length>0) {
      var item = queue.shift();
      if (item.parent) {
         // Sequence Step 14: list triple generation
         if (item.context.parent && item.context.parent.listMapping==item.listMapping) {
            // Skip a child context with exactly the same mapping
            continue;
         }
         //console.log("Generating lists for "+item.subject+", tag "+item.parent.localName);
         for (var predicate in item.listMapping) {
            var list = item.listMapping[predicate];
            if (list.length==0) {
               this.addTriple(item.parent,item.subject,predicate,{ type: $rdf.RDFaProcessor.objectURI, value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil" });
               continue;
            }
            var bnodes = [];
            for (var i=0; i<list.length; i++) {
               bnodes.push(this.newBlankNode());
               //this.newSubject(item.parent,bnodes[i]);
            }
            for (var i=0; i<bnodes.length; i++) {
               this.addTriple(item.parent,bnodes[i],"http://www.w3.org/1999/02/22-rdf-syntax-ns#first",list[i]);
               this.addTriple(item.parent,bnodes[i],"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest",{ type: $rdf.RDFaProcessor.objectURI , value: (i+1)<bnodes.length ? bnodes[i+1] : "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil" });
            }
            this.addTriple(item.parent,item.subject,predicate,{ type: $rdf.RDFaProcessor.objectURI, value: bnodes[0] });
         }
         continue;
      }
      var current = item.current;
      var context = item.context;

      //console.log("Tag: "+current.localName+", listMapping="+JSON.stringify(context.listMapping));

      // Sequence Step 1
      var skip = false;
      var newSubject = null;
      var currentObjectResource = null;
      var typedResource = null;
      var prefixes = context.prefixes;
      var prefixesCopied = false;
      var incomplete = [];
      var listMapping = context.listMapping;
      var listMappingDifferent = context.parent ? false : true;
      var language = context.language;
      var vocabulary = context.vocabulary;

      // TODO: the "base" element may be used for HTML+RDFa 1.1
      // console.log("sdf current.baseURI "+current.baseURI);
      var base = this.parseURI(removeHash(current.baseURI));
      current.item = null;

      // Sequence Step 2: set the default vocabulary
      var vocabAtt = current.getAttributeNode("vocab");
      if (vocabAtt) {
         var value = $rdf.RDFaProcessor.trim(vocabAtt.value);
         if (value.length>0) {
            vocabulary = value;
            var baseSubject = base.spec;
            //this.newSubject(current,baseSubject);
            this.addTriple(current,baseSubject,"http://www.w3.org/ns/rdfa#usesVocabulary",{ type: $rdf.RDFaProcessor.objectURI , value: vocabulary});
         } else {
            vocabulary = this.vocabulary;
         }
      }

      // Sequence Step 3: IRI mappings
      // handle xmlns attributes
      for (var i=0; i<current.attributes.length; i++) {
         var att = current.attributes[i];
         //if (att.namespaceURI=="http://www.w3.org/2000/xmlns/") {
         if (att.nodeName.charAt(0)=="x" && att.nodeName.indexOf("xmlns:")==0) {
            if (!prefixesCopied) {
               prefixes = this.copyMappings(prefixes);
               prefixesCopied = true;
            }
            var prefix = att.nodeName.substring(6);
            // TODO: resolve relative?
            var ref = $rdf.RDFaProcessor.trim(att.value);
            prefixes[prefix] = this.options.base ? $rdf.uri.join(ref, this.options.base) :ref;
         }
      }
      // Handle prefix mappings (@prefix)
      var prefixAtt = current.getAttributeNode("prefix");
      if (prefixAtt) {
         if (!prefixesCopied) {
            prefixes = this.copyMappings(prefixes);
            prefixesCopied = true;
         }
         this.parsePrefixMappings(prefixAtt.value,prefixes);
      }


      // Sequence Step 4: language
      var xmlLangAtt = null;
      for (var i=0; !xmlLangAtt && i<this.langAttributes.length; i++) {
         xmlLangAtt = current.getAttributeNodeNS(this.langAttributes[i].namespaceURI,this.langAttributes[i].localName);
      }
      if (xmlLangAtt) {
         var value = $rdf.RDFaProcessor.trim(xmlLangAtt.value);
         if (value.length>0) {
            language = value;
         } else {
            language = null;
         }
      }

      var relAtt = current.getAttributeNode("rel");
      var revAtt = current.getAttributeNode("rev");
      var typeofAtt = current.getAttributeNode("typeof");
      var propertyAtt = current.getAttributeNode("property");
      var datatypeAtt = current.getAttributeNode("datatype");
      var datetimeAtt = this.inHTMLMode ? current.getAttributeNode("datetime") : null;
      var contentAtt = current.getAttributeNode("content");
      var aboutAtt = current.getAttributeNode("about");
      var srcAtt = current.getAttributeNode("src");
      var resourceAtt = current.getAttributeNode("resource");
      var hrefAtt = current.getAttributeNode("href");
      var inlistAtt = current.getAttributeNode("inlist");
      
      var relAttPredicates = [];
      if (relAtt) {
         var values = this.tokenize(relAtt.value);
         for (var i=0; i<values.length; i++) {
            var predicate = this.parsePredicate(values[i],vocabulary,context.terms,prefixes,base,this.inHTMLMode && propertyAtt!=null);
            if (predicate) {
               relAttPredicates.push(predicate);
            }
         }
      }
      var revAttPredicates = [];
      if (revAtt) {
         var values = this.tokenize(revAtt.value);
         for (var i=0; i<values.length; i++) {
            var predicate = this.parsePredicate(values[i],vocabulary,context.terms,prefixes,base,this.inHTMLMode && propertyAtt!=null);
            if (predicate) {
               revAttPredicates.push(predicate);
            }
         }
      }
      
      // Section 3.1, bullet 7
      if (this.inHTMLMode && (relAtt!=null || revAtt!=null) && propertyAtt!=null) {
         if (relAttPredicates.length==0) {
            relAtt = null;
         }
         if (revAttPredicates.length==0) {
            revAtt = null;
         }
      }

      if (relAtt || revAtt) {
         // Sequence Step 6: establish new subject and value
         if (aboutAtt) {
            newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value,prefixes,base);
         }
         if (typeofAtt) {
            typedResource = newSubject;
         }
         if (!newSubject) {
            if (current.parentNode.nodeType==Node.DOCUMENT_NODE) {
               console.log("kjkhk current.baseURI "+current.baseURI);
               newSubject = removeHash(current.baseURI);
            } else if (context.parentObject) {
               // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
               console.log("zxcv current.baseURI "+current.parentNode.baseURI);
               newSubject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
            }
         }
         if (resourceAtt) {
            currentObjectResource = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value,prefixes,base);
         }
         
         if (!currentObjectResource) {
            if (hrefAtt) {
               currentObjectResource = this.resolveAndNormalize(base,encodeURI(hrefAtt.value));
            } else if (srcAtt) {
               currentObjectResource = this.resolveAndNormalize(base,encodeURI(srcAtt.value));
            } else if (typeofAtt && !aboutAtt && !(this.inXHTMLMode && (current.localName=="head" || current.localName=="body"))) {
               currentObjectResource = this.newBlankNode();
            }
         }
         if (typeofAtt && !aboutAtt && this.inXHTMLMode && (current.localName=="head" || current.localName=="body")) {
            typedResource = newSubject;
         } else if (typeofAtt && !aboutAtt) {
            typedResource = currentObjectResource;
         }

      } else if (propertyAtt && !contentAtt && !datatypeAtt) {
         // Sequence Step 5.1: establish a new subject
         if (aboutAtt) {
            newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value,prefixes,base);
            if (typeofAtt) {
               typedResource = newSubject;
            }
         }
         if (!newSubject && current.parentNode.nodeType==Node.DOCUMENT_NODE) {
            newSubject = removeHash(current.baseURI);
            if (typeofAtt) {
               typedResource = newSubject;
            }
         } else if (!newSubject && context.parentObject) {
            // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
            newSubject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
         }
         if (typeofAtt && !typedResource) {
            if (resourceAtt) {
               typedResource = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value,prefixes,base);
            }
            if (!typedResource &&hrefAtt) {
               typedResource = this.resolveAndNormalize(base,encodeURI(hrefAtt.value));
            }
            if (!typedResource && srcAtt) {
               typedResource = this.resolveAndNormalize(base,encodeURI(srcAtt.value));
            }
            if (!typedResource && (this.inXHTMLMode || this.inHTMLMode) && (current.localName=="head" || current.localName=="body")) {
               typedResource = newSubject;
            }
            if (!typedResource) {
               typedResource = this.newBlankNode();
            }
            currentObjectResource = typedResource;
         }
         //console.log(current.localName+", newSubject="+newSubject+", typedResource="+typedResource+", currentObjectResource="+currentObjectResource);
      } else {
         // Sequence Step 5.2: establish a new subject
         if (aboutAtt) {
            newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value,prefixes,base);
         }
         if (!newSubject && resourceAtt) {
            newSubject = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value,prefixes,base);
         }
         if (!newSubject && hrefAtt) {
            newSubject = this.resolveAndNormalize(base,encodeURI(hrefAtt.value));
         }
         if (!newSubject && srcAtt) {
            newSubject = this.resolveAndNormalize(base,encodeURI(srcAtt.value));
         }
         if (!newSubject) {
            if (current.parentNode.nodeType==Node.DOCUMENT_NODE) {
               newSubject = removeHash(current.baseURI);
            } else if ((this.inXHTMLMode || this.inHTMLMode) && (current.localName=="head" || current.localName=="body")) {
               newSubject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
            } else if (typeofAtt) {
               newSubject = this.newBlankNode();
            } else if (context.parentObject) {
               // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
               newSubject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
               if (!propertyAtt) {
                  skip = true;
               }
            }
         }
         if (typeofAtt) {
            typedResource = newSubject;
         }
      }

      //console.log(current.tagName+": newSubject="+newSubject+", currentObjectResource="+currentObjectResource+", typedResource="+typedResource+", skip="+skip);

      var rdfaData = null;
      if (newSubject) {
         //this.newSubject(current,newSubject);
         if (aboutAtt || resourceAtt || typedResource) {
            var id = newSubject;
            if (typeofAtt && !aboutAtt && !resourceAtt && currentObjectResource) {
               id = currentObjectResource;
            }
            console.log("Setting data attribute for " + current.localName + " for subject "+id);
            this.newSubjectOrigin(current,id);
         }
      }
      
      // Sequence Step 7: generate type triple
      if (typedResource) {
         var values = this.tokenize(typeofAtt.value);
         for (var i=0; i<values.length; i++) {
            var object = this.parseTermOrCURIEOrAbsURI(values[i],vocabulary,context.terms,prefixes,base);
            if (object) {
               this.addTriple(current,typedResource,$rdf.RDFaProcessor.typeURI,{ type: $rdf.RDFaProcessor.objectURI , value: object});
            }
         }
      }

      // Sequence Step 8: new list mappings if there is a new subject
      //console.log("Step 8: newSubject="+newSubject+", context.parentObject="+context.parentObject);
      if (newSubject && newSubject!=context.parentObject) {
         //console.log("Generating new list mapping for "+newSubject);
         listMapping = {};
         listMappingDifferent = true;
      }

      // Sequence Step 9: generate object triple
      if (currentObjectResource) {
         if (relAtt && inlistAtt) {
            for (var i=0; i<relAttPredicates.length; i++) {
               var list = listMapping[relAttPredicates[i]];
               if (!list) {
                  list = [];
                  listMapping[relAttPredicates[i]] = list;
               }
               list.push({ type: $rdf.RDFaProcessor.objectURI, value: currentObjectResource });
            }
         } else if (relAtt) {
            for (var i=0; i<relAttPredicates.length; i++) {
               this.addTriple(current,newSubject,relAttPredicates[i],{ type: $rdf.RDFaProcessor.objectURI, value: currentObjectResource});
            }
         }
         if (revAtt) {
            for (var i=0; i<revAttPredicates.length; i++) {
               this.addTriple(current,currentObjectResource, revAttPredicates[i], { type: $rdf.RDFaProcessor.objectURI, value: newSubject});
            }
         }
      } else {
         // Sequence Step 10: incomplete triples
         if (newSubject && !currentObjectResource && (relAtt || revAtt)) {
            currentObjectResource = this.newBlankNode();
            //alert(current.tagName+": generated blank node, newSubject="+newSubject+" currentObjectResource="+currentObjectResource);
         }
         if (relAtt && inlistAtt) {
            for (var i=0; i<relAttPredicates.length; i++) {
               var list = listMapping[relAttPredicates[i]];
               if (!list) {
                  list = [];
                  listMapping[predicate] = list;
               }
               //console.log("Adding incomplete list for "+predicate);
               incomplete.push({ predicate: relAttPredicates[i], list: list });
            }
         } else if (relAtt) {
            for (var i=0; i<relAttPredicates.length; i++) {
               incomplete.push({ predicate: relAttPredicates[i], forward: true });
            }
         }
         if (revAtt) {
            for (var i=0; i<revAttPredicates.length; i++) {
               incomplete.push({ predicate: revAttPredicates[i], forward: false });
            }
         }
      }

      // Step 11: Current property values
      if (propertyAtt) {
         var datatype = null;
         var content = null; 
         if (datatypeAtt) {
            datatype = datatypeAtt.value=="" ? $rdf.RDFaProcessor.PlainLiteralURI : this.parseTermOrCURIEOrAbsURI(datatypeAtt.value,vocabulary,context.terms,prefixes,base);
            if (datetimeAtt && !contentAtt) {
               content = datetimeAtt.value;
            } else {
               content = datatype==$rdf.RDFaProcessor.XMLLiteralURI || datatype==$rdf.RDFaProcessor.HTMLLiteralURI ? null : (contentAtt ? contentAtt.value : current.textContent);
            }
         } else if (contentAtt) {
            datatype = $rdf.RDFaProcessor.PlainLiteralURI;
            content = contentAtt.value;
         } else if (datetimeAtt) {
            content = datetimeAtt.value;
            datatype = $rdf.RDFaProcessor.deriveDateTimeType(content);
            if (!datatype) {
               datatype = $rdf.RDFaProcessor.PlainLiteralURI;
            }
         } else if (!relAtt && !revAtt) {
            if (resourceAtt) {
               content = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value,prefixes,base);
            }
            if (!content && hrefAtt) {
               content = this.resolveAndNormalize(base,encodeURI(hrefAtt.value));
            } else if (!content && srcAtt) {
               content = this.resolveAndNormalize(base,encodeURI(srcAtt.value));
            }
            if (content) {
               datatype = $rdf.RDFaProcessor.objectURI;
            }
         }
         if (!datatype) {
            if (typeofAtt && !aboutAtt) {
               datatype = $rdf.RDFaProcessor.objectURI;
               content = typedResource;
            } else {
               content = current.textContent;
               if (this.inHTMLMode && current.localName=="time") {
                  datatype = $rdf.RDFaProcessor.deriveDateTimeType(content);
               }
               if (!datatype) {
                  datatype = $rdf.RDFaProcessor.PlainLiteralURI;
               }
            }
         }
         var values = this.tokenize(propertyAtt.value);
         for (var i=0; i<values.length; i++) {
            var predicate = this.parsePredicate(values[i],vocabulary,context.terms,prefixes,base);
            if (predicate) {
               if (inlistAtt) {
                  var list = listMapping[predicate];
                  if (!list) {
                     list = [];
                     listMapping[predicate] = list;
                  }
                  list.push((datatype==$rdf.RDFaProcessor.XMLLiteralURI || datatype==$rdf.RDFaProcessor.HTMLLiteralURI) ? { type: datatype, value: current.childNodes} : { type: datatype ? datatype : $rdf.RDFaProcessor.PlainLiteralURI, value: content, language: language});
               } else {
                  if (datatype==$rdf.RDFaProcessor.XMLLiteralURI || datatype==$rdf.RDFaProcessor.HTMLLiteralURI) {
                     this.addTriple(current,newSubject,predicate,{ type: datatype, value: current.childNodes});
                  } else {
                     this.addTriple(current,newSubject,predicate,{ type: datatype ? datatype : $rdf.RDFaProcessor.PlainLiteralURI, value: content, language: language});
                     //console.log(newSubject+" "+predicate+"="+content);
                  }
               }
            }
         }
      }

      // Sequence Step 12: complete incomplete triples with new subject
      if (newSubject && !skip) {
         for (var i=0; i<context.incomplete.length; i++) {
            if (context.incomplete[i].list) {
               //console.log("Adding subject "+newSubject+" to list for "+context.incomplete[i].predicate);
               // TODO: it is unclear what to do here
               context.incomplete[i].list.push({ type: $rdf.RDFaProcessor.objectURI, value: newSubject });
            } else if (context.incomplete[i].forward) {
               //console.log(current.tagName+": completing forward triple "+context.incomplete[i].predicate+" with object="+newSubject);
               this.addTriple(current,context.subject,context.incomplete[i].predicate, { type: $rdf.RDFaProcessor.objectURI, value: newSubject});
            } else {
               //console.log(current.tagName+": completing reverse triple with object="+context.subject);
               this.addTriple(current,newSubject,context.incomplete[i].predicate,{ type: $rdf.RDFaProcessor.objectURI, value: context.subject});
            }
         }
      }

      var childContext = null;
      var listSubject = newSubject;
      if (skip) {
         // TODO: should subject be null?
         childContext = this.push(context,context.subject);
         // TODO: should the entObject be passed along?  If not, then intermediary children will keep properties from being associated with incomplete triples.
         // TODO: Verify: if the current baseURI has changed and the parentObject is the parent's base URI, then the baseURI should change
         childContext.parentObject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
         childContext.incomplete = context.incomplete;
         childContext.language = language;
         childContext.prefixes = prefixes;
         childContext.vocabulary = vocabulary;
      } else {
         childContext = this.push(context,newSubject);
         childContext.parentObject = currentObjectResource ? currentObjectResource : (newSubject ? newSubject : context.subject);
         childContext.prefixes = prefixes;
         childContext.incomplete = incomplete;
         if (currentObjectResource) {
            //console.log("Generating new list mapping for "+currentObjectResource);
            listSubject = currentObjectResource;
            listMapping = {};
            listMappingDifferent = true;
         }
         childContext.listMapping = listMapping;
         childContext.language = language;
         childContext.vocabulary = vocabulary;
      }
      if (listMappingDifferent) {
         console.log("Pushing list parent "+current.localName);
         queue.unshift({ parent: current, context: context, subject: listSubject, listMapping: listMapping});
      }
      for (var child = current.lastChild; child; child = child.previousSibling) {
         if (child.nodeType==Node.ELEMENT_NODE) {
            //console.log("Pushing child "+child.localName);
            child.baseURI = current.baseURI;
            queue.unshift({ current: child, context: childContext});
         }
      }
   }
   
   if (this.inHTMLMode) {
      this.copyProperties();
   }

   for (var i=0; i<this.finishedHandlers.length; i++) {
      this.finishedHandlers[i](node);
   }
}

$rdf.RDFaProcessor.prototype.copyProperties = function() {
}


$rdf.RDFaProcessor.prototype.push = function(parent,subject) {
   return {
      parent: parent,
      subject: subject ? subject : (parent ? parent.subject : null),
      parentObject: null,
      incomplete: [],
      listMapping: parent ? parent.listMapping : {},
      language: parent ? parent.language : this.language,
      prefixes: parent ? parent.prefixes : this.target.graph.prefixes,
      terms: parent ? parent.terms : this.target.graph.terms,
      vocabulary: parent ? parent.vocabulary : this.vocabulary
   };
};
/////////////////



$rdf.parseDOM_RDFa = function(dom, kb, base) {
    var p = new $rdf.RDFaProcessor(kb, { 'base': base } );
    dom.baseURI = base; // @@ weird
    console.log(" $rdf.parseDOM_RDFa dom.baseURI = " + dom.baseURI );
    p.process(dom);
}

///////////////////

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


}; // End of spaqlUpdateParser


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
// Matching a formula against another formula
// Assync as well as Synchronously
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
};

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
        if(q.name === null || q.name === "") {
				    q.name="Query #"+(this.queries.length+1);
        }
        q.id=this.queries.length;
        this.queries.push(q);
        for(i=0; i<this.listeners.length; i++) {
            if(this.listeners[i] !== null) {
                this.listeners[i].addQuery(q);
            }
        }
    };

    /**Remove a Query object from the source.  Tells all listeners to also
     * remove the query.
     */
    this.removeQuery = function(q) {
        var i;
        for(i=0; i<this.listeners.length; i++) {
            if(this.listeners[i] !== null) {
                this.listeners[i].removeQuery(q);
            }
        }
        if(this.queries[q.id] !== null) {
            delete this.queries[q.id];
        }
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
            if (this.queries[i] !== null) {
                listener.addQuery(this.queries[i]);
            }
        }
    };
    /**removes listener from the array of listeners, if it exists! Also takes
     * all of the queries from this source out of the listener.
     */
    this.removeListener = function(listener) {
        var i;
        for(i=0; i<this.queries.length; i++) {
            if(this.queries[i] !== null) {
                listener.removeQuery(this.queries[i]);
            }
        }

        for(i=0; i<this.listeners.length; i++) {
            if(this.listeners[i] === listener) {
                delete this.listeners[i];
            }
        } 
    };
};

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
 * 						the new bindings as parameter
 * @param	fetcher,	whenever a resource needs to be loaded this gets called  IGNORED OBSOLETE
 *                              f.fetecher is used as a Fetcher instance to do this.
 * @param       onDone          callback when 
 */
$rdf.IndexedFormula.prototype.query = function(myQuery, callback, fetcher, onDone) {
    var kb = this;

    ///////////// Debug strings

    var bindingDebug = function (b) {
            var str = "", v;
            for (v in b) {
               if (b.hasOwnProperty(v)) {
                   str += "    "+v+" -> "+b[v];
                }
            }
            return str;
    };

    var bindingsDebug = function (nbs) {
        var str = "Bindings: ";
        var i, n=nbs.length;
        for (i=0; i<n; i++) {
            str+= bindingDebug(nbs[i][0])+';\n\t';
        }
        return str;
    }; //bindingsDebug


// Unification: see also 
//  http://www.w3.org/2000/10/swap/term.py
// for similar things in python
//
// Unification finds all bindings such that when the binding is applied
// to one term it is equal to the other.
// Returns: a list of bindings, where a binding is an associative array
//  mapping variuable to value.


    var unifyTerm = function (self, other, bindings, formula) {
        var actual = bindings[self];
        if (actual === undefined) { // Not mapped
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
            if (formula.redirections[actual]) {
                actual = formula.redirections[actual];
            }
            if (formula.redirections[other])  {
                other  = formula.redirections[other];
            }
            if (actual.sameTerm(other)) {
                return [[ [], null]];
            }
            return [];
        }
        if (self instanceof Array) {
            if (!(other instanceof Array)) {
                return [];
            }
            return unifyContents(self, other, bindings);
        }
        throw("query.js: oops - code not written yet");
        // return undefined;  // for lint - no jslint objects to unreachables
    //    return actual.unifyContents(other, bindings)
    }; //unifyTerm



    var unifyContents = function (self, other, bindings, formula) {
        var nbs2;
        if (self.length !== other.length) {
            return []; // no way
        }
        if (!self.length) {
            return [[ [], null ]]; // Success
        }
        var nbs = unifyTerm(self[0], other[0], bindings, formula);
        if (nbs.length === 0) {
            return nbs;
        }
        var res = [];
        var i, n = nbs.length, nb, j, m, v, nb2, bindings2;
        for (i=0; i<n; i++) { // for each possibility from the first term
            nb = nbs[i][0]; // new bindings
            bindings2 = [];
            for (v in nb) {
                if (nb.hasOwnProperty(v)) {
                    bindings2[v] = nb[v]; // copy
                }
            }
            for (v in bindings) {
                if (bindings.hasOwnProperty(v)) {
                    bindings2[v] = bindings[v]; // copy
                }
            }
            nbs2 = unifyContents(self.slice(1), other.slice(1), bindings2, formula);
            m = nbs2.length;
            for (j=0; j<m; j++) {
                nb2 = nbs2[j][0];   //@@@@ no idea whether this is used or right
                for (v in nb) {
                    if (nb.hasOwnProperty(v)) {
                        nb2[v] = nb[v];
                    }
                }
                res.push([nb2, null]);
            }
        }
        return res;
    }; // unifyContents





    //  Matching
    //
    // Matching finds all bindings such that when the binding is applied
    // to one term it is equal to the other term.  We only match formulae.

    /** if x is not in the bindings array, return the var; otherwise, return the bindings **/
    var bind = function (x, binding) {
        var y = binding[x];
        if (y === undefined) {
            return x;
        }
        return y;
    };






    // When there are OPTIONAL clauses, we must return bindings without them if none of them
    // succeed. However, if any of them do succeed, we should not.  (This is what branchCount()
    // tracked. The problem currently is (2011/7) that when several optionals exist, and they
    // all match, multiple sets of bindings are returned, each with one optional filled in.)
    
    var union = function(a,b) {
       var c= {};
       var x;
       for (x in a) {
            if (a.hasOwnProperty(x)) {
                c[x] = a[x];
            }
        }
       for (x in b) {
            if (b.hasOwnProperty(x)) {
                c[x] = b[x];
            }
        }
        return c;
    };
    
    var OptionalBranchJunction = function(originalCallback, trunkBindings) {
        this.trunkBindings = trunkBindings;
        this.originalCallback = originalCallback;
        this.branches = [];
        //this.results = []; // result[i] is an array of bindings for branch i
        //this.done = {};  // done[i] means all/any results are in for branch i
        //this.count = {};
        return this;
    };

    OptionalBranchJunction.prototype.checkAllDone = function() {
        var i;
        for (i=0; i<this.branches.length; i++) {
            if (!this.branches[i].done) {
                return;
            }
        }
        $rdf.log.debug("OPTIONAL BIDNINGS ALL DONE:");
        this.doCallBacks(this.branches.length-1, this.trunkBindings);
    
    };
    // Recrursively generate the cross product of the bindings
    OptionalBranchJunction.prototype.doCallBacks = function(b, bindings) {
        var j;
        if (b < 0) {
            return this.originalCallback(bindings); 
        }
        for (j=0; j < this.branches[b].results.length; j++) {
            this.doCallBacks(b-1, union(bindings, this.branches[b].results[j]));
        }
    };
    
    // A mandatory branch is the normal one, where callbacks
    // are made immediately and no junction is needed.
    // Might be useful for onFinsihed callback for query API.
    var MandatoryBranch = function (callback, onDone) {
        this.count = 0;
        this.success = false;
        this.done = false;
        // this.results = [];
        this.callback = callback;
        this.onDone = onDone;
        // this.junction = junction;
        // junction.branches.push(this);
        return this;
    };
    
    MandatoryBranch.prototype.reportMatch = function(bindings) {
        // $rdf.log.error("@@@@ query.js 1"); // @@
        this.callback(bindings);
        this.success = true;
    };

    MandatoryBranch.prototype.reportDone = function() {
        this.done = true;
        $rdf.log.info("Mandatory query branch finished.***");
        if (this.onDone !== undefined) {
            this.onDone();
        }
    };


    // An optional branch hoards its results.
    var OptionalBranch = function (junction) {
        this.count = 0;
        this.done = false;
        this.results = [];
        this.junction = junction;
        junction.branches.push(this);
        return this;
    };
    
    OptionalBranch.prototype.reportMatch = function(bindings) {
        this.results.push(bindings);
    };

    OptionalBranch.prototype.reportDone = function() {
        $rdf.log.debug("Optional branch finished - results.length = "+this.results.length);
        if (this.results.length === 0) {// This is what optional means: if no hits,
            this.results.push({});  // mimic success, but with no bindings
            $rdf.log.debug("Optional branch FAILED - that's OK.");
        }
        this.done = true;
        this.junction.checkAllDone();
    };











    /** prepare -- sets the index of the item to the possible matches
        * @param f - formula
        * @param item - an Statement, possibly w/ vars in it
        * @param bindings - 
    * @returns true if the query fails -- there are no items that match **/
    var prepare = function (f, item, bindings) {
        var t, terms, termIndex, i, ind;
        item.nvars = 0;
        item.index = null;
        // if (!f.statements) $rdf.log.warn("@@@ prepare: f is "+f);
    //    $rdf.log.debug("Prepare: f has "+ f.statements.length);
        //$rdf.log.debug("Prepare: Kb size "+f.statements.length+" Preparing "+item);
        
        terms = [item.subject,item.predicate,item.object];
        ind = [f.subjectIndex,f.predicateIndex,f.objectIndex];
        for (i=0; i<3; i++) {
            //alert("Prepare "+terms[i]+" "+(terms[i] in bindings));
            if (terms[i].isVar && !(bindings[terms[i]] !== undefined)) {
                item.nvars++;
            } else {
                t = bind(terms[i], bindings); //returns the RDF binding if bound, otherwise itself
                //if (terms[i]!=bind(terms[i],bindings) alert("Term: "+terms[i]+"Binding: "+bind(terms[i], bindings));
                if (f.redirections[t.hashString()]) {
                    t = f.redirections[t.hashString()]; //redirect
                }
                termIndex = ind[i][t.hashString()];
                
                if (!termIndex) {
                    item.index = [];
                    return false; // Query line cannot match
                }
                if ((item.index === null) || (item.index.length > termIndex.length)) {
                    item.index = termIndex;
                }
            }
        }
            
        if (item.index === null) { // All 3 are variables? 
            item.index = f.statements;
        }
        return true;
    }; //prepare
        
    /** sorting function -- negative if self is easier **/
    // We always prefer to start with a URI to be able to browse a graph
    // this is why we put off items with more variables till later.
    function easiestQuery(self, other) {
        if (self.nvars !== other.nvars) {
            return self.nvars - other.nvars;
        }
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
    * Will fetch linked data from the web iff the knowledge base an associated source fetcher (f.fetcher)
    ***/
    var match = function (f, g, bindingsSoFar, level, fetcher, localCallback, branch) {
        $rdf.log.debug("Match begins, Branch count now: "+branch.count+" for "+branch.pattern_debug);
        var sf = f.fetcher ? f.fetcher : null;
        //$rdf.log.debug("match: f has "+f.statements.length+", g has "+g.statements.length)
        var pattern = g.statements;
        if (pattern.length === 0) { //when it's satisfied all the pattern triples

            $rdf.log.debug("FOUND MATCH WITH BINDINGS:"+bindingDebug(bindingsSoFar));
            if (g.optional.length === 0) {
                branch.reportMatch(bindingsSoFar);
            }
            else {
                $rdf.log.debug("OPTIONAL: "+g.optional);
                var junction = new OptionalBranchJunction(callback, bindingsSoFar); // @@ won't work with nested optionals? nest callbacks
                var br = [], b;
                for (b =0; b < g.optional.length; b++) {
                    br[b] = new OptionalBranch(junction); // Allocate branches to prevent premature ending
                    br[b].pattern_debug = g.optional[b]; // for diagnotics only
                }
                for (b = 0; b < g.optional.length; b++) {
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
        if (sf) {   //Fetcher is used to fetch URIs, function first term is a URI term, second is the requester
            var id = "match" + match_index++;
            var fetchResource = function (requestedTerm, id) {
                var docuri = requestedTerm.uri.split("#")[0];
                sf.nowOrWhenFetched(docuri, undefined, function(err, body, xhr) {
                    if (err) {
                        console.log("Error following link to <" + requestedTerm.uri + "> in query: " + body )
                    }
                    match(f, g, bindingsSoFar, level, fetcher, // match not match2 to look up any others necessary.
                        localCallback, branch);
                });
                /*
                if( sf ) {
                    sf.addCallback('done', function(uri) {
                        if ((kb.canon(kb.sym(uri)).uri !== path) && (uri !== kb.canon(kb.sym(path)))) {
                            return true;
                        }
                        return false;
                    });
                }
                fetcher(requestedTerm, id);
                */    
            };
            for (i=0; i<n; i++) {
                item = pattern[i];  //for each of the triples in the query
                if ((bindingsSoFar[item.subject] !== undefined) 
                    && bindingsSoFar[item.subject].uri
                    && sf && sf.getState($rdf.Util.uri.docpart(bindingsSoFar[item.subject].uri)) === "unrequested") {
                    //fetch the subject info and return to id
                    fetchResource(bindingsSoFar[item.subject],id);
                    return; // only look up one per line this time, but we will come back again though match
                }    
                if (bindingsSoFar[item.object] !== undefined
                           && bindingsSoFar[item.object].uri
                           && sf && sf.getState($rdf.Util.uri.docpart(bindingsSoFar[item.object].uri)) === "unrequested") {
                    fetchResource(bindingsSoFar[item.object], id);
                    return;
                }
            }
        } // if sf
        match2(f, g, bindingsSoFar, level, fetcher, localCallback, branch);     
        return;
    }; // match


    var constraintsSatisfied = function (bindings,constraints)
    {
        var res = true, x, test;
        for (x in bindings) {
            if (bindings.hasOwnProperty(x)) {
                if (constraints[x]) {
                    test = constraints[x].test;
                    if (test && !test(bindings[x])) {
                            res=false;
                    }
                }
            }
        }
        return res;
    };



    /** match2 -- stuff after the fetch **/
    var match2 = function (f, g, bindingsSoFar, level, fetcher, callback, branch) { // post fetch
        var pattern = g.statements, n = pattern.length, i,
            k, nk, v, bindings2, newBindings1, item;
        for (i=0; i<n; i++) {  //For each statement left in the query, run prepare
            item = pattern[i];
            $rdf.log.info("match2: item=" + item + ", bindingsSoFar=" + bindingDebug(bindingsSoFar));
            prepare(f, item, bindingsSoFar);
        }
        pattern.sort(easiestQuery);
        item = pattern[0];
        // $rdf.log.debug("Sorted pattern:\n"+pattern)
        var rest = f.formula();
        rest.optional = g.optional;
        rest.constraints = g.constraints;
        rest.statements = pattern.slice(1); // No indexes: we will not query g. 
        $rdf.log.debug(level + "match2 searching "+item.index.length+ " for "+item+
                "; bindings so far="+bindingDebug(bindingsSoFar));
        //var results = [];
        var c, nc=item.index.length, nbs1, st, onward = 0;
        //var x;
        for (c=0; c<nc; c++) {   // For each candidate statement
            st = item.index[c]; //for each statement in the item's index, spawn a new match with that binding 
            nbs1 = unifyContents(
                    [item.subject, item.predicate, item.object],
                    [st.subject, st.predicate, st.object], bindingsSoFar, f);
            $rdf.log.info(level+" From first: "+nbs1.length+": "+bindingsDebug(nbs1));
            nk=nbs1.length;
            //branch.count += nk;
            //$rdf.log.debug("Branch count bumped "+nk+" to: "+branch.count);
            for (k=0; k<nk; k++) {  // For each way that statement binds
                bindings2 = [];
                newBindings1 = nbs1[k][0]; 
                if (!constraintsSatisfied(newBindings1,g.constraints)) {
                    //branch.count--;
                    $rdf.log.debug("Branch count CS: "+branch.count);
                } else {
                    for (v in newBindings1){
                        if (newBindings1.hasOwnProperty(v)) {
                            bindings2[v] = newBindings1[v]; // copy
                        }
                    }
                    for (v in bindingsSoFar) {
                        if (bindingsSoFar.hasOwnProperty(v)) {
                            bindings2[v] = bindingsSoFar[v]; // copy
                        }
                    }
                    
                    branch.count++;  // Count how many matches we have yet to complete
                    onward ++;
                    match(f, rest, bindings2, level+ '  ', fetcher, callback, branch); //call match
                }
            }
        }
        branch.count--;
        if (onward === 0) {
            $rdf.log.debug("Match2 fails completely on " + item);
        }
        $rdf.log.debug("Match2 ends, Branch count: "+branch.count +" for "+branch.pattern_debug);
        if (branch.count === 0) {
            $rdf.log.debug("Branch finished.");
            branch.reportDone();
        }
    }; //match2

    //////////////////////////// Body of query()  ///////////////////////
    /*
    if(!fetcher) {
        fetcher=function (x, requestedBy) {
            if (x === null) {
                return;
            }
            $rdf.Util.AJAR_handleNewTerm(kb, x, requestedBy);
        };
    } 
    */
    //prepare, oncallback: match1
    //match1: fetcher, oncallback: match2
    //match2, oncallback: populatetable
    //    $rdf.log.debug("Query F length"+this.statements.length+" G="+myQuery)
    var f = this;
    $rdf.log.debug("Query on "+this.statements.length);
    
    
    //kb.remoteQuery(myQuery,'http://jena.hpl.hp.com:3040/backstage',callback);
    //return;


    var trunck = new MandatoryBranch(callback, onDone);
    trunck.count++; // count one branch to complete at the moment
    setTimeout(function() { match(f, myQuery.pat, myQuery.pat.initBindings, '', fetcher, callback, trunck /*branch*/ ); }, 0);
    
    return; //returns nothing; callback does the work
}; //query

// ENDS
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
		for (var x in st)
		{
			$rdf.log.debug("Found statement: "+st);
			str+=addIndent()+st[x]+"\n";
		}
		return str;
	}
	
	function getConstraints (pat)
	{
		var str="";
		for (var v in pat.constraints)
		{
			var foo = pat.constraints[v];
			str+=addIndent()+"FILTER ( "+foo.describe(v)+" ) "+"\n";
		}
		return str;
	}
	
	function getOptionals (pat)
	{
		var str = "";
		for (var x=0;x<pat.optional.length;x++)
		{
			//alert(pat.optional.termType)
			$rdf.log.debug("Found optional query");
			str+= addIndent()+"OPTIONAL { "+"\n";
			indent++;
			str+= getPattern (pat.optional[x]);
			str+= getConstraints (pat.optional[x]);
			str+= getOptionals (pat.optional[x]);
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
		str+="}";
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
		
	return getSPARQL (query);
};

/**
 * @SPARQL: SPARQL text that is converted to a query object which is returned.
 * @testMode: testing flag. Prevents loading of sources.
 */
 
$rdf.SPARQLToQuery = function(SPARQL, testMode, kb)
{
	//AJAR_ClearTable();
	var variableHash = [];
	function makeVar(name) {
		if (variableHash[name])
			return variableHash[name];
		var newVar = kb.variable(name);
		variableHash[name] = newVar;
		return newVar;
	}
	
	//term type functions			
	function isRealText(term) { return (typeof term == 'string' && term.match(/[^ \n\t]/)) ;}
	function isVar(term) { return (typeof term == 'string' && term.match(/^[\?\$]/)); }
	function fixSymbolBrackets(term) { if (typeof term == 'string') return term.replace(/^&lt;/,"<").replace(/&gt;$/,">"); else return term; }
	function isSymbol(term) { return (typeof term == 'string' && term.match(/^<[^>]*>$/)); }
	function isBnode(term) { return (typeof term == 'string' && (term.match(/^_:/)||term.match(/^$/))); }
	function isPrefix(term) { return (typeof term == 'string' && term.match(/:$/)); }
	function isPrefixedSymbol(term) { return (typeof term == 'string' && term.match(/^:|^[^_][^:]*:/)); }
	function getPrefix(term) { var a = term.split(":"); return a[0]; }
	function getSuffix(term) { var a = term.split(":"); return a[1]; }
	function removeBrackets(term) { if (isSymbol(term)) {return term.slice(1,term.length-1);} else return term; }
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
		var res = new Array(2), br, ind;
		if (!sin || (doub && doub<sin)) {br='"'; ind = doub;}
		else if (!doub || (sin && sin<doub)) {br="'"; ind = sin;}
		else {$rdf.log.error ("SQARQL QUERY OOPS!"); return res;}
		res[0] = str.slice(0,ind);
		var end = str.slice(ind+1).indexOf(br);
		if (end === -1) 
		{
			$rdf.log.error("SPARQL parsing error: no matching parentheses in literal "+str);
			return str;
		}
		//alert(str.slice(end+ind+2).match(/^\^\^/))
                var end2;
		if (str.slice(end+ind+2).match(/^\^\^/))
		{
			end2 = str.slice(end+ind+2).indexOf(" ");
			//alert(end2);
			res[1]=kb.literal(str.slice(ind+1,ind+1+end),"",kb.sym(removeBrackets(str.slice(ind+4+end,ind+2+end+end2))));
			//alert(res[1].datatype.uri);
			res = res.concat(parseLiterals(str.slice(end+ind+3+end2)));
		}
		else if (str.slice(end+ind+2).match(/^@/))
		{
                    end2 = str.slice(end+ind+2).indexOf(" ");
                    //alert(end2);
                    res[1]=kb.literal(str.slice(ind+1,ind+1+end),str.slice(ind+3+end,ind+2+end+end2),null);
                    //alert(res[1].datatype.uri);
                    res = res.concat(parseLiterals(str.slice(end+ind+2+end2)));
		} else {
                
                    res[1]=kb.literal(str.slice(ind+1,ind+1+end),"",null);
                    $rdf.log.info("Literal found: "+res[1]);
                    res = res.concat(parseLiterals(str.slice(end+ind+2))); //finds any other literals
		}
		return res;
	}
	
	
	function spaceDelimit (str)
	{
		str = str.replace(/\(/g," ( ").replace(/\)/g," ) ").replace(/</g," <").replace(/>/g,"> ").replace(/{/g," { ").replace(/}/g," } ").replace(/[\t\n\r]/g," ").replace(/; /g," ; ").replace(/\. /g," . ").replace(/, /g," , ");
		$rdf.log.info("New str into spaceDelimit: \n"+str);
		var res=[];
		var br = str.split(" ");
		for (var x in br)
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
		var res = [];
		for (var x=0;x<input.length;x++)
		{
			if (typeof input[x] != 'string') { res[x]=input[x]; continue ;}
			input[x] = fixSymbolBrackets(input[x]);
			if (isVar(input[x]))
				res[x] = makeVar(input[x].slice(1));
			else if (isBnode(input[x]))
			{
				$rdf.log.info(input[x]+" was identified as a bnode.");
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
					$rdf.log.error("SPARQL error: "+input[x]+" with prefix "+getPrefix(input[x])+" does not have a correct prefix entry.");
					res[x]=input[x];
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
		for (var x in token1)
		{
			if (typeof token1[x] == 'string') {
				token2=token2.concat(spaceDelimit(token1[x]));
                                
			} else {
				token2=token2.concat(token1[x]);
                        }
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
				ind.push(i);
		}
		return ind;
	}
				
	
	function setVars (input,query)
	{
		$rdf.log.info("SPARQL vars: "+input);
		for (var x in input)
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
		for (var i in prefInd)
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
		var index = 0;
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
        this.describe = function (varstr) { return varstr + " > "+value.toNT(); };
        this.test = function (term) {
            if (term.value.match(/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/))
                return (parseFloat(term.value) > parseFloat(value)); 
            else return (term.toNT() > value.toNT()); 
        };
        return this;
    }
    
    function constraintLessThan (value) //this is not the recommended usage. Should only work on literal, numeric, dateTime
    {
        this.describe = function (varstr) { return varstr + " < "+value.toNT(); };
        this.test = function (term) {
            //this.describe = function (varstr) { return varstr + " < "+value }
            if (term.value.match(/[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/))
                return (parseFloat(term.value) < parseFloat(value)); 
            else return (term.toNT() < value.toNT()); 
        };
        return this;
    }
    
    function constraintEqualTo (value) //This should only work on literals but doesn't.
    {
        this.describe = function (varstr) { return varstr + " = "+value.toNT(); };
        this.test = function (term) {
            return value.sameTerm(term);
        };
        return this;
    }
    
    function constraintRegexp (value) //value must be a literal
    {
        this.describe = function (varstr) { return "REGEXP( '"+value+"' , "+varstr+" )";};
        this.test = function(term) { 
            var str = value;
            //str = str.replace(/^//,"").replace(//$/,"")
            var rg = new RegExp(str); 
            if (term.value) return rg.test(term.value); 
            else return false;
        };
    }					
	

	function setConstraint(input,pat)
	{
		if (input.length == 3 && input[0].termType=="variable" && (input[2].termType=="symbol" || input[2].termType=="literal"))
		{
			if (input[1]=="=")
			{
				$rdf.log.debug("Constraint added: "+input);
				pat.constraints[input[0]]=new constraintEqualTo(input[2]);
			}
			else if (input[1]==">")
			{
				$rdf.log.debug("Constraint added: "+input);
				pat.constraints[input[0]]=new constraintGreaterThan(input[2]);
			}
			else if (input[1]=="<")
			{
				$rdf.log.debug("Constraint added: "+input);
				pat.constraints[input[0]]=new constraintLessThan(input[2]);
			}
			else
				$rdf.log.warn("I don't know how to handle the constraint: "+input);
		}
		else if (input.length == 6 && typeof input[0] == 'string' && input[0].toLowerCase() == 'regexp' &&
                                        input[1] == '(' && input[5] == ')' && input[3] == ',' && input[4].termType == 'variable' &&
					input[2].termType == 'literal')
					{
						$rdf.log.debug("Constraint added: "+input);
						pat.constraints[input[4]]=new constraintRegexp(input[2].value);
					}
		
			//$rdf.log.warn("I don't know how to handle the constraint: "+input);
		
		//alert("length: "+input.length+" input 0 type: "+input[0].termType+" input 1: "+input[1]+" input[2] type: "+input[2].termType);
	}
	

	
	function setOptional (terms, pat)
	{
		$rdf.log.debug("Optional query: "+terms+" not yet implemented.");
		var opt = kb.formula();
		setWhere (terms, opt);
		pat.optional.push(opt);
	}
	
	function setWhere (input,pat)
	{
		var terms = toTerms(input), end;
		$rdf.log.debug("WHERE: "+terms);
		//var opt = arrayIndicesOf("OPTIONAL",terms);
		while (arrayIndexOf("OPTIONAL",terms))
		{
			opt = arrayIndexOf("OPTIONAL",terms);
			$rdf.log.debug("OPT: "+opt+" "+terms[opt]+" in "+terms);
			if (terms[opt+1]!="{") $rdf.log.warn("Bad optional opening bracket in word "+opt);
			end = getMatchingBracket(terms.slice(opt+2),"{","}");
			if (end == -1) {
                            $rdf.log.error("No matching bracket in word "+opt);
			} else {
				setOptional(terms.slice(opt+2,opt+2+end),pat);
				//alert(pat.statements[0].toNT());
				opt = arrayIndexOf("OPTIONAL",terms);
				end = getMatchingBracket(terms.slice(opt+2),"{","}");
				terms.splice(opt,end+3);
			}
		}
		$rdf.log.debug("WHERE after optionals: "+terms);
		while (arrayIndexOf("FILTER",terms))
		{
			var filt = arrayIndexOf("FILTER",terms);
			if (terms[filt+1]!="(") $rdf.log.warn("Bad filter opening bracket in word "+filt);
			end = getMatchingBracket(terms.slice(filt+2),"(",")");
			if (end == -1) {
                            $rdf.log.error("No matching bracket in word "+filt);
			} else {
				setConstraint(terms.slice(filt+2,filt+2+end),pat);
				filt = arrayIndexOf("FILTER",terms);
				end = getMatchingBracket(terms.slice(filt+2),"(",")");
				terms.splice(filt,end+3);
			}
		}
		$rdf.log.debug("WHERE after filters and optionals: "+terms);
		extractStatements (terms,pat);	
	}
	
	function extractStatements (terms, formula)
	{
		var arrayZero = new Array(1); arrayZero[0]=-1;  //this is just to add the beginning of the where to the periods index.
		var per = arrayZero.concat(arrayIndicesOf(".",terms));
		var stat = [];
		for (var x=0;x<per.length-1;x++) {
			stat[x] = terms.slice(per[x]+1,per[x+1]);
                }
		//Now it's in an array of statements
		for (x in stat)                             //THIS MUST BE CHANGED FOR COMMA, SEMICOLON
		{
			$rdf.log.info("s+p+o "+x+" = "+stat[x]);
			var subj = stat[x][0];
			stat[x].splice(0,1);
			var sem = arrayZero.concat(arrayIndicesOf(";",stat[x]));
			sem.push(stat[x].length);
			var stat2 = [];
			for (y=0;y<sem.length-1;y++)
				stat2[y]=stat[x].slice(sem[y]+1,sem[y+1]);
			for (x in stat2)
			{
				$rdf.log.info("p+o "+x+" = "+stat[x]);
				var pred = stat2[x][0];
				stat2[x].splice(0,1);
				var com = arrayZero.concat(arrayIndicesOf(",",stat2[x]));
				com.push(stat2[x].length);
				var stat3 = [];
				for (y=0;y<com.length-1;y++)
					stat3[y]=stat2[x].slice(com[y]+1,com[y+1]);
				for (x in stat3)
				{
					var obj = stat3[x][0];
					$rdf.log.info("Subj="+subj+" Pred="+pred+" Obj="+obj);
					formula.add(subj,pred,obj);
				}
			}
		}
	}
		
	//*******************************THE ACTUAL CODE***************************//	
	$rdf.log.info("SPARQL input: \n"+SPARQL);
	var q = new $rdf.Query();
	var sp = tokenize (SPARQL); //first tokenize everything
	var prefixes = getPrefixDeclarations(sp);
	if (!prefixes.rdf) prefixes.rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
	if (!prefixes.rdfs) prefixes.rdfs = "http://www.w3.org/2000/01/rdf-schema#";
	var selectLoc = arrayIndexOf("SELECT", sp), whereLoc = arrayIndexOf("WHERE", sp);
	if (selectLoc<0 || whereLoc<0 || selectLoc>whereLoc)
	{
		$rdf.log.error("Invalid or nonexistent SELECT and WHERE tags in SPARQL query");
		return false;
	}
	setVars (sp.slice(selectLoc+1,whereLoc),q);

	setWhere (sp.slice(whereLoc+2,sp.length-1),q.pat);
	
    if (testMode) return q;
    
    for (var x in q.pat.statements)
    {
	var st = q.pat.statements[x];
	if (st.subject.termType == 'symbol'
	    /*&& sf.isPending(st.subject.uri)*/) { //This doesn't work.
	    //sf.requestURI(st.subject.uri,"sparql:"+st.subject) Kenny: I remove these two
	    if($rdf.fetcher) $rdf.fetcher.lookUpThing(st.subject,"sparql:"+st.subject);
	}
	if (st.object.termType == 'symbol'
	    /*&& sf.isPending(st.object.uri)*/) {
	    //sf.requestURI(st.object.uri,"sparql:"+st.object)
	    if($rdf.fetcher) $rdf.fetcher.lookUpThing(st.object,"sparql:"+st.object);
	}
    }
    //alert(q.pat);
    return q;
    //checkVars()
    
    //*******************************************************************//
};

$rdf.SPARQLResultsInterpreter = function (xml, callback, doneCallback)
{

	function isVar(term) { return (typeof term == 'string' && term.match(/^[\?\$]/)); }
	function fixSymbolBrackets(term) { if (typeof term == 'string') return term.replace(/^&lt;/,"<").replace(/&gt;$/,">"); else return term ;}
	function isSymbol(term) { return (typeof term == 'string' && term.match(/^<[^>]*>$/)); }
	function isBnode(term) { return (typeof term == 'string' && (term.match(/^_:/)||term.match(/^$/))); }
	function isPrefix(term) { return (typeof term == 'string' && term.match(/:$/)) ;}
	function isPrefixedSymbol(term) { return (typeof term == 'string' && term.match(/^:|^[^_][^:]*:/)); } 
	function getPrefix(term) { var a = term.split(":"); return a[0]; }
	function getSuffix(term) { var a = term.split(":"); return a[1]; }
	function removeBrackets(term) { if (isSymbol(term)) {return term.slice(1,term.length-1);} else return term; }	
	
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
                var pref, suf;
		if (isPrefixedSymbol(str)) {
                    pref = getPrefix(str);
                    suf = getSuffix(str);
		} else {
                    pref = "";
                    suf = str;
                }
		if (prefixes[pref])
			return prefixes[pref]+suf;
		else
			$rdf.log.error("Incorrect SPARQL results - bad prefix");
	}
	
	function xmlMakeTerm(node)
	{
		//alert("xml Node name: "+node.nodeName+"\nxml Child value: "+node.childNodes[0].nodeValue);
		var val=node.childNodes[0];
		for (var x=0; x<node.childNodes.length;x++)
			if (node.childNodes[x].nodeType==3) { val=node.childNodes[x]; break; }
		
		if (handleP(node.nodeName) == spns+"uri") 
			return kb.sym(val.nodeValue);
		else if (handleP(node.nodeName) == spns+"literal")
			return kb.literal(val.nodeValue);
		else if (handleP(node.nodeName) == spns+"unbound")
			return 'unbound';
		
		else $rdf.log.warn("Don't know how to handle xml binding term "+node);
		return false;
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
			var binding = null;
			for (var y=0;y<bind.childNodes.length;y++)
				if (bind.childNodes[y].nodeType == 1) { binding = xmlMakeTerm(bind.childNodes[y]); break; }
			if (!binding) { $rdf.log.warn("Bad binding"); return false; }
			$rdf.log.info("var: "+bindVar+" binding: "+binding);
			bound=true;
			if (binding != 'unbound') {
                            resultBindings[bindVar]=binding;
                        }
		}
		
		//alert(callback)
		if (bound && callback) {
                    setTimeout(function(){callback(resultBindings);},0);
                }
		bindingList.push(resultBindings);
		return;
	}
	
	//****MAIN CODE**********
	var prefixes = [], bindingList=[], head, results, sparql = xml.childNodes[0], spns = "http://www.w3.org/2005/sparql-results#";
	prefixes[""]="";
	var x;
        
	if (sparql.nodeName != 'sparql') { $rdf.log.error("Bad SPARQL results XML"); return; }
	
	for (x=0;x<sparql.attributes.length;x++)  //deals with all the prefixes beforehand
		parsePrefix(sparql.attributes[x]);
		
	for (x=0;x<sparql.childNodes.length;x++) //looks for the head and results childNodes
	{
		$rdf.log.info("Type: "+sparql.childNodes[x].nodeType+"\nName: "+sparql.childNodes[x].nodeName+"\nValue: "+sparql.childNodes[x].nodeValue);
		
		if (sparql.childNodes[x].nodeType==1 && handleP(sparql.childNodes[x].nodeName)== spns+"head")
			head = sparql.childNodes[x];
		else if (sparql.childNodes[x].nodeType==1 && handleP(sparql.childNodes[x].nodeName)==spns+"results")
			results = sparql.childNodes[x];
	}
	
	if (!results && !head) { $rdf.log.error("Bad SPARQL results XML"); return; }
	
	for (x=0;x<head.childNodes.length;x++) //@@does anything need to be done with these? Should we check against query vars?
	{
		if (head.childNodes[x].nodeType == 1 && handleP(head.childNodes[x].nodeName) == spns+"variable")
			$rdf.log.info("Var: "+head.childNodes[x].getAttribute('name'));
	}
	
	for (x=0; x<results.childNodes.length;x++)
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
};
// Joe Presbrey <presbrey@mit.edu>
// 2007-07-15
// 2010-08-08 TimBL folded in Kenny's WEBDAV 
// 2010-12-07 TimBL addred local file write code

$rdf.sparqlUpdate = function() {

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
        
        this.patchControl = []; // index of objects fro coordinating incomng and outgoing patches
    }

    sparql.prototype.patchControlFor = function(doc) {
        if (!this.patchControl[doc.uri]) {
            this.patchControl[doc.uri] = [];
        }
        return this.patchControl[doc.uri];
    }

    // Returns The method string SPARQL or DAV or LOCALFILE or false if known, undefined if not known.
    //
    // Files have to have a specific annotaton that they are machine written, for safety.
    // We don't actually check for write access on files.
    //
    sparql.prototype.editable = function(uri, kb) {
        if (!uri) return false; // Eg subject is bnode, no known doc to write to
        if (!kb) kb = tabulator.kb;

        if (uri.slice(0,8) == 'file:///') {
            if (kb.holds(kb.sym(uri), tabulator.ns.rdf('type'), tabulator.ns.link('MachineEditableDocument')))
                return 'LOCALFILE';
            var sts = kb.statementsMatching(kb.sym(uri),undefined,undefined);
            
            console.log("sparql.editable: Not MachineEditableDocument file "+uri+"\n");
            console.log(sts.map(function(x){return x.toNT();}).join('\n'))
            return false;
        //@@ Would be nifty of course to see whether we actually have write acess first.
        }

        var request;
        var definitive = false;
        var requests = kb.each(undefined, this.ns.link("requestedURI"), $rdf.uri.docpart(uri));
        for (var r=0; r<requests.length; r++) {
            request = requests[r];
            if (request !== undefined) {
                var response = kb.any(request, this.ns.link("response"));
                if (request !== undefined) {
                    var acceptPatch = kb.each(response, this.ns.httph("accept-patch"));
                    if (acceptPatch.length) {
                        for (var i = 0; i < acceptPatch.length; i++) {
                            var method = acceptPatch[i].value.trim();
                            if (method.indexOf('application/sparql-update') >=0 ) return 'SPARQL';
                        }
                    }
                    var author_via = kb.each(response, this.ns.httph("ms-author-via"));
                    if (author_via.length) {
                        for (var i = 0; i < author_via.length; i++) {
                            var method = author_via[i].value.trim();
                            if (method.indexOf('SPARQL') >=0 ) return 'SPARQL';
                            if (method.indexOf('DAV') >=0 ) return 'DAV';
                        }
                    }
                    var status = kb.each(response, this.ns.http("status"));
                    if (status.length) {
                        for (var i = 0; i < status.length; i++) {
                            if (status[i] == 200 || status[i] == 404) {
                                definitive = true;
                                // return false; // A definitive answer
                            }
                        }
                    }
                } else {
                    console.log("sparql.editable: No response for "+uri+"\n");
                }
            }
        }
        if (requests.length == 0) {
            console.log("sparql.editable: No request for "+uri+"\n");
        } else {
            if (definitive) return false;  // We have got a request and it did NOT say editable => not editable
        };

        console.log("sparql.editable: inconclusive for "+uri+"\n");
        return undefined; // We don't know (yet) as we haven't had a response (yet)
    }

    ///////////  The identification of bnodes


    sparql.prototype.anonymize = function (obj) {
        return (obj.toNT().substr(0,2) == "_:" && this._mentioned(obj))
        ? "?" + obj.toNT().substr(2)
        : obj.toNT();
    }

    sparql.prototype.anonymizeNT = function(stmt) {
        return this.anonymize(stmt.subject) + " " +
        this.anonymize(stmt.predicate) + " " +
        this.anonymize(stmt.object) + " .";
    }



    // A list of all bnodes occuring in a statement
    sparql.prototype._statement_bnodes = function(st) {
        return [st.subject, st.predicate, st.object].filter(function(x){return x.isBlank});
    }

    // A list of all bnodes occuring in a list of statements
    sparql.prototype._statement_array_bnodes = function(sts) {
        var bnodes = [];
        for (var i=0; i<sts.length;i++) bnodes = bnodes.concat(this._statement_bnodes(sts[i]));
        bnodes.sort(); // in place sort - result may have duplicates
        bnodes2 = [];
        for (var j=0; j<bnodes.length; j++)
            if (j==0 || !bnodes[j].sameTerm(bnodes[j-1])) bnodes2.push(bnodes[j]);
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

    // Returns a context to bind a given node, up to a given depth
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

    // Returns the smallest context to bind a given single bnode
    sparql.prototype._bnode_context_1 = function(x, source) {
        // Return a list of statements which indirectly identify a node
        //   Breadth-first
        for (var depth = 0; depth < 3; depth++) { // Try simple first 
            var con = this._bnode_context2(x, source, depth);
            if (con !== null) return con;
        }
        throw ('Unable to uniquely identify bnode: '+ x.toNT());
    }
    
    sparql.prototype._mentioned = function(x) {
        return (this.store.statementsMatching(x).length !== 0) || // Don't pin fresh bnodes
                (this.store.statementsMatching(undefined, x).length !== 0) ||
                (this.store.statementsMatching(undefined, undefined, x).length !== 0);    
    
    }

    sparql.prototype._bnode_context = function(bnodes, doc) {
        var context = [];
        if (bnodes.length) {
            this._cache_ifps();
            for (var i = 0; i < bnodes.length; i++) { // Does this occur in old graph?
                var bnode = bnodes[i];
                if (!this._mentioned(bnode)) continue;                   
                context = context.concat(this._bnode_context_1(bnode, doc));
            }
        }
        return context;
    }
    
/*  Weird code does not make sense -- some code corruption along the line -- st undefined -- weird
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
                    context = context.concat(this._bnode_context_1(bnodes[x], st.why));
                }
            }
        }
        return context;
    }
*/
    // Returns the best context for a single statement
    sparql.prototype._statement_context = function(st) {
        var bnodes = this._statement_bnodes(st);
        return this._bnode_context(bnodes, st.why);
    }

    sparql.prototype._context_where = function(context) {
            var sparql = this;
            return (context == undefined || context.length == 0)
            ? ""
            : "WHERE { " + context.map(function(x){ return sparql.anonymizeNT(x)}).join("\n") + " }\n";
    }

    sparql.prototype._fire = function(uri, query, callback) {
        if (!uri) throw "No URI given for remote editing operation: "+query;
        console.log("sparql: sending update to <"+uri+">");
        var xhr = $rdf.Util.XMLHTTPFactory();
        xhr.options = {};

        xhr.onreadystatechange = function() {
            //dump("SPARQL update ready state for <"+uri+"> readyState="+xhr.readyState+"\n"+query+"\n");
            if (xhr.readyState == 4) {
                var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300));
                if (!success) console.log("sparql: update failed for <"+uri+"> status="+
                    xhr.status+", "+xhr.statusText+", body length="+xhr.responseText.length+"\n   for query: "+query);
                else  console.log("sparql: update Ok for <"+uri+">");
                callback(uri, success, xhr.responseText, xhr);
            }
        }

        xhr.open('PATCH', uri, true);  // async=true
        xhr.setRequestHeader('Content-type', 'application/sparql-update');
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
            statementNT: statement ? this.anonymizeNT(statement):undefined,
            where: sparql._context_where(context),

            set_object: function(obj, callback) {
                query = this.where;
                query += "DELETE DATA { " + this.statementNT + " } ;\n";
                query += "INSERT DATA { " +
                    this.anonymize(this.statement[0]) + " " +
                    this.anonymize(this.statement[1]) + " " +
                    this.anonymize(obj) + " " + " . }\n";
     
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
            query += "INSERT DATA { " + stText + " }\n";
        } else {
            query += "INSERT DATA { " +
                this.anonymize(st.subject) + " " +
                this.anonymize(st.predicate) + " " +
                this.anonymize(st.object) + " " + " . }\n";
        }
        
        this._fire(st0.why.uri, query, callback);
    }

    sparql.prototype.delete_statement = function(st, callback) {

        var st0 = st instanceof Array ? st[0] : st;
        var query = this._context_where(this._statement_context(st0));
        
        if (st instanceof Array) {
            var stText="";
            for (var i=0;i<st.length;i++) stText+=st[i]+'\n';
            query += "DELETE DATA { " + stText + " }\n";
        } else {
            query += "DELETE DATA { " +
                this.anonymize(st.subject) + " " +
                this.anonymize(st.predicate) + " " +
                this.anonymize(st.object) + " " + " . }\n";
        }
        
        this._fire(st0.why.uri, query, callback);
    }


    //  Request a now or future action to refresh changes coming downstream
    //
    // This is designed to allow the system to re-request the server version,
    // when a websocket has pinged to say there are changes.
    // If thewebsocket, by contrast, has sent a patch, then this may not be necessary.

    sparql.prototype.requestDownstreamAction = function(doc, action) {
        var control = this.patchControlFor(doc);
        if (!control.pendingUpstream) {
            action(doc);
        } else {
            if (control.downstreamAction) {
                if (control.downstreamAction === action) {
                    return this;
                } else {
                    throw "Can't wait for > 1 differnt downstream actions";
                }
            } else {
                control.downstreamAction = action;
            }
        }
    }
    
    // We want to start counting websockt notifications
    // to distinguish the ones from others from our own.
    sparql.prototype.clearUpstreamCount = function(doc) {
        var control = this.patchControlFor(doc);
        control.upstreamCount = 0;
    }





    sparql.prototype.getUpdatesVia = function(doc) {
        var linkHeaders = tabulator.fetcher.getHeader(doc, 'updates-via');
        if (!linkHeaders || !linkHeaders.length) return null;
        return linkHeaders[0].trim();
    };

    sparql.prototype.addDownstreamChangeListener = function(doc, listener) {
        var control = this.patchControlFor(doc);
        if (!control.downstreamChangeListeners) control.downstreamChangeListeners = [];
        control.downstreamChangeListeners.push(listener);
        this.setRefreshHandler(doc, this.reloadAndSync);
    }

    
    sparql.prototype.reloadAndSync = function(doc) {
        var control = tabulator.sparql.patchControlFor(doc);
        
        if (control.reloading) {
            console.log("   Already reloading - stop")
            return; // once only needed
        }
        control.reloading = true;
        var retryTimeout = 1000; // ms
        var tryReload = function() {
            console.log("try reload - timeout = " + retryTimeout);
            tabulator.sparql.reload(tabulator.kb, doc, function (ok, message, xhr) {
                control.reloading = false;
                if (ok) {
                    if (control.downstreamChangeListeners) {
                        for (var i=0; i< control.downstreamChangeListeners.length; i++) {
                            console.log("        Calling downstream listener " + i)
                            control.downstreamChangeListeners[i]();
                        }
                    }
                } else {
                    if  (xhr.status === 0) {
                        console.log("Network error refreshing the data. Retrying in "
                                            + retryTimeout/1000);
                        control.reloading = true;
                        retryTimeout = retryTimeout * 2;
                        setTimeout(tryReload, retryTimeout)
                    } else {
                        console.log("Error " + xhr.status + "refreshing the data:" +
                            message + ". Stopped" + doc);
                    }
                }
            });
        }
        tryReload();
    }
    


    // Set up websocket to listen on 
    //
    // There is coordination between upstream changes and downstream ones
    // so that a reload is not done in the middle of an upsteeam patch.
    // If you usie this API then you get called when a change happens, and you 
    // have to reload the file yourself, and then refresh the UI.
    // Alternative is addDownstreamChangeListener(), where you do not
    // have to do the reload yourslf. Do mot mix them.
    //
    sparql.prototype.setRefreshHandler = function(doc, handler) {

        var wssURI = this.getUpdatesVia(doc); // relative
        var theHandler = handler;
        var self = this;
        var updater = this;
        var retryTimeout = 1500; // *2 will be 3 Seconds, 6, 12, etc
        var retries = 0;

        if (!wssURI) {
            console.log("Server doies not support live updates thoughUpdates-Via :-(")
            return false;
        }

        wssURI = $rdf.uri.join(wssURI, doc.uri); 
        wssURI = wssURI.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
        console.log("Web socket URI " + wssURI);
        
        var openWebsocket = function() {
        
            // From https://github.com/solid/solid-spec#live-updates
            var socket;
            if (typeof WebSocket !== 'undefined') {
                socket = new WebSocket(wssURI);
            } else if (typeof Services !== 'undefined'){ // Firefox add on http://stackoverflow.com/questions/24244886/is-websocket-supported-in-firefox-for-android-addons
                socket = (Services.wm.getMostRecentWindow('navigator:browser').WebSocket)(wssURI);
            } else if (typeof window !== 'undefined'  && window.WebSocket){
                socket = window.WebSocket(wssURI);
            } else {
                console.log("Live update disabled, as WebSocket not supported by platform :-(");
                return;
            }
            socket.onopen = function() {
            
                console.log("    websocket open");
                retryTimeout = 1500; // reset timeout to fast on success
                this.send('sub ' + doc.uri);
                if (retries) {
                    console.log("Web socket has been down, better check for any news.");
                    updater.requestDownstreamAction(doc, theHandler);
                }
            };
            var control = self.patchControlFor(doc);
            control.upstreamCount = 0;
            
            // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
            //
            // 1000	CLOSE_NORMAL	Normal closure; the connection successfully completed whatever purpose for which it was created.
            // 1001	CLOSE_GOING_AWAY	The endpoint is going away, either
            //                                  because of a server failure or because the browser is navigating away from the page that opened the connection.
            // 1002	CLOSE_PROTOCOL_ERROR	The endpoint is terminating the connection due to a protocol error.
            // 1003	CLOSE_UNSUPPORTED	The connection is being terminated because the endpoint
            //                                  received data of a type it cannot accept (for example, a text-only endpoint received binary data).
            // 1004                             Reserved. A meaning might be defined in the future.
            // 1005	CLOSE_NO_STATUS	Reserved.  Indicates that no status code was provided even though one was expected.
            // 1006	CLOSE_ABNORMAL	Reserved. Used to indicate that a connection was closed abnormally (
            //
            //
            socket.onclose = function(event) { 
                console.log("*** Websocket closed with code " + event.code + 
                    ", reason '" + event.reason + "' clean = " + event.clean);
                retryTimeout *= 2;
                retries += 1;
                console.log("Retrying in " + retryTimeout + "ms"); //(ask user?)
                setTimeout(function(){
                    console.log("Trying websocket again");
                    openWebsocket();
                }, retryTimeout);
            }
            socket.onmessage = function(msg) {
                if (msg.data && msg.data.slice(0, 3) === 'pub') {
                    if (control.upstreamCount) {
                        control.upstreamCount -= 1;
                        if (control.upstreamCount >= 0) {
                            console.log("just an echo");
                            return; // Just an echo
                         }
                    }
                    control.upstreamCount = 0;
                    console.log("Assume a real downstream change");
                    self.requestDownstreamAction(doc, theHandler);
                }
            };
        }; // openWebsocket
        openWebsocket();
        
        return true;
    };


    // This high-level function updates the local store iff the web is changed successfully. 
    //
    //  - deletions, insertions may be undefined or single statements or lists or formulae.
    //
    //  - callback is called as callback(uri, success, errorbody)
    //
    sparql.prototype.update = function(deletions, insertions, callback) {
        var kb = this.store;
        var ds =  deletions == undefined ? []
                    : deletions instanceof $rdf.IndexedFormula ? deletions.statements
                    : deletions instanceof Array ? deletions : [ deletions ];
        var is =  insertions == undefined? []
                    : insertions instanceof $rdf.IndexedFormula ? insertions.statements
                    : insertions instanceof Array ? insertions : [ insertions ];
        if (! (ds instanceof Array)) throw "Type Error "+(typeof ds)+": "+ds;
        if (! (is instanceof Array)) throw "Type Error "+(typeof is)+": "+is;
        if (ds.length === 0 && is.length === 0) {
            return callback(null, true); // success -- nothing needed to be done.
        }
        var doc = ds.length ? ds[0].why : is[0].why;
        var control = this.patchControlFor(doc);
        var startTime = Date.now();
        
        var props = ['subject', 'predicate', 'object', 'why'];
        var verbs = ['insert', 'delete'];
        var clauses = { 'delete': ds, 'insert': is};
        verbs.map(function(verb){
            clauses[verb].map(function(st){
                if (!doc.sameTerm(st.why)) {
                    throw "update: destination "+doc+" inconsistent with delete quad "+st.why;
                }
                props.map(function(prop){
                    if (typeof st[prop] === 'undefined') {
                        throw "update: undefined "+prop+" of statement."
                    }
                })
                
            });
        });

        /*
        });
        
        ds.map(function(st){
            if (!doc.sameTerm(st.why)) {
                throw "Update: destination "+doc+" inconsistent with delete quad "+st.why;
            }
            props.map(function(prop){
                if (typeof ds[prop] === 'undefined') {
                    throw "Update: undefined "+prop+" of statement."
                }
            })
            
        });
        is.map(function(st){i
            f (!doc.sameTerm(st.why))
                throw "sparql update: destination = "+doc+" inconsistent with insert st.why ="+st.why;
            }
        });
        */
        
        var protocol = this.editable(doc.uri, kb);
        if (!protocol) throw "Can't make changes in uneditable "+doc;

        if (protocol.indexOf('SPARQL') >=0) {
            var bnodes = []
            if (ds.length) bnodes = this._statement_array_bnodes(ds);
            if (is.length) bnodes = bnodes.concat(this._statement_array_bnodes(is));
            var context = this._bnode_context(bnodes, doc);
            var whereClause = this._context_where(context);
            var query = ""
            if (whereClause.length) { // Is there a WHERE clause?
                if (ds.length) {
                    query += "DELETE { ";
                    for (var i=0; i<ds.length;i++) query+= this.anonymizeNT(ds[i])+"\n";
                    query += " }\n";
                }
                if (is.length) {
                    query += "INSERT { ";
                    for (var i=0; i<is.length;i++) query+= this.anonymizeNT(is[i])+"\n";
                    query += " }\n";
                }
                query += whereClause;
            } else { // no where clause
                if (ds.length) {
                    query += "DELETE DATA { ";
                    for (var i=0; i<ds.length;i++) query+= this.anonymizeNT(ds[i])+"\n";
                    query += " } \n";
                }
                if (is.length) {
                    if (ds.length) query += " ; ";
                    query += "INSERT DATA { ";
                    for (var i=0; i<is.length;i++) query+= this.anonymizeNT(is[i])+"\n";
                    query += " }\n";
                }
            }
            // Track pending upstream patches until they have fnished their callback
            control.pendingUpstream = control.pendingUpstream ? control.pendingUpstream + 1 : 1;
            if (typeof control.upstreamCount !== 'undefined') {
                control.upstreamCount += 1; // count changes we originated ourselves
            }

            this._fire(doc.uri, query,
                function(uri, success, body, xhr) {
                    xhr.elapsedTime_ms =  Date.now() - startTime;
                    console.log("    sparql: Return " + (success? "success" : "FAILURE " + xhr.status ) +
                        " elapsed " + xhr.elapsedTime_ms + "ms");
                    if (success) {
                        try {
                            kb.remove(ds);
                        } catch(e) {
                            success = false;
                            body = "Remote Ok BUT error deleting "+ds.length+" from store!!! " + e;
                        } // Add in any case -- help recover from weirdness?? 
                        for (var i=0; i<is.length;i++) {
                            kb.add(is[i].subject, is[i].predicate, is[i].object, doc); 
                        }
                    }
                    

                    callback(uri, success, body, xhr);
                    control.pendingUpstream -= 1;
                    // When upstream patches have been sent, reload state if downstream waiting 
                    if (control.pendingUpstream  === 0 && control.downstreamAction) {
                        var downstreamAction = control.downstreamAction;
                        delete  control.downstreamAction;
                        console.log("delayed downstream action:")
                        downstreamAction(doc);
                    }
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
            if (candidateTarget) targetURI = $rdf.uri.join(candidateTarget.value, targetURI);
            var xhr = $rdf.Util.XMLHTTPFactory();
            xhr.options = {};
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
                console.log("Writing back to local file\n");
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
                //console.log("Writeback: Filename: "+filename+"\n")
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

                // Various JS systems object to 0666 in struct mode as dangerous
                stream.init(file, 0x02 | 0x08 | 0x20, parseInt('0666',8), 0);

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

    // This suitable for an inital creation of a document
    //
    // data:    string, or array of statements
    //
    sparql.prototype.put = function(doc, data, content_type, callback) {

        var documentString;
        var kb = this.store;
       
        if (typeof data === typeof '') {
            documentString = data;
        } else {
            //serialize to te appropriate format
            var sz = $rdf.Serializer(kb);
            sz.suggestNamespaces(kb.namespaces);
            sz.setBase(doc.uri);                   
            switch(content_type){
                case 'application/rdf+xml': 
                    documentString = sz.statementsToXML(data);
                    break;
                case 'text/n3':
                case 'text/turtle':
                case 'application/x-turtle': // Legacy
                case 'application/n3': // Legacy
                    documentString = sz.statementsToN3(data);
                    break;
                default:
                    throw "Content-type "+content_type +" not supported for data PUT";                                                                            
            }
        }
        var xhr = $rdf.Util.XMLHTTPFactory();
        xhr.options = {};
        xhr.onreadystatechange = function (){
            if (xhr.readyState == 4){
                //formula from sparqlUpdate.js, what about redirects?
                var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300));
                if (success && typeof data !== 'string') {
                    data.map(function(st){
                        kb.addStatement(st);
                    });
                    // kb.fetcher.requested[doc.uri] = true; // as though fetched
                }
                if (success) {
                    delete kb.fetcher.nonexistant[doc.uri];
                    delete kb.fetcher.requested[doc.uri];
                    // @@ later we can fake it has been requestd if put gives us the header sand we save them.
                }
                callback(doc.uri, success, xhr.responseText, xhr);
            }
        };
        xhr.open('PUT', doc.uri, true);
        xhr.setRequestHeader('Content-type', content_type);
        xhr.send(documentString);
    };
    

    // Reload a document.
    //
    // Fast and cheap, no metaata
    // Measure times for the document 
    // Load it provisionally 
    // Don't delete the statemenst before the load, or it will leave a broken document
    // in the meantime.
    
    sparql.prototype.reload = function(kb, doc, callback) {
        var startTime = Date.now();
        // force sets no-cache and 
        kb.fetcher.nowOrWhenFetched(doc.uri, {force: true, noMeta: true, clearPreviousData: true}, function(ok, body, xhr){
            if (!ok) {
                console.log("    ERROR reloading data: " + body);
                callback(false, "Error reloading data: " + body, xhr)
            } else if (xhr.onErrorWasCalled || xhr.status !== 200) {
                console.log("    Non-HTTP error reloading data! onErrorWasCalled="
                    + xhr.onErrorWasCalled + " status: " + xhr.status);
                callback(false, "Non-HTTP error reloading data: " + body, xhr)
                
            } else {
                elapsedTime_ms = Date.now() - startTime;
                if (!doc.reloadTime_total) doc.reloadTime_total = 0;
                if (!doc.reloadTime_count) doc.reloadTime_count = 0;
                doc.reloadTime_total += elapsedTime_ms;
                doc.reloadTime_count += 1;
                console.log("    Fetch took "+elapsedTime_ms+"ms, av. of " + doc.reloadTime_count +  " = "
                    + (doc.reloadTime_total/doc.reloadTime_count) +"ms.");
                callback(true);
            };
        });
    };

    sparql.prototype.oldReload = function(kb, doc, callback) {
        var g2 = $rdf.graph(); // A separate store to hold the data as we load it
        var f2 = $rdf.fetcher(g2);
        var startTime = Date.now();
        // force sets no-cache and 
        f2.nowOrWhenFetched(doc.uri, {force: true, noMeta: true, clearPreviousData: true}, function(ok, body, xhr){
            if (!ok) {
                console.log("    ERROR reloading data: " + body);
                callback(false, "Error reloading data: " + body, xhr)
            } else if (xhr.onErrorWasCalled || xhr.status !== 200) {
                console.log("    Non-HTTP error reloading data! onErrorWasCalled="
                    + xhr.onErrorWasCalled + " status: " + xhr.status);
                callback(false, "Non-HTTP error reloading data: " + body, xhr)
                
            } else {
                var sts1 = kb.statementsMatching(undefined, undefined, undefined, doc).slice();// Take a copy!!
                var sts2 = g2.statementsMatching(undefined, undefined, undefined, doc).slice();
                console.log("    replacing " + sts1.length + " with " + sts2.length
                    + " out of total statements " + kb.statements.length)
                kb.remove(sts1);
                kb.add(sts2);
                elapsedTime_ms = Date.now() - startTime;
                if (sts2.length === 0) {
                    console.log("????????????????? 0000000");
                }
                if (!doc.reloadTime_total) doc.reloadTime_total = 0;
                if (!doc.reloadTime_count) doc.reloadTime_count = 0;
                doc.reloadTime_total += elapsedTime_ms;
                doc.reloadTime_count += 1;
                console.log("    fetch took "+elapsedTime_ms+"ms, av. of " + doc.reloadTime_count +  " = "
                    + (doc.reloadTime_total/doc.reloadTime_count) +"ms.");
                callback(true);
            };
        });
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
    
    this.prefixes = [];    // suggested prefixes
    this.namespaces = []; // complementary indexes
    
    this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'); // XML code assumes this!
    this.suggestPrefix('xml', 'reserved:reservedForFutureUse'); // XML reserves xml: in the spec.
    
    this.namespacesUsed = []; // Count actually used and so needed in @prefixes
    this.keywords = ['a']; // The only one we generate at the moment
    this.prefixchars = "abcdefghijklmnopqustuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.incoming = null;  // Array not calculated yet
    this.formulas = [];  // remebering original formulae from hashes
    this.store = store;

    /* pass */
}

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
    if (prefix.slice(0,7) === 'default') return; // Try to weed these out
    if (prefix.slice(0,2) === 'ns') return; //  From others inferior algos
    if (!prefix || !uri) return; // empty strings not suitable
    if (prefix in this.namespaces || uri in this.prefixes) return; // already used 
    this.prefixes[uri] = prefix;
    this.namespaces[prefix] = uri;
}

// Takes a namespace -> prefix map
__Serializer.prototype.suggestNamespaces = function(namespaces) {
    for (var px in namespaces) {
        this.suggestPrefix(px, namespaces[px]);
    }
}

__Serializer.prototype.checkIntegrity = function() {
    var p, ns;
    for (p in this.namespaces) {
        if (this.prefixes[this.namespaces[p]] !== p) {
            throw "Serializer integity error 1: " + p + ", " + 
                this.namespaces[p] + ", "+ this.prefixes[this.namespaces[p]] +"!";
        }
    }
    for (ns in this.prefixes) {
        if (this.namespaces[this.prefixes[ns]] !== ns) {
            throw "Serializer integity error 2: " + ns + ", " + 
                this.prefixs[ns] + ", "+ this.namespaces[this.prefixes[ns]] +"!";
        
        }
    }
}

// Make up an unused prefix for a random namespace
__Serializer.prototype.makeUpPrefix = function(uri) {
    var p = uri;
    var pok;
    function canUse(pp) {
        if (! __Serializer.prototype.validPrefix.test(pp)) return false; // bad format
        if (pp === 'ns') return false; // boring
        if (pp in this.namespaces) return false; // already used
        this.prefixes[uri] = pp;
        this.namespaces[pp] = uri; 
        pok = pp;
        return true
    }
    canUse = canUse.bind(this);
/*    for (var ns in this.prefixes) {
        namespaces[this.prefixes[ns]] = ns; // reverse index foo
    }
    */
    if ('#/'.indexOf(p[p.length-1]) >= 0) p = p.slice(0, -1);
    var slash = p.lastIndexOf('/');
    if (slash >= 0) p = p.slice(slash+1);
    var i = 0;
    while (i < p.length)
        if (this.prefixchars.indexOf(p[i])) i++; else break;
    p = p.slice(0,i);
    if (p.length < 6 && canUse(p)) return pok; // exact i sbest
    if (canUse(p.slice(0,3))) return pok;
    if (canUse(p.slice(0,2))) return pok;
    if (canUse(p.slice(0,4))) return pok;
    if (canUse(p.slice(0,1))) return pok;
    if (canUse(p.slice(0,5))) return pok;
    if (! __Serializer.prototype.validPrefix.test(p)) {
        p = 'n';  // Otherwise the loop below may never termimnate
    }
    for (var i=0;; i++) if (canUse(p.slice(0,3)+i)) return pok;
}



// Todo:
//  - Sort the statements by subject, pred, object
//  - do stuff about the docu first and then (or first) about its primary topic.

__Serializer.prototype.rootSubjects = function(sts) {
    var incoming = {};
    var subjects = {};
    var allBnodes = {};

/* This scan is to find out which nodes will have to be the roots of trees
** in the serialized form. This will be any symbols, and any bnodes
** which hve more or less than one incoming arc, and any bnodes which have
** one incoming arc but it is an uninterrupted loop of such nodes back to itself.
** This should be kept linear time with repect to the number of statements.
** Note it does not use any indexing of the store.
*/


    // $rdf.log.debug('serialize.js Find bnodes with only one incoming arc\n')
    for (var i = 0; i<sts.length; i++) {
        var st = sts[i];
        [ st.subject, st.predicate, st.object].map(function(y){
            if (y.termType =='bnode'){allBnodes[y.toNT()] = true}});
        var x = sts[i].object;
        if (!incoming.hasOwnProperty(x)) incoming[x] = [];
        incoming[x].push(st.subject) // List of things which will cause this to be printed
        var ss =  subjects[this.toStr(st.subject)]; // Statements with this as subject
        if (!ss) ss = [];
        ss.push(st);
        subjects[this.toStr(st.subject)] = ss; // Make hash. @@ too slow for formula?
        // $rdf.log.debug(' sz potential subject: '+sts[i].subject)
    }

    var roots = [];
    for (var xNT in subjects) {
        if (!subjects.hasOwnProperty(xNT)) continue;
        var x = this.fromStr(xNT);
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
    // $rdf.log.debug('serialize.js Looking for connected bnode loops\n')
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
        // $rdf.log.debug('serialize: seen '+expr);
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
    // $rdf.log.debug('serialize.js Dummy serialize to check for missing nodes')
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

    // $rdf.log.debug('serialize.js Looking for connected bnode loops\n')
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
        // $rdf.log.debug('isolated bnode:'+found+', subjects[found]:'+subjects[found]+'\n');
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

    var predMap = {
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

    var treeToLine = function(tree) {
        var str = '';
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            var s2 = (typeof branch == 'string') ? branch : treeToLine(branch);
             // Note the space before the dot in case statement ends 123. which is in fact allowed but be conservative.
            if (i!=0 && s2 != ',' && s2 != ';') str += ' '; // was also:  && s2 != '.'
            str += s2;
        }
        return str;
    }

    // Convert a nested tree of lists and strings to a string
    var treeToString = function(tree, level) {
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
        var stats = this.rootSubjects(statements);
        var roots = stats.roots;
        var results = []
        for (var i=0; i<roots.length; i++) {
            var root = roots[i];
            results.push(subjectTree(root, stats))
        }
        return results;
    }
    statementListToTree = statementListToTree.bind(this);

    // The tree for a subject
    function subjectTree(subject, stats) {
        if (subject.termType == 'bnode' && !stats.incoming[subject])
            return objectTree(subject, stats, true).concat(['.']); // Anonymous bnode subject
        return [ termToN3(subject, stats) ].concat([propertyTree(subject, stats)]).concat(['.']);
    }


    // The property tree for a single subject or anonymous node
    function propertyTree(subject, stats) {
        // print('Proprty tree for '+subject);
        var results = []
        var lastPred = null;
        var sts = stats.subjects[this.toStr(subject)]; // relevant statements
        if (typeof sts == 'undefined') {
            throw('Cant find statements for '+subject);
        }

        var SPO = function(x, y) {
            return $rdf.Util.heavyCompareSPO(x, y, this.store)
        }
        sts.sort(); // 2014-09-30
//        sts.sort(SPO); // 2014-09-30
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
    propertyTree = propertyTree.bind(this);

    function objectTree(obj, stats, force) {
        if (obj.termType == 'bnode' &&
                stats.subjects[this.toStr(obj)] && // and there are statements
                (force || stats.rootsHash[obj.toNT()] == undefined)) // and not a root
            return  ['['].concat(propertyTree(obj, stats)).concat([']']);
        return termToN3(obj, stats);
    }
    objectTree = objectTree.bind(this);

    function termToN3(expr, stats) {
        switch(expr.termType) {

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
                return this.atomicTermToN3(expr);
        }
    }
    __Serializer.prototype.termToN3 = termToN3;
    termToN3 = termToN3.bind(this);

    function prefixDirectives() {
        var str = '';
        if (this.defaultNamespace)
          str += '@prefix : <'+this.defaultNamespace+'>.\n';
        for (var ns in this.prefixes) {
            if (!this.prefixes.hasOwnProperty(ns)) continue;
            if (!this.namespacesUsed[ns]) continue;
            str += '@prefix ' + this.prefixes[ns] + ': <' +
                 $rdf.uri.refTo(this.base, ns) + '>.\n';
        }
        return str + '\n';
    }
    prefixDirectives = prefixDirectives.bind(this);

    // Body of statementsToN3:

    var tree = statementListToTree(sts);
    return prefixDirectives() + treeToString(tree, -1);

}


////////////////////////////////////////////// Atomic Terms

//  Deal with term level things and nesting with no bnode structure


__Serializer.prototype.atomicTermToN3 = function atomicTermToN3(expr, stats) {
    switch(expr.termType) {
        case 'bnode':
        case 'variable':  return expr.toNT();
        case 'literal':
            if (expr.datatype) {
                switch (expr.datatype.uri) {
                case 'http://www.w3.org/2001/XMLSchema#integer':
                    return expr.value.toString();

                //case 'http://www.w3.org/2001/XMLSchema#double': // Must force use of 'e'

                case 'http://www.w3.org/2001/XMLSchema#boolean':
                    return expr.value? 'true' : 'false';
                }
            }
            var str = this.stringToN3(expr.value);
            if (expr.lang){
                str+= '@' + expr.lang;
            } else if (expr.datatype) {
                str+= '^^' + this.termToN3(expr.datatype, stats);
            }
            return str;
        case 'symbol':
            return this.symbolToN3(expr);
       default:
            throw "Internal: atomicTermToN3 cannot handle "+expr+" of termType+"+expr.termType
            return ''+expr;
    }
};

    //  stringToN3:  String escaping for N3

__Serializer.prototype.validPrefix = new RegExp(/^[a-zA-Z][a-zA-Z0-9]*$/);

__Serializer.prototype.forbidden1 = new RegExp(/[\\"\b\f\r\v\t\n\u0080-\uffff]/gm);
__Serializer.prototype.forbidden3 = new RegExp(/[\\"\b\f\r\v\u0080-\uffff]/gm);
__Serializer.prototype.stringToN3 = function stringToN3(str, flags) {
    if (!flags) flags = "e";
    var res = '', i=0, j=0;
    var delim;
    var forbidden;
    if (str.length > 20 // Long enough to make sense
            && str.slice(-1) != '"'  // corner case'
            && flags.indexOf('n') <0  // Force single line
            && (str.indexOf('\n') >0 || str.indexOf('"') > 0)) {
        delim = '"""';
        forbidden =  __Serializer.prototype.forbidden3;
    } else {
        delim = '"';
        forbidden = __Serializer.prototype.forbidden1;
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



//  A single symbol, either in  <> or namespace notation


__Serializer.prototype.symbolToN3 = function symbolToN3(x) {  // c.f. symbolString() in notation3.py
    var uri = x.uri;
    var j = uri.indexOf('#');
    if (j<0 && this.flags.indexOf('/') < 0) {
        j = uri.lastIndexOf('/');
    }
    if (j >= 0 && this.flags.indexOf('p') < 0 &&
        // Can split at namespace but only if http[s]: URI or file: or ws[s] (why not others?)
        (uri.indexOf('http') === 0 || uri.indexOf('ws') === 0 || uri.indexOf('file') === 0))  { 
        var canSplit = true;
        for (var k=j+1; k<uri.length; k++) {
            if (__Serializer.prototype._notNameChars.indexOf(uri[k]) >=0) {
                canSplit = false; break;
            }
        }

        if (uri.slice(0, j+1) == this.base + '#') { // base-relative
            return '<#' + uri.slice(j+1) + '>';
        }
        if (canSplit) {
            var localid = uri.slice(j+1);
            var namesp = uri.slice(0,j+1);
            if (this.defaultNamespace && this.defaultNamespace == namesp
                && this.flags.indexOf('d') < 0) {// d -> suppress default
                if (this.flags.indexOf('k') >= 0 &&
                    this.keyords.indexOf(localid) <0)
                    return localid;
                return ':' + localid;
            }
            this.checkIntegrity(); //  @@@ Remove when not testing
            var prefix = this.prefixes[namesp];
            if (!prefix) prefix = this.makeUpPrefix(namesp);
            if (prefix) {
                this.namespacesUsed[namesp] = true;
                return prefix + ':' + localid;
            }
            // Fall though if can't do qname
        }
    }
    if (this.flags.indexOf('r') < 0 && this.base)
        uri = $rdf.uri.refTo(this.base, uri);
    else if (this.flags.indexOf('u') >= 0)
        uri = backslashUify(uri);
    else uri = hexify(uri);
    return '<'+uri+'>';
}


// String escaping utilities


function hexify(str) { // also used in parser
  return encodeURI(str);
}


function backslashUify(str) {
    var res = '', k;
    for (var i=0; i<str.length; i++) {
        k = str.charCodeAt(i);
        if (k>65535)
            res += '\\U' + ('00000000'+k.toString(16)).slice(-8); // convert to upper?
        else if (k>126)
            res += '\\u' + ('0000'+k.toString(16)).slice(-4);
        else
            res += str[i];
    }
    return res;
}


///////////////////////////// Quad store serialization


// @para. write  - a function taking a single string to be output
//
__Serializer.prototype.writeStore = function(write) {

    var kb = this.store;
    var fetcher = kb.fetcher;
    var session = fetcher && fetcher.appNode;

    // The core data 
    
    var sources = this.store.index[3];
    for (s in sources) {  // -> assume we can use -> as short for log:semantics
        var source = kb.fromNT(s);
        if (session && source.sameTerm(session)) continue;
        write('\n'+ this.atomicTermToN3(source)+' ' +
                this.atomicTermToN3(kb.sym('http://www.w3.org/2000/10/swap/log#semantics'))
                 + ' { '+ this.statementsToN3(kb.statementsMatching(
                            undefined, undefined, undefined, source)) + ' }.\n');
    }


    // The metadata from HTTP interactions:

    kb.statementsMatching(undefined,
            kb.sym('http://www.w3.org/2007/ont/link#requestedURI')).map(
                function(st){
                    write('\n<' + st.object.value + '> log:metadata {\n'); 
                    var sts = kb.statementsMatching(undefined, undefined, undefined,  st.subject);
                    write(this.statementsToN3(this.statementsToN3(sts)));
                    write('}.\n'); 
                });
                
    // Inferences we have made ourselves not attributable to anyone else
    
    if (session) metaSources.push(session);
    var metadata = [];
    metaSources.map(function(source){
        metadata = metadata.concat(kb.statementsMatching(undefined, undefined, undefined, source));
    });
    write(this.statementsToN3(metadata));

}





//////////////////////////////////////////////// XML serialization

__Serializer.prototype.statementsToXML = function(sts) {
    var indent = 4;
    var width = 80;

    var namespaceCounts = []; // which have been used
    namespaceCounts['http://www.w3.org/1999/02/22-rdf-syntax-ns#'] = true;

    var liPrefix = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#_';	//prefix for ordered list items

    ////////////////////////// Arrange the bits of XML text

    var spaces=function(n) {
        var s='';
        for(var i=0; i<n; i++) s+=' ';
        return s
    }

    var XMLtreeToLine = function(tree) {
        var str = '';
        for (var i=0; i<tree.length; i++) {
            var branch = tree[i];
            var s2 = (typeof branch == 'string') ? branch : XMLtreeToLine(branch);
            str += s2;
        }
        return str;
    }

    // Convert a nested tree of lists and strings to a string
    var XMLtreeToString = function(tree, level) {
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
        this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
        var stats = this.rootSubjects(statements);
        var roots = stats.roots;
        var results = []
        for (var i=0; i<roots.length; i++) {
            root = roots[i];
            results.push(subjectXMLTree(root, stats))
        }
        return results;
    }
    statementListToXMLTree = statementListToXMLTree.bind(this);

    function escapeForXML(str) {
        if (typeof str == 'undefined') return '@@@undefined@@@@';
        return str.replace(/[&<"]/g, function(m) {
          switch(m[0]) {
            case '&':
              return '&amp;';
            case '<':
              return '&lt;';
            case '"':
              return '&quot;'; //'
          }
        });
    }

    function relURI(term) {
        return escapeForXML((this.base) ? $rdf.Util.uri.refTo(this.base, term.uri) : term.uri);
    }
    relURI = relURI.bind(this);

    // The tree for a subject
    function subjectXMLTree(subject, stats) {
      var results = [];
      var type, t, st, pred;
      var sts = stats.subjects[this.toStr(subject)]; // relevant statements
      if (typeof sts == 'undefined') {
        throw('Serializing XML - Cant find statements for '+subject);
      }


      // Sort only on the predicate, leave the order at object
      // level undisturbed.  This leaves multilingual content in
      // the order of entry (for partner literals), which helps
      // readability.
      //
      // For the predicate sort, we attempt to split the uri
      // as a hint to the sequence
      sts.sort(function(a,b) {
        var ap = a.predicate.uri;
        var bp = b.predicate.uri;
        if(ap.substring(0,liPrefix.length) == liPrefix || bp.substring(0,liPrefix.length) == liPrefix) {	//we're only interested in sorting list items
          return ap.localeCompare(bp);
        }

        var as = ap.substring(liPrefix.length);
        var bs = bp.substring(liPrefix.length);
        var an = parseInt(as);
        var bn = parseInt(bs);
        if(isNaN(an) || isNaN(bn) ||
            an != as || bn != bs) {	//we only care about integers
          return ap.localeCompare(bp);
        }

        return an - bn;
      });


      for (var i=0; i<sts.length; i++) {
        st = sts[i];
        // look for a type
        if(st.predicate.uri == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && !type && st.object.termType == "symbol") {
          type = st.object;
          continue;	//don't include it as a child element
        }

        // see whether predicate can be replaced with "li"
        pred = st.predicate;
        if(pred.uri.substr(0, liPrefix.length) == liPrefix) {
          var number = pred.uri.substr(liPrefix.length);
          // make sure these are actually numeric list items
          var intNumber = parseInt(number);
          if(number == intNumber.toString()) {
            // was numeric; don't need to worry about ordering since we've already
            // sorted the statements
            pred = new $rdf.Symbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#li');
          }
        }

        t = qname(pred);
        switch (st.object.termType) {
          case 'bnode':
            if(stats.incoming[st.object].length == 1) {	//there should always be something in the incoming array for a bnode
              results = results.concat(['<'+ t +'>',
                subjectXMLTree(st.object, stats),
                '</'+ t +'>']);
            } else {
              results = results.concat(['<'+ t +' rdf:nodeID="'
                +st.object.toNT().slice(2)+'"/>']);
            }
          break;
          case 'symbol':
            results = results.concat(['<'+ t +' rdf:resource="'
              + relURI(st.object)+'"/>']);
          break;
          case 'literal':
            results = results.concat(['<'+ t
              + (st.object.datatype ? ' rdf:datatype="'+escapeForXML(st.object.datatype.uri)+'"' : '')
              + (st.object.lang ? ' xml:lang="'+st.object.lang+'"' : '')
              + '>' + escapeForXML(st.object.value)
              + '</'+ t +'>']);
          break;
          case 'collection':
            results = results.concat(['<'+ t +' rdf:parseType="Collection">',
              collectionXMLTree(st.object, stats),
              '</'+ t +'>']);
          break;
          default:
            throw "Can't serialize object of type "+st.object.termType +" into XML";
        } // switch
      }

      var tag = type ? qname(type) : 'rdf:Description';

      var attrs = '';
      if (subject.termType == 'bnode') {
          if(!stats.incoming[subject] || stats.incoming[subject].length != 1) { // not an anonymous bnode
              attrs = ' rdf:nodeID="'+subject.toNT().slice(2)+'"';
          }
      } else {
          attrs = ' rdf:about="'+ relURI(subject)+'"';
      }

      return [ '<' + tag + attrs + '>' ].concat([results]).concat(["</"+ tag +">"]);
    }

    subjectXMLTree = subjectXMLTree.bind(this);

    function collectionXMLTree(subject, stats) {
        var res = []
        for (var i=0; i< subject.elements.length; i++) {
            res.push(subjectXMLTree(subject.elements[i], stats));
         }
         return res;
    }

    // The property tree for a single subject or anonymos node
    function propertyXMLTree(subject, stats) {
        var results = []
        var sts = stats.subjects[this.toStr(subject)]; // relevant statements
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
    propertyXMLTree = propertyXMLTree.bind(this);

    function qname(term) {
        var uri = term.uri;

        var j = uri.indexOf('#');
        if (j<0 && this.flags.indexOf('/') < 0) {
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
        if (this.defaultNamespace && this.defaultNamespace == namesp
            && this.flags.indexOf('d') < 0) {// d -> suppress default
            return localid;
        }
        var prefix = this.prefixes[namesp];
        if (!prefix) prefix = this.makeUpPrefix(namesp);
        namespaceCounts[namesp] = true;
        return prefix + ':' + localid;
//        throw ('No prefix for namespace "'+namesp +'" for XML qname for '+uri+', namespaces: '+sz.prefixes+' sz='+sz);
    }
    qname = qname.bind(this);

    // Body of toXML:

    var tree = statementListToXMLTree(sts);
    var str = '<rdf:RDF';
    if (this.defaultNamespace)
      str += ' xmlns="'+escapeForXML(this.defaultNamespace)+'"';
    for (var ns in namespaceCounts) {
        if (!namespaceCounts.hasOwnProperty(ns)) continue;
        str += '\n xmlns:' + this.prefixes[ns] + '="'+escapeForXML(ns)+'"';
    }
    str += '>';

    var tree2 = [str, tree, '</rdf:RDF>'];  //@@ namespace declrations
    return XMLtreeToString(tree2, -1);


} // End @@ body

var Serializer = function( store ) {return new __Serializer( store )};
return Serializer;

}();
/*
 * Updates-Via
 */
var $rdf, k, v,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  hasProp = {}.hasOwnProperty;

if (typeof $rdf === "undefined" || $rdf === null) {
  $rdf = {};
}

$rdf.UpdatesSocket = (function() {
  function UpdatesSocket(parent, via1) {
    var error, error1;
    this.parent = parent;
    this.via = via1;
    this.subscribe = bind(this.subscribe, this);
    this.onError = bind(this.onError, this);
    this.onMessage = bind(this.onMessage, this);
    this.onClose = bind(this.onClose, this);
    this.onOpen = bind(this.onOpen, this);
    this._subscribe = bind(this._subscribe, this);
    this._send = bind(this._send, this);
    this.connected = false;
    this.pending = {};
    this.subscribed = {};
    this.socket = {};
    try {
      this.socket = new WebSocket(via);
      this.socket.onopen = this.onOpen;
      this.socket.onclose = this.onClose;
      this.socket.onmessage = this.onMessage;
      this.socket.onerror = this.onError;
    } catch (error1) {
      error = error1;
      this.onError(error);
    }
  }

  UpdatesSocket.prototype._decode = function(q) {
    var elt, i, k, r, ref, ref1, v;
    r = {};
    ref = (function() {
      var j, len, ref, results;
      ref = q.split('&');
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        elt = ref[j];
        results.push(elt.split('='));
      }
      return results;
    })();
    for (i in ref) {
      elt = ref[i];
      ref1 = [decodeURIComponent(elt[0]), decodeURIComponent(elt[1])], k = ref1[0], v = ref1[1];
      if (r[k] == null) {
        r[k] = [];
      }
      r[k].push(v);
    }
    return r;
  };

  UpdatesSocket.prototype._send = function(method, uri, data) {
    var base, message;
    message = [method, uri, data].join(' ');
    return typeof (base = this.socket).send === "function" ? base.send(message) : void 0;
  };

  UpdatesSocket.prototype._subscribe = function(uri) {
    this._send('sub', uri, '');
    return this.subscribed[uri] = true;
  };

  UpdatesSocket.prototype.onOpen = function(e) {
    var results, uri;
    this.connected = true;
    results = [];
    for (uri in this.pending) {
      delete this.pending[uri];
      results.push(this._subscribe(uri));
    }
    return results;
  };

  UpdatesSocket.prototype.onClose = function(e) {
    var uri;
    this.connected = false;
    for (uri in this.subscribed) {
      this.pending[uri] = true;
    }
    return this.subscribed = {};
  };

  UpdatesSocket.prototype.onMessage = function(e) {
    var base, message;
    message = e.data.split(' ');
    if (message[0] === 'ping') {
      return typeof (base = this.socket).send === "function" ? base.send('pong ' + message.slice(1).join(' ')) : void 0;
    } else if (message[0] === 'pub') {
      return this.parent.onUpdate(message[1], this._decode(message[2]));
    }
  };

  UpdatesSocket.prototype.onError = function(e) {
    throw 'onError' + e;
  };

  UpdatesSocket.prototype.subscribe = function(uri) {
    if (this.connected) {
      return this._subscribe(uri);
    } else {
      return this.pending[uri] = true;
    }
  };

  return UpdatesSocket;

})();

$rdf.UpdatesVia = (function() {
  function UpdatesVia(fetcher) {
    this.fetcher = fetcher;
    this.onUpdate = bind(this.onUpdate, this);
    this.onHeaders = bind(this.onHeaders, this);
    this.register = bind(this.register, this);
    this.graph = {};
    this.via = {};
    this.fetcher.addCallback('headers', this.onHeaders);
  }

  UpdatesVia.prototype.register = function(via, uri) {
    if (this.via[via] == null) {
      this.via[via] = new $rdf.UpdatesSocket(this, via);
    }
    return this.via[via].subscribe(uri);
  };

  UpdatesVia.prototype.onHeaders = function(d) {
    var etag, uri, via;
    if (d.headers == null) {
      return true;
    }
    if (typeof WebSocket === "undefined" || WebSocket === null) {
      return true;
    }
    etag = d.headers['etag'];
    via = d.headers['updates-via'];
    uri = d.uri;
    if (etag && via) {
      this.graph[uri] = {
        etag: etag,
        via: via
      };
      this.register(via, uri);
    }
    return true;
  };

  UpdatesVia.prototype.onUpdate = function(uri, d) {
    return this.fetcher.refresh($rdf.sym(uri));
  };

  return UpdatesVia;

})();

if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
  for (k in $rdf) {
    if (!hasProp.call($rdf, k)) continue;
    v = $rdf[k];
    module.exports[k] = v;
  }
}
/************************************************************
 *
 * Project: rdflib.js, originally part of Tabulator project
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
 * Dependencies:
 *
 * needs: util.js uri.js term.js rdfparser.js rdfa.js n3parser.js
 *      identity.js sparql.js jsonparser.js
 *
 * If jQuery is defined, it uses jQuery.ajax, else is independent of jQuery
 *
 ************************************************************/

/**
 * Things to test: callbacks on request, refresh, retract
 *   loading from HTTP, HTTPS, FTP, FILE, others?
 * To do:
 * Firing up a mail client for mid:  (message:) URLs
 */

var asyncLib = require('async');
var jsonld = require('jsonld');
var N3 = require('n3');

$rdf.Fetcher = function(store, timeout, async) {
    this.store = store
    this.thisURI = "http://dig.csail.mit.edu/2005/ajar/ajaw/rdf/sources.js" + "#SourceFetcher" // -- Kenny
    this.timeout = timeout ? timeout : 30000
    this.async = async != null ? async : true
    this.appNode = this.store.bnode(); // Denoting this session
    this.store.fetcher = this; //Bi-linked
    this.requested = {} ;
    // this.requested[uri] states:
    //   undefined     no record of web access or records reset
    //   true          has been requested, XHR in progress
    //   'done'        received, Ok
    //   403           HTTP status unauthorized
    //   404           Ressource does not exist. Can be created etc.
    //   'redirected'  In attempt to counter CORS problems retried.
    //   other strings mean various other erros, such as parse errros.
    //

    this.fetchCallbacks = {}; // fetchCallbacks[uri].push(callback)

    this.nonexistant = {}; // keep track of explict 404s -> we can overwrite etc
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


    $rdf.Fetcher.crossSiteProxy = function(uri) {
        if ($rdf.Fetcher.crossSiteProxyTemplate)
          return $rdf.Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
        else return undefined;
    };
    $rdf.Fetcher.RDFXMLHandler = function(args) {
        if (args) {
            this.dom = args[0]
        }
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                //sf.addStatus(xhr.req, 'parsing soon as RDF/XML...');
                var kb = sf.store;
                if (!this.dom) this.dom = $rdf.Util.parseXML(xhr.responseText);
                var root = this.dom.documentElement;
                if (root.nodeName == 'parsererror') { //@@ Mozilla only See issue/issue110
                    sf.failFetch(xhr, "Badly formed XML in " + xhr.resource.uri); //have to fail the request
                    throw new Error("Badly formed XML in " + xhr.resource.uri); //@@ Add details
                }
                // Find the last URI we actual URI in a series of redirects
                // (xhr.resource.uri is the original one)
                var lastRequested = kb.any(xhr.req, ns.link('requestedURI'));
                if (!lastRequested) {
                    lastRequested = xhr.resource;
                } else {
                    lastRequested = kb.sym(lastRequested.value);
                }
                var parser = new $rdf.RDFParser(kb);
                // sf.addStatus(xhr.req, 'parsing as RDF/XML...');
                parser.parse(this.dom, lastRequested.uri, lastRequested);
                if (!xhr.options.noMeta) {
                    kb.add(lastRequested, ns.rdf('type'), ns.link('RDFDocument'), sf.appNode);
                }
                cb();
            }
        }
    };
    $rdf.Fetcher.RDFXMLHandler.toString = function() {
        return "RDFXMLHandler"
    };
    $rdf.Fetcher.RDFXMLHandler.register = function(sf) {
        sf.mediatypes['application/rdf+xml'] = {}
    };
    $rdf.Fetcher.RDFXMLHandler.pattern = new RegExp("application/rdf\\+xml");

    // This would much better use on-board XSLT engine. @@
    $rdf.Fetcher.doGRDDL = function(kb, doc, xslturi, xmluri) {
        sf.requestURI('http://www.w3.org/2005/08/' + 'online_xslt/xslt?' + 'xslfile=' + escape(xslturi) + '&xmlfile=' + escape(xmluri), doc)
    };

    $rdf.Fetcher.XHTMLHandler = function(args) {
        if (args) {
            this.dom = args[0]
        }
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                var relation, reverse;
                if (!this.dom) {
                    this.dom = $rdf.Util.parseXML(xhr.responseText)
                }
                var kb = sf.store;

                // dc:title
                var title = this.dom.getElementsByTagName('title')
                if (title.length > 0) {
                    kb.add(xhr.resource, ns.dc('title'), kb.literal(title[0].textContent), xhr.resource)
                    // $rdf.log.info("Inferring title of " + xhr.resource)
                }

                // link rel
                var links = this.dom.getElementsByTagName('link');
                for (var x = links.length - 1; x >= 0; x--) { // @@ rev
                    relation = links[x].getAttribute('rel');
                    reverse = false;
                    if (!relation) {
                        relation = links[x].getAttribute('rev');
                        reverse = true;
                    }
                    if (relation) {
                        sf.linkData(xhr, relation,
                        links[x].getAttribute('href'), xhr.resource, reverse);
                    }
                }

                // Data Islands

                var scripts = this.dom.getElementsByTagName('script');
                for (var i=0; i<scripts.length; i++) {
                    var contentType = scripts[i].getAttribute('type');
                    if ($rdf.parsable[contentType]) {
                        $rdf.parse(scripts[i].textContent, kb, xhr.resource.uri, contentType)
                    }
                }

                //GRDDL
                var head = this.dom.getElementsByTagName('head')[0]
                if (head) {
                    var profile = head.getAttribute('profile');
                    if (profile && $rdf.uri.protocol(profile) == 'http') {
                        // $rdf.log.info("GRDDL: Using generic " + "2003/11/rdf-in-xhtml-processor.");
                         $rdf.Fetcher.doGRDDL(kb, xhr.resource, "http://www.w3.org/2003/11/rdf-in-xhtml-processor", xhr.resource.uri)
/*			sf.requestURI('http://www.w3.org/2005/08/'
					  + 'online_xslt/xslt?'
					  + 'xslfile=http://www.w3.org'
					  + '/2003/11/'
					  + 'rdf-in-xhtml-processor'
					  + '&xmlfile='
					  + escape(xhr.resource.uri),
				      xhr.resource)
                        */
                    } else {
                        // $rdf.log.info("GRDDL: No GRDDL profile in " + xhr.resource)
                    }
                }
                if (!xhr.options.noMeta) {
                    kb.add(xhr.resource, ns.rdf('type'), ns.link('WebPage'), sf.appNode);
                }
                // Do RDFa here

                if ($rdf.parseDOM_RDFa) {
                    $rdf.parseDOM_RDFa(this.dom, kb, xhr.resource.uri);
                }
                cb(); // Fire done callbacks
            }
        }
    };
    $rdf.Fetcher.XHTMLHandler.toString = function() {
        return "XHTMLHandler"
    };
    $rdf.Fetcher.XHTMLHandler.register = function(sf) {
        sf.mediatypes['application/xhtml+xml'] = {
            'q': 0.3
        }
    };
    $rdf.Fetcher.XHTMLHandler.pattern = new RegExp("application/xhtml");


    /******************************************************/

    $rdf.Fetcher.XMLHandler = function() {
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                var kb = sf.store
                var dom = $rdf.Util.parseXML(xhr.responseText)

                // XML Semantics defined by root element namespace
                // figure out the root element
                for (var c = 0; c < dom.childNodes.length; c++) {
                    // is this node an element?
                    if (dom.childNodes[c].nodeType == 1) {
                        // We've found the first element, it's the root
                        var ns = dom.childNodes[c].namespaceURI;

                        // Is it RDF/XML?
                        if (ns != undefined && ns == ns['rdf']) {
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
                            // $rdf.log.info(xhr.resource.uri + " namespace " + ns + " has GRDDL ns transform" + xform.uri);
                             $rdf.Fetcher.doGRDDL(kb, xhr.resource, xform.uri, xhr.resource.uri);
                        }
                        break
                    }
                }

                // Or it could be XHTML?
                // Maybe it has an XHTML DOCTYPE?
                if (dom.doctype) {
                    // $rdf.log.info("We found a DOCTYPE in " + xhr.resource)
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
                sf.failFetch(xhr, "Unsupported dialect of XML: not RDF or XHTML namespace, etc.\n"+xhr.responseText.slice(0,80));
            }
        }
    };

    $rdf.Fetcher.XMLHandler.toString = function() {
        return "XMLHandler"
    };
    $rdf.Fetcher.XMLHandler.register = function(sf) {
        sf.mediatypes['text/xml'] = {
            'q': 0.2
        }
        sf.mediatypes['application/xml'] = {
            'q': 0.2
        }
    };
    $rdf.Fetcher.XMLHandler.pattern = new RegExp("(text|application)/(.*)xml");

    $rdf.Fetcher.HTMLHandler = function() {
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                var rt = xhr.responseText
                // We only handle XHTML so we have to figure out if this is XML
                // $rdf.log.info("Sniffing HTML " + xhr.resource + " for XHTML.");

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
                    kb.add(xhr.resource, ns.dc('title'), kb.literal(titleMatch[1]), xhr.resource); //think about xml:lang later
                    kb.add(xhr.resource, ns.rdf('type'), ns.link('WebPage'), sf.appNode);
                    cb(); //doneFetch, not failed
                    return;
                }

                sf.failFetch(xhr, "Sorry, can't yet parse non-XML HTML")
            }
        }
    };

    $rdf.Fetcher.HTMLHandler.toString = function() {
        return "HTMLHandler"
    };
    $rdf.Fetcher.HTMLHandler.register = function(sf) {
        sf.mediatypes['text/html'] = {
            'q': 0.3
        }
    };
    $rdf.Fetcher.HTMLHandler.pattern = new RegExp("text/html");

    /***********************************************/

    $rdf.Fetcher.TextHandler = function() {
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                // We only speak dialects of XML right now. Is this XML?
                var rt = xhr.responseText

                // Look for an XML declaration
                if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
                    sf.addStatus(xhr.req, "Warning: "+xhr.resource + " has an XML declaration. We'll assume "
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
                sf.doneFetch(xhr, [xhr.resource.uri]);
//                sf.failFetch(xhr, "unparseable - text/plain not visibly XML")
//                dump(xhr.resource + " unparseable - text/plain not visibly XML, starts:\n" + rt.slice(0, 500)+"\n")

            }
        }
    };

    $rdf.Fetcher.TextHandler.toString = function() {
        return "TextHandler";
    };
    $rdf.Fetcher.TextHandler.register = function(sf) {
        sf.mediatypes['text/plain'] = {
            'q': 0.1
        }
    }
    $rdf.Fetcher.TextHandler.pattern = new RegExp("text/plain");

    /***********************************************/

    $rdf.Fetcher.N3Handler = function() {
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                // Parse the text of this non-XML file
                $rdf.log.debug("web.js: Parsing as N3 " + xhr.resource.uri); // @@@@ comment me out
                //sf.addStatus(xhr.req, "N3 not parsed yet...")
                var rt = xhr.responseText
                var p = $rdf.N3Parser(kb, kb, xhr.resource.uri, xhr.resource.uri, null, null, "", null)
                //                p.loadBuf(xhr.responseText)
                try {
                    p.loadBuf(xhr.responseText)

                } catch (e) {
                    var msg = ("Error trying to parse " + xhr.resource + " as Notation3:\n" + e +':\n'+e.stack)
                    // dump(msg+"\n")
                    sf.failFetch(xhr, msg)
                    return;
                }

                sf.addStatus(xhr.req, "N3 parsed: " + p.statementCount + " triples in " + p.lines + " lines.")
                sf.store.add(xhr.resource, ns.rdf('type'), ns.link('RDFDocument'), sf.appNode);
                args = [xhr.resource.uri]; // Other args needed ever?
                sf.doneFetch(xhr, args)
            }
        }
    };

    $rdf.Fetcher.N3Handler.toString = function() {
        return "N3Handler";
    }
    $rdf.Fetcher.N3Handler.register = function(sf) {
        sf.mediatypes['text/n3'] = {
            'q': '1.0'
        } // as per 2008 spec
        sf.mediatypes['application/x-turtle'] = {
            'q': 1.0
        } // pre 2008
        sf.mediatypes['text/turtle'] = {
            'q': 1.0
        } // pre 2008
    }
    $rdf.Fetcher.N3Handler.pattern = new RegExp("(application|text)/(x-)?(rdf\\+)?(n3|turtle)")

    /***********************************************/

    $rdf.Util.callbackify(this, ['request', 'recv', 'headers', 'load', 'fail', 'refresh', 'retract', 'done']);

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
        (new handler(args)).handlerFactory(xhr);
        xhr.handle(cb)
    }

    this.addStatus = function(req, status) {
        //<Debug about="parsePerformance">
        var now = new Date();
        status = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "." + now.getMilliseconds() + "] " + status;
        //</Debug>
        var kb = this.store
        var s = kb.the(req, ns.link('status'));
        if (s && s.append) {
            s.append(kb.literal(status));
        } else {
            $rdf.log.warn("web.js: No list to add to: " + s + ',' + status); // @@@
        };
    }

    // Record errors in the system on failure
    // Returns xhr so can just do return this.failfetch(...)
    this.failFetch = function(xhr, status) {
        this.addStatus(xhr.req, status)
        if (!xhr.options.noMeta) {
            kb.add(xhr.resource, ns.link('error'), status)
        }
        this.requested[$rdf.uri.docpart(xhr.resource.uri)] = xhr.status; // changed 2015 was false
        while (this.fetchCallbacks[xhr.resource.uri] && this.fetchCallbacks[xhr.resource.uri].length) {
            this.fetchCallbacks[xhr.resource.uri].shift()(false, "Fetch of <" + xhr.resource.uri + "> failed: "+status, xhr);
        }
        delete this.fetchCallbacks[xhr.resource.uri];
        this.fireCallbacks('fail', [xhr.requestedURI, status])
        xhr.abort()
        return xhr
    }

    // in the why part of the quad distinguish between HTML and HTTP header
    // Reverse is set iif the link was rev= as opposed to rel=
    this.linkData = function(xhr, rel, uri, why, reverse) {
        var x = xhr.resource;
        if (!uri) return;
        var predicate;
        // See http://www.w3.org/TR/powder-dr/#httplink for describedby 2008-12-10
        var obj = kb.sym($rdf.uri.join(uri, xhr.resource.uri));
        if (rel == 'alternate' || rel == 'seeAlso' || rel == 'meta' || rel == 'describedby') {
            if (obj.uri === xhr.resource.uri) return;
            predicate = ns.rdfs('seeAlso');
        } else {
        // See https://www.iana.org/assignments/link-relations/link-relations.xml
        // Alas not yet in RDF yet for each predicate
            predicate = kb.sym($rdf.uri.join(rel, 'http://www.iana.org/assignments/link-relations/'));
        }
        if (reverse) {
            kb.add(obj, predicate, xhr.resource, why);
        } else {
            kb.add(xhr.resource, predicate, obj, why);
        }
    };

    this.parseLinkHeader = function(xhr, thisReq) {
        var link;
        try {
            link = xhr.getResponseHeader('link'); // May crash from CORS error
        }catch(e){}
        if (link) {
            var linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
            var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;

            var matches = link.match(linkexp);
            var rels = {};
            for (var i = 0; i < matches.length; i++) {
                var split = matches[i].split('>');
                var href = split[0].substring(1);
                var ps = split[1];
                var s = ps.match(paramexp);
                for (var j = 0; j < s.length; j++) {
                    var p = s[j];
                    var paramsplit = p.split('=');
                    var name = paramsplit[0];
                    var rel = paramsplit[1].replace(/["']/g, ''); //'"
                    this.linkData(xhr, rel, href, thisReq);
                }
            }
        }
    };



    this.doneFetch = function(xhr, args) {
        this.addStatus(xhr.req, 'Done.')
        // $rdf.log.info("Done with parse, firing 'done' callbacks for " + xhr.resource)
        this.requested[xhr.resource.uri] = 'done'; //Kenny
        while (this.fetchCallbacks[xhr.resource.uri] && this.fetchCallbacks[xhr.resource.uri].length) {
            this.fetchCallbacks[xhr.resource.uri].shift()(true, undefined, xhr);
        }
        delete this.fetchCallbacks[xhr.resource.uri];
        this.fireCallbacks('done', args)
    };


    [$rdf.Fetcher.RDFXMLHandler, $rdf.Fetcher.XHTMLHandler,
     $rdf.Fetcher.XMLHandler, $rdf.Fetcher.HTMLHandler,
     $rdf.Fetcher.TextHandler, $rdf.Fetcher.N3Handler ].map(this.addHandler);



    /** Note two nodes are now smushed
     **
     ** If only one was flagged as looked up, then
     ** the new node is looked up again, which
     ** will make sure all the URIs are dereferenced
     */
    this.nowKnownAs = function(was, now) {
        if (this.lookedUp[was.uri]) {
            if (!this.lookedUp[now.uri]) this.lookUpThing(now, was) //  @@@@  Transfer userCallback
        } else if (this.lookedUp[now.uri]) {
            if (!this.lookedUp[was.uri]) this.lookUpThing(was, now)
        }
    }





    // Looks up something.
    //
    // Looks up all the URIs a things has.
    //
    // Parameters:
    //
    //  term:       canonical term for the thing whose URI is to be dereferenced
    //  rterm:      the resource which refered to this (for tracking bad links)
    //  options:    (old: force paraemter) or dictionary of options:
    //      force:      Load the data even if loaded before
    //  oneDone:   is called as callback(ok, errorbody, xhr) for each one
    //  allDone:   is called as callback(ok, errorbody) for all of them
    // Returns      the number of URIs fetched
    //
    this.lookUpThing = function(term, rterm, options, oneDone, allDone) {
        var uris = kb.uris(term) // Get all URIs
        var success = true;
        var errors = '';
        var outstanding = {}, force;
        if (options === false || options === true) { // Old signature
            force = options;
            options = { force: force };
        } else {
            if (options === undefined) options = {};
            force = !!options.force;
        }

        if (typeof uris !== 'undefined') {
            for (var i = 0; i < uris.length; i++) {
                var u = uris[i];
                outstanding[u] = true;
                this.lookedUp[u] = true;
                var sf = this;

                var requestOne = function requestOne(u1){
                    sf.requestURI($rdf.uri.docpart(u1), rterm, options,
                        function(ok, body, xhr){
                            if (ok) {
                                if (oneDone) oneDone(true, u1);
                            } else {
                                if (oneDone) oneDone(false, body);
                                success = false;
                                errors += body + '\n';
                            };
                            delete outstanding[u];
                            for (x in outstanding) return;
                            if (allDone) allDone(success, errors);
                        }
                    );
                };
                requestOne(u);
            }
        }
        return uris.length
    }

    /* Promise-based load function
    **
    ** Promise delivers xhr
    **
    ** @@ todo: If p1 is array then sequence or parallel fetch of all
    */
    this.load = function(uri, options) {
        uri = uri.uri || uri;
        var fetcher = this;
	    return new Promise(function(resolve, reject){
    	    fetcher.nowOrWhenFetched(uri, options, function(ok, message, xhr){
        		if (ok) {
        		    resolve(xhr);
        		} else {
        		    reject(message);
        		}
            });
	    });
    }

    /*  Ask for a doc to be loaded if necessary then call back
    **
    ** Changed 2013-08-20:  Added (ok, errormessage) params to callback
    **
    ** Calling methods:
    **   nowOrWhenFetched (uri, userCallback)
    **   nowOrWhenFetched (uri, options, userCallback)
    **   nowOrWhenFetched (uri, referringTerm, userCallback, options)  <-- old
    **   nowOrWhenFetched (uri, referringTerm, userCallback) <-- old
    **
    **  Options include:
    **   referringTerm    The docuemnt in which this link was found.
    **                    this is valuable when finding the source of bad URIs
    **   force            boolean.  Never mind whether you have tried before,
    **                    load this from scratch.
    **   forceContentType Override the incoming header to force the data to be
    **                    treaed as this content-type.
    **/
    this.nowOrWhenFetched = function(uri, p2, userCallback, options) {
        uri = uri.uri || uri; // allow symbol object or string to be passed
        if (typeof p2 == 'function') {
            options = {};
            userCallback = p2;
        } else if (typeof p2 == 'undefined') { // original calling signature
            referingTerm = undefined;
        } else if (p2 instanceof $rdf.Symbol) {
            referingTerm = p2;
        } else {
            options = p2;
        }

        this.requestURI(uri, p2, options || {}, userCallback);
    }

    this.get = this.nowOrWhenFetched;

    // Look up response header
    //
    // Returns: a list of header values found in a stored HTTP response
    //      or [] if response was found but no header found
    //      or undefined if no response is available.
    //
    this.getHeader = function(doc, header) {
        var kb = this.store;
        var requests = kb.each(undefined, ns.link("requestedURI"), doc.uri);
        for (var r=0; r<requests.length; r++) {
            var request = requests[r];
            if (request !== undefined) {
                var response = kb.any(request, ns.link("response"));
                if (request !== undefined) {
                    var results = kb.each(response, ns.httph(header.toLowerCase()));
                    if (results.length) {
                        return results.map(function(v){return v.value});
                    }
                    return [];
                }
            }
        }
        return undefined;
    };

    this.proxyIfNecessary = function(uri) {
        if (typeof tabulator != 'undefined' && tabulator.isExtension) return uri; // Extenstion does not need proxy
            // browser does 2014 on as https browser script not trusted
            // If the web app origin is https: then the mixed content rules
            // prevent it loading insecure http: stuff so we need proxy.
        if ($rdf.Fetcher.crossSiteProxyTemplate && (typeof document !== 'undefined') &&document.location
			&& ('' + document.location).slice(0,6) === 'https:' // Origin is secure
                && uri.slice(0,5) === 'http:') { // requested data is not
              return $rdf.Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
        }
        return uri;
    };


    this.saveRequestMetadata = function(xhr, kb, docuri) {
        var request = kb.bnode();
        xhr.resource = $rdf.sym(docuri);

        xhr.req = request;
        if (!xhr.options.noMeta) { // Store no triples but do mind the bnode for req
            var now = new Date();
            var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
            kb.add(request, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + docuri), this.appNode);
            kb.add(request, ns.link("requestedURI"), kb.literal(docuri), this.appNode);

            kb.add(request, ns.link('status'), kb.collection(), this.appNode);
        }
        return request;
    };

    this.saveResponseMetadata = function(xhr, kb) {
        var response = kb.bnode();

        if (xhr.req) kb.add(xhr.req, ns.link('response'), response);
        kb.add(response, ns.http('status'), kb.literal(xhr.status), response);
        kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response);

        xhr.headers = {}
        if ($rdf.uri.protocol(xhr.resource.uri) == 'http' || $rdf.uri.protocol(xhr.resource.uri) == 'https') {
            xhr.headers = $rdf.Util.getHTTPHeaders(xhr)
            for (var h in xhr.headers) { // trim below for Safari - adds a CR!
                kb.add(response, ns.httph(h.toLowerCase()), xhr.headers[h].trim(), response)
            }
        }
        return response;
    };


    /** Requests a document URI and arranges to load the document.
     ** Parameters:
     **	    term:  term for the thing whose URI is to be dereferenced
     **      rterm:  the resource which refered to this (for tracking bad links)
     **      options:
     **              force:  Load the data even if loaded before
     **              withCredentials:   flag for XHR/CORS etc
     **      userCallback:  Called with (true) or (false, errorbody, {status: 400}) after load is done or failed
     ** Return value:
     **	    The xhr object for the HTTP access
     **      null if the protocol is not a look-up protocol,
     **              or URI has already been loaded
     */
    this.requestURI = function(docuri, rterm, options, userCallback) { //sources_request_new
        docuri = docuri.uri || docuri; // Symbol or string
        // Remove #localid
        docuri = docuri.split('#')[0];

        if (typeof options === 'boolean') options = { 'force': options}; // Ols dignature
        if (typeof options === 'undefined') options = {};
        var force = !! options.force
        var kb = this.store;
        var args = arguments;


        var pcol = $rdf.uri.protocol(docuri);
        if (pcol == 'tel' || pcol == 'mailto' || pcol == 'urn') {
            return userCallback? userCallback(false, "Unsupported protocol", {'status':  900 }) : undefined; //"No look-up operation on these, but they are not errors?"
        }
        var docterm = kb.sym(docuri);

        var sta = this.getState(docuri);
        if (!force) {
            if (sta == 'fetched') return userCallback ? userCallback(true) : undefined;
            if (sta == 'failed') return userCallback ?
                userCallback(false, "Previously failed. " + this.requested[docuri],
                    {'status': this.requested[docuri]}) : undefined; // An xhr standin
            //if (sta == 'requested') return userCallback? userCallback(false, "Sorry already requested - pending already.", {'status': 999 }) : undefined;
        } else {
            delete this.nonexistant[docuri];
        }
        // @@ Should allow concurrent requests

        // If it is 'failed', then shoulkd we try again?  I think so so an old error doens't get stuck
        //if (sta == 'unrequested')



        this.fireCallbacks('request', args); //Kenny: fire 'request' callbacks here
        // dump( "web.js: Requesting uri: " + docuri + "\n" );


        if (userCallback) {
            if (!this.fetchCallbacks[docuri]) {
                this.fetchCallbacks[docuri] = [ userCallback ];
            } else {
                this.fetchCallbacks[docuri].push(userCallback);
            }
        }

        if (this.requested[docuri] === true) {
            return; // Don't ask again - wait for existing call
        } else {
            this.requested[docuri] = true;
        }


        if (!options.noMeta && rterm && rterm.uri) {
            kb.add(docterm.uri, ns.link("requestedBy"), rterm.uri, this.appNode)
        }

        var useJQuery = typeof jQuery != 'undefined';
        if (!useJQuery) {
            var xhr = $rdf.Util.XMLHTTPFactory();
            var req = xhr.req = kb.bnode();
            xhr.options = options;
            xhr.resource = docterm;
            xhr.requestedURI = args[0];
        } else {
            var req = kb.bnode();
        }
        var sf = this;

        var now = new Date();
        var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
        if (!options.noMeta) {
            kb.add(req, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + docuri), this.appNode)
            kb.add(req, ns.link("requestedURI"), kb.literal(docuri), this.appNode)
            kb.add(req, ns.link('status'), kb.collection(), this.appNode)
        }
        // This should not be stored in the store, but in the JS data
        /*
        if (typeof kb.anyStatementMatching(this.appNode, ns.link("protocol"), $rdf.uri.protocol(docuri)) == "undefined") {
            // update the status before we break out
            this.failFetch(xhr, "Unsupported protocol: "+$rdf.uri.protocol(docuri))
            return xhr
        }
        */
        var checkCredentialsRetry = function() {
            if (!xhr.withCredentials) return false; // not dealt with

            console.log("@@ Retrying with no credentials for " + xhr.resource)
            xhr.abort();
            delete sf.requested[docuri]; // forget the original request happened
            newopt = {};
            for (opt in options) if (options.hasOwnProperty(opt)) {
                newopt[opt] = options[opt]
            }
            newopt.withCredentials = false;
            sf.addStatus(xhr.req, "Abort: Will retry with credentials SUPPRESSED to see if that helps");
            sf.requestURI(docuri, rterm, newopt, xhr.userCallback); // usercallback already registered (with where?)
            return true;
        }


        var onerrorFactory = function(xhr) {
            return function(event) {
                xhr.onErrorWasCalled = true; // debugging and may need it
                if  (typeof document !== 'undefined') { // Mashup situation, not node etc
                    if ($rdf.Fetcher.crossSiteProxyTemplate && document.location && !xhr.proxyUsed) {
                        var hostpart = $rdf.uri.hostpart;
                        var here = '' + document.location;
                        var uri = xhr.resource.uri
                        if (hostpart(here) && hostpart(uri) && hostpart(here) != hostpart(uri)) {
                            if (xhr.status === 401 || xhr.status === 403 || xhr.status === 404) {
                                onreadystatechangeFactory(xhr)();
                            } else {
                                newURI = $rdf.Fetcher.crossSiteProxy(uri);
                                sf.addStatus(xhr.req, "BLOCKED -> Cross-site Proxy to <" + newURI + ">");
                                if (xhr.aborted) return;

                                var kb = sf.store;
                                var oldreq = xhr.req;
                                if (!xhr.options.noMeta) {
                                    kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), oldreq);
                                }
                                xhr.abort()
                                xhr.aborted = true

                                sf.addStatus(oldreq, 'redirected to new request') // why
                                //the callback throws an exception when called from xhr.onerror (so removed)
                                //sf.fireCallbacks('done', args) // Are these args right? @@@   Not done yet! done means success
                                sf.requested[xhr.resource.uri] = 'redirected';

                                if (sf.fetchCallbacks[xhr.resource.uri]) {
                                    if (!sf.fetchCallbacks[newURI]) {
                                        sf.fetchCallbacks[newURI] = [];
                                    }
                                    sf.fetchCallbacks[newURI] == sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri]);
                                    delete sf.fetchCallbacks[xhr.resource.uri];
                                }

                                var xhr2 = sf.requestURI(newURI, xhr.resource, options);
                                if (xhr2) {
                                    xhr2.proxyUsed = true; //only try the proxy once
                                }
                                if (xhr2 && xhr2.req) {
                                    if (!xhr.options.noMeta) {
                                        kb.add(xhr.req,
                                            kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                                            xhr2.req,
                                            sf.appNode);
                                    }
                                    return;
                                }
                            }
                        }

                        if (checkCredentialsRetry(xhr)) {
                            return;
                        }
                        xhr.status = 999; //
                    }
                }; // mashu
            } // function of event
        }; // onerrorFactory

            // Set up callbacks
        var onreadystatechangeFactory = function(xhr) {
            return function() {
                var handleResponse = function() {
                    if (xhr.handleResponseDone) return;
                    xhr.handleResponseDone = true;
                    var handler = null;
                    var thisReq = xhr.req // Might have changes by redirect
                    sf.fireCallbacks('recv', args)
                    var kb = sf.store;
                    var response = sf.saveResponseMetadata(xhr, kb);
                    sf.fireCallbacks('headers', [{uri: docuri, headers: xhr.headers}]);

                    // Check for masked errors.
                    // For "security reasons" theboraser hides errors such as CORS errors from
                    // the calling code (2015). oneror() used to be called but is not now.
                    //
                    if (xhr.status === 0) {
                        console.log("Masked error - status 0 for " + xhr.resource.uri);
                        if (checkCredentialsRetry(xhr)) { // retry is could be credentials flag CORS issue
                            return;
                        }
                        xhr.status = 900; // unknown masked error
                        return;
                    }
                    if (xhr.status >= 400) { // For extra dignostics, keep the reply
                    //  @@@ 401 should cause  a retry with credential son
                    // @@@ cache the credentials flag by host ????
                        if (xhr.status === 404) {
                            kb.fetcher.nonexistant[xhr.resource.uri] = true;
                        }
                        if (xhr.responseText.length > 10) {
                            var response = kb.bnode();
                            kb.add(response, ns.http('content'), kb.literal(xhr.responseText), response);
                            if (xhr.statusText) {
                                kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response);
                            }
                            // dump("HTTP >= 400 responseText:\n"+xhr.responseText+"\n"); // @@@@
                        }
                        sf.failFetch(xhr, "HTTP error for " +xhr.resource + ": "+ xhr.status + ' ' + xhr.statusText);
                        return;
                    }

                    var loc = xhr.headers['content-location'];

                    // deduce some things from the HTTP transaction
                    var addType = function(cla) { // add type to all redirected resources too
                        var prev = thisReq;
                        if (loc) {
                            var docURI = kb.any(prev, ns.link('requestedURI'));
                            if (docURI != loc) {
                                kb.add(kb.sym(loc), ns.rdf('type'), cla, sf.appNode);
                            }
                        }
                        for (;;) {
                            var doc = kb.any(prev, ns.link('requestedURI'));
                            if (doc && doc.value) // convert Literal
                                kb.add(kb.sym(doc.value), ns.rdf('type'), cla, sf.appNode);
                            prev = kb.any(undefined, kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'), prev);
                            if (!prev) break;
                            var response = kb.any(prev, kb.sym('http://www.w3.org/2007/ont/link#response'));
                            if (!response) break;
                            var redirection = kb.any(response, kb.sym('http://www.w3.org/2007/ont/http#status'));
                            if (!redirection) break;
                            if (redirection != '301' && redirection != '302') break;
                        }
                    }
                    // This is a minimal set to allow the use of damaged servers if necessary
                    var extensionToContentType = {
                        'rdf': 'application/rdf+xml', 'owl': 'application/rdf+xml',
                        'n3': 'text/n3', 'ttl': 'text/turtle', 'nt': 'text/n3', 'acl': 'text/n3',
                        'html': 'text/html', 'html': 'text/htm',
                        'xml': 'text/xml'
                    };

                    if (xhr.status == 200) {
                        addType(ns.link('Document'));
                        var ct = xhr.headers['content-type'];
                        if (options.forceContentType) {
                            xhr.headers['content-type'] = options.forceContentType;
                        };
                        if (!ct || ct.indexOf('application/octet-stream') >=0 ) {
                            var guess = extensionToContentType[xhr.resource.uri.split('.').pop()];
                            if (guess) {
                                xhr.headers['content-type'] = guess;
                            }
                        }
                        if (ct) {
                            if (ct.indexOf('image/') == 0 || ct.indexOf('application/pdf') == 0) addType(kb.sym('http://purl.org/dc/terms/Image'));
                        }
                        if (options.clearPreviousData) { // Before we parse new data clear old but only on 200
                            kb.removeDocument(xhr.resource);
                        };

                    }
                    // application/octet-stream; charset=utf-8



                    if ($rdf.uri.protocol(xhr.resource.uri) == 'file' || $rdf.uri.protocol(xhr.resource.uri) == 'chrome') {
                        if (options.forceContentType) {
                            xhr.headers['content-type'] = options.forceContentType;
                        } else {
                            var guess = extensionToContentType[xhr.resource.uri.split('.').pop()];
                            if (guess) {
                                xhr.headers['content-type'] = guess;
                            } else {
                                xhr.headers['content-type'] = 'text/xml';
                            }
                        }
                    }

                    // If we have alread got the thing at this location, abort
                    if (loc) {
                        var udoc = $rdf.uri.join(xhr.resource.uri, loc)
                        if (!force && udoc != xhr.resource.uri && sf.requested[udoc]
                            && sf.requested[udoc] == 'done') { // we have already fetched this in fact.
                            // should we smush too?
                            // $rdf.log.info("HTTP headers indicate we have already" + " retrieved " + xhr.resource + " as " + udoc + ". Aborting.")
                            sf.doneFetch(xhr, args)
                            xhr.abort()
                            return
                        }
                        sf.requested[udoc] = true
                    }

                    for (var x = 0; x < sf.handlers.length; x++) {
                        if (xhr.headers['content-type'] && xhr.headers['content-type'].match(sf.handlers[x].pattern)) {
                            handler = new sf.handlers[x]();
                            break
                        }
                    }

                    sf.parseLinkHeader(xhr, thisReq);

                    if (handler) {
                        try {
                            handler.handlerFactory(xhr);
                        } catch(e) { // Try to avoid silent errors
                            sf.failFetch(xhr, "Exception handling content-type " + xhr.headers['content-type'] + ' was: '+e);
                        };
                    } else {
                        sf.doneFetch(xhr, args); //  Not a problem, we just don't extract data.
                        /*
                        // sf.failFetch(xhr, "Unhandled content type: " + xhr.headers['content-type']+
                        //        ", readyState = "+xhr.readyState);
                        */
                        return;
                    }
                };

                // DONE: 4
                // HEADERS_RECEIVED: 2
                // LOADING: 3
                // OPENED: 1
                // UNSENT: 0

                // $rdf.log.debug("web.js: XHR " + xhr.resource.uri + ' readyState='+xhr.readyState); // @@@@ comment me out

                switch (xhr.readyState) {
                case 0:
                    var uri = xhr.resource.uri, newURI;
                    if (this.crossSiteProxyTemplate && (typeof document !== 'undefined') &&document.location) { // In mashup situation
                        var hostpart = $rdf.uri.hostpart;
                        var here = '' + document.location;
                        if (hostpart(here) && hostpart(uri) && hostpart(here) != hostpart(uri)) {
                            newURI = this.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
                            sf.addStatus(xhr.req, "BLOCKED -> Cross-site Proxy to <" + newURI + ">");
                            if (xhr.aborted) return;

                            var kb = sf.store;
                            var oldreq = xhr.req;
                            kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), oldreq);


                            ////////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                            var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                            kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req);

                            var now = new Date();
                            var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
                            kb.add(newreq, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                            kb.add(newreq, ns.link('status'), kb.collection(), this.appNode);
                            kb.add(newreq, ns.link("requestedURI"), kb.literal(newURI), this.appNode);

                            var response = kb.bnode();
                            kb.add(oldreq, ns.link('response'), response);
                            // kb.add(response, ns.http('status'), kb.literal(xhr.status), response);
                            // if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                            xhr.abort()
                            xhr.aborted = true;
                            xhr.redirected = true;

                            sf.addStatus(oldreq, 'redirected XHR') // why

                            if (sf.fetchCallbacks[xhr.resource.uri]) {
                                if (!sf.fetchCallbacks[newURI]) {
                                    sf.fetchCallbacks[newURI] = [];
                                }
                                sf.fetchCallbacks[newURI] == sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri]);
                                delete sf.fetchCallbacks[xhr.resource.uri];
                            }


                            sf.fireCallbacks('redirected', args) // Are these args right? @@@
                            sf.requested[xhr.resource.uri] = 'redirected';

                            var xhr2 = sf.requestURI(newURI, xhr.resource, xhr.options || {} );
                            if (xhr2 && xhr2.req) kb.add(xhr.req,
                                kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                                xhr2.req, sf.appNode);                             return;
                        }
                    }
                    sf.failFetch(xhr, "HTTP Blocked. (ReadyState 0) Cross-site violation for <"+
                    docuri+">");

                    break;

                case 3:
                    // Intermediate state -- 3 may OR MAY NOT be called, selon browser.
                    // handleResponse();   // In general it you can't do it yet as the headers are in but not the data
                    break
                case 4:
                    // Final state for this XHR but may be redirected
                    handleResponse();
                    // Now handle
                    if (xhr.handle && xhr.responseText !== undefined) { // can be validly zero length
                        if (sf.requested[xhr.resource.uri] === 'redirected') {
                            break;
                        }
                        sf.fireCallbacks('load', args)
                        xhr.handle(function() {
                            sf.doneFetch(xhr, args)
                        })
                    } else {
                        if (xhr.redirected) {
                            sf.addStatus(xhr.req, "Aborted and redirected to new request.");
                        } else {
                            sf.addStatus(xhr.req, "Fetch over. No data handled. Aborted = " + xhr.aborted);
                        }
                        // sf.failFetch(xhr, "HTTP failed unusually. (no handler set) (x-site violation? no net?) for <"+
                        //    docuri+">");
                    }
                    break
                } // switch
            };
        }


        // Map the URI to a localhost proxy if we are running on localhost
        // This is used for working offline, e.g. on planes.
        // Is the script istelf is running in localhost, then access all data in a localhost mirror.
        // Do not remove without checking with TimBL
        var uri2 = docuri;
        if (typeof tabulator != 'undefined' && tabulator.preferences.get('offlineModeUsingLocalhost')) {
            if (uri2.slice(0,7) == 'http://'  && uri2.slice(7,17) != 'localhost/') {
                uri2 = 'http://localhost/' + uri2.slice(7);
                $rdf.log.warn("Localhost kludge for offline use: actually getting <" + uri2 + ">");
            } else {
                // $rdf.log.warn("Localhost kludge NOT USED <" + uri2 + ">");
            };
        } else {
            // $rdf.log.warn("Localhost kludge OFF offline use: actually getting <" + uri2 + ">");
        }
        // 2014 probelm:
        // XMLHttpRequest cannot load http://www.w3.org/People/Berners-Lee/card.
        // A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin' header when the credentials flag is true.
        // @ Many ontology files under http: and need CORS wildcard -> can't have withCredentials

        var withCredentials = ( uri2.slice(0,6) === 'https:'); // @@ Kludge -- need for webid which typically is served from https
        if (options.withCredentials !== undefined) {
            withCredentials = options.withCredentials;
        }
        var actualProxyURI = this.proxyIfNecessary(uri2);


        // Setup the request
        if (typeof jQuery !== 'undefined' && jQuery.ajax) {
            var xhrFields = { withCredentials: withCredentials};
            var xhr = jQuery.ajax({
                url: actualProxyURI,
                accepts: {'*': 'text/turtle,text/n3,application/rdf+xml'},
                processData: false,
                xhrFields: xhrFields,
                timeout: sf.timeout,
                headers: force ? { 'cache-control': 'no-cache'} : {},
                error: function(xhr, s, e) {

                    xhr.req = req;   // Add these in case fails before .ajax returns
                    xhr.resource = docterm;
                    xhr.options = options;
                    xhr.requestedURI = uri2;
                    xhr.withCredentials = withCredentials; // Somehow gets lost by jq


                    if (s == 'timeout')
                        sf.failFetch(xhr, "requestTimeout");
                    else
                        onerrorFactory(xhr)(e);
                },
                success: function(d, s, xhr) {

                    xhr.req = req;
                    xhr.resource = docterm;
                    xhr.resource = docterm;
                    xhr.requestedURI = uri2;

                    onreadystatechangeFactory(xhr)();
                }
            });

            xhr.req = req;
            xhr.options = options;

            xhr.resource = docterm;
            xhr.options = options;
            xhr.requestedURI = uri2;
            xhr.actualProxyURI = actualProxyURI;


        } else {
            var xhr = $rdf.Util.XMLHTTPFactory();
            xhr.onerror = onerrorFactory(xhr);
            xhr.onreadystatechange = onreadystatechangeFactory(xhr);
            xhr.timeout = sf.timeout;
            xhr.withCredentials = withCredentials;
            xhr.actualProxyURI = actualProxyURI;

            xhr.req = req;
            xhr.options = options;
            xhr.options = options;
            xhr.resource = docterm;
            xhr.requestedURI = uri2;

            xhr.ontimeout = function () {
                sf.failFetch(xhr, "requestTimeout");
            }
            try {
                xhr.open('GET', actualProxyURI, this.async);
            } catch (er) {
                return this.failFetch(xhr, "XHR open for GET failed for <"+uri2+">:\n\t" + er);
            }
            if (force) { // must happen after open
                xhr.setRequestHeader('Cache-control', 'no-cache');
            }

        } // if not jQuery

        // Set redirect callback and request headers -- alas Firefox Extension Only

        if (typeof tabulator != 'undefined' && tabulator.isExtension && xhr.channel &&
            ($rdf.uri.protocol(xhr.resource.uri) == 'http' ||
             $rdf.uri.protocol(xhr.resource.uri) == 'https')) {
            try {
                xhr.channel.notificationCallbacks = {
                    getInterface: function(iid) {
                        if (iid.equals(Components.interfaces.nsIChannelEventSink)) {
                            return {

                                onChannelRedirect: function(oldC, newC, flags) {
                                    if (xhr.aborted) return;
                                    var kb = sf.store;
                                    var newURI = newC.URI.spec;
                                    var oldreq = xhr.req;
                                    if (!xhr.options.noMeta) {

                                        sf.addStatus(xhr.req, "Redirected: " + xhr.status + " to <" + newURI + ">");
                                        kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req);

                                    ////////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate code?
                                        var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                                        kb.add(oldreq, ns.http('redirectedRequest'), newreq, this.appNode);

                                        var now = new Date();
                                        var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
                                        kb.add(newreq, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                                        kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
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
                                    }
                                    if (xhr.status - 0 != 303) kb.HTTPRedirects[xhr.resource.uri] = newURI; // same document as
                                    if (xhr.status - 0 == 301 && rterm) { // 301 Moved
                                        var badDoc = $rdf.uri.docpart(rterm.uri);
                                        var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.';
                                        if (rterm) {
                                            msg += ' Link in <' + badDoc + ' >should be changed';
                                            kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode);
                                        }
                                        // dump(msg+"\n");
                                    }
                                    xhr.abort()
                                    xhr.aborted = true

                                    if (sf.fetchCallbacks[xhr.resource.uri]) {
                                        if (!sf.fetchCallbacks[newURI]) {
                                            sf.fetchCallbacks[newURI] = [];
                                        }
                                        sf.fetchCallbacks[newURI] == sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri]);
                                        delete sf.fetchCallbacks[xhr.resource.uri];
                                    }

                                    sf.addStatus(oldreq, 'redirected') // why
                                    sf.fireCallbacks('redirected', args) // Are these args right? @@@
                                    sf.requested[xhr.resource.uri] = 'redirected';

                                    var hash = newURI.indexOf('#');
                                    if (hash >= 0) {
                                        var msg = ('Warning: ' + xhr.resource + ' HTTP redirects to' + newURI + ' which should not contain a "#" sign');
                                        if (!xhr.options.noMeta) {
                                            kb.add(xhr.resource, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg)
                                        }
                                        newURI = newURI.slice(0, hash);
                                    }
                                    var xhr2 = sf.requestURI(newURI, xhr.resource);
                                    if (xhr2 && xhr2.req && !noMeta) kb.add(xhr.req,
                                        kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                                        xhr2.req, sf.appNode);

                                    // else dump("No xhr.req available for redirect from "+xhr.resource+" to "+newURI+"\n")
                                },

                                // See https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIChannelEventSink
                                asyncOnChannelRedirect: function(oldC, newC, flags, callback) {
                                    if (xhr.aborted) return;
                                    var kb = sf.store;
                                    var newURI = newC.URI.spec;
                                    var oldreq = xhr.req;
                                    sf.addStatus(xhr.req, "Redirected: " + xhr.status + " to <" + newURI + ">");
                                    kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req);



                                    ////////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                                    var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                                    // xhr.resource = docterm
                                    // xhr.requestedURI = args[0]

                                    // kb.add(kb.sym(newURI), ns.link("request"), req, this.appNode)
                                    kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req);

                                    var now = new Date();
                                    var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
                                    kb.add(newreq, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                                    kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
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

                                    if (xhr.status - 0 != 303) kb.HTTPRedirects[xhr.resource.uri] = newURI; // same document as
                                    if (xhr.status - 0 == 301 && rterm) { // 301 Moved
                                        var badDoc = $rdf.uri.docpart(rterm.uri);
                                        var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.';
                                        if (rterm) {
                                            msg += ' Link in <' + badDoc + ' >should be changed';
                                            kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode);
                                        }
                                        // dump(msg+"\n");
                                    }
                                    xhr.abort()
                                    xhr.aborted = true

                                    var hash = newURI.indexOf('#');
                                    if (hash >= 0) {
                                        var msg = ('Warning: ' + xhr.resource + ' HTTP redirects to' + newURI + ' which should not contain a "#" sign');
                                        // dump(msg+"\n");
                                        kb.add(xhr.resource, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg)
                                        newURI = newURI.slice(0, hash);
                                    }

                                    if (sf.fetchCallbacks[xhr.resource.uri]) {
                                        if (!sf.fetchCallbacks[newURI]) {
                                            sf.fetchCallbacks[newURI] = [];
                                        }
                                        sf.fetchCallbacks[newURI] == sf.fetchCallbacks[newURI].concat(sf.fetchCallbacks[xhr.resource.uri]);
                                        delete sf.fetchCallbacks[xhr.resource.uri];
                                    }

                                    sf.requested[xhr.resource.uri] = 'redirected';

                                    var xhr2 = sf.requestURI(newURI, xhr.resource);
                                    if (xhr2 && xhr2.req) kb.add(xhr.req,
                                        kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                                        xhr2.req, sf.appNode);

                                    // else dump("No xhr.req available for redirect from "+xhr.resource+" to "+newURI+"\n")
                                } // asyncOnChannelRedirect
                            }
                        }
                        return Components.results.NS_NOINTERFACE
                    }
                }
            } catch (err) {
                 return sf.failFetch(xhr,
                    "@@ Couldn't set callback for redirects: " + err);
            } // try

        } // if Firefox extension

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

            //if (requester) { xhr.setRequestHeader('Referer',requester) }
        } catch (err) {
            throw ("Can't set Accept header: " + err)
        }

        // Fire

        if (!useJQuery) {
            try {
                xhr.send(null)
            } catch (er) {
                return this.failFetch(xhr, "XHR send failed:" + er);
            }
            setTimeout(function() {
                    if (xhr.readyState != 4 && sf.isPending(xhr.resource.uri)) {
                        sf.failFetch(xhr, "requestTimeout")
                    }
                },
                this.timeout);
            this.addStatus(xhr.req, "HTTP Request sent.");

        } else {
            this.addStatus(xhr.req, "HTTP Request sent (using jQuery)");
        }

        return xhr

    } // this.requestURI()


    this.objectRefresh = function(term) {
        var uris = kb.uris(term) // Get all URIs
        if (typeof uris != 'undefined') {
            for (var i = 0; i < uris.length; i++) {
                this.refresh(this.store.sym($rdf.uri.docpart(uris[i])));
                //what about rterm?
            }
        }
    }

    // deprecated -- use IndexedFormula.removeDocument(doc)
    this.unload = function(term) {
        this.store.removeMany(undefined, undefined, undefined, term)
        delete this.requested[term.uri]; // So it can be loaded again
    }

    this.refresh = function(term, userCallback) { // sources_refresh
        this.fireCallbacks('refresh', arguments)
        this.requestURI(term.uri, undefined, { force: true, clearPreviousData: true}, userCallback)
    }

    this.retract = function(term) { // sources_retract
        this.store.removeMany(undefined, undefined, undefined, term)
        if (term.uri) {
            delete this.requested[$rdf.uri.docpart(term.uri)]
        }
        this.fireCallbacks('retract', arguments)
    }

    this.getState = function(docuri) {
        if (typeof this.requested[docuri] == "undefined") {
            return "unrequested"
        } else if (this.requested[docuri] === true) {
            return "requested"
        } else if (this.requested[docuri] === 'done') {
            return "fetched"
        } else  { // An non-200 HTTP error status
            return "failed"
        }
    }

    //doing anyStatementMatching is wasting time
    this.isPending = function(docuri) { // sources_pending
        //if it's not pending: false -> flailed 'done' -> done 'redirected' -> redirected
        return this.requested[docuri] === true;
    }

    // var updatesVia = new $rdf.UpdatesVia(this); // Subscribe to headers

    // @@@@@@@@ This is turned off because it causes a websocket to be set up for ANY fetch
    // whether we want to track it ot not. including ontologies loaed though the XSSproxy

}; // End of fetcher

$rdf.fetcher = function(store, timeout, async) { return new $rdf.Fetcher(store, timeout, async) };

// Parse a string and put the result into the graph kb
// Normal method is sync.
// Unfortunately jsdonld is currently written to need to be called async.
// Hence the mess beolow with executeCallback.

$rdf.parsable = {'text/n3': true, 'text/turtle': true, 'application/rdf+xml': true,
  'application/rdfa':true, 'application/ld+json': true };

$rdf.parse = function parse(str, kb, base, contentType, callback) {
    try {
        if (contentType == 'text/n3' || contentType == 'text/turtle') {
            var p = $rdf.N3Parser(kb, kb, base, base, null, null, "", null)
            p.loadBuf(str)
            executeCallback();
        } else if (contentType == 'application/rdf+xml') {
            var parser = new $rdf.RDFParser(kb);
            parser.parse($rdf.Util.parseXML(str), base, kb.sym(base));
            executeCallback();
        } else if (contentType == 'application/rdfa') {  // @@ not really a valid mime type
            $rdf.parseDOM_RDFa($rdf.Util.parseXML(str), kb, base);
            executeCallback();
        } else if (contentType == 'application/sparql-update') {  // @@ we handle a subset
            spaqlUpdateParser(store, str, base)
            executeCallback();
        } else if (contentType == 'application/ld+json' ||
            contentType == 'application/nquads' ||
            contentType == 'application/n-quads') {
            var n3Parser = N3.Parser();
            var N3Util = N3.Util;
            var triples = []
            var prefixes = {};
            if (contentType == 'application/ld+json') {
                var jsonDocument;
                try {
                    jsonDocument = JSON.parse(str);
                    setJsonLdBase(jsonDocument, base);
                } catch(parseErr) {
                    callback(err, null);
                }
                jsonld.toRDF(jsonDocument,
                    {format: 'application/nquads'},
                    nquadCallback);
            } else {
                nquadCallback(null, str);
            }
        } else {
            throw "Don't know how to parse "+contentType+" yet";
        }
    } catch(e) {
        executeErrorCallback(e);
    }

    function executeCallback() {
        if (callback) {
            callback(null, kb);
        } else {
            return;
        }
    }

    function executeErrorCallback(e) {
        if(contentType != 'application/ld+json' ||
           contentType != 'application/nquads' ||
           contentType != 'application/n-quads') {
            if (callback) {
                callback(e, kb);
            } else {
                throw "Error trying to parse <"+base+"> as " +
                    contentType+":\n"+e +':\n'+e.stack;
            }
        }
    }

    function setJsonLdBase(doc, base) {
        if (doc instanceof Array) {
            return;
        }
        if (!('@context' in doc)) {
            doc['@context'] = {};
        }
        doc['@context']['@base'] = base;
    }

    function nquadCallback(err, nquads) {
        if (err) {
            callback(err, kb);
        }
        try {
            n3Parser.parse(nquads, tripleCallback);
        } catch (err) {
            callback(err, kb);
        }
    }

    function tripleCallback(err, triple, prefixes) {
        if (err) {
            callback(err, kb);
        }
        if (triple) {
            triples.push(triple);
        } else {
            for (var i = 0; i < triples.length; i++) {
                addTriple(kb, triples[i]);
            }
            callback(null, kb);
        }
    }

    function addTriple(kb, triple) {
        var subject = createTerm(triple.subject);
        var predicate = createTerm(triple.predicate);
        var object = createTerm(triple.object);
        var why = null;
        if (triple.graph) {
            why = createTerm(triple.graph);
        }
        kb.add(subject, predicate, object, why);
    }

    function createTerm(termString) {
        if (N3Util.isLiteral(termString)) {
            var value = N3Util.getLiteralValue(termString);
            var language = N3Util.getLiteralLanguage(termString);
            var datatype = new $rdf.Symbol(N3Util.getLiteralType(termString));
            return new $rdf.Literal(value, language, datatype);
        } else if (N3Util.isIRI(termString)) {
            return new $rdf.Symbol(termString);
        } else if (N3Util.isBlank(termString)) {
            var value = termString.substring(2, termString.length);
            return new $rdf.BlankNode(value);
        } else {
            return null;
        }
    }
}; // $rdf.parse()


//   Serialize to the appropriate format
//
// Either
//
// @@ Currently NQuads and JSON/LD are deal with extrelemently inefficiently
// through mutiple conversions.
//
$rdf.serialize = function(target, kb, base, contentType, callback) {
    var documentString = null;
    try {
        var sz = $rdf.Serializer(kb);
        var newSts = kb.statementsMatching(undefined, undefined, undefined, target);
        var n3String;
        sz.suggestNamespaces(kb.namespaces);
        sz.setBase(base);
        switch(contentType){
        case 'application/rdf+xml':
            documentString = sz.statementsToXML(newSts);
            return executeCallback(null, documentString);
            break;
        case 'text/n3':
        case 'text/turtle':
        case 'application/x-turtle': // Legacy
        case 'application/n3': // Legacy
            documentString = sz.statementsToN3(newSts);
            return executeCallback(null, documentString);
        case 'application/ld+json':
            n3String = sz.statementsToN3(newSts);
            $rdf.convert.convertToJson(n3String, callback);
            break;
        case 'application/n-quads':
        case 'application/nquads': // @@@ just outpout the quads? Does not work for collections
            n3String = sz.statementsToN3(newSts);
            documentString = $rdf.convert.convertToNQuads(n3String, callback);
            break;
        default:
            throw "Serialize: Content-type "+ contentType +" not supported for data write.";
        }
    } catch(err) {
        if (callback) {
            return (err);
        }
        throw err; // Don't hide problems from caller in sync mode
    }

    function executeCallback(err, result) {
        if(callback) {
            callback(err, result);
            return;
        } else {
            return result;
        }
    }
};

////////////////// JSON-LD code currently requires Node
//
//  Beware of bloat of the library! timbl
//


if (typeof $rdf.convert == 'undefined') $rdf.convert = {};

$rdf.convert.convertToJson = function(n3String, jsonCallback) {
    var jsonString = undefined;
    var n3Parser = N3.Parser();
    var n3Writer = N3.Writer({
            format: 'N-Quads'
    });
    asyncLib.waterfall([
            function(callback) {
                n3Parser.parse(n3String, callback);
            },
            function(triple, prefix, callback) {
                if (triple !== null) {
                    n3Writer.addTriple(triple);
                }
                if (typeof callback === 'function') {
                    n3Writer.end(callback);
                }
            },
            function(result, callback) {
                try {
                    jsonld.fromRDF(result, {
                            format: 'application/nquads'
                    }, callback);
                } catch (err) {
                    callback(err);
                }
            },
            function(json, callback) {
                jsonString = JSON.stringify(json);
                jsonCallback(null, jsonString);
            }
        ], function(err, result) {
            jsonCallback(err, jsonString);
        }
    );
};

$rdf.convert.convertToNQuads = function(n3String, nquadCallback) {
    var nquadString = undefined;
    var n3Parser = N3.Parser();
    var n3Writer = N3.Writer({
        format: 'N-Quads'
    });
    asyncLib.waterfall([
            function(callback) {
                n3Parser.parse(n3String, callback);
            },
            function(triple, prefix, callback) {
                if (triple !== null) {
                    n3Writer.addTriple(triple);
                }
                if (typeof callback === 'function') {
                    n3Writer.end(callback);
                }
            },
            function(result, callback) {
                nquadString = result;
                nquadCallback(null, nquadString);
            },
        ], function(err, result) {
            nquadCallback(err, nquadString);
            }
    );
};


// ends

// Handle node, amd, and global systems
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = $rdf;
    }
    exports.$rdf = $rdf;
}
else {
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return $rdf;
        });
    }

    // Leak a global regardless of module system
    root['$rdf'] = $rdf;
}
$rdf.buildTime = "2016-02-19T14:01:03";
})(this);
