"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultGraphURI = exports.defaultGraphNode = void 0;
var _namedNode = _interopRequireDefault(require("../named-node"));
// Prevents circular dependencies between data-factory-internal and statement

const defaultGraphURI = exports.defaultGraphURI = 'chrome:theSession';
const defaultGraphNode = exports.defaultGraphNode = new _namedNode.default(defaultGraphURI);