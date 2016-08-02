const NamedNode = require('./named-node')

function Namespace (nsuri) {
  return function (ln) {
    return new NamedNode(nsuri + (ln || ''))
  }
}

module.exports = Namespace
