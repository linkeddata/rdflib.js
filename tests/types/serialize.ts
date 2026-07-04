import { graph, serialize, st, sym, lit } from '../../src/index';

// https://github.com/linkeddata/rdflib.js/issues/450
// serialize() handles an absent target at runtime, so the typings must
// accept `undefined` (and `null`) for the first argument.
const kb = graph();
kb.add(st(
  sym('https://subject.example'),
  sym('https://predicate.example'),
  lit('value'),
  sym('https://example.net/doc')
));

const withUndefined: string | undefined = serialize(undefined, kb, 'https://example.net/doc', 'text/turtle');
const withNull: string | undefined = serialize(null, kb, 'https://example.net/doc', 'text/turtle');
const withTarget: string | undefined = serialize(sym('https://example.net/doc'), kb, null, 'text/turtle');
