'use strict'

import { expect } from 'chai'

var $rdf = require('./../../lib/index.js')

describe('IndexedFormula', () => {
  describe('removeMatches', () => {
    it('removes matches with given subject and wildcards for predicate and object', () => {

      var base = "http://www.example.org/testing/";

      var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
      var NS = $rdf.Namespace(base)

      var kb = new $rdf.graph();
      kb.defaultNamespace = base;

      var aNode = $rdf.sym(":node1");
      var aNode2 = $rdf.sym(":node2");

      kb.add(aNode,RDF('type'),$rdf.sym(':TypeA'));
      kb.add(aNode,NS('pred'),aNode2);
      kb.add(aNode,NS('pred2'),"aString");

      kb.removeMatches(aNode,undefined,undefined);
      var result = $rdf.serialize(undefined, kb, base).replace(/\n/g,'').replace(/\"/g, "\'");

      // not sure about these namespace prefixes...
      expect(result).to.equal("@prefix : <#>.")
    })

    it('removes matches with given predicate and wildcards for subject and object', () => {

      var base = "http://www.example.org/testing/";

      var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
      var NS = $rdf.Namespace(base)

      var kb = new $rdf.graph();
      kb.defaultNamespace = base;

      var aNode = $rdf.sym(":node1");
      var aNode2 = $rdf.sym(":node2");

      kb.add(aNode,RDF('type'),$rdf.sym(':TypeA'));
      kb.add(aNode,NS('pred'),aNode2);
      kb.add(aNode,NS('pred2'),"aString");

      kb.removeMatches(undefined,NS('pred'),undefined);
      var result = $rdf.serialize(undefined, kb, base).replace(/\n/g,'').replace(/\"/g, "\'");

      // not sure about these namespace prefixes...
      expect(result).to.equal(
        "@prefix : <#>."+
        "@prefix tes: <>."+
        "<:node1> a <:TypeA>; tes:pred2 'aString'.")
    })

    it('removes matches with given object and wildcards for subject and predicate', () => {

      var base = "http://www.example.org/testing/";

      var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
      var NS = $rdf.Namespace(base)

      var kb = new $rdf.graph();
      kb.defaultNamespace = base;

      var aNode = $rdf.sym(":node1");
      var aNode2 = $rdf.sym(":node2");

      kb.add(aNode,RDF('type'),$rdf.sym(':TypeA'));
      kb.add(aNode,NS('pred'),aNode2);
      kb.add(aNode,NS('pred2'),"aString");

      kb.removeMatches(undefined,undefined,aNode2);
      var result = $rdf.serialize(undefined, kb, base).replace(/\n/g,'').replace(/\"/g, "\'");

      // not sure about these namespace prefixes...
      expect(result).to.equal(
        "@prefix : <#>."+
        "@prefix tes: <>."+
        "<:node1> a <:TypeA>; tes:pred2 'aString'.")
    })

    it('removes matches with given subject and wildcards for predicate and object, with additional subject nodes left', () => {

      var base = "http://www.example.org/testing/";

      var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
      var NS = $rdf.Namespace(base)

      var kb = new $rdf.graph();
      kb.defaultNamespace = base;

      var aNode = $rdf.sym(":node1");
      var aNode2 = $rdf.sym(":node2");
      var aNode3 = $rdf.sym(":node3");
      var aNode4 = $rdf.sym(":node4");

      kb.add(aNode3,RDF('type'),$rdf.sym(':TypeA'));
      kb.add(aNode3,NS('pred'),aNode2);
      kb.add(aNode3,NS('pred2'),"aString");      

      kb.add(aNode,RDF('type'),$rdf.sym(':TypeA'));
      kb.add(aNode,NS('pred'),aNode2);
      kb.add(aNode,NS('pred2'),"aString");

      kb.add(aNode4,RDF('type'),$rdf.sym(':TypeA'));
      kb.add(aNode4,NS('pred'),aNode2);
      kb.add(aNode4,NS('pred2'),"aString");

      kb.removeMatches(aNode,undefined,undefined);
      var result = $rdf.serialize(undefined, kb, base).replace(/\n/g,'').replace(/\"/g, "\'");

      // not sure about these namespace prefixes...
      expect(result).to.equal(
        "@prefix : <#>."+
        "@prefix tes: <>."+
        "<:node3> a <:TypeA>; tes:pred <:node2>; tes:pred2 'aString'."+
        "<:node4> a <:TypeA>; tes:pred <:node2>; tes:pred2 'aString'."
      )
    })

  })
})
