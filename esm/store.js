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

/*  Identity management and indexing for RDF
 *
 * This file provides  IndexedFormula a formula (set of triples) which
 * indexed by predicate, subject and object.
 *
 * It "smushes"  (merges into a single node) things which are identical
 * according to owl:sameAs or an owl:InverseFunctionalProperty
 * or an owl:FunctionalProperty
 *
 *
 *  2005-10 Written Tim Berners-Lee
 *  2007    Changed so as not to munge statements from documents when smushing
 *  2019    Converted to typescript
 *
 *
*/

/** @module store */
import ClassOrder from './class-order';
import { defaultGraphURI } from './factories/canonical-data-factory';
import Formula from './formula';
import { ArrayIndexOf } from './utils';
import { RDFArrayRemove } from './utils-js';
import { isRDFlibObject, isStore, isGraph, isPredicate, isQuad, isSubject } from './utils/terms';
import Node from './node';
import Variable from './variable';
import { Query, indexedFormulaQuery } from './query';
import { BlankNodeTermType, CollectionTermType, DefaultGraphTermType, EmptyTermType, GraphTermType, LiteralTermType, NamedNodeTermType, VariableTermType } from './types';
import NamedNode from './named-node';
import { namedNode } from './index';
import BlankNode from './blank-node';
import DefaultGraph from './default-graph';
import Literal from './literal';
var owlNamespaceURI = 'http://www.w3.org/2002/07/owl#';
export { defaultGraphURI }; // var link_ns = 'http://www.w3.org/2007/ont/link#'
// Handle Functional Property

function handleFP(formula, subj, pred, obj) {
  var o1 = formula.any(subj, pred, undefined);

  if (!o1) {
    return false; // First time with this value
  } // log.warn("Equating "+o1.uri+" and "+obj.uri + " because FP "+pred.uri);  //@@


  formula.equate(o1, obj);
  return true;
} // handleFP
// Handle Inverse Functional Property


function handleIFP(formula, subj, pred, obj) {
  var s1 = formula.any(undefined, pred, obj);

  if (!s1) {
    return false; // First time with this value
  } // log.warn("Equating "+s1.uri+" and "+subj.uri + " because IFP "+pred.uri);  //@@


  formula.equate(s1, subj);
  return true;
} // handleIFP


function handleRDFType(formula, subj, pred, obj, why) {
  //@ts-ignore this method does not seem to exist in this library
  if (formula.typeCallback) {
    formula.typeCallback(formula, obj, why);
  }

  var x = formula.classActions[formula.id(obj)];
  var done = false;

  if (x) {
    for (var i = 0; i < x.length; i++) {
      done = done || x[i](formula, subj, pred, obj, why);
    }
  }

  return done; // statement given is not needed if true
}
/**
 * Indexed Formula aka Store
 */


var IndexedFormula = /*#__PURE__*/function (_Formula) {
  _inherits(IndexedFormula, _Formula);

  var _super = _createSuper(IndexedFormula);

  // IN future - allow pass array of statements to constructor

  /**
   * An UpdateManager initialised to this store
   */

  /**
   * Dictionary of namespace prefixes
   */

  /** Map of iri predicates to functions to call when adding { s type X } */

  /** Map of iri predicates to functions to call when getting statement with {s X o} */

  /** Redirect to lexically smaller equivalent symbol */

  /** Reverse mapping to redirection: aliases for this */

  /** Redirections we got from HTTP */

  /** Array of statements with this X as subject */

  /** Array of statements with this X as predicate */

  /** Array of statements with this X as object */

  /** Array of statements with X as provenance */

  /** Function to remove quads from the store arrays with */

  /** Callbacks which are triggered after a statement has been added to the store */

  /**
   * Creates a new formula
   * @param features - What sort of automatic processing to do? Array of string
   * @param features.sameAs - Smush together A and B nodes whenever { A sameAs B }
   * @param opts
   * @param [opts.rdfFactory] - The data factory that should be used by the store
   * @param [opts.rdfArrayRemove] - Function which removes statements from the store
   * @param [opts.dataCallback] - Callback when a statement is added to the store, will not trigger when adding duplicates
   */
  function IndexedFormula(features) {
    var _this;

    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, IndexedFormula);

    _this = _super.call(this, undefined, undefined, undefined, undefined, opts);

    _defineProperty(_assertThisInitialized(_this), "updater", void 0);

    _defineProperty(_assertThisInitialized(_this), "namespaces", void 0);

    _defineProperty(_assertThisInitialized(_this), "classActions", void 0);

    _defineProperty(_assertThisInitialized(_this), "propertyActions", void 0);

    _defineProperty(_assertThisInitialized(_this), "redirections", void 0);

    _defineProperty(_assertThisInitialized(_this), "aliases", void 0);

    _defineProperty(_assertThisInitialized(_this), "HTTPRedirects", void 0);

    _defineProperty(_assertThisInitialized(_this), "subjectIndex", void 0);

    _defineProperty(_assertThisInitialized(_this), "predicateIndex", void 0);

    _defineProperty(_assertThisInitialized(_this), "objectIndex", void 0);

    _defineProperty(_assertThisInitialized(_this), "whyIndex", void 0);

    _defineProperty(_assertThisInitialized(_this), "index", void 0);

    _defineProperty(_assertThisInitialized(_this), "features", void 0);

    _defineProperty(_assertThisInitialized(_this), "_universalVariables", void 0);

    _defineProperty(_assertThisInitialized(_this), "_existentialVariables", void 0);

    _defineProperty(_assertThisInitialized(_this), "rdfArrayRemove", void 0);

    _defineProperty(_assertThisInitialized(_this), "dataCallbacks", void 0);

    _this.propertyActions = {};
    _this.classActions = {};
    _this.redirections = [];
    _this.aliases = [];
    _this.HTTPRedirects = [];
    _this.subjectIndex = [];
    _this.predicateIndex = [];
    _this.objectIndex = [];
    _this.whyIndex = [];
    _this.index = [_this.subjectIndex, _this.predicateIndex, _this.objectIndex, _this.whyIndex];
    _this.namespaces = {}; // Dictionary of namespace prefixes

    _this.features = features || [// By default, devs do not expect these features.
      // See https://github.com/linkeddata/rdflib.js/issues/458
      //      'sameAs',
      //      'InverseFunctionalProperty',
      //      'FunctionalProperty',
    ];
    _this.rdfArrayRemove = opts.rdfArrayRemove || RDFArrayRemove;

    if (opts.dataCallback) {
      _this.dataCallbacks = [opts.dataCallback];
    }

    _this.initPropertyActions(_this.features);

    return _this;
  }
  /**
   * Gets the URI of the default graph
   */


  _createClass(IndexedFormula, [{
    key: "substitute",
    value:
    /**
     * Gets this graph with the bindings substituted
     * @param bindings The bindings
     */
    function substitute(bindings) {
      var statementsCopy = this.statements.map(function (ea) {
        return ea.substitute(bindings);
      });
      var y = new IndexedFormula();
      y.add(statementsCopy);
      return y;
    }
    /**
     * Add a callback which will be triggered after a statement has been added to the store.
     * @param cb
     */

  }, {
    key: "addDataCallback",
    value: function addDataCallback(cb) {
      if (!this.dataCallbacks) {
        this.dataCallbacks = [];
      }

      this.dataCallbacks.push(cb);
    }
    /**
     * Apply a set of statements to be deleted and to be inserted
     *
     * @param patch - The set of statements to be deleted and to be inserted
     * @param target - The name of the document to patch
     * @param patchCallback - Callback to be called when patching is complete
     */

  }, {
    key: "applyPatch",
    value: function applyPatch(patch, target, patchCallback) {
      var targetKB = this;
      var ds;
      var binding = null;

      function doPatch(onDonePatch) {
        if (patch['delete']) {
          ds = patch['delete']; // console.log(bindingDebug(binding))
          // console.log('ds before substitute: ' + ds)

          if (binding) ds = ds.substitute(binding); // console.log('applyPatch: delete: ' + ds)

          ds = ds.statements;
          var bad = [];
          var ds2 = ds.map(function (st) {
            // Find the actual statements in the store
            var sts = targetKB.statementsMatching(st.subject, st.predicate, st.object, target);

            if (sts.length === 0) {
              // log.info("NOT FOUND deletable " + st)
              bad.push(st);
              return null;
            } else {
              // log.info("Found deletable " + st)
              return sts[0];
            }
          });

          if (bad.length) {
            // console.log('Could not find to delete ' + bad.length + 'statements')
            // console.log('despite ' + targetKB.statementsMatching(bad[0].subject, bad[0].predicate)[0])
            return patchCallback('Could not find to delete: ' + bad.join('\n or '));
          }

          ds2.map(function (st) {
            targetKB.remove(st);
          });
        }

        if (patch['insert']) {
          // log.info("doPatch insert "+patch['insert'])
          ds = patch['insert'];
          if (binding) ds = ds.substitute(binding);
          ds = ds.statements;
          ds.map(function (st) {
            st.graph = target;
            targetKB.add(st.subject, st.predicate, st.object, st.graph);
          });
        }

        onDonePatch();
      }

      if (patch.where) {
        // log.info("Processing WHERE: " + patch.where + '\n')
        var query = new Query('patch');
        query.pat = patch.where;
        query.pat.statements.map(function (st) {
          st.graph = namedNode(target.value);
        }); //@ts-ignore TODO: add sync property to Query when converting Query to typescript

        query.sync = true;
        var bindingsFound = [];
        targetKB.query(query, function onBinding(binding) {
          bindingsFound.push(binding); // console.log('   got a binding: ' + bindingDebug(binding))
        }, targetKB.fetcher, function onDone() {
          if (bindingsFound.length === 0) {
            return patchCallback('No match found to be patched:' + patch.where);
          }

          if (bindingsFound.length > 1) {
            return patchCallback('Patch ambiguous. No patch done.');
          }

          binding = bindingsFound[0];
          doPatch(patchCallback);
        });
      } else {
        doPatch(patchCallback);
      }
    }
    /**
     * N3 allows for declaring blank nodes, this function enables that support
     *
     * @param x The blank node to be declared, supported in N3
     */

  }, {
    key: "declareExistential",
    value: function declareExistential(x) {
      if (!this._existentialVariables) this._existentialVariables = [];

      this._existentialVariables.push(x);

      return x;
    }
    /**
     * @param features
     */

  }, {
    key: "initPropertyActions",
    value: function initPropertyActions(features) {
      // If the predicate is #type, use handleRDFType to create a typeCallback on the object
      this.propertyActions[this.rdfFactory.id(this.rdfFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'))] = [handleRDFType]; // Assumption: these terms are not redirected @@fixme

      if (ArrayIndexOf(features, 'sameAs') >= 0) {
        this.propertyActions[this.rdfFactory.id(this.rdfFactory.namedNode("".concat(owlNamespaceURI, "sameAs")))] = [function (formula, subj, pred, obj, why) {
          // log.warn("Equating "+subj.uri+" sameAs "+obj.uri);  //@@
          formula.equate(subj, obj);
          return true; // true if statement given is NOT needed in the store
        }]; // sameAs -> equate & don't add to index
      }

      if (ArrayIndexOf(features, 'InverseFunctionalProperty') >= 0) {
        this.classActions[this.rdfFactory.id(this.rdfFactory.namedNode("".concat(owlNamespaceURI, "InverseFunctionalProperty")))] = [function (formula, subj, pred, obj, addFn) {
          // yes subj not pred!
          return formula.newPropertyAction(subj, handleIFP);
        }]; // IFP -> handleIFP, do add to index
      }

      if (ArrayIndexOf(features, 'FunctionalProperty') >= 0) {
        this.classActions[this.rdfFactory.id(this.rdfFactory.namedNode("".concat(owlNamespaceURI, "FunctionalProperty")))] = [function (formula, subj, proj, obj, addFn) {
          return formula.newPropertyAction(subj, handleFP);
        }]; // FP => handleFP, do add to index
      }
    }
    /** @deprecated Use {add} instead */

  }, {
    key: "addStatement",
    value: function addStatement(st) {
      this.add(st.subject, st.predicate, st.object, st.graph);
      return this.statements.length;
    }
    /**
     * Adds a triple (quad) to the store.
     *
     * @param subj - The thing about which the fact a relationship is asserted.
     *        Also accepts a statement or an array of Statements.
     * @param pred - The relationship which is asserted
     * @param obj - The object of the relationship, e.g. another thing or a value. If passed a string, this will become a literal.
     * @param why - The document in which the triple (S,P,O) was or will be stored on the web
     * @returns The statement added to the store, or the store
     */

  }, {
    key: "add",
    value: function add(subj, pred, obj, why) {
      var i;

      if (arguments.length === 1) {
        if (subj instanceof Array) {
          for (i = 0; i < subj.length; i++) {
            this.add(subj[i]);
          }
        } else if (isQuad(subj)) {
          this.add(subj.subject, subj.predicate, subj.object, subj.graph);
        } else if (isStore(subj)) {
          this.add(subj.statements);
        }

        return this;
      }

      var actions;
      var st;

      if (!why) {
        // system generated
        why = this.fetcher ? this.fetcher.appNode : this.rdfFactory.defaultGraph();
      }

      if (typeof subj == 'string') {
        subj = this.rdfFactory.namedNode(subj);
      }

      pred = Node.fromValue(pred);
      var objNode = Node.fromValue(obj);
      why = Node.fromValue(why);

      if (!isSubject(subj)) {
        throw new Error('Subject is not a subject type');
      }

      if (!isPredicate(pred)) {
        throw new Error("Predicate ".concat(pred, " is not a predicate type"));
      }

      if (!isRDFlibObject(objNode)) {
        throw new Error("Object ".concat(objNode, " is not an object type"));
      }

      if (!isGraph(why)) {
        throw new Error("Why is not a graph type");
      } //@ts-ignore This is not used internally


      if (this.predicateCallback) {
        //@ts-ignore This is not used internally
        this.predicateCallback(this, pred, why);
      } // Action return true if the statement does not need to be added


      var predHash = this.id(this.canon(pred));
      actions = this.propertyActions[predHash]; // Predicate hash

      var done = false;

      if (actions) {
        // alert('type: '+typeof actions +' @@ actions='+actions)
        for (i = 0; i < actions.length; i++) {
          done = done || actions[i](this, subj, pred, objNode, why);
        }
      }

      if (this.holds(subj, pred, objNode, why)) {
        // Takes time but saves duplicates
        // console.log('rdflib: Ignoring dup! {' + subj + ' ' + pred + ' ' + obj + ' ' + why + '}')
        return null; // @@better to return self in all cases?
      } // If we are tracking provenance, every thing should be loaded into the store
      // if (done) return this.rdfFactory.quad(subj, pred, obj, why)
      // Don't put it in the store
      // still return this statement for owl:sameAs input


      var hash = [this.id(this.canon(subj)), predHash, this.id(this.canon(objNode)), this.id(this.canon(why))]; // @ts-ignore this will fail if you pass a collection and the factory does not allow Collections

      st = this.rdfFactory.quad(subj, pred, objNode, why);

      for (i = 0; i < 4; i++) {
        var ix = this.index[i];
        var h = hash[i];

        if (!ix[h]) {
          ix[h] = [];
        }

        ix[h].push(st); // Set of things with this as subject, etc
      } // log.debug("ADDING    {"+subj+" "+pred+" "+objNode+"} "+why)


      this.statements.push(st);

      if (this.dataCallbacks) {
        var _iterator = _createForOfIteratorHelper(this.dataCallbacks),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var callback = _step.value;
            callback(st);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      return st;
    }
    /**
     * Returns the symbol with canonical URI as smushed
     * @param term - An RDF node
     */

  }, {
    key: "canon",
    value: function canon(term) {
      if (!term) {
        // @@ TODO Should improve this to return proper value - doing this to keep it backward compatible
        return term;
      }

      var y = this.redirections[this.id(term)];

      if (y) {
        return y;
      }

      switch (term.termType) {
        case BlankNodeTermType:
          return new BlankNode(term.value);

        case CollectionTermType:
          return term;
        // non-RDF/JS type, should just need to cast

        case DefaultGraphTermType:
          return new DefaultGraph();

        case EmptyTermType:
          // non-RDF/JS type, should just need to cast
          return term;

        case GraphTermType:
          // non-RDF/JS type, should just need to cast
          return term;

        case LiteralTermType:
          return new Literal(term.value, term.language, term.datatype);

        case NamedNodeTermType:
          return new NamedNode(term.value);

        case VariableTermType:
          return new Variable(term.value);

        default:
          throw new Error("Term Type not recognized for canonization: ".concat(term.termType));
      }
    }
    /**
     * Checks this formula for consistency
     */

  }, {
    key: "check",
    value: function check() {
      this.checkStatementList(this.statements);

      for (var p = 0; p < 4; p++) {
        var ix = this.index[p];

        for (var key in ix) {
          if (ix.hasOwnProperty(key)) {
            // @ts-ignore should this pass an array or a single statement? checkStateMentsList expects an array.
            this.checkStatementList(ix[key], p);
          }
        }
      }
    }
    /**
     * Checks a list of statements for consistency
     * @param sts - The list of statements to check
     * @param from - An index with the array ['subject', 'predicate', 'object', 'why']
     */

  }, {
    key: "checkStatementList",
    value: function checkStatementList(sts, from) {
      if (from === undefined) {
        from = 0;
      }

      var names = ['subject', 'predicate', 'object', 'why'];
      var origin = ' found in ' + names[from] + ' index.';
      var st;

      for (var j = 0; j < sts.length; j++) {
        st = sts[j];
        var term = [st.subject, st.predicate, st.object, st.graph];

        var arrayContains = function arrayContains(a, x) {
          for (var i = 0; i < a.length; i++) {
            if (a[i].subject.equals(x.subject) && a[i].predicate.equals(x.predicate) && a[i].object.equals(x.object) && a[i].why.equals(x.graph)) {
              return true;
            }
          }
        };

        for (var p = 0; p < 4; p++) {
          var c = this.canon(term[p]);
          var h = this.id(c);

          if (!this.index[p][h]) {// throw new Error('No ' + name[p] + ' index for statement ' + st + '@' + st.why + origin)
          } else {
            if (!arrayContains(this.index[p][h], st)) {// throw new Error('Index for ' + name[p] + ' does not have statement ' + st + '@' + st.why + origin)
            }
          }
        }

        if (!arrayContains(this.statements, st)) {
          throw new Error('Statement list does not statement ' + st + '@' + st.graph + origin);
        }
      }
    }
    /**
     * Closes this formula (and return it)
     */

  }, {
    key: "close",
    value: function close() {
      return this;
    }
  }, {
    key: "compareTerms",
    value: function compareTerms(u1, u2) {
      // Keep compatibility with downstream classOrder changes
      if (Object.prototype.hasOwnProperty.call(u1, "compareTerm")) {
        return u1.compareTerm(u2);
      }

      if (ClassOrder[u1.termType] < ClassOrder[u2.termType]) {
        return -1;
      }

      if (ClassOrder[u1.termType] > ClassOrder[u2.termType]) {
        return +1;
      }

      if (u1.value < u2.value) {
        return -1;
      }

      if (u1.value > u2.value) {
        return +1;
      }

      return 0;
    }
    /**
     * replaces @template with @target and add appropriate triples
     * removes no triples by default and is a one-direction replication
     * @param template node to copy
     * @param target node to copy to
     * @param flags Whether or not to do a two-directional copy and/or delete triples
     */

  }, {
    key: "copyTo",
    value: function copyTo(template, target, flags) {
      if (!flags) flags = [];
      var statList = this.statementsMatching(template);

      if (ArrayIndexOf(flags, 'two-direction') !== -1) {
        statList.concat(this.statementsMatching(undefined, undefined, template));
      }

      for (var i = 0; i < statList.length; i++) {
        var st = statList[i];

        switch (st.object.termType) {
          case 'NamedNode':
            this.add(target, st.predicate, st.object);
            break;

          case 'Literal':
          case 'BlankNode': // @ts-ignore Collections can appear here

          case 'Collection':
            // @ts-ignore Possible bug: copy is not available on Collections
            this.add(target, st.predicate, st.object.copy(this));
        }

        if (ArrayIndexOf(flags, 'delete') !== -1) {
          this.remove(st);
        }
      }
    }
    /**
     * Simplify graph in store when we realize two identifiers are equivalent
     * We replace the bigger with the smaller.
     * @param u1in The first node
     * @param u2in The second node
     */

  }, {
    key: "equate",
    value: function equate(u1in, u2in) {
      // log.warn("Equating "+u1+" and "+u2); // @@
      // @@JAMBO Must canonicalize the uris to prevent errors from a=b=c
      // 03-21-2010
      var u1 = this.canon(u1in);
      var u2 = this.canon(u2in);
      var d = this.compareTerms(u1, u2);

      if (!d) {
        return true; // No information in {a = a}
      } // var big
      // var small


      if (d < 0) {
        // u1 less than u2
        return this.replaceWith(u2, u1);
      } else {
        return this.replaceWith(u1, u2);
      }
    }
    /**
     * Creates a new empty indexed formula
     * Only applicable for IndexedFormula, but TypeScript won't allow a subclass to override a property
     * @param features The list of features
     */

  }, {
    key: "formula",
    value: function formula(features) {
      return new IndexedFormula(features);
    }
    /**
     * Returns the number of statements contained in this IndexedFormula.
     * (Getter proxy to this.statements).
     * Usage:
     *    ```
     *    var kb = rdf.graph()
     *    kb.length  // -> 0
     *    ```
     * @returns {Number}
     */

  }, {
    key: "length",
    get: function get() {
      return this.statements.length;
    }
    /**
     * Returns any quads matching the given arguments.
     * Standard RDFJS spec method for Source objects, implemented as an
     * alias to `statementsMatching()`
     * @param subject The subject
     * @param predicate The predicate
     * @param object The object
     * @param graph The graph that contains the statement
     */

  }, {
    key: "match",
    value: function match(subject, predicate, object, graph) {
      return this.statementsMatching(Node.fromValue(subject), Node.fromValue(predicate), Node.fromValue(object), Node.fromValue(graph));
    }
    /**
     * Find out whether a given URI is used as symbol in the formula
     * @param uri The URI to look for
     */

  }, {
    key: "mentionsURI",
    value: function mentionsURI(uri) {
      var hash = '<' + uri + '>';
      return !!this.subjectIndex[hash] || !!this.objectIndex[hash] || !!this.predicateIndex[hash];
    }
    /**
     * Existentials are BNodes - something exists without naming
     * @param uri An URI
     */

  }, {
    key: "newExistential",
    value: function newExistential(uri) {
      if (!uri) return this.bnode();
      var x = this.sym(uri); // @ts-ignore x should be blanknode, but is namedNode.

      return this.declareExistential(x);
    }
    /**
     * Adds a new property action
     * @param pred the predicate that the function should be triggered on
     * @param action the function that should trigger
     */

  }, {
    key: "newPropertyAction",
    value: function newPropertyAction(pred, action) {
      // log.debug("newPropertyAction:  "+pred)
      var hash = this.id(pred);

      if (!this.propertyActions[hash]) {
        this.propertyActions[hash] = [];
      }

      this.propertyActions[hash].push(action); // Now apply the function to to statements already in the store

      var toBeFixed = this.statementsMatching(undefined, pred, undefined);
      var done = false;

      for (var i = 0; i < toBeFixed.length; i++) {
        // NOT optimized - sort toBeFixed etc
        done = done || action(this, toBeFixed[i].subject, pred, toBeFixed[i].object);
      }

      return done;
    }
    /**
     * Creates a new universal node
     * Universals are Variables
     * @param uri An URI
     */

  }, {
    key: "newUniversal",
    value: function newUniversal(uri) {
      var x = this.sym(uri);
      if (!this._universalVariables) this._universalVariables = [];

      this._universalVariables.push(x);

      return x;
    } // convenience function used by N3 parser

  }, {
    key: "variable",
    value: function variable(name) {
      return new Variable(name);
    }
    /**
     * Find an unused id for a file being edited: return a symbol
     * (Note: Slow iff a lot of them -- could be O(log(k)) )
     * @param doc A document named node
     */

  }, {
    key: "nextSymbol",
    value: function nextSymbol(doc) {
      for (var i = 0;; i++) {
        var uri = doc.value + '#n' + i;
        if (!this.mentionsURI(uri)) return this.sym(uri);
      }
    }
    /**
     * Query this store asynchronously, return bindings in callback
     *
     * @param myQuery The query to be run
     * @param callback Function to call when bindings
     * @param Fetcher | null  If you want the query to do link following
     * @param onDone OBSOLETE - do not use this // @@ Why not ?? Called when query complete
     */

  }, {
    key: "query",
    value: function query(myQuery, callback, fetcher, onDone) {
      return indexedFormulaQuery.call(this, myQuery, callback, fetcher, onDone);
    }
    /**
     * Query this store synchronously and return bindings
     *
     * @param myQuery The query to be run
     */

  }, {
    key: "querySync",
    value: function querySync(myQuery) {
      var results = [];

      function saveBinginds(bindings) {
        results.push(bindings);
      }

      function onDone() {
        done = true;
      }

      var done = false; // @ts-ignore TODO: Add .sync to Query

      myQuery.sync = true;
      indexedFormulaQuery.call(this, myQuery, saveBinginds, null, onDone);

      if (!done) {
        throw new Error('Sync query should have called done function');
      }

      return results;
    }
    /**
     * Removes one or multiple statement(s) from this formula
     * @param st - A Statement or array of Statements to remove
     */

  }, {
    key: "remove",
    value: function remove(st) {
      if (st instanceof Array) {
        for (var i = 0; i < st.length; i++) {
          this.remove(st[i]);
        }

        return this;
      }

      if (isStore(st)) {
        return this.remove(st.statements);
      }

      var sts = this.statementsMatching(st.subject, st.predicate, st.object, st.graph);

      if (!sts.length) {
        throw new Error('Statement to be removed is not on store: ' + st);
      }

      this.removeStatement(sts[0]);
      return this;
    }
    /**
     * Removes all statements in a doc
     * @param doc - The document / graph
     */

  }, {
    key: "removeDocument",
    value: function removeDocument(doc) {
      var sts = this.statementsMatching(undefined, undefined, undefined, doc).slice(); // Take a copy as this is the actual index

      for (var i = 0; i < sts.length; i++) {
        this.removeStatement(sts[i]);
      }

      return this;
    }
    /**
     * Remove all statements matching args (within limit) *
     * @param subj The subject
     * @param pred The predicate
     * @param obj The object
     * @param why The graph that contains the statement
     * @param limit The number of statements to remove
     */

  }, {
    key: "removeMany",
    value: function removeMany(subj, pred, obj, why, limit) {
      // log.debug("entering removeMany w/ subj,pred,obj,why,limit = " + subj +", "+ pred+", " + obj+", " + why+", " + limit)
      var sts = this.statementsMatching(subj, pred, obj, why, false); // This is a subtle bug that occurred in updateCenter.js too.
      // The fact is, this.statementsMatching returns this.whyIndex instead of a copy of it
      // but for perfromance consideration, it's better to just do that
      // so make a copy here.

      var statements = [];

      for (var i = 0; i < sts.length; i++) {
        statements.push(sts[i]);
      }

      if (limit) statements = statements.slice(0, limit);

      for (i = 0; i < statements.length; i++) {
        this.remove(statements[i]);
      }
    }
    /**
     * Remove all matching statements
     * @param subject The subject
     * @param predicate The predicate
     * @param object The object
     * @param graph The graph that contains the statement
     */

  }, {
    key: "removeMatches",
    value: function removeMatches(subject, predicate, object, graph) {
      this.removeStatements(this.statementsMatching(subject, predicate, object, graph));
      return this;
    }
    /**
     * Remove a particular statement object from the store
     *
     * @param st - a statement which is already in the store and indexed.
     *        Make sure you only use this for these.
     *        Otherwise, you should use remove() above.
     */

  }, {
    key: "removeStatement",
    value: function removeStatement(st) {
      // log.debug("entering remove w/ st=" + st)
      var term = [st.subject, st.predicate, st.object, st.graph];

      for (var p = 0; p < 4; p++) {
        var c = this.canon(term[p]);
        var h = this.id(c);

        if (!this.index[p][h]) {// log.warn ("Statement removal: no index '+p+': "+st)
        } else {
          this.rdfArrayRemove(this.index[p][h], st);
        }
      }

      this.rdfArrayRemove(this.statements, st);
      return this;
    }
    /**
     * Removes statements
     * @param sts The statements to remove
     */

  }, {
    key: "removeStatements",
    value: function removeStatements(sts) {
      for (var i = 0; i < sts.length; i++) {
        this.remove(sts[i]);
      }

      return this;
    }
    /**
     * Replace big with small, obsoleted with obsoleting.
     */

  }, {
    key: "replaceWith",
    value: function replaceWith(big, small) {
      // log.debug("Replacing "+big+" with "+small) // this.id(@@
      var oldhash = this.id(big);
      var newhash = this.id(small);

      var moveIndex = function moveIndex(ix) {
        var oldlist = ix[oldhash];

        if (!oldlist) {
          return; // none to move
        }

        var newlist = ix[newhash];

        if (!newlist) {
          ix[newhash] = oldlist;
        } else {
          ix[newhash] = oldlist.concat(newlist);
        }

        delete ix[oldhash];
      }; // the canonical one carries all the indexes


      for (var i = 0; i < 4; i++) {
        moveIndex(this.index[i]);
      }

      this.redirections[oldhash] = small;

      if (big.value) {
        // @@JAMBO: must update redirections,aliases from sub-items, too.
        if (!this.aliases[newhash]) {
          this.aliases[newhash] = [];
        }

        this.aliases[newhash].push(big); // Back link

        if (this.aliases[oldhash]) {
          for (i = 0; i < this.aliases[oldhash].length; i++) {
            this.redirections[this.id(this.aliases[oldhash][i])] = small;
            this.aliases[newhash].push(this.aliases[oldhash][i]);
          }
        }

        this.add(small, this.sym('http://www.w3.org/2007/ont/link#uri'), big); // If two things are equal, and one is requested, we should request the other.

        if (this.fetcher) {
          this.fetcher.nowKnownAs(big, small);
        }
      }

      moveIndex(this.classActions);
      moveIndex(this.propertyActions); // log.debug("Equate done. "+big+" to be known as "+small)

      return true; // true means the statement does not need to be put in
    }
    /**
     * Return all equivalent URIs by which this is known
     * @param x A named node
     */

  }, {
    key: "allAliases",
    value: function allAliases(x) {
      var a = this.aliases[this.id(this.canon(x))] || [];
      a.push(this.canon(x));
      return a;
    }
    /**
     * Compare by canonical URI as smushed
     * @param x A named node
     * @param y Another named node
     */

  }, {
    key: "sameThings",
    value: function sameThings(x, y) {
      if (x.equals(y)) {
        return true;
      }

      var x1 = this.canon(x); //    alert('x1='+x1)

      if (!x1) return false;
      var y1 = this.canon(y); //    alert('y1='+y1); //@@

      if (!y1) return false;
      return x1.value === y1.value;
    }
  }, {
    key: "setPrefixForURI",
    value: function setPrefixForURI(prefix, nsuri) {
      // TODO: This is a hack for our own issues, which ought to be fixed
      // post-release
      // See http://dig.csail.mit.edu/cgi-bin/roundup.cgi/$rdf/issue227
      if (prefix === 'tab' && this.namespaces['tab']) {
        return;
      } // There are files around with long badly generated prefixes like this


      if (prefix.slice(0, 2) === 'ns' || prefix.slice(0, 7) === 'default') {
        return;
      }

      this.namespaces[prefix] = nsuri;
    }
    /** Search the Store
     *
     * ALL CONVENIENCE LOOKUP FUNCTIONS RELY ON THIS!
     * @param subj - A node to search for as subject, or if null, a wildcard
     * @param pred - A node to search for as predicate, or if null, a wildcard
     * @param obj - A node to search for as object, or if null, a wildcard
     * @param why - A node to search for as graph, or if null, a wildcard
     * @param justOne - flag - stop when found one rather than get all of them?
     * @returns An array of nodes which match the wildcard position
     */

  }, {
    key: "statementsMatching",
    value: function statementsMatching(subj, pred, obj, why, justOne) {
      // log.debug("Matching {"+subj+" "+pred+" "+obj+"}")
      var pat = [subj, pred, obj, why];
      var pattern = [];
      var hash = [];
      var wild = []; // wildcards

      var given = []; // Not wild

      var p;
      var list;

      for (p = 0; p < 4; p++) {
        pattern[p] = this.canon(Node.fromValue(pat[p]));

        if (!pattern[p]) {
          wild.push(p);
        } else {
          given.push(p);
          hash[p] = this.id(pattern[p]);
        }
      }

      if (given.length === 0) {
        return this.statements;
      }

      if (given.length === 1) {
        // Easy too, we have an index for that
        p = given[0];
        list = this.index[p][hash[p]];

        if (list && justOne) {
          if (list.length > 1) {
            list = list.slice(0, 1);
          }
        }

        list = list || [];
        return list;
      } // Now given.length is 2, 3 or 4.
      // We hope that the scale-free nature of the data will mean we tend to get
      // a short index in there somewhere!


      var best = 1e10; // really bad

      var iBest;
      var i;

      for (i = 0; i < given.length; i++) {
        p = given[i]; // Which part we are dealing with

        list = this.index[p][hash[p]];

        if (!list) {
          return []; // No occurrences
        }

        if (list.length < best) {
          best = list.length;
          iBest = i; // (not p!)
        }
      } // Ok, we have picked the shortest index but now we have to filter it


      var pBest = given[iBest];
      var possibles = this.index[pBest][hash[pBest]];
      var check = given.slice(0, iBest).concat(given.slice(iBest + 1)); // remove iBest

      var results = [];
      var parts = ['subject', 'predicate', 'object', 'why'];

      for (var j = 0; j < possibles.length; j++) {
        var st = possibles[j];

        for (i = 0; i < check.length; i++) {
          // for each position to be checked
          p = check[i];

          if (!this.canon(st[parts[p]]).equals(pattern[p])) {
            st = null;
            break;
          }
        }

        if (st != null) {
          results.push(st);
          if (justOne) break;
        }
      }

      return results;
    }
    /**
     * A list of all the URIs by which this thing is known
     * @param term
     */

  }, {
    key: "uris",
    value: function uris(term) {
      var cterm = this.canon(term);
      var terms = this.aliases[this.id(cterm)];
      if (!cterm.value) return [];
      var res = [cterm.value];

      if (terms) {
        for (var i = 0; i < terms.length; i++) {
          res.push(terms[i].uri);
        }
      }

      return res;
    }
  }], [{
    key: "defaultGraphURI",
    get: function get() {
      return defaultGraphURI;
    }
  }]);

  return IndexedFormula;
}(Formula);

_defineProperty(IndexedFormula, "handleRDFType", void 0);

export { IndexedFormula as default };
IndexedFormula.handleRDFType = handleRDFType;