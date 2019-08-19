import asyncLib from 'async' // @@ Goal: remove this dependency
import jsonld from 'jsonld'
import { Parser, Writer } from 'n3'  // @@ Goal: remove this dependency

export function convertToJson (n3String, jsonCallback) {
  var jsonString
  var n3Parser = new Parser()
  var n3Writer = new Writer({
    format: 'N-Quads'
  })
  asyncLib.waterfall([
    function (callback) {
      n3Parser.parse(n3String, callback)
    },
    function (triple, prefix, callback) {
      if (triple !== null) {
        n3Writer.addTriple(triple)
      }
      if (typeof callback === 'function') {
        n3Writer.end(callback)
      }
    },
    function (result, callback) {
      try {
        jsonld.fromRDF(result, {
          format: 'application/nquads'
        }, callback)
      } catch (err) {
        callback(err)
      }
    },
    function (json, callback) {
      jsonString = JSON.stringify(json)
      jsonCallback(null, jsonString)
    }
  ], function (err, result) {
    jsonCallback(err, jsonString)
  }
  )
}

export function convertToNQuads (n3String, nquadCallback) {
  var nquadString
  var n3Parser = new Parser()
  var n3Writer = new Writer({
    format: 'N-Quads'
  })
  asyncLib.waterfall([
    function (callback) {
      n3Parser.parse(n3String, callback)
    },
    function (triple, prefix, callback) {
      if (triple !== null) {
        n3Writer.addTriple(triple)
      }
      if (typeof callback === 'function') {
        n3Writer.end(callback)
      }
    },
    function (result, callback) {
      nquadString = result
      nquadCallback(null, nquadString)
    }
  ], function (err, result) {
    nquadCallback(err, nquadString)
  }
  )
}
