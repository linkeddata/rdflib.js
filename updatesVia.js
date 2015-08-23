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
    var error;
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
    } catch (_error) {
      error = _error;
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
