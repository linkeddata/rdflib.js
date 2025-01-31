"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = exports.default = function () {
  return {
    parseJSON: function (data, source, store) {
      var subject, predicate, object;
      var bnodes = {};
      var why = store.sym(source);
      for (var x in data) {
        if (x.indexOf('_:') === 0) {
          if (bnodes[x]) {
            subject = bnodes[x];
          } else {
            subject = store.bnode(x);
            bnodes[x] = subject;
          }
        } else {
          subject = store.sym(x);
        }
        var preds = data[x];
        for (var y in preds) {
          var objects = preds[y];
          predicate = store.sym(y);
          for (var z in objects) {
            var obj = objects[z];
            if (obj.type === 'uri') {
              object = store.sym(obj.value);
              store.add(subject, predicate, object, why);
            } else if (obj.type === 'BlankNode') {
              if (bnodes[obj.value]) {
                object = bnodes[obj.value];
              } else {
                object = store.bnode(obj.value);
                bnodes[obj.value] = object;
              }
              store.add(subject, predicate, object, why);
            } else if (obj.type === 'Literal') {
              // var datatype
              if (obj.datatype) {
                object = store.literal(obj.value, undefined, store.sym(obj.datatype));
              } else if (obj.lang) {
                object = store.literal(obj.value, obj.lang);
              } else {
                object = store.literal(obj.value);
              }
              store.add(subject, predicate, object, why);
            } else {
              throw new Error('error: unexpected termtype: ' + z.type);
            }
          }
        }
      }
    }
  };
}();