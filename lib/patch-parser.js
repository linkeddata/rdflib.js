"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sparqlUpdateParser;
var _n3parser = _interopRequireDefault(require("./n3parser"));
var _namespace = _interopRequireDefault(require("./namespace"));
// Parse a simple SPARL-Update subset syntax for patches.
//
//  This parses
//   WHERE {xxx} DELETE {yyy} INSERT DATA {zzz}
// (not necessarily in that order)
// as though it were the n3
//   <#query> patch:where {xxx}; patch:delete {yyy}; patch:insert {zzz}.

function sparqlUpdateParser(str, kb, base) {
  var i, j, k;
  var keywords = ['INSERT', 'DELETE', 'WHERE'];
  var SQNS = (0, _namespace.default)('http://www.w3.org/ns/pim/patch#');
  var p = (0, _n3parser.default)(kb, kb, base, base, null, null, '', null);
  var clauses = {};
  var badSyntax = function (uri, lines, str, i, why) {
    return 'Line ' + (lines + 1) + ' of <' + uri + '>: Bad syntax:\n   ' + why + '\n   at: "' + str.slice(i, i + 30) + '"';
  };

  // var check = function (next, last, message) {
  //   if (next < 0) {
  //     throw badSyntax(p._thisDoc, p.lines, str, j, last, message)
  //   }
  //   return next
  // }
  i = 0;
  var query = kb.sym(base + '#query'); // Invent a URI for the query
  clauses['query'] = query; // A way of accessing it in its N3 model.

  while (true) {
    // console.log("A Now at i = " + i)
    j = p.skipSpace(str, i);
    if (j < 0) {
      return clauses;
    }
    // console.log("B After space at j= " + j)
    if (str[j] === ';') {
      i = p.skipSpace(str, j + 1);
      if (i < 0) {
        return clauses; // Allow end in a
      }
      j = i;
    }
    var found = false;
    for (k = 0; k < keywords.length; k++) {
      var key = keywords[k];
      if (str.slice(j, j + key.length) === key) {
        i = p.skipSpace(str, j + key.length);
        if (i < 0) {
          throw badSyntax(p._thisDoc, p.lines, str, j + key.length, 'found EOF, needed {...} after ' + key);
        }
        if ((key === 'INSERT' || key === 'DELETE') && str.slice(i, i + 4) === 'DATA') {
          // Some wanted 'DATA'. Whatever
          j = p.skipSpace(str, i + 4);
          if (j < 0) {
            throw badSyntax(p._thisDoc, p.lines, str, i + 4, 'needed {...} after INSERT DATA ' + key);
          }
          i = j;
        }
        var res2 = [];
        j = p.node(str, i, res2); // Parse all the complexity of the clause

        if (j < 0) {
          throw badSyntax(p._thisDoc, p.lines, str, i, 'bad syntax or EOF in {...} after ' + key);
        }
        clauses[key.toLowerCase()] = res2[0];
        kb.add(query, SQNS(key.toLowerCase()), res2[0]); // , kb.sym(base)
        // key is the keyword and res2 has the contents
        found = true;
        i = j;
      }
    }
    if (!found && str.slice(j, j + 7) === '@prefix') {
      i = p.directive(str, j);
      if (i < 0) {
        throw badSyntax(p._thisDoc, p.lines, str, i, 'bad syntax or EOF after @prefix ');
      }
      // console.log("P before dot i= " + i)
      i = p.checkDot(str, i);
      // console.log("Q after dot i= " + i)
      found = true;
    }
    if (!found) {
      // console.log("Bad syntax " + j)
      throw badSyntax(p._thisDoc, p.lines, str, j, "Unknown syntax at start of statememt: '" + str.slice(j).slice(0, 20) + "'");
    }
  } // while
  // return clauses
}