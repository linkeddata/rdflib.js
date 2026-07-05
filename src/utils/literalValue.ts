/**
 * Value-space helpers for reading typed literals.
 *
 * The Turtle-family parsers preserve the source lexical form of literals,
 * so code comparing `term.value` against a single canonical spelling
 * (`term.value === '1'`, `kb.holds(s, p, Literal.fromBoolean(true))`)
 * breaks silently on data that spells the same value differently.
 *
 * These helpers compare in value space instead: they accept every lexical
 * form the datatype's lexical space allows and return the datatype's value,
 * so `"true"`, `"1"`, `" true "` all read as `true`, and `"12"`, `"12.0"`,
 * `"1.2e1"` all read as `12`.
 *
 * See also the `canonicalize` option of `parse()` for a transitional
 * alternative that restores parse-time normalisation instead.
 */
import { Term, Literal as TFLiteral } from '../tf-types'

const XSD_NS = 'http://www.w3.org/2001/XMLSchema#'
const XSD_BOOLEAN = XSD_NS + 'boolean'

/**
 * The XSD numeric datatypes read by {@link literalToNumber}: xsd:decimal,
 * the xsd:integer hierarchy derived from it, and the floating-point types.
 */
const NUMERIC_DATATYPES: { [iri: string]: 'integer' | 'decimal' | 'floating' } = {
  [XSD_NS + 'decimal']: 'decimal',
  [XSD_NS + 'double']: 'floating',
  [XSD_NS + 'float']: 'floating',
  [XSD_NS + 'integer']: 'integer',
  [XSD_NS + 'long']: 'integer',
  [XSD_NS + 'int']: 'integer',
  [XSD_NS + 'short']: 'integer',
  [XSD_NS + 'byte']: 'integer',
  [XSD_NS + 'nonNegativeInteger']: 'integer',
  [XSD_NS + 'nonPositiveInteger']: 'integer',
  [XSD_NS + 'negativeInteger']: 'integer',
  [XSD_NS + 'positiveInteger']: 'integer',
  [XSD_NS + 'unsignedLong']: 'integer',
  [XSD_NS + 'unsignedInt']: 'integer',
  [XSD_NS + 'unsignedShort']: 'integer',
  [XSD_NS + 'unsignedByte']: 'integer',
}

const INTEGER_LEXICAL = /^[+-]?[0-9]+$/
const DECIMAL_LEXICAL = /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/
const FLOATING_LEXICAL = /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/
const FLOATING_SPECIALS: { [lexical: string]: number } = {
  'INF': Infinity,
  '+INF': Infinity,
  '-INF': -Infinity,
  'NaN': NaN,
}

/** Structural literal check that works for terms from any RDF/JS factory. */
function asLiteral (term: Term | null | undefined): TFLiteral | null {
  if (!term || typeof term !== 'object' || term.termType !== 'Literal') {
    return null
  }
  return term as TFLiteral
}

/**
 * Reads an `xsd:boolean` literal in value space.
 *
 * Returns `true` for the lexical forms `"true"` and `"1"`, `false` for
 * `"false"` and `"0"` (leading/trailing whitespace is ignored, per XSD's
 * whitespace collapse), and `undefined` for everything else: a missing
 * term, a non-literal, a literal of another datatype, or an ill-typed
 * lexical form.
 *
 * The distinction between `false` and `undefined` lets callers tell an
 * explicitly-false setting apart from an unset one:
 * ```js
 * const setting = literalToBoolean(kb.any(me, ns.dct('audienceEnabled'), null, doc))
 * if (setting === undefined) applyDefault()
 * ```
 * For a plain "is it on?" read, use {@link isTrue}.
 *
 * @param term - The term to read; `null`/`undefined` are accepted (and map
 *   to `undefined`) so `kb.any(...)` results can be passed directly
 */
export function literalToBoolean (term: Term | null | undefined): boolean | undefined {
  const literal = asLiteral(term)
  if (!literal || !literal.datatype || literal.datatype.value !== XSD_BOOLEAN) {
    return undefined
  }
  switch (literal.value.trim()) {
    case 'true':
    case '1':
      return true
    case 'false':
    case '0':
      return false
    default:
      return undefined
  }
}

/**
 * Whether the given term is an `xsd:boolean` literal that is true in value
 * space, i.e. its lexical form is `"true"` or `"1"`.
 *
 * This is the drop-in, value-space replacement for the pre-3.0 pattern
 * `kb.anyValue(s, p) === '1'`, which relied on the old parsers normalising
 * every true boolean to `"1"`:
 * ```js
 * const enabled = isTrue(kb.any(subject, predicate, null, doc))
 * ```
 * Anything that is not a true boolean literal (a false one, an ill-typed
 * one, a non-literal, `null`, `undefined`) yields `false`.
 */
export function isTrue (term: Term | null | undefined): boolean {
  return literalToBoolean(term) === true
}

/**
 * Reads a numeric literal in value space, so that `"12"^^xsd:integer`,
 * `"12.0"^^xsd:decimal` and `"1.2e1"^^xsd:double` all read as the number
 * `12` no matter how the source document spelled them.
 *
 * Handles `xsd:decimal`, the derived integer types (`xsd:integer`,
 * `xsd:long`, `xsd:int`, ...) and the floating-point types (`xsd:double`,
 * `xsd:float`, including their `INF`/`-INF`/`NaN` specials). Returns
 * `undefined` for a missing term, a non-literal, a literal of a
 * non-numeric datatype, or a lexical form outside the datatype's lexical
 * space. Values beyond IEEE-754 double precision are rounded to the nearest
 * representable number, as with JavaScript's `Number`.
 *
 * @param term - The term to read; `null`/`undefined` are accepted (and map
 *   to `undefined`) so `kb.any(...)` results can be passed directly
 */
export function literalToNumber (term: Term | null | undefined): number | undefined {
  const literal = asLiteral(term)
  if (!literal || !literal.datatype) {
    return undefined
  }
  const family = NUMERIC_DATATYPES[literal.datatype.value]
  if (family === undefined) {
    return undefined
  }
  const lexical = literal.value.trim()
  switch (family) {
    case 'integer':
      return INTEGER_LEXICAL.test(lexical) ? Number(lexical) : undefined
    case 'decimal':
      return DECIMAL_LEXICAL.test(lexical) ? Number(lexical) : undefined
    case 'floating':
      if (Object.prototype.hasOwnProperty.call(FLOATING_SPECIALS, lexical)) {
        return FLOATING_SPECIALS[lexical]
      }
      return FLOATING_LEXICAL.test(lexical) ? Number(lexical) : undefined
    default:
      return undefined
  }
}
