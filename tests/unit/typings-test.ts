
import Statement from '../../src/statement'
import Literal from '../../src/literal'
import { expect } from 'chai'
import DataFactory from '../../src/factories/rdflib-data-factory'
import IndexedFormula from '../../src/store'
import NamedNode from '../../src/named-node'

const URI = 'https://example.com/subject'

/**
 * These test do some assertions, but their main test is that they don't create compiler errors.
 */
describe('typings', () => {
  it('allows calling Literal.equal with non-literal', () => {
    const test = (): Statement => ({}) as unknown as Statement

    const b = test()
    const c = new Literal("")

    expect(c.equals(b.object)).to.be.false()
  })

  const s = DataFactory.namedNode(URI);
  const p = DataFactory.namedNode(URI);
  const o = DataFactory.namedNode(URI);

  it('allows S P O generation with the datafactory', () => {
    const t = DataFactory.triple(s, p, o);
  })

  it('allows passing DataFactory NamedNodes and Statements as RDF/JS Quads', () => {
    const g = DataFactory.namedNode(IndexedFormula.defaultGraphURI);
    const q = DataFactory.quad(s, p, o, g);
    const store = new IndexedFormula();
    store.add(q)
    store.remove(q);
  })

  it('allows passing RDFLib NamedNode as RDF/JS Quads', () => {
    const store = new IndexedFormula();
    const subj = new NamedNode(URI);
    const g = new NamedNode(URI);
    const statement = new Statement(subj, p, o, g)
    store.add(statement)
  })
})
