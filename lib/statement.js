"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
var _defaultGraph = _interopRequireWildcard(require("./default-graph"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const defaultGraph = new _defaultGraph.default();

/** A Statement represents an RDF Triple or Quad. */
class Statement {
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
  constructor(subject, predicate, object, graph) {
    /** The subject of the triple.  What the Statement is about. */
    (0, _defineProperty2.default)(this, "subject", void 0);
    /** The relationship which is asserted between the subject and object */
    (0, _defineProperty2.default)(this, "predicate", void 0);
    /** The thing or data value which is asserted to be related to the subject */
    (0, _defineProperty2.default)(this, "object", void 0);
    /**
     * The graph param is a named node of the document in which the triple when
     *  it is stored on the web.
     */
    (0, _defineProperty2.default)(this, "graph", void 0);
    this.subject = _nodeInternal.default.fromValue(subject);
    this.predicate = _nodeInternal.default.fromValue(predicate);
    this.object = _nodeInternal.default.fromValue(object);
    this.graph = graph == undefined ? defaultGraph : _nodeInternal.default.fromValue(graph); // property currently used by rdflib
  }

  /** Alias for graph, favored by Tim */
  get why() {
    return this.graph;
  }
  set why(g) {
    this.graph = g;
  }

  /**
   * Checks whether two statements are the same
   * @param other - The other statement
   */
  equals(other) {
    return other.subject.equals(this.subject) && other.predicate.equals(this.predicate) && other.object.equals(this.object) && other.graph.equals(this.graph);
  }

  /**
   * Creates a statement with the bindings substituted
   * @param bindings The bindings
   */
  substitute(bindings) {
    const y = new Statement(this.subject.substitute(bindings), this.predicate.substitute(bindings), this.object.substitute(bindings), (0, _defaultGraph.isDefaultGraph)(this.graph) ? this.graph : this.graph.substitute(bindings)); // 2016
    // console.log('@@@ statement substitute:' + y)
    return y;
  }

  /** Creates a canonical string representation of this statement. */
  toCanonical() {
    let terms = [this.subject.toCanonical(), this.predicate.toCanonical(), this.object.toCanonical()];
    if (this.graph && this.graph.termType !== _types.DefaultGraphTermType) {
      terms.push(this.graph.toCanonical());
    }
    return terms.join(' ') + ' .';
  }

  /** Creates a n-triples string representation of this statement */
  toNT() {
    return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT()].join(' ') + ' .';
  }

  /** Creates a n-quads string representation of this statement */
  toNQ() {
    return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT(), (0, _defaultGraph.isDefaultGraph)(this.graph) ? '' : this.graph.toNT()].join(' ') + ' .';
  }

  /** Creates a string representation of this statement */
  toString() {
    /*
    return [
      this.subject.toString(),
      this.predicate.toString(),
      this.object.toString(),
    ].join(' ') + ' .'
    */
    return this.toNT();
  }
}
exports.default = Statement;