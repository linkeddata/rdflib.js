const $rdf = require('./lib');
const kb = $rdf.graph();
const base = 'http://example.com/';
const doc = $rdf.sym(base + 'doc');
// A URI in a different namespace so it can abbreviate to a prefix
const other = 'http://example.org/ns/subject.example';
kb.add($rdf.sym(base + 's'), $rdf.sym(base + 'p'), $rdf.sym(other), doc);

function run(flags) {
  const out = $rdf.serialize(doc, kb, doc.uri, 'text/turtle', undefined, { flags });
  console.log('FLAGS=' + flags + '\n' + out);
}

run('');
run('o');
