import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/inherits";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
import ClassOrder from './class-order';
import Node from './node-internal';
import { BlankNodeTermType } from './types';
/**
 * An RDF blank node is a Node without a URI
 * @link https://rdf.js.org/data-model-spec/#blanknode-interface
 */
var BlankNode = /*#__PURE__*/function (_Node) {
  /**
   * Initializes this node
   * @param [id] The identifier for the blank node
   */
  function BlankNode(id) {
    var _this;
    _classCallCheck(this, BlankNode);
    _this = _callSuper(this, BlankNode, [BlankNode.getId(id)]);
    _defineProperty(_this, "termType", BlankNodeTermType);
    _defineProperty(_this, "classOrder", ClassOrder.BlankNode);
    /** Whether this is a blank node */
    _defineProperty(_this, "isBlank", 1);
    /**
     * This type of node is a variable.
     *
     * Note that the existence of this property already indicates that it is a variable.
     */
    _defineProperty(_this, "isVar", 1);
    return _this;
  }

  /**
   * The identifier for the blank node
   */
  _inherits(BlankNode, _Node);
  return _createClass(BlankNode, [{
    key: "id",
    get: function get() {
      return this.value;
    },
    set: function set(value) {
      this.value = value;
    }
  }, {
    key: "compareTerm",
    value: function compareTerm(other) {
      if (this.classOrder < other.classOrder) {
        return -1;
      }
      if (this.classOrder > other.classOrder) {
        return +1;
      }
      if (this.id < other.id) {
        return -1;
      }
      if (this.id > other.id) {
        return +1;
      }
      return 0;
    }

    /**
     * Gets a copy of this blank node in the specified formula
     * @param formula The formula
     */
  }, {
    key: "copy",
    value: function copy(formula) {
      // depends on the formula
      var bnodeNew = new BlankNode();
      formula.copyTo(this, bnodeNew);
      return bnodeNew;
    }
  }, {
    key: "toCanonical",
    value: function toCanonical() {
      return BlankNode.NTAnonymousNodePrefix + this.value;
    }
  }, {
    key: "toString",
    value: function toString() {
      return BlankNode.NTAnonymousNodePrefix + this.id;
    }
  }], [{
    key: "getId",
    value: function getId(id) {
      if (id) {
        if (typeof id !== 'string') {
          throw new Error('Bad id argument to new blank node: ' + id);
        }
        if (id.includes('#')) {
          // Is a URI with hash fragment
          var fragments = id.split('#');
          return fragments[fragments.length - 1];
        }
        return id;
      }
      return 'n' + BlankNode.nextId++;
    }
  }]);
}(Node);
/**
 * The next unique identifier for blank nodes
 */
_defineProperty(BlankNode, "nextId", 0);
_defineProperty(BlankNode, "NTAnonymousNodePrefix", '_:');
export { BlankNode as default };