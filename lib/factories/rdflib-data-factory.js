"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _store = _interopRequireDefault(require("../store"));
var _fetcher = _interopRequireDefault(require("../fetcher"));
var _extendedTermFactory = _interopRequireDefault(require("./extended-term-factory"));
/** Full RDFLib.js Data Factory */
const RDFlibDataFactory = {
  ..._extendedTermFactory.default,
  /**
   * Creates a new fetcher
   * @param store - The store to use
   * @param options - The options
   */
  fetcher(store, options) {
    return new _fetcher.default(store, options);
  },
  /**
   * Creates a new graph (store)
   */
  graph(features = undefined, opts = undefined) {
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
  lit(val, lang, dt) {
    return this.literal('' + val, lang || dt);
  },
  /**
   * Creates a new statement
   * @param subject The subject
   * @param predicate The predicate
   * @param object The object
   * @param graph The containing graph
   */
  st(subject, predicate, object, graph) {
    return this.quad(subject, predicate, object, graph);
  }
};
var _default = exports.default = RDFlibDataFactory;