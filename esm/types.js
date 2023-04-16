export var NamedNodeTermType = "NamedNode";
export var BlankNodeTermType = "BlankNode";
export var LiteralTermType = "Literal";
export var VariableTermType = "Variable";
export var DefaultGraphTermType = "DefaultGraph";
// Non-RDF/JS types:
export var CollectionTermType = "Collection";
export var EmptyTermType = "Empty";
export var GraphTermType = "Graph";
export var HTMLContentType = "text/html";
export var JSONLDContentType = "application/ld+json";
export var N3ContentType = "text/n3";
export var N3LegacyContentType = "application/n3";
export var NQuadsAltContentType = "application/nquads";
export var NQuadsContentType = "application/n-quads";
export var NTriplesContentType = "application/n-triples";
export var RDFXMLContentType = "application/rdf+xml";
export var SPARQLUpdateContentType = "application/sparql-update";
export var SPARQLUpdateSingleMatchContentType = "application/sparql-update-single-match";
export var TurtleContentType = "text/turtle";
export var TurtleLegacyContentType = "application/x-turtle";
export var XHTMLContentType = "application/xhtml+xml";

/**
 * A valid mime type header
 */

/** A type for values that serves as inputs */

/**
 * In this project, there exist two types for the same kind of RDF concept.
 * We have RDF/JS spec types (standardized, generic), and RDFlib types (internal, specific).
 * When deciding which type to use in a function, it is preferable to accept generic inputs,
 * whenever possible, and provide strict outputs.
 * In some ways, the TF types in here are a bit more strict.
 * Variables are missing, and the statement requires specific types of terms (e.g. NamedNode instead of Term).
 */
/** An RDF/JS Subject */
/** An RDF/JS Predicate */
/** An RDF/JS Object */
/** An RDF/JS Graph */
// | Formula
/** All the types that a .fromValue() method might return */