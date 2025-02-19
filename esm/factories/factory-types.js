/** A set of features that may be supported by a Data Factory */

export let Feature = /*#__PURE__*/function (Feature) {
  /** Whether the factory supports termType:Collection terms */
  Feature["collections"] = "COLLECTIONS";
  /** Whether the factory supports termType:DefaultGraph terms */
  Feature["defaultGraphType"] = "DEFAULT_GRAPH_TYPE";
  /** Whether the factory supports equals on produced instances */
  Feature["equalsMethod"] = "EQUALS_METHOD";
  /** Whether the factory can create a unique idempotent identifier for the given term. */
  Feature["id"] = "ID";
  /**
   * Whether the factory will return the same instance for subsequent calls.
   * This implies `===`, which means methods like `indexOf` can be used.
   */
  Feature["identity"] = "IDENTITY";
  /** Whether the factory supports mapping ids back to instances (should adhere to the identity setting) */
  Feature["reversibleId"] = "REVERSIBLE_ID";
  /** Whether the factory supports termType:Variable terms */
  Feature["variableType"] = "VARIABLE_TYPE";
  return Feature;
}({});

/**
 * Defines a DataFactory as used in rdflib, based on the RDF/JS: Data model specification,
 * but with additional extensions
 *
 * bnIndex is optional but useful.
 */