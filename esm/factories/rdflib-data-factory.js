import _defineProperty from "@babel/runtime/helpers/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

import IndexedFormula from '../store';
import Fetcher from '../fetcher';
import ExtendedTermFactory from './extended-term-factory';

/** Full RDFLib.js Data Factory */
var RDFlibDataFactory = _objectSpread(_objectSpread({}, ExtendedTermFactory), {}, {
  /**
   * Creates a new fetcher
   * @param store - The store to use
   * @param options - The options
   */
  fetcher: function fetcher(store, options) {
    return new Fetcher(store, options);
  },

  /**
   * Creates a new graph (store)
   */
  graph: function graph() {
    var features = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
    return new IndexedFormula(features, opts || {
      rdfFactory: ExtendedTermFactory
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

export default RDFlibDataFactory;