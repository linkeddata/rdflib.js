/* Term-level serialization for Turtle / N3
**
** This module is the *correctness* layer that sits UNDER the pretty-printer in
** src/serializer.js. It contains pure, side-effect-free helpers that turn a
** single RDF term's lexical value into a valid Turtle/N3 token:
**
**   - abbreviateTypedLiteral() : native numeric/boolean abbreviation, but only
**                                when the lexical form is actually valid for the
**                                datatype AND expressible as a Turtle token.
**                                Otherwise returns null so the caller falls back
**                                to a lossless "value"^^<datatype> form.
**   - escapeStringBody()       : correct Turtle string escaping (valid ECHARs,
**                                control characters, optional \\uXXXX for non-ASCII).
**
** Keeping these pure means the pretty-printing logic (subject grouping, prefix
** use, RDF-list syntax, indentation) in serializer.js is unchanged: only the
** term-level writing it delegates to is corrected. See
** ~/css/upstream/rdflib-serializer-architecture.md for the full design.
**
** Inspired by the term-writing layers of @jeswr/pretty-turtle (lib/escape.ts,
** validated numeric/boolean regexes) and @rdfjs/serializer-turtle
** (lib/TermSerializer.js). Licence: MIT
*/

const XSD = 'http://www.w3.org/2001/XMLSchema#'
export const XSD_INTEGER = XSD + 'integer'
export const XSD_DECIMAL = XSD + 'decimal'
export const XSD_DOUBLE = XSD + 'double'
export const XSD_BOOLEAN = XSD + 'boolean'

// Valid lexical spaces (subset expressible as a Turtle numeric token).
// Mirrors the shapes used by @jeswr/pretty-turtle and rdflib PR #827.
const INTEGER_RE = /^[+-]?[0-9]+$/
// xsd:decimal lexical space; Turtle DECIMAL additionally needs a fraction, which
// we complete below. We accept a trailing-dot form ("2.") as valid XSD and fix it.
const DECIMAL_RE = /^[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)$/
// xsd:double: the numeric part optionally followed by an exponent. Deliberately
// excludes the special values INF, -INF and NaN, which are valid xsd:double
// values but have NO Turtle DOUBLE production, so they must fall back to quoted.
const DOUBLE_RE = /^[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/

/**
 * Return a bare Turtle numeric/boolean token for `value` when it is a valid
 * lexical form of `datatypeUri` that Turtle can express natively; otherwise
 * return null so the caller emits a lossless quoted `"value"^^<datatype>` form.
 *
 * This is the single fix for the whole datatype-abbreviation bug family
 * (#147 / #619 / #772): abbreviation now happens only for values that are both
 * valid for their datatype and round-trippable, so the serializer never flips a
 * value ("true" stays true), never silently coerces an invalid value ("yes" is
 * preserved verbatim), and never emits an invalid Turtle token ("abc", "1.2.3",
 * "NaN").
 *
 * @param {string} value        the literal's lexical value
 * @param {string} datatypeUri  the literal's datatype IRI
 * @returns {string|null}
 */
export function abbreviateTypedLiteral(value, datatypeUri) {
  switch (datatypeUri) {
    case XSD_INTEGER:
      return INTEGER_RE.test(value) ? value : null

    case XSD_DECIMAL: {
      if (!DECIMAL_RE.test(value)) return null
      // Turtle DECIMAL needs a digit after the dot. Normalise:
      //   "5"  -> "5.0"   (no dot at all)
      //   "5." -> "5.0"   (trailing dot)
      //   ".5", "5.5" are already valid Turtle DECIMALs.
      if (value.indexOf('.') < 0) return value + '.0'
      if (value.charAt(value.length - 1) === '.') return value + '0'
      return value
    }

    case XSD_DOUBLE: {
      if (!DOUBLE_RE.test(value)) return null
      // Turtle DOUBLE requires an exponent; ensure one is present (mirrors the
      // pre-existing normalisation so valid inputs serialise exactly as before).
      let out = value
      const hasExponent = out.indexOf('e') >= 0 || out.indexOf('E') >= 0
      if (out.indexOf('.') < 0 && !hasExponent) out += '.0'
      if (!hasExponent) out += 'e0'
      return out
    }

    case XSD_BOOLEAN:
      if (value === 'true' || value === '1') return 'true'
      if (value === 'false' || value === '0') return 'false'
      return null

    default:
      return null
  }
}

// Characters that have a dedicated Turtle ECHAR escape. Note there is NO \\v:
// U+000B (vertical tab) is *not* a valid Turtle escape, so it (and every other
// control character without a named escape) goes through \\uXXXX below.
const SHORT_ESCAPES = {
  '\t': '\\t',
  '\b': '\\b',
  '\n': '\\n',
  '\r': '\\r',
  '\f': '\\f',
  '"': '\\"',
  '\\': '\\\\',
}

function unicodeEscapeChar(code) {
  return '\\u' + ('000' + code.toString(16).toLowerCase()).slice(-4)
}

/**
 * Escape the inner body of a Turtle/N3 string literal (delimiters not included).
 *
 * Fixes two escaping bugs in the previous inline implementation:
 *   - U+000B was emitted as the invalid escape `\\v` (Turtle has no \\v ECHAR).
 *   - Control characters U+0000–U+001F (and U+007F) outside the named set were
 *     passed through raw, producing invalid Turtle.
 * Both are now emitted as `\\uXXXX`.
 *
 * @param {string} str        the raw string value
 * @param {object} [opts]
 * @param {boolean} [opts.longString]     true for a """triple-quoted""" literal,
 *                                        where raw newlines and tabs are allowed
 *                                        and a lone `"` may stay unescaped.
 * @param {boolean} [opts.unicodeEscape]  true to \\uXXXX-escape non-ASCII (the
 *                                        historic default; disabled by omitting
 *                                        the 'e' flag).
 * @returns {string}
 */
export function escapeStringBody(str, { longString = false, unicodeEscape = true } = {}) {
  let res = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    const code = str.charCodeAt(i)
    if (ch === '\\') {
      res += '\\\\'
    } else if (ch === '"') {
      // In a long string a lone quote is legal; only escape a quote that would
      // start a `"""` run and thus prematurely close the literal.
      res += (longString && str.slice(i, i + 3) !== '"""') ? '"' : '\\"'
    } else if (longString && (ch === '\n' || ch === '\t')) {
      res += ch // newlines and tabs may stay raw inside a long string
    } else if (SHORT_ESCAPES[ch] !== undefined) {
      res += SHORT_ESCAPES[ch]
    } else if (code <= 0x1f || code === 0x7f) {
      res += unicodeEscapeChar(code) // control chars incl. U+000B -> \uXXXX (never \v)
    } else if (unicodeEscape && code > 0x7e) {
      res += unicodeEscapeChar(code)
    } else {
      res += ch
    }
  }
  return res
}
