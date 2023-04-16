"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertFirstRestNil = convertFirstRestNil;
exports.substituteInDoc = substituteInDoc;
exports.substituteNillsInDoc = substituteNillsInDoc;
var _collection = _interopRequireDefault(require("./collection"));
var _statement = _interopRequireDefault(require("./statement"));
var _namespace = _interopRequireDefault(require("./namespace"));
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; } /* Lists form conversion
                                                                                                                                                                                    */ // import DataFactory from './factories/extended-term-factory'
// import jsonldParser from './jsonldparser'
// @ts-ignore is this injected?
// @@ Goal: remove this dependency
// import N3Parser from './n3parser'
// import { parseRDFaDOM } from './rdfaparser'
// import RDFParser from './rdfxmlparser'
// import sparqlUpdateParser from './patch-parser'
// import * as Util from './utils-js'
// import BlankNode from './blank-node'
// import NamedNode from './named-node'
// import Formula from './formula'
// import { ContentType, TurtleContentType, N3ContentType, RDFXMLContentType, XHTMLContentType, HTMLContentType, SPARQLUpdateContentType, SPARQLUpdateSingleMatchContentType, JSONLDContentType, NQuadsContentType, NQuadsAltContentType } from './types'
// import { Quad } from './tf-types'
var RDF = (0, _namespace.default)('http://www.w3.org/1999/02/22-rdf-syntax-ns#');

/* Replace a given node with another node throughout a given document
*
* we do the predicate as well for complenesss though we don't expect Collections to use it
*/
function substituteInDoc(store, x, y, doc) {
  // console.log(`substituteInDoc put ${x} for ${y} in ${doc}}`)
  var _iterator = _createForOfIteratorHelper(store.statementsMatching(y, null, null, doc)),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var quad = _step.value;
      var newStatement = new _statement.default(x, quad.predicate, quad.object, doc);
      store.remove(quad);
      store.add(newStatement);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var _iterator2 = _createForOfIteratorHelper(store.statementsMatching(null, y, null, doc)),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _quad = _step2.value;
      store.remove(_quad);
      // console.log(`  substituteInDoc predicate ${x} in ${quad}}`)
      store.add(new _statement.default(_quad.subject, x, _quad.object, doc));
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  var _iterator3 = _createForOfIteratorHelper(store.statementsMatching(null, null, y, doc)),
    _step3;
  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var _quad2 = _step3.value;
      store.remove(_quad2);
      store.add(new _statement.default(_quad2.subject, _quad2.predicate, x, doc));
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
}

/* Change all lone rdf:nil nodes into empty Collections
*/
function substituteNillsInDoc(store, doc) {
  var x = RDF('nil');
  var _iterator4 = _createForOfIteratorHelper(store.statementsMatching(x, null, null, doc)),
    _step4;
  try {
    for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
      var quad = _step4.value;
      store.remove(quad);
      var y = new _collection.default();
      store.add(new _statement.default(y, quad.predicate, quad.object, doc));
    }
  } catch (err) {
    _iterator4.e(err);
  } finally {
    _iterator4.f();
  }
  var _iterator5 = _createForOfIteratorHelper(store.statementsMatching(null, null, x, doc)),
    _step5;
  try {
    for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
      var _quad3 = _step5.value;
      if (!_quad3.predicate.sameTerm(RDF('rest'))) {
        // If not a tail
        store.remove(_quad3);
        var _y = new _collection.default();
        store.add(new _statement.default(_quad3.subject, _quad3.predicate, _y, doc));
      }
    }
  } catch (err) {
    _iterator5.e(err);
  } finally {
    _iterator5.f();
  }
}
/**
 * Convert lists reified as rdf:first, rest
 * Normal method is sync.
 * Unfortunately jsdonld is currently written to need to be called async.
 * Hence the mess below with executeCallback.
 * @param store - The quadstore
 * @param doc - The document in which the conversion is done
 */

function convertFirstRestNil(store, doc // Do whole store?
) {
  function preceding(ele, listSoFar, trash) {
    var rests = store.statementsMatching(ele, RDF('rest'), null, doc);
    if (rests.length !== 1) throw new Error("Bad list structure: no rest at ".concat(ele));
    var firsts = store.statementsMatching(ele, RDF('first'), null, doc);
    if (firsts.length !== 1) throw new Error("Bad list structure: rest but ".concat(firsts.length, " firsts at ").concat(ele));
    var value = firsts[0].object;
    var total = [value].concat(listSoFar);
    // console.log('  List now is: ', total)
    var totalTrash = trash.concat(rests).concat(firsts);
    var pres = store.statementsMatching(null, RDF('rest'), ele, doc);
    if (pres.length === 0) {
      // Head of the list
      var newList = new _collection.default(total);
      store.remove(totalTrash);
      // Replace old list with new list:
      substituteInDoc(store, newList, ele, doc);
      return;
    }
    if (pres.length !== 1) throw new Error("Bad list structure: ".concat(pres.length, " pres at ").concat(ele));
    var pre = pres[0].subject;
    if (pre.termType !== 'BlankNode') throw new Error("Bad list element node ".concat(pre, " type: ").concat(pre.termType, " "));
    preceding(pre, total, totalTrash);
    return;
  }
  substituteNillsInDoc(store, doc); // lone ones only

  var tails = store.statementsMatching(null, RDF('rest'), RDF('nil'), doc);
  tails.forEach(function (tail) {
    if (tail.subject.termType !== 'BlankNode') throw new Error("Bad list element node ".concat(tail.subject, " type: ").concat(tail.subject.termType, " "));
    preceding(tail.subject, [], []);
  });
}