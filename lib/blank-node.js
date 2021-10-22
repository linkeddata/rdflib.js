"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classOrder = _interopRequireDefault(require("./class-order"));

var _nodeInternal = _interopRequireDefault(require("./node-internal"));

var _types = require("./types");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * An RDF blank node is a Node without a URI
 * @link https://rdf.js.org/data-model-spec/#blanknode-interface
 */
var BlankNode = /*#__PURE__*/function (_Node) {
  (0, _inherits2.default)(BlankNode, _Node);

  var _super = _createSuper(BlankNode);

  /**
   * Initializes this node
   * @param [id] The identifier for the blank node
   */
  function BlankNode(id) {
    var _this;

    (0, _classCallCheck2.default)(this, BlankNode);
    _this = _super.call(this, BlankNode.getId(id));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "termType", _types.BlankNodeTermType);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "classOrder", _classOrder.default.BlankNode);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "isBlank", 1);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "isVar", 1);
    return _this;
  }
  /**
   * The identifier for the blank node
   */


  (0, _createClass2.default)(BlankNode, [{
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
}(_nodeInternal.default);

exports.default = BlankNode;
(0, _defineProperty2.default)(BlankNode, "nextId", 0);
(0, _defineProperty2.default)(BlankNode, "NTAnonymousNodePrefix", '_:');