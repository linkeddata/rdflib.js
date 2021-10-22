import {
  DataFactory,
} from '../../src/index';
import * as RdfJs from 'rdf-js';

const factory = DataFactory;

// rdflib.js Term instances are superclasses of the corresponding RDF/JS Terms
const named1: RdfJs.NamedNode = factory.namedNode('http://example.org/');
const blank1: RdfJs.BlankNode = factory.blankNode();
const literal1: RdfJs.Literal = factory.literal('abc');
const var1: RdfJs.Variable = factory.variable('var');
const default1: RdfJs.DefaultGraph = factory.defaultGraph();

// rdflib.js Term instances have rdflib.js-specific types
const named2 = factory.namedNode('http://example.org/');
named2.toCanonical();
const blank2 = factory.blankNode();
blank2.toCanonical();
const literal2 = factory.literal('abc');
literal2.toCanonical();
const var2 = factory.variable('var');
var2.toCanonical();
const default2 = factory.defaultGraph();
default2.toCanonical();
