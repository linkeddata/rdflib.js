"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
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
  get: function get() {
    return _blankNode.default;
  }
});
Object.defineProperty(exports, "Collection", {
  enumerable: true,
  get: function get() {
    return _collection.default;
  }
});
exports.ConnectedStore = void 0;
Object.defineProperty(exports, "DataFactory", {
  enumerable: true,
  get: function get() {
    return _rdflibDataFactory.default;
  }
});
Object.defineProperty(exports, "Empty", {
  enumerable: true,
  get: function get() {
    return _empty.default;
  }
});
Object.defineProperty(exports, "Fetcher", {
  enumerable: true,
  get: function get() {
    return _fetcher.default;
  }
});
Object.defineProperty(exports, "Formula", {
  enumerable: true,
  get: function get() {
    return _formula.default;
  }
});
Object.defineProperty(exports, "IndexedFormula", {
  enumerable: true,
  get: function get() {
    return _store.default;
  }
});
Object.defineProperty(exports, "Literal", {
  enumerable: true,
  get: function get() {
    return _literal.default;
  }
});
exports.LiveStore = void 0;
Object.defineProperty(exports, "N3Parser", {
  enumerable: true,
  get: function get() {
    return _n3parser.default;
  }
});
Object.defineProperty(exports, "NamedNode", {
  enumerable: true,
  get: function get() {
    return _namedNode.default;
  }
});
Object.defineProperty(exports, "Namespace", {
  enumerable: true,
  get: function get() {
    return _namespace.default;
  }
});
exports.NextId = void 0;
Object.defineProperty(exports, "Node", {
  enumerable: true,
  get: function get() {
    return _node.default;
  }
});
Object.defineProperty(exports, "Query", {
  enumerable: true,
  get: function get() {
    return _query.Query;
  }
});
Object.defineProperty(exports, "RDFParser", {
  enumerable: true,
  get: function get() {
    return _rdfxmlparser.default;
  }
});
Object.defineProperty(exports, "RDFaProcessor", {
  enumerable: true,
  get: function get() {
    return _rdfaparser.default;
  }
});
Object.defineProperty(exports, "SPARQLToQuery", {
  enumerable: true,
  get: function get() {
    return _sparqlToQuery.default;
  }
});
Object.defineProperty(exports, "Serializer", {
  enumerable: true,
  get: function get() {
    return _serializer.default;
  }
});
Object.defineProperty(exports, "Statement", {
  enumerable: true,
  get: function get() {
    return _statement.default;
  }
});
Object.defineProperty(exports, "Store", {
  enumerable: true,
  get: function get() {
    return _store.default;
  }
});
Object.defineProperty(exports, "UpdateManager", {
  enumerable: true,
  get: function get() {
    return _updateManager.default;
  }
});
Object.defineProperty(exports, "UpdatesSocket", {
  enumerable: true,
  get: function get() {
    return _updatesVia.UpdatesSocket;
  }
});
Object.defineProperty(exports, "UpdatesVia", {
  enumerable: true,
  get: function get() {
    return _updatesVia.UpdatesVia;
  }
});
exports.Util = void 0;
Object.defineProperty(exports, "Variable", {
  enumerable: true,
  get: function get() {
    return _variable.default;
  }
});
exports.graph = exports.fromNT = exports.fetcher = exports.defaultGraph = exports.blankNode = void 0;
Object.defineProperty(exports, "jsonParser", {
  enumerable: true,
  get: function get() {
    return _jsonparser.default;
  }
});
exports.literal = exports.lit = void 0;
Object.defineProperty(exports, "log", {
  enumerable: true,
  get: function get() {
    return _log.default;
  }
});
exports.namedNode = void 0;
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function get() {
    return _parse.default;
  }
});
exports.quad = void 0;
Object.defineProperty(exports, "queryToSPARQL", {
  enumerable: true,
  get: function get() {
    return _queryToSparql.default;
  }
});
Object.defineProperty(exports, "serialize", {
  enumerable: true,
  get: function get() {
    return _serialize.default;
  }
});
Object.defineProperty(exports, "sparqlUpdateParser", {
  enumerable: true,
  get: function get() {
    return _patchParser.default;
  }
});
exports.term = exports.sym = exports.st = void 0;
Object.defineProperty(exports, "termValue", {
  enumerable: true,
  get: function get() {
    return _termValue.termValue;
  }
});
exports.variable = exports.uri = exports.triple = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
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
    get: function get() {
      return _terms[key];
    }
  });
});
var _termValue = require("./utils/termValue");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2.default)(o), (0, _possibleConstructorReturn2.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2.default)(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
// Prepare bound versions of data factory methods for export
var boundDataFactory = {};
for (var name in _rdflibDataFactory.default) {
  if (typeof _rdflibDataFactory.default[name] === 'function') boundDataFactory[name] = _rdflibDataFactory.default[name].bind(_rdflibDataFactory.default);
}
var fetcher = exports.fetcher = boundDataFactory.fetcher,
  graph = exports.graph = boundDataFactory.graph,
  lit = exports.lit = boundDataFactory.lit,
  st = exports.st = boundDataFactory.st,
  namedNode = exports.namedNode = exports.sym = boundDataFactory.namedNode,
  variable = exports.variable = boundDataFactory.variable,
  blankNode = exports.blankNode = boundDataFactory.blankNode,
  defaultGraph = exports.defaultGraph = boundDataFactory.defaultGraph,
  literal = exports.literal = boundDataFactory.literal,
  quad = exports.quad = boundDataFactory.quad,
  triple = exports.triple = boundDataFactory.triple;
var formula = new _formula.default();
var fromNT = exports.fromNT = function fromNT(str) {
  return formula.fromNT(str);
};
var term = exports.term = _node.default.fromValue;

// TODO: this export is broken;
// it exports the _current_ value of nextId, which is always 0
var NextId = exports.NextId = _blankNode.default.nextId;
var ConnectedStore = exports.ConnectedStore = /*#__PURE__*/function (_Store) {
  function ConnectedStore(features) {
    var _this;
    (0, _classCallCheck2.default)(this, ConnectedStore);
    _this = _callSuper(this, ConnectedStore, [features]);
    (0, _defineProperty2.default)(_this, "fetcher", void 0);
    _this.fetcher = new _fetcher.default(_this, {});
    return _this;
  }
  (0, _inherits2.default)(ConnectedStore, _Store);
  return (0, _createClass2.default)(ConnectedStore);
}(_store.default);
var LiveStore = exports.LiveStore = /*#__PURE__*/function (_ConnectedStore2) {
  function LiveStore(features) {
    var _this2;
    (0, _classCallCheck2.default)(this, LiveStore);
    _this2 = _callSuper(this, LiveStore, [features]);
    (0, _defineProperty2.default)(_this2, "updater", void 0);
    _this2.updater = new _updateManager.default(_this2);
    return _this2;
  }
  (0, _inherits2.default)(LiveStore, _ConnectedStore2);
  return (0, _createClass2.default)(LiveStore);
}(ConnectedStore);