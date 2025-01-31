"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.XHTMLContentType = exports.VariableTermType = exports.TurtleLegacyContentType = exports.TurtleContentType = exports.SPARQLUpdateSingleMatchContentType = exports.SPARQLUpdateContentType = exports.RDFXMLContentType = exports.NamedNodeTermType = exports.NTriplesContentType = exports.NQuadsContentType = exports.NQuadsAltContentType = exports.N3LegacyContentType = exports.N3ContentType = exports.LiteralTermType = exports.JSONLDContentType = exports.HTMLContentType = exports.GraphTermType = exports.EmptyTermType = exports.DefaultGraphTermType = exports.CollectionTermType = exports.BlankNodeTermType = void 0;
const NamedNodeTermType = exports.NamedNodeTermType = "NamedNode";
const BlankNodeTermType = exports.BlankNodeTermType = "BlankNode";
const LiteralTermType = exports.LiteralTermType = "Literal";
const VariableTermType = exports.VariableTermType = "Variable";
const DefaultGraphTermType = exports.DefaultGraphTermType = "DefaultGraph";
// Non-RDF/JS types:
const CollectionTermType = exports.CollectionTermType = "Collection";
const EmptyTermType = exports.EmptyTermType = "Empty";
const GraphTermType = exports.GraphTermType = "Graph";
const HTMLContentType = exports.HTMLContentType = "text/html";
const JSONLDContentType = exports.JSONLDContentType = "application/ld+json";
const N3ContentType = exports.N3ContentType = "text/n3";
const N3LegacyContentType = exports.N3LegacyContentType = "application/n3";
const NQuadsAltContentType = exports.NQuadsAltContentType = "application/nquads";
const NQuadsContentType = exports.NQuadsContentType = "application/n-quads";
const NTriplesContentType = exports.NTriplesContentType = "application/n-triples";
const RDFXMLContentType = exports.RDFXMLContentType = "application/rdf+xml";
const SPARQLUpdateContentType = exports.SPARQLUpdateContentType = "application/sparql-update";
const SPARQLUpdateSingleMatchContentType = exports.SPARQLUpdateSingleMatchContentType = "application/sparql-update-single-match";
const TurtleContentType = exports.TurtleContentType = "text/turtle";
const TurtleLegacyContentType = exports.TurtleLegacyContentType = "application/x-turtle";
const XHTMLContentType = exports.XHTMLContentType = "application/xhtml+xml";

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