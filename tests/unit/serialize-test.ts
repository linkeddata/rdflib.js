import {expect} from 'chai'
import {graph, Literal, serialize, st, sym, lit} from '../../src/index';


describe('serialize', () => {
    describe('doubles', () => {
        it('literal from double value is taken as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                Literal.fromNumber(0.123),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123 .

`)
        });

        it('literal from number ending with .0 serializes to integer', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                Literal.fromNumber(123.0),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 123 .

`)
        });

        it('appends e0 for strings typed as xsd:double', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123e0 .

`)
        });

        it('adds .0 and e0 for strings containing an integer', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 123.0e0 .

`)
        });

        it('"e" notation is serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123e2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123e2 .

`)
        });

        it('"e" notation with negative exponent is serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123e-2 .

`)
        });

        it('capital "E" is serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("0.123E2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 0.123E2 .

`)
        });

        it('strings without dot but e notation are serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123e2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 123e2 .

`)
        });

        it('strings without dot but e notation with negative exponent are serialized as-is', () => {
            const doc = sym("https://doc.example");
            const statement = st(
                sym('https://subject.example'),
                sym('https://predicate.example'),
                lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
                doc
            )
            const kb = graph();
            kb.add(statement)
            const result = serialize(doc, kb, null, 'text/turtle')
            expect(result).to.equal(`@prefix : <#>.

<https://subject.example> <https://predicate.example> 123e-2 .

`)
        });



      it('use setPrefix to define a namespace prefix', () => {
        const doc = sym("https://doc.example");
        const statement = st(
          sym('https://example.com/subject'),
          sym('http://schema.org/predicate'),
          lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
          doc
        )
        const kb = graph()
        kb.setPrefixForURI("example", "https://example.com/")
        kb.add(statement)
        const result = serialize(doc, kb, null, 'text/turtle')
        expect(result).to.equal(`@prefix : <#>.
@prefix schema: <http://schema.org/>.
@prefix example: <https://example.com/>.

example:subject schema:predicate 123e-2 .

`)
      });


      it('use setPrefix to override a graph prefix', () => {
        const doc = sym("https://doc.example");
        const statement = st(
          sym('https://example.com/subject'),
          sym('http://schema.org/predicate'),
          lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
          doc
        )
        const kb = graph()
        kb.setPrefixForURI("example", "https://example.com/")

        kb.setPrefixForURI("example2", "https://example.com/")
        kb.add(statement)
        const result = serialize(doc, kb, null, 'text/turtle')
        expect(result).to.equal(`@prefix : <#>.
@prefix schema: <http://schema.org/>.
@prefix example2: <https://example.com/>.

example2:subject schema:predicate 123e-2 .

`)
      });

      it('use setPrefix to override a default prefix', () => {
        const doc = sym("https://doc.example");
        const statement = st(
          sym('https://example.com/subject'),
          sym('http://schema.org/predicate'),
          lit("123e-2", undefined, sym("http://www.w3.org/2001/XMLSchema#double")),
          doc
        )
        const kb = graph();
        kb.setPrefixForURI("example", "https://example.com/")
        kb.setPrefixForURI("schema2", "http://schema.org/")
        kb.add(statement)

        const result = kb.serialize(null, 'text/turtle', null);

        //const result = serialize(doc, kb, null, 'text/turtle')
        expect(result).to.equal(`@prefix schema2: <http://schema.org/>.
@prefix example: <https://example.com/>.

example:subject schema2:predicate 123e-2 .

`)
      });


    });

  describe('namespaces', () => {
    it('producing [prefix][colon] [dot]', () => {
      // when a symbol has a trailing slash, the automatic prefix production results in a prefixed symbol with no local name
      // if that symbol is the statement's object, it results in a colon immediately followed by a dot
      // some platforms choke if there's no whitespace between the colon and the dot - make sure there is.
      const doc = sym("https://doc.example");
      const statement = st(
        sym('https://example.com/subject'),
        sym('http://schema.org/predicate'),
        sym('https://example.com/object/'),
        doc
      )
      const kb = graph();
      kb.setPrefixForURI("example", "https://example.com/")
      kb.setPrefixForURI("schema2", "http://schema.org/")
      kb.add(statement)

      const result = serialize(doc, kb, null, 'text/turtle');

      //const result = serialize(doc, kb, null, 'text/turtle')
      expect(result).to.equal(`@prefix : <#>.
@prefix schema: <http://schema.org/>.
@prefix example: <https://example.com/>.
@prefix obj: <https://example.com/object/>.

example:subject schema:predicate obj: .

`)
    });
  });
});