"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertToJson = convertToJson;
exports.convertToNQuads = convertToNQuads;

var _async = _interopRequireDefault(require("async"));

var _jsonld = _interopRequireDefault(require("jsonld"));

var _n = require("n3");

// @@ Goal: remove this dependency
// @@ Goal: remove this dependency
function convertToJson(n3String, jsonCallback) {
  var jsonString;
  var n3Parser = new _n.Parser();
  var n3Writer = new _n.Writer({
    format: 'N-Quads'
  });

  _async.default.waterfall([function (callback) {
    n3Parser.parse(n3String, function (error, quad, prefixes) {
      if (error) {
        callback(error);
      } else if (quad !== null) {
        n3Writer.addQuad(quad);
      } else {
        n3Writer.end(callback);
      }
    });
  }, function (result, callback) {
    try {
      _jsonld.default.fromRDF(result, {
        format: 'application/nquads'
      }).then(function (result) {
        callback(null, result);
      });
    } catch (err) {
      callback(err);
    }
  }, function (json, callback) {
    jsonString = JSON.stringify(json);
    jsonCallback(null, jsonString);
  }], function (err, result) {
    jsonCallback(err, jsonString);
  });
}

function convertToNQuads(n3String, nquadCallback) {
  var nquadString;
  var n3Parser = new _n.Parser();
  var n3Writer = new _n.Writer({
    format: 'N-Quads'
  });

  _async.default.waterfall([function (callback) {
    n3Parser.parse(n3String, function (error, triple, prefixes) {
      if (error) {
        callback(error);
      } else if (quad !== null) {
        n3Writer.addQuad(quad);
      } else {
        n3Writer.end(callback);
      }
    });
  }, function (result, callback) {
    nquadString = result;
    nquadCallback(null, nquadString);
  }], function (err, result) {
    nquadCallback(err, nquadString);
  });
}