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
