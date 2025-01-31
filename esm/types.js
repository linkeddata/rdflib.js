export const NamedNodeTermType = "NamedNode";
export const BlankNodeTermType = "BlankNode";
export const LiteralTermType = "Literal";
export const VariableTermType = "Variable";
export const DefaultGraphTermType = "DefaultGraph";
// Non-RDF/JS types:
export const CollectionTermType = "Collection";
export const EmptyTermType = "Empty";
export const GraphTermType = "Graph";
export const HTMLContentType = "text/html";
export const JSONLDContentType = "application/ld+json";
export const N3ContentType = "text/n3";
export const N3LegacyContentType = "application/n3";
export const NQuadsAltContentType = "application/nquads";
export const NQuadsContentType = "application/n-quads";
export const NTriplesContentType = "application/n-triples";
export const RDFXMLContentType = "application/rdf+xml";
export const SPARQLUpdateContentType = "application/sparql-update";
export const SPARQLUpdateSingleMatchContentType = "application/sparql-update-single-match";
export const TurtleContentType = "text/turtle";
export const TurtleLegacyContentType = "application/x-turtle";
export const XHTMLContentType = "application/xhtml+xml";

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