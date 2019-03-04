const Term = require('./term');

function Namespace (nsuri) {
  Term.namedNodeByIRI(nsuri)

  return function (ln) {
    const fullIRI = nsuri + (ln || '')

    return Term.namedNodeByIRI(fullIRI, ln)
  }
}

module.exports = Namespace
