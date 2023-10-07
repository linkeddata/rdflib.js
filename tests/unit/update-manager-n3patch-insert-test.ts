import * as chai from 'chai'
import {Headers} from 'cross-fetch'
import * as dirtyChai from 'dirty-chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import {Fetcher, graph, lit, st, sym, UpdateManager} from '../../src/index'
import BlankNode from '../../src/blank-node';


const {expect} = chai

chai.use((sinonChai as any).default)
chai.use((dirtyChai as any).default)

chai.should()

describe('n3-patch updates via update manager', () => {

    const subject = sym('https://pod.example/test/foo#subject')
    const predicate = sym('https://pod.example/test/foo#predicate')
    let fetchMock;
    let store;
    let updater;

    beforeEach(() => {
        store = graph();
        fetchMock = sinon.stub().resolves({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers({
                'accept-patch': 'text/n3'
            })
        });
        store.fetcher = new Fetcher(store, {fetch: fetchMock})
        updater = new UpdateManager(store)
    });

    it('calls PATCH to insert a triple', async () => {
        const st1 = st(subject, predicate, lit("literal value"), subject.doc())
        await updater.update([], [st1])
        expect(getPatchCall().lastArg.body).to.equal(`
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix ex: <http://www.example.org/terms#>.

_:patch

 
      solid:inserts {
        <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal value" .
      };   a solid:InsertDeletePatch .
`)
    })

    it('calls PATCH to insert a triple including line feed', async () => {
        const st1 = st(subject, predicate, lit("literal\nvalue"), subject.doc())
        await updater.update([], [st1])
        expect(getPatchCall().lastArg.body).to.equal(`
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix ex: <http://www.example.org/terms#>.

_:patch

 
      solid:inserts {
        <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal\\nvalue" .
      };   a solid:InsertDeletePatch .
`)
    })

    it('calls PATCH to insert a triple including carriage return line feed', async () => {
        const st1 = st(subject, predicate, lit("literal\r\nvalue"), subject.doc())
        await updater.update([], [st1])
        expect(getPatchCall().lastArg.body).to.equal(`
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix ex: <http://www.example.org/terms#>.

_:patch

 
      solid:inserts {
        <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal\\r\\nvalue" .
      };   a solid:InsertDeletePatch .
`)
    })

    it('does not anonymize triples in INSERT DATA query', async () => {
        // updater.anonymize = sinon.spy();

        const bNode = new BlankNode('subj');
        const st1 = st(bNode, predicate, subject, subject.doc())
        await updater.update([], [st1])
        // expect(updater.anonymize).to.not.have.been.called;
        expect(getPatchCall().lastArg.body).to.equal(`
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix ex: <http://www.example.org/terms#>.

_:patch

 
      solid:inserts {
        _:subj <https://pod.example/test/foo#predicate> <https://pod.example/test/foo#subject> .
      };   a solid:InsertDeletePatch .
`)
    });

    function getPatchCall() {
        return fetchMock.getCalls().find(it => it.lastArg.method === 'PATCH');
    }
});
