"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  term: true,
  NextId: true,
  fromNT: true,
  fetcher: true,
  graph: true,
  lit: true,
  st: true,
  sym: true,
  namedNode: true,
  blankNode: true,
  defaultGraph: true,
  literal: true,
  quad: true,
  triple: true,
  variable: true,
  ConnectedStore: true,
  LiveStore: true,
  BlankNode: true,
  Collection: true,
  Empty: true,
  Fetcher: true,
  Formula: true,
  Store: true,
  IndexedFormula: true,
  jsonParser: true,
  Literal: true,
  log: true,
  N3Parser: true,
  NamedNode: true,
  Namespace: true,
  Node: true,
  parse: true,
  Query: true,
  queryToSPARQL: true,
  RDFaProcessor: true,
  RDFParser: true,
  serialize: true,
  Serializer: true,
  SPARQLToQuery: true,
  sparqlUpdateParser: true,
  Statement: true,
  UpdateManager: true,
  UpdatesSocket: true,
  UpdatesVia: true,
  uri: true,
  Util: true,
  Variable: true,
  DataFactory: true,
  termValue: true
};
Object.defineProperty(exports, "BlankNode", {
  enumerable: true,
  get: function () {
    return _blankNode.default;
  }
});
Object.defineProperty(exports, "Collection", {
  enumerable: true,
  get: function () {
    return _collection.default;
  }
});
exports.ConnectedStore = void 0;
Object.defineProperty(exports, "DataFactory", {
  enumerable: true,
  get: function () {
    return _rdflibDataFactory.default;
  }
});
Object.defineProperty(exports, "Empty", {
  enumerable: true,
  get: function () {
    return _empty.default;
  }
});
Object.defineProperty(exports, "Fetcher", {
  enumerable: true,
  get: function () {
    return _fetcher.default;
  }
});
Object.defineProperty(exports, "Formula", {
  enumerable: true,
  get: function () {
    return _formula.default;
  }
});
Object.defineProperty(exports, "IndexedFormula", {
  enumerable: true,
  get: function () {
    return _store.default;
  }
});
Object.defineProperty(exports, "Literal", {
  enumerable: true,
  get: function () {
    return _literal.default;
  }
});
exports.LiveStore = void 0;
Object.defineProperty(exports, "N3Parser", {
  enumerable: true,
  get: function () {
    return _n3parser.default;
  }
});
Object.defineProperty(exports, "NamedNode", {
  enumerable: true,
  get: function () {
    return _namedNode.default;
  }
});
Object.defineProperty(exports, "Namespace", {
  enumerable: true,
  get: function () {
    return _namespace.default;
  }
});
exports.NextId = void 0;
Object.defineProperty(exports, "Node", {
  enumerable: true,
  get: function () {
    return _node.default;
  }
});
Object.defineProperty(exports, "Query", {
  enumerable: true,
  get: function () {
    return _query.Query;
  }
});
Object.defineProperty(exports, "RDFParser", {
  enumerable: true,
  get: function () {
    return _rdfxmlparser.default;
  }
});
Object.defineProperty(exports, "RDFaProcessor", {
  enumerable: true,
  get: function () {
    return _rdfaparser.default;
  }
});
Object.defineProperty(exports, "SPARQLToQuery", {
  enumerable: true,
  get: function () {
    return _sparqlToQuery.default;
  }
});
Object.defineProperty(exports, "Serializer", {
  enumerable: true,
  get: function () {
    return _serializer.default;
  }
});
Object.defineProperty(exports, "Statement", {
  enumerable: true,
  get: function () {
    return _statement.default;
  }
});
Object.defineProperty(exports, "Store", {
  enumerable: true,
  get: function () {
    return _store.default;
  }
});
Object.defineProperty(exports, "UpdateManager", {
  enumerable: true,
  get: function () {
    return _updateManager.default;
  }
});
Object.defineProperty(exports, "UpdatesSocket", {
  enumerable: true,
  get: function () {
    return _updatesVia.UpdatesSocket;
  }
});
Object.defineProperty(exports, "UpdatesVia", {
  enumerable: true,
  get: function () {
    return _updatesVia.UpdatesVia;
  }
});
exports.Util = void 0;
Object.defineProperty(exports, "Variable", {
  enumerable: true,
  get: function () {
    return _variable.default;
  }
});
exports.graph = exports.fromNT = exports.fetcher = exports.defaultGraph = exports.blankNode = void 0;
Object.defineProperty(exports, "jsonParser", {
  enumerable: true,
  get: function () {
    return _jsonparser.default;
  }
});
exports.literal = exports.lit = void 0;
Object.defineProperty(exports, "log", {
  enumerable: true,
  get: function () {
    return _log.default;
  }
});
exports.namedNode = void 0;
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function () {
    return _parse.default;
  }
});
exports.quad = void 0;
Object.defineProperty(exports, "queryToSPARQL", {
  enumerable: true,
  get: function () {
    return _queryToSparql.default;
  }
});
Object.defineProperty(exports, "serialize", {
  enumerable: true,
  get: function () {
    return _serialize.default;
  }
});
Object.defineProperty(exports, "sparqlUpdateParser", {
  enumerable: true,
  get: function () {
    return _patchParser.default;
  }
});
exports.term = exports.sym = exports.st = void 0;
Object.defineProperty(exports, "termValue", {
  enumerable: true,
  get: function () {
    return _termValue.termValue;
  }
});
exports.variable = exports.uri = exports.triple = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _blankNode = _interopRequireDefault(require("./blank-node"));
var _collection = _interopRequireDefault(require("./collection"));
var _empty = _interopRequireDefault(require("./empty"));
var _fetcher = _interopRequireDefault(require("./fetcher"));
var _formula = _interopRequireDefault(require("./formula"));
var _store = _interopRequireDefault(require("./store"));
var _jsonparser = _interopRequireDefault(require("./jsonparser"));
var _literal = _interopRequireDefault(require("./literal"));
var _log = _interopRequireDefault(require("./log"));
var _n3parser = _interopRequireDefault(require("./n3parser"));
var _namedNode = _interopRequireDefault(require("./named-node"));
var _namespace = _interopRequireDefault(require("./namespace"));
var _node = _interopRequireDefault(require("./node"));
var _parse = _interopRequireDefault(require("./parse"));
var _query = require("./query");
var _queryToSparql = _interopRequireDefault(require("./query-to-sparql"));
var _rdfaparser = _interopRequireDefault(require("./rdfaparser"));
var _rdfxmlparser = _interopRequireDefault(require("./rdfxmlparser"));
var _serialize = _interopRequireDefault(require("./serialize"));
var _serializer = _interopRequireDefault(require("./serializer"));
var _sparqlToQuery = _interopRequireDefault(require("./sparql-to-query"));
var _patchParser = _interopRequireDefault(require("./patch-parser"));
var _statement = _interopRequireDefault(require("./statement"));
var _updateManager = _interopRequireDefault(require("./update-manager"));
var _updatesVia = require("./updates-via");
var uri = _interopRequireWildcard(require("./uri"));
exports.uri = uri;
var Util = _interopRequireWildcard(require("./utils-js"));
exports.Util = Util;
var _variable = _interopRequireDefault(require("./variable"));
var _rdflibDataFactory = _interopRequireDefault(require("./factories/rdflib-data-factory"));
var _terms = require("./utils/terms");
Object.keys(_terms).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _terms[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _terms[key];
    }
  });
});
var _termValue = require("./utils/termValue");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// Prepare bound versions of data factory methods for export
const boundDataFactory = {};
for (const name in _rdflibDataFactory.default) {
  if (typeof _rdflibDataFactory.default[name] === 'function') boundDataFactory[name] = _rdflibDataFactory.default[name].bind(_rdflibDataFactory.default);
}
const {
  fetcher,
  graph,
  lit,
  st,
  namedNode,
  variable,
  blankNode,
  defaultGraph,
  literal,
  quad,
  triple
} = boundDataFactory;
exports.triple = triple;
exports.quad = quad;
exports.literal = literal;
exports.defaultGraph = defaultGraph;
exports.blankNode = blankNode;
exports.variable = variable;
exports.namedNode = exports.sym = namedNode;
exports.st = st;
exports.lit = lit;
exports.graph = graph;
exports.fetcher = fetcher;
const formula = new _formula.default();
const fromNT = str => formula.fromNT(str);
exports.fromNT = fromNT;
const term = exports.term = _node.default.fromValue;

// TODO: this export is broken;
// it exports the _current_ value of nextId, which is always 0
const NextId = exports.NextId = _blankNode.default.nextId;
class ConnectedStore extends _store.default {
  constructor(features) {
    super(features);
    (0, _defineProperty2.default)(this, "fetcher", void 0);
    this.fetcher = new _fetcher.default(this, {});
  }
}
exports.ConnectedStore = ConnectedStore;
class LiveStore extends ConnectedStore {
  constructor(features) {
    super(features);
    (0, _defineProperty2.default)(this, "updater", void 0);
    this.updater = new _updateManager.default(this);
  }
}
exports.LiveStore = LiveStore;