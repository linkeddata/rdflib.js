import * as chai from 'chai'
import {Headers} from 'cross-fetch'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import {Collection, Fetcher, graph, lit, st, sym, UpdateManager} from '../../src/index'
import BlankNode from '../../src/blank-node';


const {expect} = chai

chai.use((sinonChai as any).default)

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
        expect(getPatchCall().lastArg.body).to.equal(`INSERT DATA { <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal value". }
`)
    })

    it('calls PATCH to insert a triple including line feed', async () => {
        const st1 = st(subject, predicate, lit("literal\nvalue"), subject.doc())
        await updater.update([], [st1])
        expect(getPatchCall().lastArg.body).to.equal(`INSERT DATA { <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal\\nvalue". }
`)
    })

    it('calls PATCH to insert a triple including carriage return line feed', async () => {
        const st1 = st(subject, predicate, lit("literal\r\nvalue"), subject.doc())
        await updater.update([], [st1])
        expect(getPatchCall().lastArg.body).to.equal(`INSERT DATA { <https://pod.example/test/foo#subject> <https://pod.example/test/foo#predicate> "literal\\r\\nvalue". }
`)
    })

    it('does not anonymize triples in INSERT DATA query', async () => {
        updater.anonymize = sinon.spy();

        const bNode = new BlankNode('subj');
        const st1 = st(bNode, predicate, subject, subject.doc())
        await updater.update([], [st1])
        expect(updater.anonymize).to.not.have.been.called;
        expect(getPatchCall().lastArg.body).to.equal(`INSERT DATA { _:subj <https://pod.example/test/foo#predicate> <https://pod.example/test/foo#subject>. }
`)
    });

    it('sends spec-conformant DELETE DATA ; INSERT DATA for combined updates', async () => {
        const st1 = st(subject, predicate, lit('old'), subject.doc())
        const st2 = st(subject, predicate, lit('new'), subject.doc())
        store.add(st1.subject, st1.predicate, st1.object, st1.graph)
        await updater.update([st1], [st2])
        const body = getPatchCall().lastArg.body
        expect(body).to.match(/^DELETE DATA \{[^}]*"old"[^}]*\};\s*\nINSERT DATA \{[^}]*"new"[^}]*\}\n$/)
    })

    it('keeps the callback API contract of update()', done => {
        const st1 = st(subject, predicate, lit('value'), subject.doc())
        updater.update([], [st1], (uri, ok, errorBody, response) => {
            try {
                expect(uri).to.equal(subject.doc().value)
                expect(ok).to.equal(true)
                expect(response).to.be.an('object')
                done()
            } catch (e) {
                done(e)
            }
        })
    })

    describe('blank node grounding (#313)', () => {
        const acl = 'http://www.w3.org/ns/auth/acl#'
        const me = sym('https://pod.example/profile/card#me')
        const doc = me.doc()
        const trustedApp = sym(acl + 'trustedApp')
        const origin = sym(acl + 'origin')
        const mode = sym(acl + 'mode')

        it('rewrites a known blank node to one consistent variable across DELETE/INSERT/WHERE', async () => {
            const app = new BlankNode('app')
            store.add(me, trustedApp, app, doc)
            store.add(app, origin, sym('https://trusted.app'), doc)
            store.add(app, mode, sym(acl + 'Read'), doc)

            await updater.update(
                [st(app, mode, sym(acl + 'Read'), doc)],
                [st(app, mode, sym(acl + 'Write'), doc)])
            const body = getPatchCall().lastArg.body

            // No blank node labels may survive into the SPARQL text
            expect(body).to.not.include('_:')
            const deleteVar = (body.match(/DELETE \{\s*\?([A-Za-z0-9_]+)/) || [])[1]
            const insertVar = (body.match(/INSERT \{\s*\?([A-Za-z0-9_]+)/) || [])[1]
            expect(deleteVar, 'DELETE clause variable').to.be.a('string')
            // the same variable is used in all three clauses, so the WHERE
            // clause grounds the variable the INSERT clause uses
            expect(insertVar).to.equal(deleteVar)
            const whereSection = body.slice(body.indexOf('WHERE'))
            expect(whereSection).to.include('?' + deleteVar)
            expect(whereSection).to.include('https://trusted.app')
        })

        it('gives distinct blank nodes collision-free distinct variables', async () => {
            const b1 = new BlankNode('x-1')
            const b2 = new BlankNode('x_1')
            store.add(me, trustedApp, b1, doc)
            store.add(b1, origin, sym('https://one.example'), doc)
            store.add(me, trustedApp, b2, doc)
            store.add(b2, origin, sym('https://two.example'), doc)

            await updater.update(
                [st(b1, origin, sym('https://one.example'), doc),
                 st(b2, origin, sym('https://two.example'), doc)], [])
            const body = getPatchCall().lastArg.body
            expect(body).to.not.include('_:')
            const deleteSection = body.slice(body.indexOf('DELETE'), body.indexOf('WHERE'))
            const vars = new Set(Array.from(deleteSection.matchAll(/\?([A-Za-z0-9_]+)/g) as any[])
                .map((m: any) => m[1]))
            expect(vars.size, 'two distinct variables for two distinct bnodes').to.equal(2)
        })

        it('keeps fresh blank nodes as blank nodes in insertions while grounding known ones', async () => {
            const app = new BlankNode('known')
            store.add(me, trustedApp, app, doc)
            store.add(app, origin, sym('https://trusted.app'), doc)
            const fresh = new BlankNode('fresh')

            await updater.update([], [
                st(app, mode, sym(acl + 'Write'), doc),
                st(me, trustedApp, fresh, doc),
                st(fresh, origin, sym('https://new.app'), doc)
            ])
            const body = getPatchCall().lastArg.body
            expect(body).to.include('_:fresh')
            expect(body).to.not.include('_:known')
            const insertSection = body.slice(body.indexOf('INSERT'), body.indexOf('WHERE'))
            const whereSection = body.slice(body.indexOf('WHERE'))
            const insertVars = Array.from(insertSection.matchAll(/\?([A-Za-z0-9_]+)/g) as any[])
                .map((m: any) => m[1])
            expect(insertVars.length).to.be.greaterThan(0)
            for (const v of insertVars) {
                expect(whereSection, `INSERT variable ?${v} is grounded by WHERE`).to.include('?' + v)
            }
        })

        it('throws a clear error when deleting a statement with an unknown blank node', async () => {
            const ghost = new BlankNode('ghost')
            const st1 = st(ghost, predicate, lit('x'), subject.doc())
            try {
                await updater.update([st1], [])
                throw new Error('update should have rejected')
            } catch (e) {
                expect(String(e)).to.match(/cannot delete a statement containing the blank node _:ghost/)
            }
        })
    })

    describe('term validation (#278)', () => {
        it('rejects a plain string in a term position with a TypeError naming it', async () => {
            const bad = {
                subject: subject,
                predicate: predicate,
                object: 'plain string, not a term',
                graph: subject.doc()
            }
            try {
                await updater.update([], [bad as any])
                throw new Error('update should have rejected')
            } catch (e) {
                expect(String(e)).to.include('TypeError')
                expect(String(e)).to.include('the object of insertions[0] is the string "plain string, not a term"')
                expect(String(e)).to.include('sym()')
            }
            expect(fetchMock).to.not.have.been.called
        })

        it('rejects a string that st() coerced into a Literal predicate', async () => {
            const st1 = st(subject, 'https://pod.example/test/foo#predicate' as any,
                lit('x'), subject.doc())
            try {
                await updater.update([], [st1])
                throw new Error('update should have rejected')
            } catch (e) {
                expect(String(e)).to.include('TypeError')
                expect(String(e)).to.include('the predicate of insertions[0] is a Literal')
                expect(String(e)).to.include('expected a NamedNode')
            }
        })

        it('rejects a non-NamedNode graph with a TypeError instead of the confusing destination error', async () => {
            const good = st(subject, predicate, lit('x'), subject.doc())
            const bad = {
                subject: subject,
                predicate: predicate,
                object: lit('y'),
                graph: 'https://pod.example/test/foo'
            }
            try {
                await updater.update([good, bad as any], [])
                throw new Error('update should have rejected')
            } catch (e) {
                expect(String(e)).to.include('TypeError')
                expect(String(e)).to.include('the graph of deletions[1] is the string')
            }
        })

        it('reports the callback error shape for invalid terms', done => {
            const bad = {
                subject: 'not-a-term',
                predicate: predicate,
                object: lit('x'),
                graph: subject.doc()
            }
            updater.update([], [bad as any], (uri, ok, errorBody) => {
                try {
                    expect(ok).to.equal(false)
                    expect(errorBody).to.include('the subject of insertions[0] is the string "not-a-term"')
                    done()
                } catch (e) {
                    done(e)
                }
            })
        })
    })

    describe('collections', () => {
        it('desugars a Collection object in insertions into rdf:first/rest triples', async () => {
            const list = new Collection([sym('https://ex.example/a'), lit('two')] as any)
            const st1 = st(subject, predicate, list as any, subject.doc())
            await updater.update([], [st1])
            const body = getPatchCall().lastArg.body
            expect(body).to.include('<http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://ex.example/a>')
            expect(body).to.include('<http://www.w3.org/1999/02/22-rdf-syntax-ns#first> "two"')
            expect(body).to.include('<http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>')
        })

        it('throws a clear error for a Collection in deletions', async () => {
            const list = new Collection([sym('https://ex.example/a')] as any)
            const st1 = st(subject, predicate, list as any, subject.doc())
            try {
                await updater.update([st1], [])
                throw new Error('update should have rejected')
            } catch (e) {
                expect(String(e)).to.include('cannot delete a statement containing a Collection')
            }
        })
    })

    function getPatchCall() {
        return fetchMock.getCalls().find(it => it.lastArg.method === 'PATCH');
    }
});
