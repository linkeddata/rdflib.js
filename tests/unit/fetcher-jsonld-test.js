import * as rdf from '../../src';

const nock = require('nock')
import chai from 'chai'

const {expect} = chai

describe('Given a JSON-LD resource', () => {

    const uri = "http://localhost/jsonld#it"

    beforeEach(() => {
        const docContents = `
        {
            "@id": "${uri}",
            "@type": "https://type.example",
            "https://predicate.example": "value"
        }
        `
        nock('http://localhost').get('/jsonld').reply(200, docContents, {
            'Content-Type': 'application/ld+json',
        })
    });

    describe('when it is fetched to the store', () => {

        let fetcher, store;
        beforeEach(() => {
            store = rdf.graph();
            fetcher = rdf.fetcher(store);
        });

        it('then the triples from the document can be found in the store', async () => {
            await fetcher.load(uri);
            const match = store.anyStatementMatching(rdf.sym(uri), rdf.sym('https://predicate.example'));
            expect(match.subject.value).to.equal(uri);
            expect(match.predicate.value).to.equal('https://predicate.example');
            expect(match.object.value).to.equal('value');
        });

        it('then the type can be found in the store', async () => {
            await fetcher.load(uri);
            const match = store.anyStatementMatching(rdf.sym(uri), rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'));
            expect(match.subject.value).to.equal(uri);
            expect(match.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
            expect(match.object.value).to.equal('https://type.example');
        });
    });


});
