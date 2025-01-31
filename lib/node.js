"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _collection = require("./collection");
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _namespace = _interopRequireDefault(require("./namespace"));
var _terms = require("./utils/terms");
// This file attaches all functionality to Node
// that would otherwise require circular dependencies.

/**
 * Creates an RDF Node from a native javascript value.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * @method fromValue
 * @static
 * @param value {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Collection}
 */
_nodeInternal.default.fromValue = _collection.fromValue;
var _default = exports.default = _nodeInternal.default;
const ns = {
  xsd: (0, _namespace.default)('http://www.w3.org/2001/XMLSchema#')
};

/**
 * Gets the javascript object equivalent to a node
 * @param term The RDF node
 */
_nodeInternal.default.toJS = function (term) {
  if ((0, _terms.isCollection)(term)) {
    return term.elements.map(_nodeInternal.default.toJS); // Array node (not standard RDFJS)
  }
  if (!(0, _terms.isLiteral)(term)) return term;
  if (term.datatype.equals(ns.xsd('boolean'))) {
    return term.value === '1' || term.value === 'true';
  }
  if (term.datatype.equals(ns.xsd('dateTime')) || term.datatype.equals(ns.xsd('date'))) {
    return new Date(term.value);
  }
  if (term.datatype.equals(ns.xsd('integer')) || term.datatype.equals(ns.xsd('float')) || term.datatype.equals(ns.xsd('decimal'))) {
    return Number(term.value);
  }
  return term.value;
};