"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.isDefaultGraph = isDefaultGraph;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
var _defaultGraphUri = require("./utils/default-graph-uri");
/** The RDF default graph */
class DefaultGraph extends _nodeInternal.default {
  constructor() {
    super('');
    (0, _defineProperty2.default)(this, "value", '');
    (0, _defineProperty2.default)(this, "termType", _types.DefaultGraphTermType);
    (0, _defineProperty2.default)(this, "uri", _defaultGraphUri.defaultGraphURI);
  }
  toCanonical() {
    return this.value;
  }
  toString() {
    return 'DefaultGraph';
  }
}
exports.default = DefaultGraph;
function isDefaultGraph(object) {
  return !!object && object.termType === _types.DefaultGraphTermType;
}