import * as rdf from '../../src';

const nock = require('nock')
import chai from 'chai'

const {expect} = chai

describe('fetch JSON-LD', () => {
  describe('Given a JSON-LD resource', () => {

    const uri = "http://localhost/jsonld#it"
    let capturedHeaders;

    beforeEach(() => {
      const docContents = `
        {
            "@id": "${uri}",
            "@type": "https://type.example",
            "https://predicate.example": "value"
        }
        `
      nock('http://localhost').get('/jsonld').reply(function () {
        capturedHeaders = this.req.headers;
        return [200, docContents, {
          'Content-Type': 'application/ld+json',
        }]
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

      it('then the request used the correct accept headers', async () => {
        await fetcher.load(uri);
        expect(capturedHeaders['accept'][0]).to.equal(
          'image/*;q=0.9, */*;q=0.1, application/rdf+xml;q=0.9, application/xhtml+xml, text/xml;q=0.5, application/xml;q=0.5, text/html;q=0.9, text/plain;q=0.5, text/n3;q=1.0, text/turtle;q=1, application/ld+json;q=0.9'
        );
      });
    });
  });

  describe('Given a resource returns invalid JSON-LD that cannot be parsed', () => {
    beforeEach(() => {
      nock('http://localhost').get('/invalid.jsonld').reply(200, `this is not parsable JSON-LD`, {
        'Content-Type': 'application/ld+json',
      })
    });

    describe('when it is fetched to the store', () => {
      let fetcher, store;
      beforeEach(() => {
        store = rdf.graph();
        fetcher = rdf.fetcher(store);
      });

      it('then a parsing error occurs', async () => {
        try {
          // when this resource is fetched
          await fetcher.load('http://localhost/invalid.jsonld');
          fail("Should have thrown an error");
        } catch (e) {
          // then a parsing error occurs
          expect(e.message).to.contain(`Fetcher: Error trying to parse <http://localhost/invalid.jsonld> as JSON-LD:
SyntaxError: Unexpected token`);
        }
      });
    })
  });

  describe('Given an activity streams JSON-LD resource, using "application/activity+json" content type', () => {
    const uri = "https://fediverse.test/some/note"

    beforeEach(() => {
      const docContents = `
        {
            "@type": "https://www.w3.org/ns/activitystreams#Note",
            "https://www.w3.org/ns/activitystreams#content": "Some content"
        }
        `
      nock('https://fediverse.test').get('/some/note').reply(200, docContents, {
        'Content-Type': 'application/activity+json',
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
        const match = store.anyStatementMatching(undefined, rdf.sym("https://www.w3.org/ns/activitystreams#content"), undefined, rdf.sym(uri));
        expect(match.subject.termType).to.eq("BlankNode");
        expect(match.predicate.value).to.equal('https://www.w3.org/ns/activitystreams#content');
        expect(match.object.value).to.equal('Some content');
      });

      it('then the type can be found in the store', async () => {
        await fetcher.load(uri);
        const match = store.anyStatementMatching(undefined, rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), undefined, rdf.sym(uri));
        expect(match.subject.termType).to.eq("BlankNode");
        expect(match.predicate.value).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        expect(match.object.value).to.equal('https://www.w3.org/ns/activitystreams#Note');
      });
    });
  });
});