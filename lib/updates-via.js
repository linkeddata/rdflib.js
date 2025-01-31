"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdatesVia = exports.UpdatesSocket = void 0;
var _rdflibDataFactory = _interopRequireDefault(require("./factories/rdflib-data-factory"));
/*
 * Updates-Via
 */

class UpdatesSocket {
  constructor(parent, via) {
    this.parent = parent;
    this.via = via;
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
    } catch (error) {
      this.onError(error);
    }
  }
  _decode(q) {
    var elt;
    var i;
    var k;
    var r;
    var ref;
    var ref1;
    var v;
    r = {};
    ref = function () {
      var j, len, ref, results;
      ref = q.split('&');
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        elt = ref[j];
        results.push(elt.split('='));
      }
      return results;
    }();
    for (i in ref) {
      elt = ref[i];
      ref1 = [decodeURIComponent(elt[0]), decodeURIComponent(elt[1])];
      k = ref1[0];
      v = ref1[1];
      if (r[k] == null) {
        r[k] = [];
      }
      r[k].push(v);
    }
    return r;
  }
  _send(method, uri, data) {
    var base, message;
    message = [method, uri, data].join(' ');
    return typeof (base = this.socket).send === 'function' ? base.send(message) : void 0;
  }
  _subscribe(uri) {
    this._send('sub', uri, '');
    this.subscribed[uri] = true;
    return this.subscribed[uri];
  }
  onClose(e) {
    var uri;
    this.connected = false;
    for (uri in this.subscribed) {
      this.pending[uri] = true;
    }
    this.subscribed = {};
    return this.subscribed;
  }
  onError(e) {
    throw new Error('onError' + e);
  }
  onMessage(e) {
    var base, message;
    message = e.data.split(' ');
    if (message[0] === 'ping') {
      return typeof (base = this.socket).send === 'function' ? base.send('pong ' + message.slice(1).join(' ')) : void 0;
    } else if (message[0] === 'pub') {
      return this.parent.onUpdate(message[1], this._decode(message[2]));
    }
  }
  onOpen(e) {
    var results, uri;
    this.connected = true;
    results = [];
    for (uri in this.pending) {
      delete this.pending[uri];
      results.push(this._subscribe(uri));
    }
    return results;
  }
  subscribe(uri) {
    if (this.connected) {
      return this._subscribe(uri);
    } else {
      this.pending[uri] = true;
      return this.pending[uri];
    }
  }
}
exports.UpdatesSocket = UpdatesSocket;
class UpdatesVia {
  constructor(fetcher) {
    this.fetcher = fetcher;
    this.graph = {};
    this.via = {};
    this.fetcher.addCallback('headers', this.onHeaders);
  }
  onHeaders(d) {
    var etag, uri, via;
    if (d.headers == null) {
      return true;
    }
    if (typeof WebSocket === 'undefined' || WebSocket === null) {
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
  }
  onUpdate(uri, d) {
    return this.fetcher.refresh(_rdflibDataFactory.default.namedNode(uri));
  }
  register(via, uri) {
    if (this.via[via] == null) {
      this.via[via] = new UpdatesSocket(this, via);
    }
    return this.via[via].subscribe(uri);
  }
}
exports.UpdatesVia = UpdatesVia;