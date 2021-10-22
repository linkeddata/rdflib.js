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
  BlankNode: true,
  Collection: true,
  convert: true,
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
exports.graph = exports.fromNT = exports.fetcher = exports.defaultGraph = exports.convert = exports.blankNode = void 0;
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

var _blankNode = _interopRequireDefault(require("./blank-node"));

var _collection = _interopRequireDefault(require("./collection"));

var convert = _interopRequireWildcard(require("./convert"));

exports.convert = convert;

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
var term = _node.default.fromValue; // TODO: this export is broken;
// it exports the _current_ value of nextId, which is always 0

exports.term = term;
var NextId = _blankNode.default.nextId;
exports.NextId = NextId;