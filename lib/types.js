"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.XHTMLContentType = exports.VariableTermType = exports.TurtleLegacyContentType = exports.TurtleContentType = exports.SPARQLUpdateSingleMatchContentType = exports.SPARQLUpdateContentType = exports.RDFXMLContentType = exports.NamedNodeTermType = exports.NTriplesContentType = exports.NQuadsContentType = exports.NQuadsAltContentType = exports.N3LegacyContentType = exports.N3ContentType = exports.LiteralTermType = exports.JSONLDContentType = exports.HTMLContentType = exports.GraphTermType = exports.EmptyTermType = exports.DefaultGraphTermType = exports.CollectionTermType = exports.BlankNodeTermType = void 0;
var NamedNodeTermType = "NamedNode";
exports.NamedNodeTermType = NamedNodeTermType;
var BlankNodeTermType = "BlankNode";
exports.BlankNodeTermType = BlankNodeTermType;
var LiteralTermType = "Literal";
exports.LiteralTermType = LiteralTermType;
var VariableTermType = "Variable";
exports.VariableTermType = VariableTermType;
var DefaultGraphTermType = "DefaultGraph";
// Non-RDF/JS types:
exports.DefaultGraphTermType = DefaultGraphTermType;
var CollectionTermType = "Collection";
exports.CollectionTermType = CollectionTermType;
var EmptyTermType = "Empty";
exports.EmptyTermType = EmptyTermType;
var GraphTermType = "Graph";
exports.GraphTermType = GraphTermType;
var HTMLContentType = "text/html";
exports.HTMLContentType = HTMLContentType;
var JSONLDContentType = "application/ld+json";
exports.JSONLDContentType = JSONLDContentType;
var N3ContentType = "text/n3";
exports.N3ContentType = N3ContentType;
var N3LegacyContentType = "application/n3";
exports.N3LegacyContentType = N3LegacyContentType;
var NQuadsAltContentType = "application/nquads";
exports.NQuadsAltContentType = NQuadsAltContentType;
var NQuadsContentType = "application/n-quads";
exports.NQuadsContentType = NQuadsContentType;
var NTriplesContentType = "application/n-triples";
exports.NTriplesContentType = NTriplesContentType;
var RDFXMLContentType = "application/rdf+xml";
exports.RDFXMLContentType = RDFXMLContentType;
var SPARQLUpdateContentType = "application/sparql-update";
exports.SPARQLUpdateContentType = SPARQLUpdateContentType;
var SPARQLUpdateSingleMatchContentType = "application/sparql-update-single-match";
exports.SPARQLUpdateSingleMatchContentType = SPARQLUpdateSingleMatchContentType;
var TurtleContentType = "text/turtle";
exports.TurtleContentType = TurtleContentType;
var TurtleLegacyContentType = "application/x-turtle";
exports.TurtleLegacyContentType = TurtleLegacyContentType;
var XHTMLContentType = "application/xhtml+xml";

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
exports.XHTMLContentType = XHTMLContentType;