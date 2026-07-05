/* Term-level serialization for Turtle / N3
**
** Pure helpers used by the pretty-printer in src/serializer.js to turn a
** single RDF term's lexical value into a valid Turtle/N3 token.
**
** Inspired by the term-writing layers of @jeswr/pretty-turtle and
** @rdfjs/serializer-turtle. Licence: MIT
*/

const XSD = 'http://www.w3.org/2001/XMLSchema#'
export const XSD_INTEGER = XSD + 'integer'
export const XSD_DECIMAL = XSD + 'decimal'
export const XSD_DOUBLE = XSD + 'double'
export const XSD_BOOLEAN = XSD + 'boolean'

// Valid lexical spaces (the subset expressible as a Turtle numeric token)
const INTEGER_RE = /^[+-]?[0-9]+$/
// xsd:decimal; a trailing-dot form ("2.") is valid XSD and completed below
const DECIMAL_RE = /^[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)$/
// xsd:double, excluding INF/-INF/NaN which have no Turtle DOUBLE production
const DOUBLE_RE = /^[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/

/**
 * Return a bare Turtle numeric/boolean token for `value` when it is a valid
 * lexical form of `datatypeUri` that Turtle can express natively; otherwise
 * return null so the caller emits a lossless quoted `"value"^^<datatype>`
 * form (#147/#619/#772).
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
      // Turtle DOUBLE requires an exponent; ensure one is present
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

// Characters with a dedicated Turtle ECHAR escape. There is no \v ECHAR:
// U+000B, like other unnamed control characters, goes through \uXXXX below.
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
      // In a long string only a quote starting a `"""` run needs escaping
      res += (longString && str.slice(i, i + 3) !== '"""') ? '"' : '\\"'
    } else if (longString && (ch === '\n' || ch === '\t')) {
      res += ch // newlines and tabs may stay raw inside a long string
    } else if (SHORT_ESCAPES[ch] !== undefined) {
      res += SHORT_ESCAPES[ch]
    } else if (code <= 0x1f || code === 0x7f) {
      res += unicodeEscapeChar(code) // control chars incl. U+000B; Turtle has no \v
    } else if (unicodeEscape && code > 0x7e) {
      res += unicodeEscapeChar(code)
    } else {
      res += ch
    }
  }
  return res
}
