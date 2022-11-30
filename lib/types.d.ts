import Node from './node-internal';
import RDFlibVariable from './variable';
import RDFlibBlankNode from './blank-node';
import Collection from './collection';
import RDFlibLiteral from './literal';
import RDFlibNamedNode from './named-node';
import RDFlibDefaultGraph from './default-graph';
import { DataFactory } from './factories/factory-types';
import IndexedFormula from './store';
import Fetcher from './fetcher';
import Statement from './statement';
import Empty from './empty';
import { NamedNode, Term, Quad_Subject, Quad_Predicate, Quad_Object, Quad_Graph } from './tf-types';
export declare const NamedNodeTermType: "NamedNode";
export declare const BlankNodeTermType: "BlankNode";
export declare const LiteralTermType: "Literal";
export declare const VariableTermType: "Variable";
export declare const DefaultGraphTermType: "DefaultGraph";
export declare const CollectionTermType: "Collection";
export declare const EmptyTermType: "Empty";
export declare const GraphTermType: "Graph";
export type TermType = typeof NamedNodeTermType | typeof BlankNodeTermType | typeof LiteralTermType | typeof VariableTermType | typeof DefaultGraphTermType | typeof CollectionTermType | typeof EmptyTermType | typeof GraphTermType;
export declare const HTMLContentType: "text/html";
export declare const JSONLDContentType: "application/ld+json";
export declare const N3ContentType: "text/n3";
export declare const N3LegacyContentType: "application/n3";
export declare const NQuadsAltContentType: "application/nquads";
export declare const NQuadsContentType: "application/n-quads";
export declare const NTriplesContentType: "application/n-triples";
export declare const RDFXMLContentType: "application/rdf+xml";
export declare const SPARQLUpdateContentType: "application/sparql-update";
export declare const SPARQLUpdateSingleMatchContentType: "application/sparql-update-single-match";
export declare const TurtleContentType: "text/turtle";
export declare const TurtleLegacyContentType: "application/x-turtle";
export declare const XHTMLContentType: "application/xhtml+xml";
/**
 * A valid mime type header
 */
export type ContentType = typeof RDFXMLContentType | typeof HTMLContentType | typeof JSONLDContentType | typeof N3ContentType | typeof N3LegacyContentType | typeof NQuadsAltContentType | typeof NQuadsContentType | typeof SPARQLUpdateContentType | typeof SPARQLUpdateSingleMatchContentType | typeof TurtleContentType | typeof TurtleLegacyContentType | typeof XHTMLContentType;
/** A type for values that serves as inputs */
export type ValueType = Term | Node | Date | string | number | boolean | undefined | null | Collection;
/**
 * In this project, there exist two types for the same kind of RDF concept.
 * We have RDF/JS spec types (standardized, generic), and RDFlib types (internal, specific).
 * When deciding which type to use in a function, it is preferable to accept generic inputs,
 * whenever possible, and provide strict outputs.
 * In some ways, the TF types in here are a bit more strict.
 * Variables are missing, and the statement requires specific types of terms (e.g. NamedNode instead of Term).
 */
/** An RDF/JS Subject */
export type SubjectType = RDFlibBlankNode | RDFlibNamedNode | RDFlibVariable;
/** An RDF/JS Predicate */
export type PredicateType = RDFlibNamedNode | RDFlibVariable;
/** An RDF/JS Object */
export type ObjectType = RDFlibNamedNode | RDFlibLiteral | Collection | RDFlibBlankNode | RDFlibVariable | Empty;
/** An RDF/JS Graph */
export type GraphType = RDFlibDefaultGraph | RDFlibNamedNode | RDFlibVariable;
export interface Bindings {
    [id: string]: Term;
}
/** All the types that a .fromValue() method might return */
export type FromValueReturns<C extends Node = any> = Term | undefined | null | Collection<C>;
export interface IRDFlibDataFactory extends DataFactory<RDFlibNamedNode | RDFlibBlankNode | RDFlibLiteral | Collection | Statement> {
    fetcher: (store: IndexedFormula, options: any) => Fetcher;
    lit: (val: string, lang?: string, dt?: NamedNode) => RDFlibLiteral;
    graph: (features?: any, opts?: any) => IndexedFormula;
    st: (subject: Quad_Subject, predicate: Quad_Predicate, object: Quad_Object, graph?: Quad_Graph) => Statement;
}
