import chai, {expect} from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import {graph, parse, st, sym} from "../../src/";

chai.use(sinonChai)

describe('IndexedFormula', () => {

  describe('data callbacks', () => {

    const statement1 = st(
      sym("https://subject1.test"),
      sym("https://predicate1.test"),
      sym("https://object1.test"),
      sym("https://graph1.test/")
    )

    const statement2 = st(
      sym("https://subject2.test"),
      sym("https://predicate2.test"),
      sym("https://object2.test"),
      sym("https://graph2.test/")
    )

    describe('addDataCallback', () => {

      let store, callback;
      beforeEach(() => {
        store = graph()
        callback = sinon.spy()
        store.addDataCallback(callback)
      });


      it('callback is called when a statement is added', () => {
        store.add(statement1)
        expect(callback).to.have.been.calledWith(statement1)
      });

      it('callback is called when many statements are added separately', () => {
        store.add(statement1)
        store.add(statement2)
        expect(callback).to.have.been.calledWith(statement1)
        expect(callback).to.have.been.calledWith(statement2)
      });

      it('callback is called when many statements are added at once', () => {
        store.addAll([statement1, statement2])
        expect(callback).to.have.been.calledWith(statement1)
        expect(callback).to.have.been.calledWith(statement2)
      });

      it('callback is called when data is parsed', () => {
        parse(`
            <https://subject.test> <https://predicate1.test> <https://object1.test>; 
                                    <https://predicate2.test> <https://object2.test>; 
            .`,
          store, "https://graph.test/")
        expect(callback).to.have.been.calledWith(st(
          sym("https://subject.test"),
          sym("https://predicate1.test"),
          sym("https://object1.test"),
          sym("https://graph.test/")
        ))
        expect(callback).to.have.been.calledWith(st(
          sym("https://subject.test"),
          sym("https://predicate2.test"),
          sym("https://object2.test"),
          sym("https://graph.test/")
        ))
      });

      it('callback is not called again if statement is already present', () => {
        store.add(statement1)
        store.add(statement1)
        expect(callback).to.have.been.calledOnceWith(statement1)
      });

      it('all callbacks are called, if there are multiple', () => {
        const callback2 = sinon.spy()
        store.addDataCallback(callback2)
        store.add(statement1)
        expect(callback).to.have.been.calledWith(statement1)
        expect(callback2).to.have.been.calledWith(statement1)
      });
    });

    describe('addDataRemovalCallback', () => {
      let store, callback;
      beforeEach(() => {
        store = graph()
        store.addAll([statement1, statement2])
        callback = sinon.spy()
        store.addDataRemovalCallback(callback)
      });

      it('callback is called when a statement is removed', () => {
        store.remove(statement1)
        expect(callback).to.have.been.calledWith(statement1)
      });

      it('callback is called when many statements are removed separately', () => {
        store.remove(statement1)
        store.remove(statement2)
        expect(callback).to.have.been.calledWith(statement1)
        expect(callback).to.have.been.calledWith(statement2)
      });

      it('callback is called when many statements are removed at once', () => {
        store.removeStatements([statement1, statement2])
        expect(callback).to.have.been.calledWith(statement1)
        expect(callback).to.have.been.calledWith(statement2)
      });

      it('callback is called when many matching statements are removed', () => {
        parse(`
            <https://subject.test> <https://predicate1.test> <https://object1.test>; 
                                    <https://predicate2.test> <https://object2.test>; 
            .`,
          store, "https://graph.test/")

        store.removeMany(sym("https://subject.test"), null, null, null)

        expect(callback).to.have.been.calledWith(st(
          sym("https://subject.test"),
          sym("https://predicate1.test"),
          sym("https://object1.test"),
          sym("https://graph.test/")
        ))
        expect(callback).to.have.been.calledWith(st(
          sym("https://subject.test"),
          sym("https://predicate2.test"),
          sym("https://object2.test"),
          sym("https://graph.test/")
        ))

      });

      it('callback is called for each statement in a removed document', () => {
        parse(`
            <https://subject.test> <https://predicate1.test> <https://object1.test>; 
                                    <https://predicate2.test> <https://object2.test>; 
            .`,
          store, "https://graph.test/")

        store.removeDocument(sym("https://graph.test/"))

        expect(callback).to.have.been.calledWith(st(
          sym("https://subject.test"),
          sym("https://predicate1.test"),
          sym("https://object1.test"),
          sym("https://graph.test/")
        ))
        expect(callback).to.have.been.calledWith(st(
          sym("https://subject.test"),
          sym("https://predicate2.test"),
          sym("https://object2.test"),
          sym("https://graph.test/")
        ))
      });

      it('callback is not called if statement is not present', () => {
        try {
          store.remove(statement1)
          store.remove(statement1)
        } catch (e) {
          // the second remove fails
        }
        expect(callback).to.have.been.calledOnceWith(statement1)
      });
    });

    describe('pass callbacks as options', () => {

      it('data callback can be passed as option', () => {
        const callback = sinon.spy()
        const store = graph(undefined, {
          dataCallback: callback
        })
        store.add(statement1)
        expect(callback).to.have.been.calledWith(statement1)
      });

      it('data removal callback can be passed as option', () => {
        const callback = sinon.spy()
        const store = graph(undefined, {
          dataRemovalCallback: callback
        })
        store.add(statement1)
        store.remove(statement1)
        expect(callback).to.have.been.calledWith(statement1)
      });
    });
  });
});
