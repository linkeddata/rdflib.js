"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _nodeInternal = _interopRequireDefault(require("./node-internal"));
var _types = require("./types");
/**
* An empty node
*/
class Empty extends _nodeInternal.default {
  constructor() {
    super('');
    (0, _defineProperty2.default)(this, "termType", _types.EmptyTermType);
  }
  toString() {
    return '()';
  }
}
exports.default = Empty;