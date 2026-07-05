import {
  graph,
  isTrue,
  literalToBoolean,
  literalToNumber,
  Literal,
  parse,
  sym,
} from '../../src/index';
import type { ParseOptions } from '../../src/index';

// The value-space literal helpers accept any RDF/JS term as well as the
// null/undefined that kb.any() can produce, and are exposed both standalone
// and as Literal statics. parse() takes the `canonicalize` option either in
// the callback slot or as a sixth argument after a callback.
const kb = graph();
const doc = 'https://example.net/doc';

parse('<#s> <#p> true .', kb, doc, 'text/turtle');
parse('<#s> <#p> 12.0 .', kb, doc, 'text/turtle', { canonicalize: true });
parse('<#s> <#p> 3.141e0 .', kb, doc, 'text/turtle', (_error, _kb) => {}, { canonicalize: false });
const options: ParseOptions = { canonicalize: true };
parse('<#s> <#p> false .', kb, doc, 'text/turtle', null, options);

const term = kb.any(sym(`${doc}#s`), sym(`${doc}#p`));
const asBoolean: boolean | undefined = literalToBoolean(term);
const asBooleanStatic: boolean | undefined = Literal.toBoolean(undefined);
const truthy: boolean = isTrue(term);
const truthyOfMissing: boolean = isTrue(null);
const asNumber: number | undefined = literalToNumber(term);
const asNumberStatic: number | undefined = Literal.toNumber(new Literal('12'));
