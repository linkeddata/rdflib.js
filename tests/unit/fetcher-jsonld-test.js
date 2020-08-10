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
            const match = store.anyStatementMatching(rdf.sym(uri))
            expect(match).to.be.ok()
        });
    });


});