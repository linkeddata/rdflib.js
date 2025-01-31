/**
 * Utility functions for $rdf
 * @module util
 */
import { docpart } from './uri';
import log from './log';
import * as uri from './uri';
import NamedNode from './named-node';
const string = {
  template: stringTemplate
};
export { log, uri, string };
export function mediaTypeClass(mediaType) {
  mediaType = mediaType.split(';')[0].trim(); // remove media type parameters
  return new NamedNode('http://www.w3.org/ns/iana/media-types/' + mediaType + '#Resource');
}
export function linkRelationProperty(relation) {
  return new NamedNode('http://www.w3.org/ns/iana/link-relations/relation#' + relation.trim());
}

/**
 * Adds callback functionality to an object.
 * Callback functions are indexed by a 'hook' string.
 * They return true if they want to be called again.
 * @method callbackify
 * @param obj {Object}
 * @param callbacks {Array<string>}
 */
export function callbackify(obj, callbacks) {
  obj.callbacks = {};
  for (var x = callbacks.length - 1; x >= 0; x--) {
    obj.callbacks[callbacks[x]] = [];
  }
  obj.addHook = function (hook) {
    if (!obj.callbacks[hook]) {
      obj.callbacks[hook] = [];
    }
  };
  obj.addCallback = function (hook, func) {
    obj.callbacks[hook].push(func);
  };
  obj.removeCallback = function (hook, funcName) {
    for (var i = 0; i < obj.callbacks[hook].length; i++) {
      if (obj.callbacks[hook][i].name === funcName) {
        obj.callbacks[hook].splice(i, 1);
        return true;
      }
    }
    return false;
  };
  obj.insertCallback = function (hook, func) {
    obj.callbacks[hook].unshift(func);
  };
  obj.fireCallbacks = function fireCallbacks(hook, args) {
    var newCallbacks = [];
    var replaceCallbacks = [];
    var len = obj.callbacks[hook].length;
    var x;
    let callback;

    // log.info('!@$ Firing '+hook+' call back with length'+len)
    for (x = len - 1; x >= 0; x--) {
      // log.info('@@ Firing '+hook+' callback '+ obj.callbacks[hook][x])
      callback = obj.callbacks[hook][x];
      if (callback && callback.apply(obj, args)) {
        newCallbacks.push(callback);
      }
    }
    for (x = newCallbacks.length - 1; x >= 0; x--) {
      replaceCallbacks.push(newCallbacks[x]);
    }
    for (x = len; x < obj.callbacks[hook].length; x++) {
      replaceCallbacks.push(obj.callbacks[hook][x]);
    }
    obj.callbacks[hook] = replaceCallbacks;
  };
}

/**
 * Returns a DOM parser based on current runtime environment.
 */
export function DOMParserFactory() {
  if (window.DOMParser) {
    return new DOMParser();
  } else if (window.ActiveXObject) {
    return new ActiveXObject('Microsoft.XMLDOM');
  } else {
    return false;
  }
}

// From https://github.com/linkeddata/dokieli
export function domToString(node, options) {
  options = options || {};
  var selfClosing = [];
  if (options && options.selfClosing) {
    options.selfClosing.split(' ').forEach(function (n) {
      selfClosing[n] = true;
    });
  }
  var skipAttributes = [];
  if (options && options.skipAttributes) {
    options.skipAttributes.split(' ').forEach(function (n) {
      skipAttributes[n] = true;
    });
  }
  return dumpNode(node, options, selfClosing, skipAttributes);
}
export function dumpNode(node, options, selfClosing, skipAttributes) {
  var i;
  var out = '';
  var noEsc = [false];
  if (typeof node.nodeType === 'undefined') return out;
  if (node.nodeType === 1) {
    if (node.hasAttribute('class') && options && options.classWithChildText && node.matches(options.classWithChildText.class)) {
      out += node.querySelector(options.classWithChildText.element).textContent;
    } else if (!(options && options.skipNodeWithClass && node.matches('.' + options.skipNodeWithClass))) {
      var ename = node.nodeName.toLowerCase();
      out += '<' + ename;
      var attrList = [];
      for (i = node.attributes.length - 1; i >= 0; i--) {
        var atn = node.attributes[i];
        if (skipAttributes && skipAttributes.length > 0 && skipAttributes[atn.name]) continue;
        if (/^\d+$/.test(atn.name)) continue;
        if (atn.name === 'class' && options && options.replaceClassItemWith && atn.value.split(' ').indexOf(options.replaceClassItemWith.source) > -1) {
          var re = new RegExp(options.replaceClassItemWith.source, 'g');
          atn.value = atn.value.replace(re, options.replaceClassItemWith.target).trim();
        }
        if (!(atn.name === 'class' && options && options.skipClassWithValue && options.skipClassWithValue === atn.value)) {
          attrList.push(atn.name + '=\'' + atn.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;') + '\'');
        }
      }
      if (attrList.length > 0) {
        if (options && options.sortAttributes) {
          attrList.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
          });
        }
        out += ' ' + attrList.join(' ');
      }
      if (selfClosing && selfClosing.ename) {
        out += ' />';
      } else {
        out += '>';
        out += ename === 'html' ? '\n  ' : '';
        noEsc.push(ename === 'style' || ename === 'script');
        for (i = 0; i < node.childNodes.length; i++) out += dumpNode(node.childNodes[i]);
        noEsc.pop();
        out += ename === 'body' ? '</' + ename + '>' + '\n' : '</' + ename + '>';
      }
    }
  } else if (node.nodeType === 8) {
    // FIXME: If comments are not tabbed in source, a new line is not prepended
    out += '<!--' + node.nodeValue + '-->';
  } else if (node.nodeType === 3 || node.nodeType === 4) {
    // XXX: Remove new lines which were added after DOM ready
    var nl = node.nodeValue.replace(/\n+$/, '');
    out += noEsc[noEsc.length - 1] ? nl : nl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  } else {
    console.log('Warning; Cannot handle serialising nodes of type: ' + node.nodeType);
    console.log(node);
  }
  return out;
}
export function dtstamp() {
  var now = new Date();
  var year = now.getYear() + 1900;
  var month = now.getMonth() + 1;
  var day = now.getDate();
  var hour = now.getUTCHours();
  var minute = now.getUTCMinutes();
  var second = now.getSeconds();
  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  if (hour < 10) hour = '0' + hour;
  if (minute < 10) minute = '0' + minute;
  if (second < 10) second = '0' + second;
  return year + '-' + month + '-' + day + 'T' + hour + ':' + minute + ':' + second + 'Z';
}

/**
 * Compares statements (heavy comparison for repeatable canonical ordering)
 */
export function heavyCompare(x, y, g, uriMap) {
  var nonBlank = function (x) {
    return x.termType === 'BlankNode' ? null : x;
  };
  var signature = function (x) {
    var lis = g.statementsMatching(x).map(function (st) {
      return '' + nonBlank(st.subject) + ' ' + nonBlank(st.predicate) + ' ' + nonBlank(st.object);
    }).concat(g.statementsMatching(undefined, undefined, x).map(function (st) {
      return '' + nonBlank(st.subject) + ' ' + nonBlank(st.predicate) + ' ' + nonBlank(st.object);
    }));
    lis.sort();
    return lis.join('\n');
  };
  const comparison = Object.prototype.hasOwnProperty.call(g, "compareTerms") ? g.compareTerms(x, y) : x.compareTerm(y);
  if (x.termType === 'BlankNode' && y.termType === 'BlankNode') {
    if (comparison === 0) return 0; // Same
    if (signature(x) > signature(y)) return +1;
    if (signature(x) < signature(y)) return -1;
    return comparison; // Too bad -- this order not canonical.
    // throw "different bnodes indistinquishable for sorting"
  } else {
    if (uriMap && x.uri && y.uri) {
      return (uriMap[x.uri] || x.uri).localeCompare(uriMap[y.uri] || y.uri);
    }
    return comparison;
  }
}
export function heavyCompareSPO(x, y, g, uriMap) {
  return heavyCompare(x.subject, y.subject, g, uriMap) || heavyCompare(x.predicate, y.predicate, g, uriMap) || heavyCompare(x.object, y.object, g, uriMap);
}

/**
 * Defines a simple debugging function
 * @method output
 * @param o {String}
 */
export function output(o) {
  var k = document.createElement('div');
  k.textContent = o;
  document.body.appendChild(k);
}
import { DOMParser } from '@xmldom/xmldom';

/**
 * Returns a DOM from parsed XML.
 */
export function parseXML(str, options) {
  var dparser;
  options = options || {};
  if (typeof module !== 'undefined' && module && module.exports) {
    // Node.js
    var dom = new DOMParser().parseFromString(str, options.contentType || 'application/xhtml+xml');
    return dom;
  } else {
    if (typeof window !== 'undefined' && window.DOMParser) {
      dparser = new window.DOMParser(); // seems to actually work
    } else {
      dparser = new DOMParser(); // Doc says this works
    }
  }
  return dparser.parseFromString(str, 'application/xml');
}

/**
 * Removes all statements equal to x from a
 */
export function RDFArrayRemove(a, x) {
  for (var i = 0; i < a.length; i++) {
    // TODO: This used to be the following, which didnt always work..why
    // if(a[i] === x)
    if (a[i].subject.equals(x.subject) && a[i].predicate.equals(x.predicate) && a[i].object.equals(x.object) && a[i].why.equals(x.why)) {
      a.splice(i, 1);
      return;
    }
  }
  throw new Error('RDFArrayRemove: Array did not contain ' + x + ' ' + x.why);
}
export function string_startswith(str, pref) {
  // missing library routines
  return str.slice(0, pref.length) === pref;
}

/**
 * C++, python style %s -> subs
 */
function stringTemplate(base, subs) {
  var baseA = base.split('%s');
  var result = '';
  for (var i = 0; i < subs.length; i++) {
    subs[i] += '';
    result += baseA[i] + subs[i];
  }
  return result + baseA.slice(subs.length).join();
}

// Stack dump on errors - to pass errors back

export function stackString(e) {
  var str = '' + e + '\n';
  if (!e.stack) {
    return str + 'No stack available.\n';
  }
  var lines = e.stack.toString().split('\n');
  var toprint = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf('ecmaunit.js') > -1) {
      // remove useless bit of traceback
      break;
    }
    if (line.charAt(0) == '(') {
      line = 'function' + line;
    }
    var chunks = line.split('@');
    toprint.push(chunks);
  }
  // toprint.reverse();  No - I prefer the latest at the top by the error message -tbl

  for (var i = 0; i < toprint.length; i++) {
    str += '  ' + toprint[i][1] + '\n    ' + toprint[i][0];
  }
  return str;
}