"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.XHTMLContentType = exports.VariableTermType = exports.TurtleLegacyContentType = exports.TurtleContentType = exports.SPARQLUpdateSingleMatchContentType = exports.SPARQLUpdateContentType = exports.RDFXMLContentType = exports.NamedNodeTermType = exports.NTriplesContentType = exports.NQuadsContentType = exports.NQuadsAltContentType = exports.N3LegacyContentType = exports.N3ContentType = exports.LiteralTermType = exports.JSONLDContentType = exports.HTMLContentType = exports.GraphTermType = exports.EmptyTermType = exports.DefaultGraphTermType = exports.CollectionTermType = exports.BlankNodeTermType = void 0;
var NamedNodeTermType = exports.NamedNodeTermType = "NamedNode";
var BlankNodeTermType = exports.BlankNodeTermType = "BlankNode";
var LiteralTermType = exports.LiteralTermType = "Literal";
var VariableTermType = exports.VariableTermType = "Variable";
var DefaultGraphTermType = exports.DefaultGraphTermType = "DefaultGraph";
// Non-RDF/JS types:
var CollectionTermType = exports.CollectionTermType = "Collection";
var EmptyTermType = exports.EmptyTermType = "Empty";
var GraphTermType = exports.GraphTermType = "Graph";
var HTMLContentType = exports.HTMLContentType = "text/html";
var JSONLDContentType = exports.JSONLDContentType = "application/ld+json";
var N3ContentType = exports.N3ContentType = "text/n3";
var N3LegacyContentType = exports.N3LegacyContentType = "application/n3";
var NQuadsAltContentType = exports.NQuadsAltContentType = "application/nquads";
var NQuadsContentType = exports.NQuadsContentType = "application/n-quads";
var NTriplesContentType = exports.NTriplesContentType = "application/n-triples";
var RDFXMLContentType = exports.RDFXMLContentType = "application/rdf+xml";
var SPARQLUpdateContentType = exports.SPARQLUpdateContentType = "application/sparql-update";
var SPARQLUpdateSingleMatchContentType = exports.SPARQLUpdateSingleMatchContentType = "application/sparql-update-single-match";
var TurtleContentType = exports.TurtleContentType = "text/turtle";
var TurtleLegacyContentType = exports.TurtleLegacyContentType = "application/x-turtle";
var XHTMLContentType = exports.XHTMLContentType = "application/xhtml+xml";

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