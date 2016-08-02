'use strict'
const Collection = require('./collection')
const Literal = require('./literal')
const NamedNode = require('./named-node')

/**
 * Transforms a value into an RDF Node.
 * RDF Nodes are returned unchanged, undefined returned as itself.
 * @method term
 * @param val {Node|Date|String|Number|Boolean|Undefined}
 * @return {Node|Undefined}
 */
function term (val) {
  var d2, dt, elt, i, len, value, x
  switch (typeof val) {
    case 'object':
      if (val instanceof Date) {
        d2 = function (x) {
          return ('' + (100 + x)).slice(1, 3)
        }
        value = '' + val.getUTCFullYear() + '-' + d2(val.getUTCMonth() + 1) + '-' + d2(val.getUTCDate()) + 'T' + d2(val.getUTCHours()) + ':' + d2(val.getUTCMinutes()) + ':' + d2(val.getUTCSeconds()) + 'Z'
        return new Literal(value, void 0, NamedNode.prototype.XSDdateTime)
      } else if (val instanceof Array) {
        x = new Collection()
        for (i = 0, len = val.length; i < len; i++) {
          elt = val[i]
          x.append(term(elt))
        }
        return x
      }
      return val
    case 'string':
      return new Literal(val)
    case 'number':
      if (('' + val).indexOf('e') >= 0) {
        dt = NamedNode.prototype.XSDfloat
      } else if (('' + val).indexOf('.') >= 0) {
        dt = NamedNode.prototype.XSDdecimal
      } else {
        dt = NamedNode.prototype.XSDinteger
      }
      return new Literal('' + val, void 0, dt)
    case 'boolean':
      return new Literal((val ? '1' : '0'), void 0, NamedNode.prototype.XSDboolean)
    case 'undefined':
      return void 0
  }
  throw new Error("Can't make term from " + val + ' of type ' + typeof val)
}

module.exports = term
