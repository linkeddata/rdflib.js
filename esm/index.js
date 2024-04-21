import _createClass from "@babel/runtime/helpers/createClass";
import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/inherits";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
import BlankNode from './blank-node';
import Collection from './collection';
import Empty from './empty';
import Fetcher from './fetcher';
import Formula from './formula';
import Store from './store';
import jsonParser from './jsonparser';
import Literal from './literal';
import log from './log';
import N3Parser from './n3parser';
import NamedNode from './named-node';
import Namespace from './namespace';
import Node from './node';
import parse from './parse';
import { Query } from './query';
import queryToSPARQL from './query-to-sparql';
import RDFaProcessor from './rdfaparser';
import RDFParser from './rdfxmlparser';
import serialize from './serialize';
import Serializer from './serializer';
import SPARQLToQuery from './sparql-to-query';
import sparqlUpdateParser from './patch-parser';
import Statement from './statement';
import UpdateManager from './update-manager';
import { UpdatesSocket } from './updates-via';
import { UpdatesVia } from './updates-via';
import * as uri from './uri';
import * as Util from './utils-js';
import Variable from './variable';
import DataFactory from './factories/rdflib-data-factory';

// Prepare bound versions of data factory methods for export
var boundDataFactory = {};
for (var name in DataFactory) {
  if (typeof DataFactory[name] === 'function') boundDataFactory[name] = DataFactory[name].bind(DataFactory);
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
var formula = new Formula();
var fromNT = function fromNT(str) {
  return formula.fromNT(str);
};
var term = Node.fromValue;

// TODO: this export is broken;
// it exports the _current_ value of nextId, which is always 0
var NextId = BlankNode.nextId;
export * from './utils/terms';
export { BlankNode, Collection, DataFactory, Empty, Fetcher, Formula, Store, jsonParser, Literal, log, N3Parser, NamedNode, Namespace, Node, parse, Query, queryToSPARQL, RDFaProcessor, RDFParser, serialize, Serializer, SPARQLToQuery, sparqlUpdateParser, Statement, term, UpdateManager, UpdatesSocket, UpdatesVia, uri, Util, Variable, Store as IndexedFormula,
// Alias

NextId, fromNT, fetcher, graph, lit, st, namedNode as sym,
// RDFJS DataFactory interface
blankNode, defaultGraph, literal, namedNode, quad, triple, variable };
export { termValue } from './utils/termValue';
export var ConnectedStore = /*#__PURE__*/function (_Store) {
  function ConnectedStore(features) {
    var _this;
    _classCallCheck(this, ConnectedStore);
    _this = _callSuper(this, ConnectedStore, [features]);
    _defineProperty(_this, "fetcher", void 0);
    _this.fetcher = new Fetcher(_this, {});
    return _this;
  }
  _inherits(ConnectedStore, _Store);
  return _createClass(ConnectedStore);
}(Store);
export var LiveStore = /*#__PURE__*/function (_ConnectedStore2) {
  function LiveStore(features) {
    var _this2;
    _classCallCheck(this, LiveStore);
    _this2 = _callSuper(this, LiveStore, [features]);
    _defineProperty(_this2, "updater", void 0);
    _this2.updater = new UpdateManager(_this2);
    return _this2;
  }
  _inherits(LiveStore, _ConnectedStore2);
  return _createClass(LiveStore);
}(ConnectedStore);