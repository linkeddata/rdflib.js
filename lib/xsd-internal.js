"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _namedNode = _interopRequireDefault(require("./named-node"));
var _default = exports.default = {
  boolean: new _namedNode.default('http://www.w3.org/2001/XMLSchema#boolean'),
  dateTime: new _namedNode.default('http://www.w3.org/2001/XMLSchema#dateTime'),
  decimal: new _namedNode.default('http://www.w3.org/2001/XMLSchema#decimal'),
  double: new _namedNode.default('http://www.w3.org/2001/XMLSchema#double'),
  integer: new _namedNode.default('http://www.w3.org/2001/XMLSchema#integer'),
  langString: new _namedNode.default('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString'),
  string: new _namedNode.default('http://www.w3.org/2001/XMLSchema#string')
};