/*
 * Updates-Via
 */
var $rdf, k, v,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty;

if (typeof $rdf === "undefined" || $rdf === null) {
  $rdf = {};
}

$rdf.UpdatesSocket = (function() {
  function UpdatesSocket(parent, via) {
    var error;
    this.parent = parent;
    this.via = via;
    this.subscribe = __bind(this.subscribe, this);
    this.onError = __bind(this.onError, this);
    this.onMessage = __bind(this.onMessage, this);
    this.onClose = __bind(this.onClose, this);
    this.onOpen = __bind(this.onOpen, this);
    this._subscribe = __bind(this._subscribe, this);
    this._send = __bind(this._send, this);
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
    } catch (_error) {
      error = _error;
      this.onError(error);
    }
  }

  UpdatesSocket.prototype._decode = function(q) {
    var elt, i, k, r, v, _ref, _ref1;
    r = {};
    _ref = (function() {
      var _i, _len, _ref, _results;
      _ref = q.split('&');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elt = _ref[_i];
        _results.push(elt.split('='));
      }
      return _results;
    })();
    for (i in _ref) {
      elt = _ref[i];
      _ref1 = [decodeURIComponent(elt[0]), decodeURIComponent(elt[1])], k = _ref1[0], v = _ref1[1];
      if (r[k] == null) {
        r[k] = [];
      }
      r[k].push(v);
    }
    return r;
  };

  UpdatesSocket.prototype._send = function(method, uri, data) {
    var message, _base;
    message = [method, uri, data].join(' ');
    return typeof (_base = this.socket).send === "function" ? _base.send(message) : void 0;
  };

  UpdatesSocket.prototype._subscribe = function(uri) {
    this._send('sub', uri, '');
    return this.subscribed[uri] = true;
  };

  UpdatesSocket.prototype.onOpen = function(e) {
    var uri, _results;
    this.connected = true;
    _results = [];
    for (uri in this.pending) {
      delete this.pending[uri];
      _results.push(this._subscribe(uri));
    }
    return _results;
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
    var message, _base;
    message = e.data.split(' ');
    if (message[0] === 'ping') {
      return typeof (_base = this.socket).send === "function" ? _base.send('pong ' + message.slice(1).join(' ')) : void 0;
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
    this.onUpdate = __bind(this.onUpdate, this);
    this.onHeaders = __bind(this.onHeaders, this);
    this.register = __bind(this.register, this);
    this.graph = {};
    this.via = {};
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
    if (!__hasProp.call($rdf, k)) continue;
    v = $rdf[k];
    module.exports[k] = v;
  }
}
