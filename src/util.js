/**
 * Utility functions for $rdf
 * @module util
 */
var docpart = require('./uri').docpart
var log = require('./log')
var NamedNode = require('./named-node')

module.exports.AJAR_handleNewTerm = ajarHandleNewTerm
module.exports.ArrayIndexOf = arrayIndexOf
module.exports.callbackify = callbackify
module.exports.dtstamp = dtstamp
module.exports.DOMParserFactory = domParser
module.exports.domToString = domToString
module.exports.dumpNode = dumpNode
module.exports.heavyCompare = heavyCompare
module.exports.heavyCompareSPO = heavyCompareSPO
module.exports.output = output
module.exports.parseXML = parseXML
module.exports.RDFArrayRemove = rdfArrayRemove
module.exports.stackString = stackString
module.exports.string_startswith = stringStartsWith
module.exports.string = {}
module.exports.string.template = stringTemplate
module.exports.uri = require('./uri')  // TODO: Remove this mixed usage
module.exports.log = log

module.exports.mediaTypeClass = function(mediaType){
  mediaType = mediaType.split(';')[0].trim()  // remove media type parameters
  return new NamedNode('http://www.w3.org/ns/iana/media-types/' + mediaType + '#Resource')
}

module.exports.linkRelationProperty = function(relation){
  return new NamedNode('http://www.w3.org/ns/iana/link-relations/relation#' + relation.trim())
}

/**
 * Loads ontologies of the data we load (this is the callback from the kb to
 * the fetcher). Exports as `AJAR_handleNewTerm`
 */
function ajarHandleNewTerm (kb, p, requestedBy) {
  var sf = null
  if (typeof kb.fetcher !== 'undefined') {
    sf = kb.fetcher
  } else {
    return
  }
  if (p.termType !== 'NamedNode') return
  var docuri = docpart(p.uri)
  var fixuri
  if (p.uri.indexOf('#') < 0) { // No hash
    // @@ major hack for dbpedia Categories, which spread indefinitely
    if (stringStartsWith(p.uri, 'http://dbpedia.org/resource/Category:')) return

    /*
      if (string_startswith(p.uri, 'http://xmlns.com/foaf/0.1/')) {
      fixuri = "http://dig.csail.mit.edu/2005/ajar/ajaw/test/foaf"
      // should give HTTP 303 to ontology -- now is :-)
      } else
    */
    if (stringStartsWith(p.uri,
            'http://purl.org/dc/elements/1.1/') ||
          stringStartsWith(p.uri, 'http://purl.org/dc/terms/')) {
      fixuri = 'http://dublincore.org/2005/06/13/dcq'
    // dc fetched multiple times
    } else if (stringStartsWith(p.uri, 'http://xmlns.com/wot/0.1/')) {
      fixuri = 'http://xmlns.com/wot/0.1/index.rdf'
    } else if (stringStartsWith(p.uri, 'http://web.resource.org/cc/')) {
      //            log.warn("creative commons links to html instead of rdf. doesn't seem to content-negotiate.")
      fixuri = 'http://web.resource.org/cc/schema.rdf'
    }
  }
  if (fixuri) {
    docuri = fixuri
  }
  if (sf && sf.getState(docuri) !== 'unrequested') return

  if (fixuri) { // only give warning once: else happens too often
    log.warn('Assuming server still broken, faking redirect of <' + p.uri +
      '> to <' + docuri + '>')
  }

  return sf.fetch(docuri, { referringTerm: requestedBy })
}

/**
 * Exports as `ArrayIndexOf`.
 */
function arrayIndexOf (arr, item, i) {
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

/**
 * Adds callback functionality to an object.
 * Callback functions are indexed by a 'hook' string.
 * They return true if they want to be called again.
 * @method callbackify
 * @param obj {Object}
 * @param callbacks {Array<Function>}
 */
function callbackify (obj, callbacks) {
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

  obj.fireCallbacks = function fireCallbacks (hook, args) {
    var newCallbacks = []
    var replaceCallbacks = []
    var len = obj.callbacks[hook].length
    var x
    let callback

    // log.info('!@$ Firing '+hook+' call back with length'+len)
    for (x = len - 1; x >= 0; x--) {
      // log.info('@@ Firing '+hook+' callback '+ obj.callbacks[hook][x])
      callback = obj.callbacks[hook][x]
      if (callback && callback.apply(obj, args)) {
        newCallbacks.push(callback)
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
}

/**
 * Returns a DOM parser based on current runtime environment.
 * Exports as `DOMParserFactory`
 */
function domParser () {
  if (window.DOMParser) {
    return new DOMParser()
  } else if (window.ActiveXObject) {
    return new ActiveXObject('Microsoft.XMLDOM')
  } else {
    return false
  }
}

// From https://github.com/linkeddata/dokieli
function domToString (node, options) {
  options = options || {}
  var selfClosing = []
  if ('selfClosing' in options) {
    options.selfClosing.split(' ').forEach(function (n) {
      selfClosing[n] = true
    })
  }
  var skipAttributes = []
  if ('skipAttributes' in options) {
    options.skipAttributes.split(' ').forEach(function (n) {
      skipAttributes[n] = true
    })
  }
  return dumpNode(node, options, selfClosing, skipAttributes)
}

function dumpNode (node, options, selfClosing, skipAttributes) {
  var i
  var out = ''
  var noEsc = [ false ]
  if (typeof node.nodeType === 'undefined') return out
  if (node.nodeType === 1) {
    if (node.hasAttribute('class') && 'classWithChildText' in options && node.matches(options.classWithChildText.class)) {
      out += node.querySelector(options.classWithChildText.element).textContent
    } else if (!('skipNodeWithClass' in options && node.matches('.' + options.skipNodeWithClass))) {
      var ename = node.nodeName.toLowerCase()
      out += '<' + ename

      var attrList = []
      for (i = node.attributes.length - 1; i >= 0; i--) {
        var atn = node.attributes[i]
        if (skipAttributes.length > 0 && skipAttributes[atn.name]) continue
        if (/^\d+$/.test(atn.name)) continue
        if (atn.name === 'class' && 'replaceClassItemWith' in options && (atn.value.split(' ').indexOf(options.replaceClassItemWith.source) > -1)) {
          var re = new RegExp(options.replaceClassItemWith.source, 'g')
          atn.value = atn.value.replace(re, options.replaceClassItemWith.target).trim()
        }
        if (!(atn.name === 'class' && 'skipClassWithValue' in options && options.skipClassWithValue === atn.value)) {
          attrList.push(atn.name + '=\'' + atn.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;') + '\'')
        }
      }
      if (attrList.length > 0) {
        if ('sortAttributes' in options && options.sortAttributes) {
          attrList.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase())
          })
        }
        out += ' ' + attrList.join(' ')
      }
      if (selfClosing[ename]) {
        out += ' />'
      } else {
        out += '>'
        out += (ename === 'html') ? '\n  ' : ''
        noEsc.push(ename === 'style' || ename === 'script')
        for (i = 0; i < node.childNodes.length; i++) out += dumpNode(node.childNodes[i])
        noEsc.pop()
        out += (ename === 'body') ? '</' + ename + '>' + '\n' : '</' + ename + '>'
      }
    }
  } else if (node.nodeType === 8) {
    // FIXME: If comments are not tabbed in source, a new line is not prepended
    out += '<!--' + node.nodeValue + '-->'
  } else if (node.nodeType === 3 || node.nodeType === 4) {
    // XXX: Remove new lines which were added after DOM ready
    var nl = node.nodeValue.replace(/\n+$/, '')
    out += noEsc[noEsc.length - 1] ? nl : nl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  } else {
    console.log('Warning; Cannot handle serialising nodes of type: ' + node.nodeType)
    console.log(node)
  }
  return out
}

function dtstamp () {
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
}

/**
 * Compares statements (heavy comparison for repeatable canonical ordering)
 */
function heavyCompare (x, y, g, uriMap) {
  var nonBlank = function (x) {
    return (x.termType === 'BlankNode') ? null : x
  }
  var signature = function (x) {
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
  if ((x.termType === 'BlankNode') && (y.termType === 'BlankNode')) {
    if (x.compareTerm(y) === 0) return 0 // Same
    if (signature(x) > signature(y)) return +1
    if (signature(x) < signature(y)) return -1
    return x.compareTerm(y)  // Too bad -- this order not canonical.
    // throw "different bnodes indistinquishable for sorting"
  } else {
    if (uriMap && x.uri && y.uri){
      return (uriMap[x.uri] || x.uri).localeCompare(uriMap[y.uri] || y.uri)
    }
    return x.compareTerm(y)
  }
}

function heavyCompareSPO (x, y, g, uriMap) {
  return heavyCompare(x.subject, y.subject, g, uriMap) ||
    heavyCompare(x.predicate, y.predicate, g, uriMap) ||
    heavyCompare(x.object, y.object, g, uriMap)
}

/**
 * Defines a simple debugging function
 * @method output
 * @param o {String}
 */
function output (o) {
  var k = document.createElement('div')
  k.textContent = o
  document.body.appendChild(k)
}

/**
 * Returns a DOM from parsex XML.
 */
function parseXML (str, options) {
  var dparser
  options = options || {}
  if (typeof module !== 'undefined' && module && module.exports) { // Node.js
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

/**
 * Removes all statements equal to x from a
 * Exports as `RDFArrayRemove`
 */
function rdfArrayRemove (a, x) {
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
}

function stringStartsWith (str, pref) { // missing library routines
  return (str.slice(0, pref.length) === pref)
}

/**
 * C++, python style %s -> subs
 */
function stringTemplate (base, subs) {
  var baseA = base.split('%s')
  var result = ''
  for (var i = 0;i < subs.length;i++) {
    subs[i] += ''
    result += baseA[i] + subs[i]
  }
  return result + baseA.slice(subs.length).join()
}


// Stack dump on errors - to pass errors back

function stackString (e) {
  var str = '' + e + '\n'
  if (!e.stack) {
    return str + 'No stack available.\n'
  }
  var lines = e.stack.toString().split('\n')
  var toprint = []
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    if (line.indexOf('ecmaunit.js') > -1) {
      // remove useless bit of traceback
      break
    }
    if (line.charAt(0) == '(') {
      line = 'function' + line
    }
    var chunks = line.split('@')
    toprint.push(chunks)
  }
  // toprint.reverse();  No - I prefer the latest at the top by the error message -tbl

  for (var i = 0; i < toprint.length; i++) {
    str += '  ' + toprint[i][1] + '\n    ' + toprint[i][0]
  }
  return str
}
