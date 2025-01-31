"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Namespace;
var _namedNode = _interopRequireDefault(require("./named-node"));
/**
 * Gets a namespace for the specified namespace's URI
 * @param nsuri - The URI for the namespace
 * @param [factory] - The factory for creating named nodes with
 */
function Namespace(nsuri, factory) {
  const dataFactory = factory || {
    namedNode: value => new _namedNode.default(value)
  };
  return function (ln) {
    return dataFactory.namedNode(nsuri + (ln || ''));
  };
}