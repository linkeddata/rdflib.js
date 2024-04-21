import _classCallCheck from "@babel/runtime/helpers/classCallCheck";
import _createClass from "@babel/runtime/helpers/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/inherits";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
import RdflibBlankNode from './blank-node';
import ClassOrder from './class-order';
import Literal from './literal';
import Node from './node-internal';
import { CollectionTermType } from './types';
import { isTerm } from './utils/terms';
/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * Arrays return Collections.
 * Strings, numbers and booleans return Literals.
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
export function fromValue(value) {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }
  if (isTerm(value)) {
    // a Node subclass or a Collection
    return value;
  }
  if (Array.isArray(value)) {
    return new Collection(value);
  }
  return Literal.fromValue(value);
}

/**
 * A collection of other RDF nodes
 *
 * Use generic T to control the contents of the array.
 */
var Collection = /*#__PURE__*/function (_Node) {
  function Collection(initial) {
    var _this;
    _classCallCheck(this, Collection);
    _this = _callSuper(this, Collection, [(RdflibBlankNode.nextId++).toString()]);
    _defineProperty(_this, "termType", CollectionTermType);
    _defineProperty(_this, "classOrder", ClassOrder.Collection);
    _defineProperty(_this, "closed", false);
    _defineProperty(_this, "compareTerm", RdflibBlankNode.prototype.compareTerm);
    /**
     * The nodes in this collection
     */
    _defineProperty(_this, "elements", []);
    _defineProperty(_this, "isVar", 0);
    if (initial && initial.length > 0) {
      initial.forEach(function (element) {
        _this.elements.push(fromValue(element));
      });
    }
    return _this;
  }
  _inherits(Collection, _Node);
  return _createClass(Collection, [{
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
      // return '(' + collection.elements.map(x => x.toNT()).join(' ') + ')'
      // As lists are not in NT and toNT() must be a reversible function, we kludge it for a list
      return RdflibBlankNode.NTAnonymousNodePrefix + collection.id;
    }
  }]);
}(Node);
_defineProperty(Collection, "termType", CollectionTermType);
export { Collection as default };