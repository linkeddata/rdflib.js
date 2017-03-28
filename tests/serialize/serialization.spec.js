"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import $rdf from '../../lib'
var $rdf = require("../../lib/index");
var test_helper_1 = require("./test-helper");
var fs = require("mz/fs");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var Promise = require("bluebird");
var jsdiff = require("diff");
require("colors");
chai.use(chaiAsPromised);
chai.should();
function strcmpr(str1, str2) {
    str1 = str1.replace(/\r\n?/g, "\n");
    str2 = str2.replace(/\r\n?/g, "\n");
    return str1 < str2 ? -1 : +(str1 > str2);
}
describe("Testing the consistency of serialization between the various parsers", function () {
    describe("Simple turtle to xml", function () {
        var testHelper;
        testHelper = new test_helper_1.TestHelper();
        // You can't nest it inside other it. 
        // So you can either just place simple assertion inside the .then() bodies, or you have to define a new testing unit/context/whatever you wanna call it.
        it("Should read t1.ttl, write to ,t1.xml equivalent to t1-ref.xml", function (done) {
            testHelper.loadFile("t1.ttl").should.eventually.be.fulfilled
                .then(function () {
                // describe("loadFile", () => {
                //     it("Should have loaded t1.ttl", function () {
                // console.log(testHelper.kb.statements);
                testHelper.kb.statementsMatching(undefined, undefined, testHelper.base + "t1.ttl")[0]["object"].termType.should.to.equal("Literal");
                //     })
                // })
                return testHelper.outputFile(",t1.xml", "application/rdf+xml");
            })
                .then(function () {
                // describe("outputFile", () => {
                //     it("Should have created t1.xml with the an integer value", () => {
                return fs.readFile("tests/serialize/sample_files/,t1.xml").then(function (data) { return data.toString(); }).should.to.eventually.contain("http://www.w3.org/2001/XMLSchema#integer");
                //     })
                // })
            })
                .should.notify(done);
        });
    });
    describe("Turtle to xml against a reference file", function () {
        // t2
        // node ./data.js -in=t2.ttl -format=application/rdf+xml  -out=,t2.xml
        // diff ,t2.xml t2-ref.xml
        var testHelper = new test_helper_1.TestHelper();
        it("Should load t2.ttl and write ,t2.xml, equivalent to t2-ref.xml", function (done) {
            testHelper.loadFile("t2.ttl").should.eventually.be.fulfilled
                .then(function () {
                var foo = $rdf.sym("https://example.org/foo#foo");
                testHelper.kb.statementsMatching(foo)[0]["object"].termType.should.to.equal("Literal");
                return testHelper.outputFile(",t2.xml", "application/rdf+xml");
            })
                .then(function () {
                return Promise.all([
                    fs.readFile("tests/serialize/sample_files/,t2.xml", "utf8"),
                    fs.readFile("tests/serialize/sample_files/t2-ref.xml", "utf8")
                ]);
            })
                .then(function (vals) {
                strcmpr(vals[0], vals[1]).should.equal(0);
                return;
            })
                .should.notify(done);
        });
    }); // END of turtle to xml
    describe("Turtle to xml with makeup prefixes", function () {
        // t3:
        // node ./data.js -in=t3.ttl -format=application/rdf+xml  -out=,t3.xml
        // diff ,t3.xml t3-ref.xml
        var testHelper = new test_helper_1.TestHelper();
        it("Should load t3.ttl and write to ,t3.xml, equivalent to t3-ref.xml", function (done) {
            testHelper.loadFile("t3.ttl").should.eventually.be.fulfilled
                .then(function () {
                var foo = $rdf.sym("https://example.net/67890#foo");
                var pred = $rdf.sym("https://example.net/67890#bar");
                testHelper.kb.statementsMatching(foo, pred)[0]["object"].value.should.equal("https://example.net/88888#baz");
                return testHelper.outputFile(",t3.xml", "application/rdf+xml");
            })
                .then(function () {
                return Promise.all([
                    fs.readFile("tests/serialize/sample_files/,t3.xml", "utf8"),
                    fs.readFile("tests/serialize/sample_files/t3-ref.xml", "utf8")
                ]);
            })
                .then(function (vals) {
                strcmpr(vals[0], vals[1]).should.equal(0);
            })
                .should.notify(done);
        });
    }); // END of makeup prefixes
    describe("Turtle to turtle", function () {
        // t4:
        // node./data.js -in=t3.ttl - out=,t4.ttl
        // diff , t4.ttl t4- ref.ttl    
        var testHelper = new test_helper_1.TestHelper();
        it("Should load t3.ttl and write t4.ttl, equivalent to t4-ref.ttl", function (done) {
            testHelper.loadFile("t3.ttl").should.eventually.be.fulfilled
                .then(function () {
                var foo = $rdf.sym("https://example.net/67890#foo");
                var pred = $rdf.sym("https://example.net/67890#bar");
                testHelper.kb.statementsMatching(foo, pred)[0]["object"].value.should.equal("https://example.net/88888#baz");
                return testHelper.outputFile(",t4.ttl", "text/turtle");
            })
                .then(function () {
                return Promise.all([
                    fs.readFile("tests/serialize/sample_files/,t4.ttl", "utf8"),
                    fs.readFile("tests/serialize/sample_files/t4-ref.ttl", "utf8")
                ]);
            })
                .then(function (vals) {
                strcmpr(vals[0], vals[1]).should.equal(0);
            })
                .should.notify(done);
        });
    }); // END of turtle to turtle
    describe("n3 to turtle", function () {
        // t5:
        // node ./data.js -in=t5.n3 -format=text/turtle -out=,t5.ttl
        // diff ,t5.ttl t5-ref.ttl 
        var testHelper = new test_helper_1.TestHelper();
        it("Should load t5.n3 and write t5.ttl, equivalent to t5-ref.ttl", function (done) {
            testHelper.loadFile("t5.n3").should.eventually.be.fulfilled
                .then(function () {
                var lit = $rdf.literal(testHelper.base + "t5.n3");
                // let pred = $rdf.sym("https://example.net/67890#bar");
                testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined;
                return testHelper.outputFile(",t5.ttl", "text/turtle");
            })
                .then(function () {
                return Promise.all([
                    fs.readFile("tests/serialize/sample_files/,t5.ttl", "utf8"),
                    fs.readFile("tests/serialize/sample_files/t5-ref.ttl", "utf8")
                ]);
            })
                .then(function (vals) {
                strcmpr(vals[0], vals[1]).should.equal(0);
            })
                .should.notify(done);
        });
    }); // END of n3 to turtle
    describe("n3 to n3", function () {
        // t6
        // de ./data.js -in=t5.n3 -format=text/n3 -out=,t6.n3
        // diff ,t6.n3 t6-ref.n3
        var testHelper = new test_helper_1.TestHelper();
        it("Should load t5.n3 and write t6.n3, equivalent to t6-ref.n3", function (done) {
            testHelper.loadFile("t5.n3").should.eventually.be.fulfilled
                .then(function () {
                var lit = $rdf.literal(testHelper.base + "t5.n3");
                testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined;
                return testHelper.outputFile(",t6.n3", "text/n3");
            })
                .then(function () {
                return Promise.all([
                    fs.readFile("tests/serialize/sample_files/,t6.n3", "utf8"),
                    fs.readFile("tests/serialize/sample_files/t6-ref.n3", "utf8")
                ]);
            })
                .then(function (vals) {
                strcmpr(vals[0], vals[1]).should.equal(0);
            })
                .should.notify(done);
        });
    }); // END of n3 to n3
    describe("n3 to n-triples", function () {
        // t7:
        // node ./data.js -in=t7.n3 -format=application/n-triples -out=,t7.nt
        // diff ,t7.nt t7-ref.nt
        var testHelper = new test_helper_1.TestHelper();
        it("Should load t7.n3 and write t7.nt, equivalent to t7-ref.nt", function (done) {
            testHelper.loadFile("t7.n3").should.eventually.be.fulfilled
                .then(function () {
                var lit = $rdf.literal(testHelper.base + "t7.n3");
                testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined;
                return testHelper.outputFile(",t7.nt", "application/n-triples");
            })
                .then(function () {
                return Promise.all([
                    fs.readFile("tests/serialize/sample_files/,t7.nt", "utf8"),
                    fs.readFile("tests/serialize/sample_files/t7-ref.nt", "utf8")
                ]);
            })
                .then(function (vals) {
                strcmpr(vals[0], vals[1]).should.equal(0);
            })
                .should.notify(done);
        });
    }); // END n3 to n-triples 
    // As mentioned in the makefile the n-quad includes the time of insertion
    // of the data so it cant be reporduced. Also it is not guaranteed the collision
    // on the names of the blank nodes.
    describe.skip("n3 to n-quads", function () {
        // t8:
        // node ./data.js -in=t5.n3  -format=application/n-quads -dump=,t8.nq
        // diff ,t8.nq t8-ref.nq
        var testHelper = new test_helper_1.TestHelper();
        it("Should load t5.n3 and write t8.nq, equivalent to t8-ref.nq", function (done) {
            testHelper.loadFile("t5.n3").should.eventually.be.fulfilled
                .then(function () {
                var lit = $rdf.literal(testHelper.base + "t5.n3");
                testHelper.kb.statementsMatching(undefined, undefined, lit).should.not.be.undefined;
                return testHelper.outputFile(",t8.nq", "application/n-quads");
            })
                .then(function () {
                return testHelper.dump(",t8.nq");
            })
                .then(function () {
                return Promise.all([
                    fs.readFile("tests/serialize/sample_files/,t8.nq", "utf8"),
                    fs.readFile("tests/serialize/sample_files/t8-ref.nq", "utf8")
                ]);
            })
                .then(function (vals) {
                var diff = jsdiff.diffChars(vals[0], vals[1]);
                diff.forEach(function (part) {
                    var color = part.added ? 'green' :
                        part.removed ? 'red' : 'grey';
                    process.stderr.write(part.value[color]);
                });
                strcmpr(vals[0], vals[1]).should.equal(0);
            })
                .should.notify(done);
        });
    }); // END n3 to n-quads 
});
