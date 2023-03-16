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

describe('sparql updates via update manager', () => {

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
                'accept-patch': 'application/sparql-update'
            })
        });
        store.fetcher = new Fetcher(store, {fetch: fetchMock})
        updater = new UpdateManager(store)
    });

    it('calls PATCH to insert a triple', async () => {
        const st1 = st(subject, predicate, lit("literal value"), subject.doc())
        await updater.update([], [st1])
        expect(getPatchCall().lastArg.body).to.equal(`INSERT DATA { <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal value" .
 }
`)
    })

    it('calls PATCH to insert a triple including line feed', async () => {
        const st1 = st(subject, predicate, lit("literal\nvalue"), subject.doc())
        await updater.update([], [st1])
        expect(getPatchCall().lastArg.body).to.equal(`INSERT DATA { <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal\\nvalue" .
 }
`)
    })

    it('calls PATCH to insert a triple including carriage return line feed', async () => {
        const st1 = st(subject, predicate, lit("literal\r\nvalue"), subject.doc())
        await updater.update([], [st1])
        expect(getPatchCall().lastArg.body).to.equal(`INSERT DATA { <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal\\r\\nvalue" .
 }
`)
    })

    it('does not anonymize triples in INSERT DATA query', async () => {
        updater.anonymize = sinon.spy();

        const bNode = new BlankNode('subj');
        const st1 = st(bNode, predicate, subject, subject.doc())
        await updater.update([], [st1])
        expect(updater.anonymize).to.not.have.been.called;
        expect(getPatchCall().lastArg.body).to.equal(`INSERT DATA { _:subj <https://pod.example/test/foo#predicate> <https://pod.example/test/foo#subject> .
 }
`)
    });

    function getPatchCall() {
        return fetchMock.getCalls().find(it => it.lastArg.method === 'PATCH');
    }
});
