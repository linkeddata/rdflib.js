const NamedNode = require('./named-node')
const Node = require('./node');

function Namespace (nsuri) {
  return function (ln) {
    const fullIRI = nsuri + ln
    if (Node.nsMap[fullIRI] !== undefined) {
      return Node.nsMap[fullIRI]
    }

    return Node.addNN(new NamedNode(nsuri + (ln || '')), ln)
  }
}

module.exports = Namespace
