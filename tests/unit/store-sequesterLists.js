/* eslint-env mocha */
import { expect } from 'chai'

import parse from '../../src/parse'
import { namedNode, blankNode, literal, quad, graph, defaultGraph } from '../../src/data-factory'

const NsXsd = 'http://www.w3.org/2001/XMLSchema#';
const NsRdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const first = NsRdf + 'first', rest = NsRdf + 'rest', nil = NsRdf + 'nil';
const nNil = namedNode(nil);

describe('Store.sequesterLists()', () => {
  const BASE = 'http://a.example/'
  describe('An rdflib store containing a well-formed rdf:Collection as subject', function () {
    var member0 = namedNode(BASE + 'element1');
    var member1 = literal('element2');
    var store = graph();
    var listElements = makeList(store, null, member0, member1);
    store.add(listElements[0], namedNode(BASE + 'p1'), namedNode(BASE + 'o1'), defaultGraph());
    var listItemsJSON = {
      n0: [
        { termType: 'NamedNode', value: BASE + 'element1' },
        { termType: 'Literal', value: 'element2',
          datatype: { termType: 'NamedNode', value: NsXsd + 'string' } },
      ],
    };

    describe('sequesterLists with failParam', function () {
      var failures = [];
      var listHeads = store.sequesterLists((li, msg) => failures.push([li, msg]));
      var struct = mapToObject(listHeads);
      it('should not delete triples',
        shouldIncludeAll(store.statementsMatching(),
                         ['_:' + listElements[0].value, BASE + 'p1', BASE + 'o1'],
                         ['_:' + listElements[0].value, first, BASE + 'element1'],
                         ['_:' + listElements[0].value, rest, '_:' + listElements[1].value],
                         ['_:' + listElements[1].value, first, '"element2"'],
                         ['_:' + listElements[1].value, rest, nil]
                        ));
      it('should not call failParam', function () {
        expect(failures).to.be.empty;
      });
      it('should generate a list of Collections', function () {
        expect(struct).to.deep.equal(listItemsJSON);
      });
    });

    describe('sequesterLists without failParam', function () {
      const store2 = copyGraph(store);
      var listHeads = store2.sequesterLists();
      var struct = mapToObject(listHeads);
      it('should remove the first/rest triples and return the list members',
        shouldIncludeAll(store2.statementsMatching(),
                         ['_:' + listElements[0].value, BASE + 'p1', BASE + 'o1']));
      it('should generate a list of Collections', function () {
        expect(struct).to.deep.equal(listItemsJSON);
      });
    });
  });

  describe('An rdflib store containing a well-formed rdf:Collection as object', function () {
    var member0 = namedNode(BASE + 'element1');
    var member1 = literal('element2');
    var store = graph();
    var listElements = makeList(store, null, member0, member1);
    store.add(namedNode(BASE + 's1'), namedNode(BASE + 'p1'), listElements[0], defaultGraph());
    var listItemsJSON = {
      n2: [
        { termType: 'NamedNode', value: BASE + 'element1' },
        { termType: 'Literal', value: 'element2',
          datatype: { termType: 'NamedNode', value: NsXsd + 'string' } },
      ],
    };

    describe('sequesterLists with failParam', function () {
      var failures = [];
      var listHeads = store.sequesterLists((li, msg) => failures.push([li, msg]));
      var struct = mapToObject(listHeads);
      it('should not delete triples',
        shouldIncludeAll(store.statementsMatching(),
                         [BASE + 's1', BASE + 'p1', '_:' + listElements[0].value],
                         ['_:' + listElements[0].value, first, BASE + 'element1'],
                         ['_:' + listElements[0].value, rest, '_:' + listElements[1].value],
                         ['_:' + listElements[1].value, first, '"element2"'],
                         ['_:' + listElements[1].value, rest, nil]
                        ));
      it('should not call failParam', function () {
        expect(failures).to.be.empty;
      });
      it('should generate a list of Collections', function () {
        expect(struct).to.deep.equal(listItemsJSON);
      });
    });

    describe('sequesterLists without failParam', function () {
      const store2 = copyGraph(store);
      var listHeads = store2.sequesterLists();
      var struct = mapToObject(listHeads);
      it('should remove the first/rest triples and return the list members',
        shouldIncludeAll(store2.statementsMatching(),
                         [BASE + 's1', BASE + 'p1', '_:' + listElements[0].value]));
      it('should generate a list of Collections', function () {
        expect(struct).to.deep.equal(listItemsJSON);
      });
    });
  });

  describe('An rdflib store containing a rdf:Collection with multiple rdf:first arcs on head', function () {
    var store = graph();
    var listElements = makeList(store, null, blankNode(), blankNode());
    store.add(listElements[0], namedNode(first), blankNode(), defaultGraph());
    expectFailure(store, listElements[0]);
  });

  describe('An rdflib store containing a rdf:Collection with multiple rdf:first arcs on tail', function () {
    var store = graph();
    var listElements = makeList(store, null, blankNode(), blankNode());
    store.add(listElements[1], namedNode(first), blankNode(), defaultGraph());
    expectFailure(store, listElements[1]);
  });

  describe('An rdflib store containing a rdf:Collection with multiple rdf:rest arcs on head', function () {
    var store = graph();
    var listElements = makeList(store, null, blankNode(), blankNode());
    store.add(listElements[0], namedNode(rest), blankNode(), defaultGraph());
    expectFailure(store, listElements[0]);
  });

  describe('An rdflib store containing a rdf:Collection with multiple rdf:rest arcs on tail', function () {
    var store = graph();
    var listElements = makeList(store, null, blankNode(), blankNode());
    store.add(listElements[1], namedNode(rest), blankNode(), defaultGraph());
    expectFailure(store, listElements[1]);
  });

  describe('An rdflib store containing a rdf:Collection with non-list arcs out', function () {
    var store = graph();
    var listElements = makeList(store, null, blankNode(), blankNode(), blankNode());
    store.add(listElements[1], namedNode(BASE + 'foo'), blankNode(), defaultGraph());
    expectFailure(store, listElements[1]);
  });

  describe('An rdflib store containing a rdf:Collection with multiple incoming rdf:rest arcs', function () {
    var store = graph();
    var listElements = makeList(store, null, blankNode(), blankNode(), blankNode());
    store.add(blankNode(), namedNode(rest), listElements[1], defaultGraph());
    expectFailure(store, listElements[1]);
  });

  describe('An rdflib store containing a rdf:Collection with co-references out of head', function () {
    var store = graph();
    var listElements = makeList(store, null, blankNode(), blankNode(), blankNode());
    store.add(listElements[0], namedNode(BASE + 'p1'), namedNode(BASE + 'o1'), defaultGraph());
    store.add(listElements[0], namedNode(BASE + 'p1'), namedNode(BASE + 'o2'), defaultGraph());
    expectFailure(store, listElements[0]);
  });

  describe('An rdflib store containing a rdf:Collection with co-references into head', function () {
    var store = graph();
    var listElements = makeList(store, null, blankNode(), blankNode(), blankNode());
    store.add(namedNode(BASE + 's1'), namedNode(BASE + 'p1'), listElements[0], defaultGraph());
    store.add(namedNode(BASE + 's2'), namedNode(rest), listElements[0], defaultGraph());
    store.add(namedNode(BASE + 's2'), namedNode(BASE + 'p1'), listElements[0], defaultGraph());
    expectFailure(store, listElements[0]);
  });

  describe('An rdflib store containing a rdf:Collection spread across graphs', function () {
    var member0 = namedNode(BASE + 'element1');
    var member1 = literal('element2');
    var store = graph();
    var listElements = [
      blankNode(),
      blankNode(),
    ];
    store.add(listElements[0], namedNode(first), member0, defaultGraph());
    store.add(listElements[0], namedNode(rest), listElements[1], namedNode(BASE + 'g1'), defaultGraph());
    store.add(listElements[1], namedNode(first), member1, defaultGraph());
    store.add(listElements[1], namedNode(rest), namedNode(nil), defaultGraph());
    store.add(namedNode(BASE + 's1'), namedNode(BASE + 'p1'), listElements[0], defaultGraph());
    describe('sequesterLists with failParam', function () {
      var failures = [];
      var listHeads = store.sequesterLists((li, msg) => failures.push([li, msg]));
      var struct = mapToObject(listHeads);
      it('should call failParam', function () {
        expect(failures.length).to.equal(1);
        expect(failures[0][0]).to.deep.equal(listElements[0]);
      });
      it('should not generate a list of Collections', function () {
        expect(struct).to.deep.equal({});
      });
    });

    describe('sequesterLists without failParam', function () {
      var listHeads = store.sequesterLists();
      var struct = mapToObject(listHeads);
      it('should not delete triples',
        shouldIncludeAll(store.statementsMatching(),
                         [BASE + 's1', BASE + 'p1', '_:' + listElements[0].value],
                         ['_:' + listElements[0].value, first, BASE + 'element1'],
                         ['_:' + listElements[0].value, rest, '_:' + listElements[1].value, BASE + 'g1'],
                         ['_:' + listElements[1].value, first, '"element2"'],
                         ['_:' + listElements[1].value, rest, nil]
                        ));
      it('should generate an empty list of Collections', function () {
        expect(struct).to.deep.equal({});
      });
    });
  });
})

function expectFailure(store, b0rked) {
  describe('sequesterLists with failParam', function () {
    var failures = [];
    var listHeads = store.sequesterLists((li, msg) => failures.push([li, msg]));
    var struct = mapToObject(listHeads);
    it('should call failParam', function () {
      expect(failures.length).to.equal(1);
      expect(failures[0][0]).to.deep.equal(b0rked);
    });
    it('should not generate a list of Collections', function () {
      expect(struct).to.deep.equal({});
    });
  });

  describe('sequesterLists without failParam', function () {
    var listHeads = store.sequesterLists();
    var struct = mapToObject(listHeads);
    it('should generate an empty list of Collections', function () {
      expect(struct).to.deep.equal({});
    });
  });
}

function mapToObject(listHeads) {
  return Array.from(listHeads.entries()).reduce(
    (acc, pair) => {
      acc[pair[0]] = pair[1].map(m => {
        let ret = { termType: m.termType, value: m.value }
        if (m.language)
          ret.language = m.language
        if (m.datatype)
          ret.datatype = { termType: m.datatype.termType, value: m.datatype.value }
        return ret
      });
      return acc;
    }, {});
}

function makeList(store, graph = defaultGraph()) {
  if (!graph)
    graph = defaultGraph()
  if (arguments.length < 3)
    return nNil

  var listElements = [blankNode()];
  var args = Array.prototype.slice.call(arguments, 2);
  args.forEach(function (member, idx) {
    store.add(listElements[idx], namedNode(first), member, graph);
    if (idx === args.length - 1) {
      store.add(listElements[idx], namedNode(rest), namedNode(nil), graph);
    }
    else {
      listElements.push(blankNode());
      store.add(listElements[idx], namedNode(rest), listElements[idx + 1], graph);
    }
  });
  return listElements;
}

function shouldIncludeAll(result) {
  var items = Array.prototype.slice.call(arguments, 1).map(function (arg) {
    return quad.apply(null, arg.map(a =>
                                    a.startsWith('_:')
                                    ? blankNode(a.substr(2))
                                    : a.startsWith('"')
                                    ? literal(a.substr(1, a.length - 2))
                                    : namedNode(a)))
  });
  return function () {
    if (typeof result === 'function') result = result()
    expect(result.length).to.eql(items.length);
    for (var i = 0; i < items.length; i++) {
      const lookFor = items[i]
      const found = result.filter(q => {
        return lookFor.equals(q)
      }) ;if (!found) debugger;
      expect(found.length).to.eql(1)
    }
  };
}

function copyGraph (store) {
  const ret = graph()
  ret.add(store.statementsMatching())
  return ret
}
