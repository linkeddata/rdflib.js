/**
 * All the possible TermTypes
 * @todo Convert these to const enums when it's supported https://github.com/babel/babel/issues/8741
 */
export const TermType = {
  NamedNode: 'NamedNode',
  BlankNode: 'BlankNode',
  Literal: 'Literal',
  Variable: 'Variable',
  DefaultGraph: 'DefaultGraph',
  // The next ones are not specified by the rdf.js taskforce
  Collection: 'Collection',
  Empty: 'Empty',
  Graph: 'Graph',
}

/**
 * RDF/JS taskforce Term
 * @link https://rdf.js.org/data-model-spec/#term-interface
 */
export interface TFTerm {
  termType: string
  value: string
  equals(other: TFTerm): boolean
}
