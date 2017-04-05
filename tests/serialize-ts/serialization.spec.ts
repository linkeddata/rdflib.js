// import $rdf from '../../lib'
import $rdf = require('../../lib/index')
import { TestHelper } from './test-helper'
import * as fs from 'mz/fs'
import * as chai from "chai"
import * as chaiAsPromised from "chai-as-promised"
import * as Promise from 'bluebird'
import * as jsdiff from 'diff'
require("colors");

chai.use(chaiAsPromised);
chai.should();

// In general chai is not too happy about arrow functions. Keep this in mind when using chai's own operators
function strcmpr(str1: string, str2: string): number {
  str1 = str1.replace(/\r\n?/g, "\n")
  str2 = str2.replace(/\r\n?/g, "\n")
  return str1 < str2 ? -1 : +(str1 > str2)
}

describe("Testing the consistency of serialization between the various parsers", () => {

  describe("T1: Simple turtle to xml", () => {
    let testHelper: TestHelper
    testHelper = new TestHelper()

    // You can't nest "it" inside other its 
    // So you must either just place simple assertion inside the .then() bodies, or define a new testing unit/context/whatever you wanna call it
    it("Should read t1.ttl, write to ,t1.xml matching t1-ref.xml", function (done) {
      testHelper.loadFile("t1.ttl").should.eventually.be.fulfilled
        .then(() => {
          // describe("loadFile", () => {
          //     it("Should have loaded t1.ttl", function () {
          // console.log(testHelper.kb.statements);
          testHelper.kb.statementsMatching(null, null, testHelper.base + "t1.ttl")[0]["object"].termType.should.equal("Literal")
          //     })
          // })
          return testHelper.outputFile(",t1.xml", "application/rdf+xml")
        })
        .then(() => {
          // describe("outputFile", () => {
          //     it("Should have created t1.xml with an integer value", () => {
          return fs.readFile("tests/serialize/sample_files/,t1.xml").then(data => data.toString()).should.eventually.contain("http://www.w3.org/2001/XMLSchema#integer")
          //     })
          // })
        })
        .should.notify(done);
    })
  })

  describe("T2: Turtle to xml against a reference file", () => {
    // t2
    // node ./data.js -in=t2.ttl -format=application/rdf+xml  -out=,t2.xml
    // diff ,t2.xml t2-ref.xml
    let testHelper: TestHelper = new TestHelper()
    it("Should load t2.ttl and write ,t2.xml, matching t2-ref.xml", function (done) {
      testHelper.loadFile("t2.ttl").should.eventually.be.fulfilled
        .then(() => {
          let foo = $rdf.sym("https://example.org/foo#foo");
          testHelper.kb.statementsMatching(foo)[0]["object"].termType.should.equal("Literal")
          return testHelper.outputFile(",t2.xml", "application/rdf+xml")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t2.xml", "utf8"),
            fs.readFile("tests/serialize/sample_files/t2-ref.xml", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
          return
        })
        .should.notify(done);
    })
  }) // END of turtle to xml

  describe("T3: Turtle to xml with makeup prefixes", () => {
    // t3:
    // node ./data.js -in=t3.ttl -format=application/rdf+xml  -out=,t3.xml
    // diff ,t3.xml t3-ref.xml
    let testHelper: TestHelper = new TestHelper()
    it("Should load t3.ttl and write to ,t3.xml, matching t3-ref.xml", function (done) {
      testHelper.loadFile("t3.ttl").should.eventually.be.fulfilled
        .then(() => {
          let foo = $rdf.sym("https://example.net/67890#foo");
          let pred = $rdf.sym("https://example.net/67890#bar");
          testHelper.kb.statementsMatching(foo, pred)[0]["object"].value.should.equal("https://example.net/88888#baz")
          return testHelper.outputFile(",t3.xml", "application/rdf+xml")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t3.xml", "utf8"),
            fs.readFile("tests/serialize/sample_files/t3-ref.xml", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END of makeup prefixes

  describe("T4: Turtle to turtle", () => {
    // t4:
    // node./data.js -in=t3.ttl - out=,t4.ttl
    // diff , t4.ttl t4- ref.ttl    
    let testHelper: TestHelper = new TestHelper()
    it("Should load t3.ttl and write t4.ttl, matching t4-ref.ttl", function (done) {
      testHelper.loadFile("t3.ttl").should.eventually.be.fulfilled
        .then(() => {
          let foo = $rdf.sym("https://example.net/67890#foo");
          let pred = $rdf.sym("https://example.net/67890#bar");
          testHelper.kb.statementsMatching(foo, pred)[0]["object"].value.should.equal("https://example.net/88888#baz")
          return testHelper.outputFile(",t4.ttl", "text/turtle")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t4.ttl", "utf8"),
            fs.readFile("tests/serialize/sample_files/t4-ref.ttl", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END of turtle to turtle

  describe("T5: n3 to turtle", () => {
    // t5:
    // node ./data.js -in=t5.n3 -format=text/turtle -out=,t5.ttl
    // diff ,t5.ttl t5-ref.ttl 
    let testHelper: TestHelper = new TestHelper()
    it("Should load t5.n3 and write t5.ttl, matching t5-ref.ttl", function (done) {
      testHelper.loadFile("t5.n3").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "t5.n3")
          // let pred = $rdf.sym("https://example.net/67890#bar");
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",t5.ttl", "text/turtle")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t5.ttl", "utf8"),
            fs.readFile("tests/serialize/sample_files/t5-ref.ttl", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END of n3 to turtle

  describe("T6: n3 to n3", () => {
    // t6
    // de ./data.js -in=t5.n3 -format=text/n3 -out=,t6.n3
    // diff ,t6.n3 t6-ref.n3
    let testHelper: TestHelper = new TestHelper()
    it("Should load t5.n3 and write t6.n3, matching t6-ref.n3", function (done) {
      testHelper.loadFile("t5.n3").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "t5.n3")
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",t6.n3", "text/n3")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t6.n3", "utf8"),
            fs.readFile("tests/serialize/sample_files/t6-ref.n3", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          //  str1.should.equal(str2)
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END of n3 to n3

  describe("T7: n3 to n-triples", () => {
    // t7:
    // node ./data.js -in=t7.n3 -format=application/n-triples -out=,t7.nt
    // diff ,t7.nt t7-ref.nt
    let testHelper: TestHelper = new TestHelper()
    it("Should load t7.n3 and write t7.nt, matching t7-ref.nt", function (done) {
      testHelper.loadFile("t7.n3").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "t7.n3")
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",t7.nt", "application/n-triples")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t7.nt", "utf8"),
            fs.readFile("tests/serialize/sample_files/t7-ref.nt", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END n3 to n-triples 

  // As mentioned in the makefile the n-quad includes the time of insertion
  // of the data so it cant be reporduced. Also it is not guaranteed the collision
  // on the names of the blank nodes.
  describe.skip("T8: n3 to n-quads", () => {
    // t8:
    // node ./data.js -in=t5.n3  -format=application/n-quads -dump=,t8.nq
    // diff ,t8.nq t8-ref.nq
    let testHelper: TestHelper = new TestHelper()
    it("Should load t5.n3 and write t8.nq, matching t8-ref.nq", function (done) {
      testHelper.loadFile("t5.n3").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "t5.n3")
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",t8.nq", "application/n-quads")
        })
        .then(() => {
          return testHelper.dump(",t8.nq")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t8.nq", "utf8"),
            fs.readFile("tests/serialize/sample_files/t8-ref.nq", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          // var diff = jsdiff.diffChars(vals[0], vals[1]);

          // diff.forEach(function (part) {
          //   var color = part.added ? 'green' :
          //     part.removed ? 'red' : 'grey';

          //   process.stderr.write(part.value[color]);
          // });
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END n3 to n-quads 

  describe("T9: n3 to ld+json", () => {
    // "serialize-test-9": "cd tests/serialize && node ./data.js -in=t7.n3 -format=application/ld+json -out=,t9.json && node diff ,t9.json t9-ref.json"
    let testHelper: TestHelper = new TestHelper()
    it("Should load t7.n3 and write t9.json, matching t9-ref.json", function (done) {
      testHelper.loadFile("t7.n3").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "t7.n3")
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",t9.json", "application/ld+json")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t9.json", "utf8"),
            fs.readFile("tests/serialize/sample_files/t9-ref.json", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END n3 to ldjson

  describe("T10: turtle parsing", () => {
    //   "serialize-test-10": "cd tests/serialize && node ./data.js -in=details.ttl -format=text/turtle -out=,t10.ttl && node diff ,t10.ttl t10-ref.ttl",
    let testHelper: TestHelper = new TestHelper()
    it("Should load details.ttl and write ,t10.ttl, matching t10-ref.ttl", function (done) {
      testHelper.loadFile("details.ttl").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "details.ttl")
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",t10.ttl", "text/turtle")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,t10.ttl", "utf8"),
            fs.readFile("tests/serialize/sample_files/t10-ref.ttl", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END ttl parser

  describe.only("T11: n3 to rdf+xml", () => {
    // "serialize-test-11": "cd tests/serialize && node ./data.js -in=structures.n3 -format=application/rdf+xml  -out=,structures.xml && node diff ,structures.xml t11-ref.xml",
    let testHelper: TestHelper = new TestHelper()
    testHelper.clear()
    it("Should load structures.n3 and write ,structures.xml, matching t11-ref.ttl", function (done) {
      testHelper.loadFile("structures.n3").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "structures.n3")
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",structures.xml", "application/rdf+xml")
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,structures.xml", "utf8"),
            fs.readFile("tests/serialize/sample_files/t11-ref.xml", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END n3 to rdf+xml

  describe("T12: n3 to nt to ttl", () => {
    //   "serialize-test-12": "cd tests/serialize && node ./data.js -in=structures.n3 -format=text/turtle -out=,structures.ttl && node diff ,structures.ttl t12-ref.ttl",
    let testHelper: TestHelper = new TestHelper()
    it("Should load structures.n3 and write ,structures.ttl, matching t11-ref.ttl", function (done) {
      testHelper.loadFile("structures.n3").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "structures.n3")
          // testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",structures.ttl", 'text/turtle')
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,structures.ttl", "utf8"),
            fs.readFile("tests/serialize/sample_files/t12-ref.ttl", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END n3 to turtle

  describe("T13: n3 to rdf+xml", () => {
    //   "serialize-test-13": "cd tests/serialize && node ./data.js -in=structures.n3 -format=application/n-triples -out=,structures.nt && node ./data.js -in=,structures.nt -format=text/turtle -out=,structures.nt.ttl && node diff ,structures.nt.ttl t13-ref.ttl"
    let testHelper: TestHelper = new TestHelper()
    it("Should load structures.n3 and write ,structures.nt, matching t11-ref.ttl", function (done) {
      testHelper.loadFile("structures.n3").should.eventually.be.fulfilled
        .then(() => {
          let lit = $rdf.literal(testHelper.base + "structures.n3")
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",structures.nt", 'application/n-triples')
        })
        .then(() => {
          return testHelper.clear()
        })
        .then(() => {
          testHelper.loadFile(",structures.nt").should.eventually.be.fulfilled
        })
        .then(() => {
          let lit = $rdf.literal(testHelper.base + ",structures.nt")
          console.log(testHelper.kb.statements)
          // .map(el => { console.log(el); })
          testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined
          return testHelper.outputFile(",structures.nt.ttl", 'text/turtle')
        })
        .then(() => {
          return Promise.all([
            fs.readFile("tests/serialize/sample_files/,structures.nt.ttl", "utf8"),
            fs.readFile("tests/serialize/sample_files/t13-ref.ttl", "utf8")])
        })
        .then(vals => {
          let str1 = vals[0].replace(/\r\n?/g, "\n")
          let str2 = vals[1].replace(/\r\n?/g, "\n")
          str1.should.equal(str2)
        })
        .should.notify(done);
    })
  }) // END n3 to rdf+xml

});
