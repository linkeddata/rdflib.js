"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createXSD = createXSD;
exports.default = void 0;
var _canonicalDataFactory = _interopRequireDefault(require("./factories/canonical-data-factory"));
function createXSD(localFactory = _canonicalDataFactory.default) {
  return {
    boolean: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#boolean"),
    dateTime: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime"),
    decimal: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#decimal"),
    double: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#double"),
    integer: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#integer"),
    langString: localFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#langString"),
    string: localFactory.namedNode("http://www.w3.org/2001/XMLSchema#string")
  };
}
const defaultXSD = createXSD(_canonicalDataFactory.default);
var _default = exports.default = defaultXSD;