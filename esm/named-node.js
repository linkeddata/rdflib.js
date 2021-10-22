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
import { NamedNodeTermType } from './types';
import { termValue } from './utils/termValue';
import { isTerm } from './utils/terms';
/**
 * A named (IRI) RDF node
 */

var NamedNode = /*#__PURE__*/function (_Node) {
  _inherits(NamedNode, _Node);

  var _super = _createSuper(NamedNode);

  /**
   * Create a named (IRI) RDF Node
   * @constructor
   * @param iri - The IRI for this node
   */
  function NamedNode(iri) {
    var _this;

    _classCallCheck(this, NamedNode);

    _this = _super.call(this, termValue(iri));

    _defineProperty(_assertThisInitialized(_this), "termType", NamedNodeTermType);

    _defineProperty(_assertThisInitialized(_this), "classOrder", ClassOrder.NamedNode);

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


  _createClass(NamedNode, [{
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

      if (isTerm(value)) {
        return value;
      }

      return new NamedNode(value);
    }
  }]);

  return NamedNode;
}(Node);

export { NamedNode as default };