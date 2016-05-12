/**
* Utility functions for $rdf and the $rdf object itself
 */

if (typeof $rdf === 'undefined') {
  var $rdf = {}
} else {
  throw new Error('Internal error: RDF libray has already been loaded: $rdf already exists')
}

/**
 * @class a dummy logger

 Note to implement this using the Firefox error console see
  https://developer.mozilla.org/en/nsIConsoleService
 */

// dump("@@ rdf/util.js test RESET RDF LOGGER  $rdf.log.error)\n")
if ($rdf.log !== undefined) {
  // dump("WTF util.js:" + $rdf.log)
  throw new Error('Internal Error: $rdf.log already defined,  util.js: ' + $rdf.log)
}

$rdf.log = {
  'debug': function (x) {
    return
  },
  'warn': function (x) {
    return
  },
  'info': function (x) {
    return
  },
  'error': function (x) {
    return
  },
  'success': function (x) {
    return
  },
  'msg': function (x) {
    return
  }
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
  callbackify: function (obj, callbacks) {
    obj.callbacks = {}
    for (var x = callbacks.length - 1; x >= 0; x--) {
      obj.callbacks[callbacks[x]] = []
    }

    obj.addHook = function (hook) {
      if (!obj.callbacks[hook]) {
        obj.callbacks[hook] = []
      }
    }

    obj.addCallback = function (hook, func) {
      obj.callbacks[hook].push(func)
    }

    obj.removeCallback = function (hook, funcName) {
      for (var i = 0;i < obj.callbacks[hook].length;i++) {
        if (obj.callbacks[hook][i].name === funcName) {
          obj.callbacks[hook].splice(i, 1)
          return true
        }
      }
      return false
    }

    obj.insertCallback = function (hook, func) {
      obj.callbacks[hook].unshift(func)
    }

    obj.fireCallbacks = function (hook, args) {
      var newCallbacks = []
      var replaceCallbacks = []
      var len = obj.callbacks[hook].length
      var x
      //	    $rdf.log.info('!@$ Firing '+hook+' call back with length'+len)
      for (x = len - 1; x >= 0; x--) {
        //		    $rdf.log.info('@@ Firing '+hook+' callback '+ obj.callbacks[hook][x])
        if (obj.callbacks[hook][x].apply(obj, args)) {
          newCallbacks.push(obj.callbacks[hook][x])
        }
      }

      for (x = newCallbacks.length - 1; x >= 0; x--) {
        replaceCallbacks.push(newCallbacks[x])
      }

      for (x = len; x < obj.callbacks[hook].length; x++) {
        replaceCallbacks.push(obj.callbacks[hook][x])
      }

      obj.callbacks[hook] = replaceCallbacks
    }
  },

  /**
  * A standard way to create XMLHttpRequest objects
  */
  XMLHTTPFactory: function () {
    var XMLHttpRequest
    // Running inside the Tabulator Firefox extension
    if (typeof tabulator !== 'undefined' && tabulator.isExtension) {
      // Cannot use XMLHttpRequest natively, must request it through SDK
      return Components
        .classes['@mozilla.org/xmlextras/xmlhttprequest;1']
        .createInstance()
        .QueryInterface(Components.interfaces.nsIXMLHttpRequest)
    } else if (typeof window !== 'undefined' && 'XMLHttpRequest' in window) {
      // Running inside the browser
      XMLHttpRequest = window.XMLHttpRequest
      return new XMLHttpRequest()
    } else if (typeof module !== 'undefined' && module && module.exports) {
      // Running in Node.js
      XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
      return new XMLHttpRequest()
    } else if (window.ActiveXObject) {
      try {
        return new ActiveXObject('Msxml2.XMLHTTP')
      } catch (e) {
        return new ActiveXObject('Microsoft.XMLHTTP')
      }
    } else {
      return false
    }
  },

  'DOMParserFactory': function () {
    if (tabulator && tabulator.isExtension) {
      return Components.classes['@mozilla.org/xmlextras/domparser;1']
        .getService(Components.interfaces.nsIDOMParser)
    } else if (window.DOMParser) {
      return new DOMParser()
    } else if (window.ActiveXObject) {
      return new ActiveXObject('Microsoft.XMLDOM')
    } else {
      return false
    }
  },

  /**
  * Returns a hash of headers and values
  **
  ** @@ Bug: Assumes that each header only occurs once
  ** Also note that a , in a header value is just the same as having two headers.
   */
  getHTTPHeaders: function (xhr) {
    var lines = xhr.getAllResponseHeaders().split('\n')
    var headers = {}
    var last
    for (var x = 0; x < lines.length; x++) {
      if (lines[x].length > 0) {
        var pair = lines[x].split(': ')
        if (typeof pair[1] === 'undefined') { // continuation
          headers[last] += '\n' + pair[0]
        } else {
          last = pair[0].toLowerCase()
          headers[last] = pair[1]
        }
      }
    }
    return headers
  },

  dtstamp: function () {
    var now = new Date()
    var year = now.getYear() + 1900
    var month = now.getMonth() + 1
    var day = now.getDate()
    var hour = now.getUTCHours()
    var minute = now.getUTCMinutes()
    var second = now.getSeconds()
    if (month < 10) month = '0' + month
    if (day < 10) day = '0' + day
    if (hour < 10) hour = '0' + hour
    if (minute < 10) minute = '0' + minute
    if (second < 10) second = '0' + second
    return year + '-' + month + '-' + day + 'T' +
      hour + ':' + minute + ':' + second + 'Z'
  },

  enablePrivilege: ((typeof netscape !== 'undefined') &&
    (typeof netscape.security.PrivilegeManager !== 'undefined') &&
    netscape.security.PrivilegeManager.enablePrivilege) ||
    function () {
      return
    },

  disablePrivilege: ((typeof netscape !== 'undefined') && (typeof netscape.security.PrivilegeManager !== 'undefined') && netscape.security.PrivilegeManager.disablePrivilege) || function () {
    return
  },

  // removes all statements equal to x from a
  RDFArrayRemove: function (a, x) {
    for (var i = 0; i < a.length; i++) {
      // TODO: This used to be the following, which didnt always work..why
      // if(a[i] === x)
      if (a[i].subject.sameTerm(x.subject) &&
        a[i].predicate.sameTerm(x.predicate) &&
        a[i].object.sameTerm(x.object) &&
        a[i].why.sameTerm(x.why)) {
        a.splice(i, 1)
        return
      }
    }
    throw new Error('RDFArrayRemove: Array did not contain ' + x + ' ' + x.why)
  },

  string_startswith: function (str, pref) { // missing library routines
    return (str.slice(0, pref.length) === pref)
  },

  // This is the callback from the kb to the fetcher which is used to
  // load ontologies of the data we load.

  AJAR_handleNewTerm: function (kb, p, requestedBy) {
    var sf = null
    if (typeof kb.fetcher !== 'undefined') {
      sf = kb.fetcher
    } else {
      return
    }
    if (p.termType !== 'symbol') return
    var docuri = $rdf.Util.uri.docpart(p.uri)
    var fixuri
    if (p.uri.indexOf('#') < 0) { // No hash
      // @@ major hack for dbpedia Categories, which spread indefinitely
      if ($rdf.Util.string_startswith(p.uri, 'http://dbpedia.org/resource/Category:')) return

      /*
        if (string_startswith(p.uri, 'http://xmlns.com/foaf/0.1/')) {
        fixuri = "http://dig.csail.mit.edu/2005/ajar/ajaw/test/foaf"
        // should give HTTP 303 to ontology -- now is :-)
        } else
      */
      if ($rdf.Util.string_startswith(p.uri,
              'http://purl.org/dc/elements/1.1/') ||
            $rdf.Util.string_startswith(p.uri, 'http://purl.org/dc/terms/')) {
        fixuri = 'http://dublincore.org/2005/06/13/dcq'
      // dc fetched multiple times
      } else if ($rdf.Util.string_startswith(p.uri, 'http://xmlns.com/wot/0.1/')) {
        fixuri = 'http://xmlns.com/wot/0.1/index.rdf'
      } else if ($rdf.Util.string_startswith(p.uri, 'http://web.resource.org/cc/')) {
        //            $rdf.log.warn("creative commons links to html instead of rdf. doesn't seem to content-negotiate.")
        fixuri = 'http://web.resource.org/cc/schema.rdf'
      }
    }
    if (fixuri) {
      docuri = fixuri
    }
    if (sf && sf.getState(docuri) !== 'unrequested') return

    if (fixuri) { // only give warning once: else happens too often
      $rdf.log.warn('Assuming server still broken, faking redirect of <' + p.uri +
        '> to <' + docuri + '>')
    }
    sf.requestURI(docuri, requestedBy)
  }, // AJAR_handleNewTerm

  ArrayIndexOf: function (arr, item, i) {
    i || (i = 0)
    var length = arr.length
    if (i < 0) i = length + i
    for (; i < length; i++) {
      if (arr[i] === item) {
        return i
      }
    }
    return -1
  }

}

// //////////////// find the variables in a graph
//  SHALLOW
//  used?
//
$rdf.Util.variablesIn = function (g) {
  for (var i = 0; i < g.statements.length; i++) {
    var st = g.statatements[i]
    var vars = {}
    if (st.subject instanceof $rdf.Variable) {
      vars[st.subject.toNT()] = true
    }
    if (st.predicate instanceof $rdf.Variable) {
      vars[st.predicate.toNT()] = true
    }
    if (st.object instanceof $rdf.Variable) {
      vars[st.object.toNT()] = true
    }
  }
  return vars
}

//   Heavy comparison is for repeatable canonical ordering
$rdf.Util.heavyCompare = function (x, y, g) {
  var nonBlank = function (x) {
    return (x.termType === 'bnode') ? null : x
  }
  var signature = function (b) {
    var lis = g.statementsMatching(x).map(function (st) {
      return ('' + nonBlank(st.subject) + ' ' + nonBlank(st.predicate) +
        ' ' + nonBlank(st.object))
    }).concat(g.statementsMatching(undefined, undefined, x).map(function (st) {
      return ('' + nonBlank(st.subject) + ' ' + nonBlank(st.predicate) +
        ' ' + nonBlank(st.object))
    }))
    lis.sort()
    return lis.join('\n')
  }
  if ((x.termType === 'bnode') || (y.termType === 'bnode')) {
    if (x.compareTerm(y) === 0) return 0 // Same
    if (signature(x) > signature(y)) return +1
    if (signature(x) < signature(y)) return -1
    return x.compareTerm(y)  // Too bad -- this order not canonical.
    // throw "different bnodes indistinquishable for sorting"
  } else {
    return x.compareTerm(y)
  }
}

$rdf.Util.heavyCompareSPO = function (x, y, g) {
  var comp = $rdf.Util.heavyCompare
  var d = comp(x.subject, y.subject, g)
  if (d) return d
  d = comp(x.predicate, y.predicate, g)
  if (d) return d
  return comp(x.object, y.object, g)
}

// /////////////////// Parse XML
//
// Returns: A DOM
//

$rdf.Util.parseXML = function (str, options) {
  var dparser
  options = options || {}
  if ((typeof tabulator !== 'undefined' && tabulator.isExtension)) {
    dparser = Components.classes['@mozilla.org/xmlextras/domparser;1'].getService(
      Components.interfaces.nsIDOMParser)
  } else if (typeof module !== 'undefined' && module && module.exports) { // Node.js
    // var libxmljs = require('libxmljs'); // Was jsdom before 2012-01 then libxmljs but that nonstandard
    // return libxmljs.parseXmlString(str)

    // var jsdom = require('jsdom');   2012-01 though 2015-08 no worky with new Node
    // var dom = jsdom.jsdom(str, undefined, {} );// html, level, options

    var DOMParser = require('xmldom').DOMParser // 2015-08 on https://github.com/jindw/xmldom
    var dom = new DOMParser().parseFromString(str, options.contentType || 'application/xhtml+xml')
    return dom
  } else {
    if (typeof window !== 'undefined' && window.DOMParser) {
      dparser = new window.DOMParser() // seems to actually work
    } else {
      dparser = new DOMParser() // Doc says this works
    }
  }
  return dparser.parseFromString(str, 'application/xml')
}

// ////////////////////String Utility
// substitutes given terms for occurrnces of %s
// not well named. Used??? - tim
//
$rdf.Util.string = {
  // C++, python style %s -> subs
  'template': function (base, subs) {
    var baseA = base.split('%s')
    var result = ''
    for (var i = 0;i < subs.length;i++) {
      subs[i] += ''
      result += baseA[i] + subs[i]
    }
    return result + baseA.slice(subs.length).join()
  }
}

//From https://github.com/linkeddata/dokieli
$rdf.Util.domToString = function(node, options) {
  var options = options || {}
  var selfClosing = []
  if ('selfClosing' in options) {
    options.selfClosing.split(' ').forEach(function (n) {
      selfClosing[n] = true
    })
  }
  var skipAttributes = [];
  if ('skipAttributes' in options) {
    options.skipAttributes.split(' ').forEach(function (n) {
      skipAttributes[n] = true
    })
  }

  var noEsc = [false];

  var dumpNode = function(node) {
    var out = ''
    if (typeof node.nodeType === 'undefined') return out
    if (1 === node.nodeType) {
      if (node.hasAttribute('class') && 'classWithChildText' in options && node.matches(options.classWithChildText.class)) {
        out += node.querySelector(options.classWithChildText.element).textContent
      }
      else if (!('skipNodeWithClass' in options && node.matches('.' + options.skipNodeWithClass))) {
        var ename = node.nodeName.toLowerCase()
        out += "<" + ename

        var attrList = []
        for (var i = node.attributes.length - 1; i >= 0; i--) {
          var atn = node.attributes[i]
          if (skipAttributes.length > 0 && skipAttributes[atn.name]) continue
          if (/^\d+$/.test(atn.name)) continue
          if (atn.name == 'class' && 'replaceClassItemWith' in options && (atn.value.split(' ').indexOf(options.replaceClassItemWith.source) > -1)) {
            var re = new RegExp(options.replaceClassItemWith.source, 'g')
            atn.value = atn.value.replace(re, options.replaceClassItemWith.target).trim()
          }
          if (!(atn.name == 'class' && 'skipClassWithValue' in options && options.skipClassWithValue == atn.value)) {
            attrList.push(atn.name + "=\"" + atn.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + "\"")
          }
        }

        if (attrList.length > 0) {
          if('sortAttributes' in options && options.sortAttributes) {
            attrList.sort(function (a, b) {
              return a.toLowerCase().localeCompare(b.toLowerCase())
            })
          }
          out += ' ' + attrList.join(' ')
        }

        if (selfClosing[ename]) { out += " />"; }
        else {
          out += '>';
          out += (ename == 'html') ? "\n  " : ''
          noEsc.push(ename === "style" || ename === "script");
          for (var i = 0; i < node.childNodes.length; i++) out += dumpNode(node.childNodes[i])
          noEsc.pop()
          out += (ename == 'body') ? '</' + ename + '>' + "\n" : '</' + ename + '>'
        }
      }
    }
    else if (8 === node.nodeType) {
      //FIXME: If comments are not tabbed in source, a new line is not prepended
      out += "<!--" + node.nodeValue + "-->"
    }
    else if (3 === node.nodeType || 4 === node.nodeType) {
      //XXX: Remove new lines which were added after DOM ready
      var nl = node.nodeValue.replace(/\n+$/, '')
      out += noEsc[noEsc.length - 1] ? nl : nl.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }
    else {
      console.log("Warning; Cannot handle serialising nodes of type: " + node.nodeType)
      console.log(node)
    }
    return out
  };

  return dumpNode(node)
}

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
        options, name, src, copy

    // Handle a deep copy situation
    if (typeof target === "boolean") {
        deep = target
        target = arguments[1] || {}
        // skip the boolean and the target
        i = 2
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && !jQuery.isFunction(target)) {
        target = {}
    }

    // extend jQuery itself if only one argument is passed
    if (length === i) {
        target = this
        --i
    }

    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
                src = target[name]
                copy = options[name]

                // Prevent never-ending loop
                if (target === copy) {
                    continue
                }

                // Recurse if we're merging object values
                if (deep && copy && typeof copy === "object" && !copy.nodeType) {
                    var clone

                    if (src) {
                        clone = src
                    } else if (jQuery.isArray(copy)) {
                        clone = []
                    } else if (jQuery.isObject(copy)) {
                        clone = {}
                    } else {
                        clone = copy
                    }

                    // Never move original objects, clone them
                    target[name] = jQuery.extend(deep, clone, copy)

                    // Don't bring in undefined values
                } else if (copy !== undefined) {
                    target[name] = copy
                }
            }
        }
    }

    // Return the modified object
    return target
}
*/
