"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.fromValue = fromValue;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _blankNode = _interopRequireDefault(require("./blank-node"));

var _classOrder = _interopRequireDefault(require("./class-order"));

var _literal = _interopRequireDefault(require("./literal"));

var _nodeInternal = _interopRequireDefault(require("./node-internal"));

var _types = require("./types");

var _terms = require("./utils/terms");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * Arrays return Collections.
 * Strings, numbers and booleans return Literals.
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
function fromValue(value) {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }

  if ((0, _terms.isTerm)(value)) {
    // a Node subclass or a Collection
    return value;
  }

  if (Array.isArray(value)) {
    return new Collection(value);
  }

  return _literal.default.fromValue(value);
}
/**
 * A collection of other RDF nodes
 *
 * Use generic T to control the contents of the array.
 */


var Collection = /*#__PURE__*/function (_Node) {
  (0, _inherits2.default)(Collection, _Node);

  var _super = _createSuper(Collection);

  /**
   * The nodes in this collection
   */
  function Collection(initial) {
    var _this;

    (0, _classCallCheck2.default)(this, Collection);
    _this = _super.call(this, (_blankNode.default.nextId++).toString());
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "termType", _types.CollectionTermType);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "classOrder", _classOrder.default.Collection);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "closed", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "compareTerm", _blankNode.default.prototype.compareTerm);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "elements", []);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "isVar", 0);

    if (initial && initial.length > 0) {
      initial.forEach(function (element) {
        _this.elements.push(fromValue(element));
      });
    }

    return _this;
  }

  (0, _createClass2.default)(Collection, [{
    key: "id",
    get: function get() {
      return this.value;
    },
    set: function set(value) {
      this.value = value;
    }
    /**
     * Appends an element to this collection
     * @param element - The new element
     */

  }, {
    key: "append",
    value: function append(element) {
      return this.elements.push(element);
    }
    /**
     * Closes this collection
     */

  }, {
    key: "close",
    value: function close() {
      this.closed = true;
      return this.closed;
    }
    /**
     * Removes the first element from the collection (and return it)
     */

  }, {
    key: "shift",
    value: function shift() {
      return this.elements.shift();
    }
    /**
     * Creates a new Collection with the substituting bindings applied
     * @param bindings - The bindings to substitute
     */

  }, {
    key: "substitute",
    value: function substitute(bindings) {
      var elementsCopy = this.elements.map(function (ea) {
        return ea.substitute(bindings);
      });
      return new Collection(elementsCopy);
    }
  }, {
    key: "toNT",
    value: function toNT() {
      return Collection.toNT(this);
    }
  }, {
    key: "toString",
    value:
    /**
     * Serializes the collection to a string.
     * Surrounded by (parentheses) and separated by spaces.
     */
    function toString() {
      return '(' + this.elements.join(' ') + ')';
    }
    /**
     * Prepends the specified element to the collection's front
     * @param element - The element to prepend
     */

  }, {
    key: "unshift",
    value: function unshift(element) {
      return this.elements.unshift(element);
    }
  }], [{
    key: "toNT",
    value: function toNT(collection) {
      return _blankNode.default.NTAnonymousNodePrefix + collection.id;
    }
  }]);
  return Collection;
}(_nodeInternal.default);

exports.default = Collection;
(0, _defineProperty2.default)(Collection, "termType", _types.CollectionTermType);