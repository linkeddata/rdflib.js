/*
# Implements URI-specific functions
#
# See RFC 2386
#
# See also:
#   http://www.w3.org/2005/10/ajaw/uri.js
#   http://www.w3.org/2000/10/swap/uripath.py
#
*/

var $rdf, k, v, _base, _ref, _ref1, _ref2,
  __hasProp = {}.hasOwnProperty;

if (typeof $rdf === "undefined" || $rdf === null) {
  $rdf = {};
}

if ((_ref = $rdf.Util) == null) {
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
    baseScheme = base.slice(0, baseColon + 1 || 9e9);
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
      path = path.slice(0, lastSlash + 1 || 9e9);
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
    var c, i, j, k, l, n, s, _i, _j, _k, _len, _len1, _ref1;
    if (!base) {
      return uri;
    }
    if (base === uri) {
      return '';
    }
    for (i = _i = 0, _len = uri.length; _i < _len; i = ++_i) {
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
    _ref1 = base.slice(i);
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      c = _ref1[_j];
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
      for (j = _k = 1; 1 <= n ? _k <= n : _k >= n; j = 1 <= n ? ++_k : --_k) {
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

}).call(this);

$rdf.Util.uri = $rdf.uri;

if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
  if ((_ref1 = (_base = module.exports).Util) == null) {
    _base.Util = {};
  }
  _ref2 = $rdf.Util;
  for (k in _ref2) {
    if (!__hasProp.call(_ref2, k)) continue;
    v = _ref2[k];
    module.exports.Util[k] = v;
  }
  module.exports.uri = $rdf.uri;
}
