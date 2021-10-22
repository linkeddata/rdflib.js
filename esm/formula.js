import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inherits from "@babel/runtime/helpers/inherits";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _defineProperty from "@babel/runtime/helpers/defineProperty";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

import ClassOrder from './class-order';
import Collection from './collection';
import CanonicalDataFactory from './factories/canonical-data-factory';
import log from './log';
import Namespace from './namespace';
import Node from './node-internal';
import Serializer from './serialize';
import { GraphTermType } from './types';
import { isStatement } from './utils/terms';
import Variable from './variable';
import { appliedFactoryMethods, arrayToStatements } from './utils';
import NamedNode from './named-node';

/**
 * A formula, or store of RDF statements
 */
var Formula = /*#__PURE__*/function (_Node) {
  _inherits(Formula, _Node);

  var _super = _createSuper(Formula);

  /**
   * The accompanying fetcher instance.
   *
   * Is set by the fetcher when initialized.
   */

  /**
   * A namespace for the specified namespace's URI
   * @param nsuri The URI for the namespace
   */

  /** The factory used to generate statements and terms */

  /**
   * Initializes this formula
   * @constructor
   * @param statements - Initial array of statements
   * @param constraints - initial array of constraints
   * @param initBindings - initial bindings used in Query
   * @param optional - optional
   * @param opts
   * @param opts.rdfFactory - The rdf factory that should be used by the store
  */
  function Formula() {
    var _this;

    var statements = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var constraints = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var initBindings = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var optional = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
    var opts = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

    _classCallCheck(this, Formula);

    _this = _super.call(this, '');
    _this.statements = statements;
    _this.constraints = constraints;
    _this.initBindings = initBindings;
    _this.optional = optional;

    _defineProperty(_assertThisInitialized(_this), "termType", GraphTermType);

    _defineProperty(_assertThisInitialized(_this), "classOrder", ClassOrder.Graph);

    _defineProperty(_assertThisInitialized(_this), "fetcher", void 0);

    _defineProperty(_assertThisInitialized(_this), "isVar", 0);

    _defineProperty(_assertThisInitialized(_this), "ns", Namespace);

    _defineProperty(_assertThisInitialized(_this), "rdfFactory", void 0);

    _this.rdfFactory = opts && opts.rdfFactory || CanonicalDataFactory; // Enable default factory methods on this while preserving factory context.

    var _iterator = _createForOfIteratorHelper(appliedFactoryMethods),
        _step;

    try {
      var _loop = function _loop() {
        var factoryMethod = _step.value;

        _this[factoryMethod] = function () {
          var _this$rdfFactory;

          return (_this$rdfFactory = _this.rdfFactory)[factoryMethod].apply(_this$rdfFactory, arguments);
        };
      };

      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    return _this;
  }
  /** Add a statement from its parts
   * @param subject - the first part of the statement
   * @param predicate - the second part of the statement
   * @param object - the third part of the statement
   * @param graph - the last part of the statement
   */


  _createClass(Formula, [{
    key: "add",
    value: function add(subject, predicate, object, graph) {
      var _this2 = this;

      if (arguments.length === 1) {
        subject.forEach(function (st) {
          return _this2.add(st.subject, st.predicate, st.object, st.graph);
        });
      }

      return this.statements.push(this.rdfFactory.quad(subject, predicate, object, graph));
    }
    /** Add a statment object
     * @param {Statement} statement - An existing constructed statement to add
     */

  }, {
    key: "addStatement",
    value: function addStatement(statement) {
      return this.add(statement);
    }
    /**
     * Shortcut for adding blankNodes
     * @param [id]
     */

  }, {
    key: "bnode",
    value: function bnode(id) {
      return this.rdfFactory.blankNode(id);
    }
    /**
     * Adds all the statements to this formula
     * @param statements - A collection of statements
     */

  }, {
    key: "addAll",
    value: function addAll(statements) {
      var _this3 = this;

      statements.forEach(function (quad) {
        _this3.add(quad.subject, quad.predicate, quad.object, quad.graph);
      });
    }
    /** Follow link from one node, using one wildcard, looking for one
    *
    * For example, any(me, knows, null, profile)  - a person I know accoring to my profile .
    * any(me, knows, null, null)  - a person I know accoring to anything in store .
    * any(null, knows, me, null)  - a person who know me accoring to anything in store .
    *
    * @param s - A node to search for as subject, or if null, a wildcard
    * @param p - A node to search for as predicate, or if null, a wildcard
    * @param o - A node to search for as object, or if null, a wildcard
    * @param g - A node to search for as graph, or if null, a wildcard
    * @returns A node which match the wildcard position, or null
    */

  }, {
    key: "any",
    value: function any(s, p, o, g) {
      var st = this.anyStatementMatching(s, p, o, g);

      if (st == null) {
        return null;
      } else if (s == null) {
        return st.subject;
      } else if (p == null) {
        return st.predicate;
      } else if (o == null) {
        return st.object;
      }

      return null;
    }
    /**
     * Gets the value of a node that matches the specified pattern
     * @param s The subject
     * @param p The predicate
     * @param o The object
     * @param g The graph that contains the statement
     */

  }, {
    key: "anyValue",
    value: function anyValue(s, p, o, g) {
      var y = this.any(s, p, o, g);
      return y ? y.value : void 0;
    }
    /**
     * Gets the first JavaScript object equivalent to a node based on the specified pattern
     * @param s The subject
     * @param p The predicate
     * @param o The object
     * @param g The graph that contains the statement
     */

  }, {
    key: "anyJS",
    value: function anyJS(s, p, o, g) {
      var y = this.any(s, p, o, g);
      return y ? Node.toJS(y) : void 0;
    }
    /**
     * Gets the first statement that matches the specified pattern
     */

  }, {
    key: "anyStatementMatching",
    value: function anyStatementMatching(s, p, o, g) {
      var x = this.statementsMatching(s, p, o, g, true);

      if (!x || x.length === 0) {
        return undefined;
      }

      return x[0];
    }
    /**
     * Returns a unique index-safe identifier for the given term.
     *
     * Falls back to the rdflib hashString implementation if the given factory doesn't support id.
     */

  }, {
    key: "id",
    value: function id(term) {
      return this.rdfFactory.id(term);
    }
    /**
     * Search the Store
     * This is really a teaching method as to do this properly you would use IndexedFormula
     *
     * @param s - A node to search for as subject, or if null, a wildcard
     * @param p - A node to search for as predicate, or if null, a wildcard
     * @param o - A node to search for as object, or if null, a wildcard
     * @param g - A node to search for as graph, or if null, a wildcard
     * @param justOne - flag - stop when found one rather than get all of them?
     * @returns {Array<Node>} - An array of nodes which match the wildcard position
     */

  }, {
    key: "statementsMatching",
    value: function statementsMatching(s, p, o, g, justOne) {
      var sts = this.statements.filter(function (st) {
        return (!s || s.equals(st.subject)) && (!p || p.equals(st.predicate)) && (!o || o.equals(st.object)) && (!g || g.equals(st.graph));
      });

      if (justOne) {
        return sts.length === 0 ? [] : [sts[0]];
      }

      return sts;
    }
    /**
     * Finds the types in the list which have no *stored* subtypes
     * These are a set of classes which provide by themselves complete
     * information -- the other classes are redundant for those who
     * know the class DAG.
     * @param types A map of the types
     */

  }, {
    key: "bottomTypeURIs",
    value: function bottomTypeURIs(types) {
      var bots;
      var bottom;
      var elt;
      var i;
      var len;
      var ref;
      var subs;
      var v;
      bots = [];

      for (var _k in types) {
        if (!types.hasOwnProperty(_k)) continue;
        v = types[_k];
        subs = this.each(void 0, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'), this.rdfFactory.namedNode(_k));
        bottom = true;
        i = 0;

        for (len = subs.length; i < len; i++) {
          elt = subs[i];
          ref = elt.uri;

          if (ref in types) {
            // the subclass is one we know
            bottom = false;
            break;
          }
        }

        if (bottom) {
          bots[_k] = v;
        }
      }

      return bots;
    }
    /** Creates a new collection */

  }, {
    key: "collection",
    value: function collection() {
      return new Collection();
    }
    /** Follow links from one node, using one wildcard.
    *
    * For example, each(me, knows, null, profile)  - people I know accoring to my profile .
    * each(me, knows, null, null)  - people I know accoring to anything in store .
    * each(null, knows, me, null)  - people who know me accoring to anything in store .
    *
    * @param s - A node to search for as subject, or if null, a wildcard
    * @param p - A node to search for as predicate, or if null, a wildcard
    * @param o - A node to search for as object, or if null, a wildcard
    * @param g - A node to search for as graph, or if null, a wildcard
    * @returns {Array<Node>} - An array of nodes which match the wildcard position
    */

  }, {
    key: "each",
    value: function each(s, p, o, g) {
      var results = [];
      var sts = this.statementsMatching(s, p, o, g, false);

      if (s == null) {
        for (var i = 0, len = sts.length; i < len; i++) {
          results.push(sts[i].subject);
        }
      } else if (p == null) {
        for (var l = 0, len1 = sts.length; l < len1; l++) {
          results.push(sts[l].predicate);
        }
      } else if (o == null) {
        for (var m = 0, len2 = sts.length; m < len2; m++) {
          results.push(sts[m].object);
        }
      } else if (g == null) {
        for (var _q = 0, len3 = sts.length; _q < len3; _q++) {
          results.push(new NamedNode(sts[_q].graph.value));
        }
      }

      return results;
    }
    /**
     * Test whether this formula is equals to {other}
     * @param other - The other formula
     */

  }, {
    key: "equals",
    value: function equals(other) {
      if (!other) {
        return false;
      }

      return this.hashString() === other.hashString();
    }
    /**
     * For thisClass or any subclass, anything which has it is its type
     * or is the object of something which has the type as its range, or subject
     * of something which has the type as its domain
     * We don't bother doing subproperty (yet?)as it doesn't seeem to be used
     * much.
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * @return a hash of URIs
     */

  }, {
    key: "findMembersNT",
    value: function findMembersNT(thisClass) {
      var len2;
      var len4;
      var m;
      var members;
      var pred;
      var ref;
      var ref1;
      var ref2;
      var ref3;
      var ref4;
      var ref5;
      var seeds;
      var st;
      var u;
      seeds = {};
      seeds[thisClass.toNT()] = true;
      members = {};
      ref = this.transitiveClosure(seeds, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true);

      for (var t in ref) {
        if (!ref.hasOwnProperty(t)) continue;
        ref1 = this.statementsMatching(void 0, this.rdfFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), this.fromNT(t));

        for (var i = 0, len = ref1.length; i < len; i++) {
          st = ref1[i];
          members[st.subject.toNT()] = st;
        }

        ref2 = this.each(void 0, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#domain'), this.fromNT(t));

        for (var l = 0, len1 = ref2.length; l < len1; l++) {
          pred = ref2[l];
          ref3 = this.statementsMatching(void 0, pred);

          for (m = 0, len2 = ref3.length; m < len2; m++) {
            st = ref3[m];
            members[st.subject.toNT()] = st;
          }
        }

        ref4 = this.each(void 0, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#range'), this.fromNT(t));

        for (var _q2 = 0, len3 = ref4.length; _q2 < len3; _q2++) {
          pred = ref4[_q2];
          ref5 = this.statementsMatching(void 0, pred);

          for (u = 0, len4 = ref5.length; u < len4; u++) {
            st = ref5[u];
            members[st.object.toNT()] = st;
          }
        }
      }

      return members;
    }
    /**
     * For thisClass or any subclass, anything which has it is its type
     * or is the object of something which has the type as its range, or subject
     * of something which has the type as its domain
     * We don't bother doing subproperty (yet?)as it doesn't seeem to be used
     * much.
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * @param subject - A named node
     */

  }, {
    key: "findMemberURIs",
    value: function findMemberURIs(subject) {
      return this.NTtoURI(this.findMembersNT(subject));
    }
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a superclass
     * Returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */

  }, {
    key: "findSubClassesNT",
    value: function findSubClassesNT(subject) {
      var types = {};
      types[subject.toNT()] = true;
      return this.transitiveClosure(types, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true);
    }
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a subclass
     * @param {RDFlibNamedNode} subject - The thing whose classes are to be found
     * @returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */

  }, {
    key: "findSuperClassesNT",
    value: function findSuperClassesNT(subject) {
      var types = {};
      types[subject.toNT()] = true;
      return this.transitiveClosure(types, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false);
    }
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * todo: This will loop is there is a class subclass loop (Sublass loops are
     * not illegal)
     * @param {RDFlibNamedNode} subject - The thing whose classes are to be found
     * @returns a hash table where key is NT of type and value is statement why we think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     */

  }, {
    key: "findTypesNT",
    value: function findTypesNT(subject) {
      var domain;
      var range;
      var rdftype;
      var ref;
      var ref1;
      var ref2;
      var ref3;
      var st;
      var types;
      rdftype = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
      types = [];
      ref = this.statementsMatching(subject, void 0, void 0);

      for (var i = 0, len = ref.length; i < len; i++) {
        st = ref[i];

        if (st.predicate.uri === rdftype) {
          types[st.object.toNT()] = st;
        } else {
          ref1 = this.each(st.predicate, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#domain'));

          for (var l = 0, len1 = ref1.length; l < len1; l++) {
            range = ref1[l];
            types[range.toNT()] = st;
          }
        }
      }

      ref2 = this.statementsMatching(void 0, void 0, subject);

      for (var m = 0, len2 = ref2.length; m < len2; m++) {
        st = ref2[m];
        ref3 = this.each(st.predicate, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#range'));

        for (var _q3 = 0, len3 = ref3.length; _q3 < len3; _q3++) {
          domain = ref3[_q3];
          types[domain.toNT()] = st;
        }
      }

      return this.transitiveClosure(types, this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false);
    }
    /**
     * Get all the Classes of which we can RDFS-infer the subject is a member
     * todo: This will loop is there is a class subclass loop (Sublass loops are
     * not illegal)
     * Returns a hash table where key is NT of type and value is statement why we
     * think so.
     * Does NOT return terms, returns URI strings.
     * We use NT representations in this version because they handle blank nodes.
     * @param subject - A subject node
     */

  }, {
    key: "findTypeURIs",
    value: function findTypeURIs(subject) {
      return this.NTtoURI(this.findTypesNT(subject));
    }
    /** Trace statements which connect directly, or through bnodes
     *
     * @param subject - The node to start looking for statments
     * @param doc - The document to be searched, or null to search all documents
     * @returns an array of statements, duplicate statements are suppresssed.
     */

  }, {
    key: "connectedStatements",
    value: function connectedStatements(subject, doc, excludePredicateURIs) {
      excludePredicateURIs = excludePredicateURIs || [];
      var todo = [subject];
      var done = {};
      var doneArcs = {};
      var result = [];
      var self = this;

      var follow = function follow(x) {
        var queue = function queue(x) {
          if (x.termType === 'BlankNode' && !done[x.value]) {
            done[x.value] = true;
            todo.push(x);
          }
        };

        var sts = self.statementsMatching(null, null, x, doc).concat(self.statementsMatching(x, null, null, doc));
        sts = sts.filter(function (st) {
          if (excludePredicateURIs[st.predicate.value]) return false;
          var hash = st.toNT();
          if (doneArcs[hash]) return false;
          doneArcs[hash] = true;
          return true;
        });
        sts.forEach(function (st) {
          queue(st.subject);
          queue(st.object);
        });
        result = result.concat(sts);
      };

      while (todo.length) {
        follow(todo.shift());
      } // console.log('' + result.length + ' statements about ' + subject)


      return result;
    }
    /**
     * Creates a new empty formula
     *
     * @param _features - Not applicable, but necessary for typing to pass
     */

  }, {
    key: "formula",
    value: function formula(_features) {
      return new Formula();
    }
    /**
     * Transforms an NTriples string format into a Node.
     * The blank node bit should not be used on program-external values; designed
     * for internal work such as storing a blank node id in an HTML attribute.
     * This will only parse the strings generated by the various toNT() methods.
     */

  }, {
    key: "fromNT",
    value: function fromNT(str) {
      var dt, k, lang;

      switch (str[0]) {
        case '<':
          return this.sym(str.slice(1, -1));

        case '"':
          lang = void 0;
          dt = void 0;
          k = str.lastIndexOf('"');

          if (k < str.length - 1) {
            if (str[k + 1] === '@') {
              lang = str.slice(k + 2);
            } else if (str.slice(k + 1, k + 3) === '^^') {
              dt = this.fromNT(str.slice(k + 3));
            } else {
              throw new Error("Can't convert string from NT: " + str);
            }
          }

          str = str.slice(1, k);
          str = str.replace(/\\"/g, '"');
          str = str.replace(/\\n/g, '\n');
          str = str.replace(/\\\\/g, '\\');
          return this.rdfFactory.literal(str, lang || dt);

        case '_':
          return this.rdfFactory.blankNode(str.slice(2));

        case '?':
          return new Variable(str.slice(1));
      }

      throw new Error("Can't convert from NT: " + str);
    }
    /** Returns true if this formula holds the specified statement(s) */

  }, {
    key: "holds",
    value: function holds(s, p, o, g) {
      var i;

      if (arguments.length === 1) {
        if (!s) {
          return true;
        }

        if (s instanceof Array) {
          for (i = 0; i < s.length; i++) {
            if (!this.holds(s[i])) {
              return false;
            }
          }

          return true;
        } else if (isStatement(s)) {
          return this.holds(s.subject, s.predicate, s.object, s.graph);
        } else if (s.statements) {
          return this.holds(s.statements);
        }
      }

      var st = this.anyStatementMatching(s, p, o, g);
      return st != null;
    }
    /**
     * Returns true if this formula holds the specified {statement}
     */

  }, {
    key: "holdsStatement",
    value: function holdsStatement(statement) {
      return this.holds(statement.subject, statement.predicate, statement.object, statement.graph);
    }
    /**
     * Used by the n3parser to generate list elements
     * @param values - The values of the collection
     * @param context - The store
     * @return {BlankNode|Collection} - The term for the statement
     */

  }, {
    key: "list",
    value: function list(values, context) {
      if (context.rdfFactory.supports["COLLECTIONS"]) {
        var collection = context.rdfFactory.collection();
        values.forEach(function (val) {
          collection.append(val);
        });
        return collection;
      } else {
        var node = context.rdfFactory.blankNode();

        var _statements = arrayToStatements(context.rdfFactory, node, values);

        context.addAll(_statements);
        return node;
      }
    }
    /**
     * Transform a collection of NTriple URIs into their URI strings
     * @param t - Some iterable collection of NTriple URI strings
     * @return A collection of the URIs as strings
     * todo: explain why it is important to go through NT
     */

  }, {
    key: "NTtoURI",
    value: function NTtoURI(t) {
      var k, v;
      var uris = {};

      for (k in t) {
        if (!t.hasOwnProperty(k)) continue;
        v = t[k];

        if (k[0] === '<') {
          uris[k.slice(1, -1)] = v;
        }
      }

      return uris;
    }
    /**
     * Serializes this formula
     * @param base - The base string
     * @param contentType - The content type of the syntax to use
     * @param provenance - The provenance URI
     */

  }, {
    key: "serialize",
    value: function serialize(base, contentType, provenance) {
      var documentString;
      var sts;
      var sz;
      sz = Serializer(this);
      sz.suggestNamespaces(this.ns);
      sz.setBase(base);

      if (provenance) {
        sts = this.statementsMatching(void 0, void 0, void 0, provenance);
      } else {
        sts = this.statements;
      }

      switch (contentType != null ? contentType : 'text/n3') {
        case 'application/rdf+xml':
          documentString = sz.statementsToXML(sts);
          break;

        case 'text/n3':
        case 'text/turtle':
          documentString = sz.statementsToN3(sts);
          break;

        default:
          throw new Error('serialize: Content-type ' + contentType + ' not supported.');
      }

      return documentString;
    }
    /**
     * Creates a new formula with the substituting bindings applied
     * @param bindings - The bindings to substitute
     */

  }, {
    key: "substitute",
    value: function substitute(bindings) {
      var statementsCopy = this.statements.map(function (ea) {
        return ea.substitute(bindings);
      });
      console.log('Formula subs statmnts:' + statementsCopy);
      var y = new Formula();
      y.addAll(statementsCopy);
      console.log('indexed-form subs formula:' + y);
      return y;
    }
  }, {
    key: "sym",
    value: function sym(uri, name) {
      if (name) {
        throw new Error('This feature (kb.sym with 2 args) is removed. Do not assume prefix mappings.');
      }

      return this.rdfFactory.namedNode(uri);
    }
    /**
     * Gets the node matching the specified pattern. Throws when no match could be made.
     * @param s - The subject
     * @param p - The predicate
     * @param o - The object
     * @param g - The graph that contains the statement
     */

  }, {
    key: "the",
    value: function the(s, p, o, g) {
      var x = this.any(s, p, o, g);

      if (x == null) {
        log.error('No value found for the() {' + s + ' ' + p + ' ' + o + '}.');
      }

      return x;
    }
    /**
     * RDFS Inference
     * These are hand-written implementations of a backward-chaining reasoner
     * over the RDFS axioms.
     * @param seeds - A hash of NTs of classes to start with
     * @param predicate - The property to trace though
     * @param inverse - Trace inverse direction
     */

  }, {
    key: "transitiveClosure",
    value: function transitiveClosure(seeds, predicate, inverse) {
      var elt, i, len, s, sups, t;
      var agenda = {};
      Object.assign(agenda, seeds); // make a copy

      var done = {}; // classes we have looked up

      while (true) {
        t = function () {
          for (var p in agenda) {
            if (!agenda.hasOwnProperty(p)) continue;
            return p;
          }
        }();

        if (t == null) {
          return done;
        }

        sups = inverse ? this.each(void 0, predicate, this.fromNT(t)) : this.each(this.fromNT(t), predicate);

        for (i = 0, len = sups.length; i < len; i++) {
          elt = sups[i];
          s = elt.toNT();

          if (s in done) {
            continue;
          }

          if (s in agenda) {
            continue;
          }

          agenda[s] = agenda[t];
        }

        done[t] = agenda[t];
        delete agenda[t];
      }
    }
    /**
     * Finds the types in the list which have no *stored* supertypes
     * We exclude the universal class, owl:Things and rdf:Resource, as it is
     * information-free.
     * @param types - The types
     */

  }, {
    key: "topTypeURIs",
    value: function topTypeURIs(types) {
      var i;
      var j;
      var k;
      var len;
      var n;
      var ref;
      var tops;
      var v;
      tops = [];

      for (k in types) {
        if (!types.hasOwnProperty(k)) continue;
        v = types[k];
        n = 0;
        ref = this.each(this.rdfFactory.namedNode(k), this.rdfFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'));

        for (i = 0, len = ref.length; i < len; i++) {
          j = ref[i];

          if (j.uri !== 'http://www.w3.org/2000/01/rdf-schema#Resource') {
            n++;
            break;
          }
        }

        if (!n) {
          tops[k] = v;
        }
      }

      if (tops['http://www.w3.org/2000/01/rdf-schema#Resource']) {
        delete tops['http://www.w3.org/2000/01/rdf-schema#Resource'];
      }

      if (tops['http://www.w3.org/2002/07/owl#Thing']) {
        delete tops['http://www.w3.org/2002/07/owl#Thing'];
      }

      return tops;
    }
    /**
     * Serializes this formula to a string
     */

  }, {
    key: "toString",
    value: function toString() {
      return '{' + this.statements.join('\n') + '}';
    }
    /**
     * Gets a new variable
     * @param name - The variable's name
     */

  }, {
    key: "variable",
    value: function variable(name) {
      return new Variable(name);
    }
    /**
     * Gets the number of statements in this formula that matches the specified pattern
     * @param s - The subject
     * @param p - The predicate
     * @param o - The object
     * @param g - The graph that contains the statement
     */

  }, {
    key: "whether",
    value: function whether(s, p, o, g) {
      return this.statementsMatching(s, p, o, g, false).length;
    }
  }]);

  return Formula;
}(Node);

export { Formula as default };