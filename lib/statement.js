"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _nodeInternal = _interopRequireDefault(require("./node-internal"));

var _types = require("./types");

var _defaultGraph = _interopRequireWildcard(require("./default-graph"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var defaultGraph = new _defaultGraph.default();
/** A Statement represents an RDF Triple or Quad. */

var Statement = /*#__PURE__*/function () {
  /** The subject of the triple.  What the Statement is about. */

  /** The relationship which is asserted between the subject and object */

  /** The thing or data value which is asserted to be related to the subject */

  /**
   * The graph param is a named node of the document in which the triple when
   *  it is stored on the web.
   */

  /**
   * Construct a new statement
   *
   * @param subject - The subject of the triple.  What the fact is about
   * @param predicate - The relationship which is asserted between the subject and object
   * @param object - The thing or data value which is asserted to be related to the subject
   * @param {NamedNode} graph - The document where the triple is or was or will be stored on the web.
   *
   * The graph param is a named node of the document in which the triple when it is stored
   *  on the web. It exists because when you have read data from various places in the web,
   *  the “graph” tells you _why_ you have the triple. (At the moment, it is just the
   *  document, in future it could be an inference step)
   *
   * When you do UpdateManager.update() then the graph’s of all the statements must be the same,
   *  and give the document you are patching. In future, we may have a more
   *  powerful update() which can update more than one document.
   */
  function Statement(subject, predicate, object, graph) {
    (0, _classCallCheck2.default)(this, Statement);
    (0, _defineProperty2.default)(this, "subject", void 0);
    (0, _defineProperty2.default)(this, "predicate", void 0);
    (0, _defineProperty2.default)(this, "object", void 0);
    (0, _defineProperty2.default)(this, "graph", void 0);
    this.subject = _nodeInternal.default.fromValue(subject);
    this.predicate = _nodeInternal.default.fromValue(predicate);
    this.object = _nodeInternal.default.fromValue(object);
    this.graph = graph == undefined ? defaultGraph : _nodeInternal.default.fromValue(graph); // property currently used by rdflib
  }
  /** Alias for graph, favored by Tim */


  (0, _createClass2.default)(Statement, [{
    key: "why",
    get: function get() {
      return this.graph;
    },
    set: function set(g) {
      this.graph = g;
    }
    /**
     * Checks whether two statements are the same
     * @param other - The other statement
     */

  }, {
    key: "equals",
    value: function equals(other) {
      return other.subject.equals(this.subject) && other.predicate.equals(this.predicate) && other.object.equals(this.object) && other.graph.equals(this.graph);
    }
    /**
     * Creates a statement with the bindings substituted
     * @param bindings The bindings
     */

  }, {
    key: "substitute",
    value: function substitute(bindings) {
      var y = new Statement(this.subject.substitute(bindings), this.predicate.substitute(bindings), this.object.substitute(bindings), (0, _defaultGraph.isDefaultGraph)(this.graph) ? this.graph : this.graph.substitute(bindings)); // 2016

      console.log('@@@ statement substitute:' + y);
      return y;
    }
    /** Creates a canonical string representation of this statement. */

  }, {
    key: "toCanonical",
    value: function toCanonical() {
      var terms = [this.subject.toCanonical(), this.predicate.toCanonical(), this.object.toCanonical()];

      if (this.graph && this.graph.termType !== _types.DefaultGraphTermType) {
        terms.push(this.graph.toCanonical());
      }

      return terms.join(' ') + ' .';
    }
    /** Creates a n-triples string representation of this statement */

  }, {
    key: "toNT",
    value: function toNT() {
      return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT()].join(' ') + ' .';
    }
    /** Creates a n-quads string representation of this statement */

  }, {
    key: "toNQ",
    value: function toNQ() {
      return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT(), (0, _defaultGraph.isDefaultGraph)(this.graph) ? '' : this.graph.toNT()].join(' ') + ' .';
    }
    /** Creates a string representation of this statement */

  }, {
    key: "toString",
    value: function toString() {
      return this.toNT();
    }
  }]);
  return Statement;
}();

exports.default = Statement;