import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inherits from "@babel/runtime/helpers/inherits";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _defineProperty from "@babel/runtime/helpers/defineProperty";

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

import ClassOrder from './class-order';
import Node from './node-internal';
import { BlankNodeTermType } from './types';

/**
 * An RDF blank node is a Node without a URI
 * @link https://rdf.js.org/data-model-spec/#blanknode-interface
 */
var BlankNode = /*#__PURE__*/function (_Node) {
  _inherits(BlankNode, _Node);

  var _super = _createSuper(BlankNode);

  /**
   * Initializes this node
   * @param [id] The identifier for the blank node
   */
  function BlankNode(id) {
    var _this;

    _classCallCheck(this, BlankNode);

    _this = _super.call(this, BlankNode.getId(id));

    _defineProperty(_assertThisInitialized(_this), "termType", BlankNodeTermType);

    _defineProperty(_assertThisInitialized(_this), "classOrder", ClassOrder.BlankNode);

    _defineProperty(_assertThisInitialized(_this), "isBlank", 1);

    _defineProperty(_assertThisInitialized(_this), "isVar", 1);

    return _this;
  }
  /**
   * The identifier for the blank node
   */


  _createClass(BlankNode, [{
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
    value:
    /**
     * The next unique identifier for blank nodes
     */
    function getId(id) {
      if (id) {
        if (typeof id !== 'string') {
          console.log('Bad blank id:', id);
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

  return BlankNode;
}(Node);

_defineProperty(BlankNode, "nextId", 0);

_defineProperty(BlankNode, "NTAnonymousNodePrefix", '_:');

export { BlankNode as default };