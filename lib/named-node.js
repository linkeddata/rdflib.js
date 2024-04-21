"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classOrder = _interopRequireDefault(require("./class-order"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
var _termValue = require("./utils/termValue");
var _terms = require("./utils/terms");
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2.default)(o), (0, _possibleConstructorReturn2.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2.default)(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
/**
 * A named (IRI) RDF node
 */
var NamedNode = exports.default = /*#__PURE__*/function (_Node) {
  /**
   * Create a named (IRI) RDF Node
   * @constructor
   * @param iri - The IRI for this node
   */
  function NamedNode(iri) {
    var _this;
    (0, _classCallCheck2.default)(this, NamedNode);
    _this = _callSuper(this, NamedNode, [(0, _termValue.termValue)(iri)]);
    (0, _defineProperty2.default)(_this, "termType", _types.NamedNodeTermType);
    (0, _defineProperty2.default)(_this, "classOrder", _classOrder.default.NamedNode);
    if (!_this.value) {
      throw new Error('Missing IRI for NamedNode');
    }
    if (!_this.value.includes(':')) {
      throw new Error('NamedNode IRI "' + iri + '" must be absolute.');
    }
    if (_this.value.includes(' ')) {
      var message = 'Error: NamedNode IRI "' + iri + '" must not contain unencoded spaces.';
      throw new Error(message);
    }
    return _this;
  }

  /**
   * Returns an $rdf node for the containing directory, ending in slash.
   */
  (0, _inherits2.default)(NamedNode, _Node);
  return (0, _createClass2.default)(NamedNode, [{
    key: "dir",
    value: function dir() {
      var str = this.value.split('#')[0];
      var p = str.slice(0, -1).lastIndexOf('/');
      var q = str.indexOf('//');
      if (q >= 0 && p < q + 2 || p < 0) return null;
      return new NamedNode(str.slice(0, p + 1));
    }

    /**
     * Returns an NN for the whole web site, ending in slash.
     * Contrast with the "origin" which does NOT have a trailing slash
     */
  }, {
    key: "site",
    value: function site() {
      var str = this.value.split('#')[0];
      var p = str.indexOf('//');
      if (p < 0) throw new Error('This URI does not have a web site part (origin)');
      var q = str.indexOf('/', p + 2);
      if (q < 0) {
        return new NamedNode(str.slice(0) + '/'); // Add slash to a bare origin
      } else {
        return new NamedNode(str.slice(0, q + 1));
      }
    }

    /**
     * Creates the fetchable named node for the document.
     * Removes everything from the # anchor tag.
     */
  }, {
    key: "doc",
    value: function doc() {
      if (this.value.indexOf('#') < 0) {
        return this;
      } else {
        return new NamedNode(this.value.split('#')[0]);
      }
    }

    /**
     * Returns the URI including <brackets>
     */
  }, {
    key: "toString",
    value: function toString() {
      return '<' + this.value + '>';
    }

    /** The local identifier with the document */
  }, {
    key: "id",
    value: function id() {
      return this.value.split('#')[1];
    }

    /** Alias for value, favored by Tim */
  }, {
    key: "uri",
    get: function get() {
      return this.value;
    },
    set: function set(uri) {
      this.value = uri;
    }

    /**
     * Creates a named node from the specified input value
     * @param value - An input value
     */
  }], [{
    key: "fromValue",
    value: function fromValue(value) {
      if (typeof value === 'undefined' || value === null) {
        return value;
      }
      if ((0, _terms.isTerm)(value)) {
        return value;
      }
      return new NamedNode(value);
    }
  }]);
}(_nodeInternal.default);