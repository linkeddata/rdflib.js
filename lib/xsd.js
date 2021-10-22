"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createXSD = createXSD;
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _canonicalDataFactory = _interopRequireDefault(require("./factories/canonical-data-factory"));

function createXSD() {
  var localFactory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _canonicalDataFactory.default;

  var XSD = function XSD() {
    (0, _classCallCheck2.default)(this, XSD);
  };

  XSD.boolean = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean');
  XSD.dateTime = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#dateTime');
  XSD.decimal = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#decimal');
  XSD.double = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#double');
  XSD.integer = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#integer');
  XSD.langString = localFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString');
  XSD.string = localFactory.namedNode('http://www.w3.org/2001/XMLSchema#string');
  return XSD;
}

var defaultXSD = createXSD(_canonicalDataFactory.default);
var _default = defaultXSD;
exports.default = _default;