import BlankNode from './blank-node';
import Collection from './collection';
import Empty from './empty';
import Fetcher from './fetcher';
import Formula from './formula';
import Store from './store';
import jsonParser from './jsonparser';
import Literal from './literal';
import log from './log';
import N3Parser from './n3parser';
import NamedNode from './named-node';
import Namespace from './namespace';
import Node from './node';
import parse from './parse';
import { Query } from './query';
import queryToSPARQL from './query-to-sparql';
import RDFaProcessor from './rdfaparser';
import RDFParser from './rdfxmlparser';
import serialize from './serialize';
import Serializer from './serializer';
import SPARQLToQuery from './sparql-to-query';
import sparqlUpdateParser from './patch-parser';
import Statement from './statement';
import UpdateManager from './update-manager';
import { UpdatesSocket } from './updates-via';
import { UpdatesVia } from './updates-via';
import * as uri from './uri';
import * as Util from './utils-js';
import Variable from './variable';
import DataFactory from './factories/rdflib-data-factory';
declare const fetcher: (store: Store, options: any) => Fetcher, graph: (features?: any, opts?: any) => Store, lit: (val: string, lang?: string, dt?: import("./tf-types").NamedNode) => Literal, st: (subject: import("./tf-types").Quad_Subject, predicate: import("./tf-types").Quad_Predicate, object: import("./tf-types").Quad_Object, graph?: import("./tf-types").Quad_Graph) => Statement, namedNode: (value: string) => NamedNode, variable: (value: string) => Variable, blankNode: (value?: string) => BlankNode, defaultGraph: () => import("./default-graph").default, literal: (value: string, languageOrDatatype?: string | import("./tf-types").NamedNode) => Literal, quad: (subject: import("./tf-types").Term, predicate: import("./tf-types").Term, object: import("./tf-types").Term, graph?: import("./tf-types").Term) => Statement, triple: (subject: import("./tf-types").Term, predicate: import("./tf-types").Term, object: import("./tf-types").Term, graph?: import("./tf-types").Term) => import("./tf-types").Quad<any, any, any, any>;
declare const fromNT: (str: any) => any;
declare const term: <T extends import("./types").FromValueReturns>(value: import("./types").ValueType) => T;
declare const NextId: number;
export * from './utils/terms';
export type { AutoInitOptions, ExtendedResponse, FetchError } from './fetcher';
export { BlankNode, Collection, DataFactory, Empty, Fetcher, Formula, Store, jsonParser, Literal, log, N3Parser, NamedNode, Namespace, Node, parse, Query, queryToSPARQL, RDFaProcessor, RDFParser, serialize, Serializer, SPARQLToQuery, sparqlUpdateParser, Statement, term, UpdateManager, UpdatesSocket, UpdatesVia, uri, Util, Variable, Store as IndexedFormula, // Alias
NextId, fromNT, fetcher, graph, lit, st, namedNode as sym, blankNode, defaultGraph, literal, namedNode, quad, triple, variable, };
export { termValue } from './utils/termValue';
export declare class ConnectedStore extends Store {
    fetcher: Fetcher;
    constructor(features: any);
}
export declare class LiveStore extends ConnectedStore {
    updater: UpdateManager;
    constructor(features: any);
}
