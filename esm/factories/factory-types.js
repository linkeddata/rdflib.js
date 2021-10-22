/** A set of features that may be supported by a Data Factory */
export var Feature;
/**
 * Defines a DataFactory as used in rdflib, based on the RDF/JS: Data model specification,
 * but with additional extensions
 *
 * bnIndex is optional but useful.
 */

(function (Feature) {
  Feature["collections"] = "COLLECTIONS";
  Feature["defaultGraphType"] = "DEFAULT_GRAPH_TYPE";
  Feature["equalsMethod"] = "EQUALS_METHOD";
  Feature["id"] = "ID";
  Feature["identity"] = "IDENTITY";
  Feature["reversibleId"] = "REVERSIBLE_ID";
  Feature["variableType"] = "VARIABLE_TYPE";
})(Feature || (Feature = {}));