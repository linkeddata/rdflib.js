"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _store = _interopRequireDefault(require("../store"));
var _fetcher = _interopRequireDefault(require("../fetcher"));
var _extendedTermFactory = _interopRequireDefault(require("./extended-term-factory"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2.default)(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
/** Full RDFLib.js Data Factory */
var RDFlibDataFactory = _objectSpread(_objectSpread({}, _extendedTermFactory.default), {}, {
  /**
   * Creates a new fetcher
   * @param store - The store to use
   * @param options - The options
   */
  fetcher: function fetcher(store, options) {
    return new _fetcher.default(store, options);
  },
  /**
   * Creates a new graph (store)
   */
  graph: function graph() {
    var features = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
    return new _store.default(features, opts || {
      rdfFactory: _extendedTermFactory.default
    });
  },
  /**
   * Creates a new literal node
   * @param val The lexical value
   * @param lang The language
   * @param dt The datatype
   */
  lit: function lit(val, lang, dt) {
    return this.literal('' + val, lang || dt);
  },
  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   * @param graph The containing graph
   */
  st: function st(subject, predicate, object, graph) {
    return this.quad(subject, predicate, object, graph);
  }
});
var _default = exports.default = RDFlibDataFactory;