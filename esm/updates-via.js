import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";

/*
 * Updates-Via
 */
import DataFactory from './factories/rdflib-data-factory';
export var UpdatesSocket = /*#__PURE__*/function () {
  function UpdatesSocket(parent, via) {
    _classCallCheck(this, UpdatesSocket);

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

  _createClass(UpdatesSocket, [{
    key: "_decode",
    value: function _decode(q) {
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
  }, {
    key: "_send",
    value: function _send(method, uri, data) {
      var base, message;
      message = [method, uri, data].join(' ');
      return typeof (base = this.socket).send === 'function' ? base.send(message) : void 0;
    }
  }, {
    key: "_subscribe",
    value: function _subscribe(uri) {
      this._send('sub', uri, '');

      this.subscribed[uri] = true;
      return this.subscribed[uri];
    }
  }, {
    key: "onClose",
    value: function onClose(e) {
      var uri;
      this.connected = false;

      for (uri in this.subscribed) {
        this.pending[uri] = true;
      }

      this.subscribed = {};
      return this.subscribed;
    }
  }, {
    key: "onError",
    value: function onError(e) {
      throw new Error('onError' + e);
    }
  }, {
    key: "onMessage",
    value: function onMessage(e) {
      var base, message;
      message = e.data.split(' ');

      if (message[0] === 'ping') {
        return typeof (base = this.socket).send === 'function' ? base.send('pong ' + message.slice(1).join(' ')) : void 0;
      } else if (message[0] === 'pub') {
        return this.parent.onUpdate(message[1], this._decode(message[2]));
      }
    }
  }, {
    key: "onOpen",
    value: function onOpen(e) {
      var results, uri;
      this.connected = true;
      results = [];

      for (uri in this.pending) {
        delete this.pending[uri];
        results.push(this._subscribe(uri));
      }

      return results;
    }
  }, {
    key: "subscribe",
    value: function subscribe(uri) {
      if (this.connected) {
        return this._subscribe(uri);
      } else {
        this.pending[uri] = true;
        return this.pending[uri];
      }
    }
  }]);

  return UpdatesSocket;
}();
export var UpdatesVia = /*#__PURE__*/function () {
  function UpdatesVia(fetcher) {
    _classCallCheck(this, UpdatesVia);

    this.fetcher = fetcher;
    this.graph = {};
    this.via = {};
    this.fetcher.addCallback('headers', this.onHeaders);
  }

  _createClass(UpdatesVia, [{
    key: "onHeaders",
    value: function onHeaders(d) {
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
  }, {
    key: "onUpdate",
    value: function onUpdate(uri, d) {
      return this.fetcher.refresh(DataFactory.namedNode(uri));
    }
  }, {
    key: "register",
    value: function register(via, uri) {
      if (this.via[via] == null) {
        this.via[via] = new UpdatesSocket(this, via);
      }

      return this.via[via].subscribe(uri);
    }
  }]);

  return UpdatesVia;
}();