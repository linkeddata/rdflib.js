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
var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
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
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
// Prepare bound versions of data factory methods for export
var boundDataFactory = {};
for (var name in _rdflibDataFactory.default) {
  if (typeof _rdflibDataFactory.default[name] === 'function') boundDataFactory[name] = _rdflibDataFactory.default[name].bind(_rdflibDataFactory.default);
}
var fetcher = boundDataFactory.fetcher,
  graph = boundDataFactory.graph,
  lit = boundDataFactory.lit,
  st = boundDataFactory.st,
  namedNode = boundDataFactory.namedNode,
  variable = boundDataFactory.variable,
  blankNode = boundDataFactory.blankNode,
  defaultGraph = boundDataFactory.defaultGraph,
  literal = boundDataFactory.literal,
  quad = boundDataFactory.quad,
  triple = boundDataFactory.triple;
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
var formula = new _formula.default();
var fromNT = function fromNT(str) {
  return formula.fromNT(str);
};
exports.fromNT = fromNT;
var term = _node.default.fromValue;

// TODO: this export is broken;
// it exports the _current_ value of nextId, which is always 0
exports.term = term;
var NextId = _blankNode.default.nextId;
exports.NextId = NextId;
var ConnectedStore = /*#__PURE__*/function (_Store) {
  (0, _inherits2.default)(ConnectedStore, _Store);
  var _super = _createSuper(ConnectedStore);
  function ConnectedStore(features) {
    var _this;
    (0, _classCallCheck2.default)(this, ConnectedStore);
    _this = _super.call(this, features);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "fetcher", void 0);
    _this.fetcher = new _fetcher.default((0, _assertThisInitialized2.default)(_this), {});
    return _this;
  }
  return (0, _createClass2.default)(ConnectedStore);
}(_store.default);
exports.ConnectedStore = ConnectedStore;
var LiveStore = /*#__PURE__*/function (_ConnectedStore) {
  (0, _inherits2.default)(LiveStore, _ConnectedStore);
  var _super2 = _createSuper(LiveStore);
  function LiveStore(features) {
    var _this2;
    (0, _classCallCheck2.default)(this, LiveStore);
    _this2 = _super2.call(this, features);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this2), "updater", void 0);
    _this2.updater = new _updateManager.default((0, _assertThisInitialized2.default)(_this2));
    return _this2;
  }
  return (0, _createClass2.default)(LiveStore);
}(ConnectedStore);
exports.LiveStore = LiveStore;