import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
import Node from './node-internal';
import { DefaultGraphTermType } from './types';
import DefaultGraphNode, { isDefaultGraph } from './default-graph';
var defaultGraph = new DefaultGraphNode();
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
    _classCallCheck(this, Statement);

    _defineProperty(this, "subject", void 0);

    _defineProperty(this, "predicate", void 0);

    _defineProperty(this, "object", void 0);

    _defineProperty(this, "graph", void 0);

    this.subject = Node.fromValue(subject);
    this.predicate = Node.fromValue(predicate);
    this.object = Node.fromValue(object);
    this.graph = graph == undefined ? defaultGraph : Node.fromValue(graph); // property currently used by rdflib
  }
  /** Alias for graph, favored by Tim */


  _createClass(Statement, [{
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
      var y = new Statement(this.subject.substitute(bindings), this.predicate.substitute(bindings), this.object.substitute(bindings), isDefaultGraph(this.graph) ? this.graph : this.graph.substitute(bindings)); // 2016

      console.log('@@@ statement substitute:' + y);
      return y;
    }
    /** Creates a canonical string representation of this statement. */

  }, {
    key: "toCanonical",
    value: function toCanonical() {
      var terms = [this.subject.toCanonical(), this.predicate.toCanonical(), this.object.toCanonical()];

      if (this.graph && this.graph.termType !== DefaultGraphTermType) {
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
      return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT(), isDefaultGraph(this.graph) ? '' : this.graph.toNT()].join(' ') + ' .';
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

export { Statement as default };