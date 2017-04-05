"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var $rdf = require("../../lib/index");
var fs = require("fs");
var Promise = require("bluebird");
/**
 * A helper class for manipulating files during tests
 *
 * @export
 * @class TestHelper
 */
var TestHelper = (function () {
    function TestHelper(folder) {
        this.testFolder = folder || "tests/serialize/sample_files/";
        this.kb = $rdf.graph();
        this.fetcher = $rdf.fetcher(this.kb);
        $rdf.fetcher(this.kb);
        this.contentType = 'text/turtle';
        this.base = 'file://' + this.reverseSlash(process.cwd()) + "/" + this.testFolder;
        this.targetDocument = $rdf.sym(this.base + 'stdin'); // defaul URI of test data
    }
    TestHelper.prototype.setBase = function (base) {
        this.base = $rdf.uri.join(base, this.base);
    };
    TestHelper.prototype.clear = function () {
        $rdf.BlankNode.nextId = 0;
        this.kb = $rdf.graph();
        this.fetcher = $rdf.fetcher(this.kb);
    };
    TestHelper.prototype.setFormat = function (format) {
        this.contentType = format;
    };
    /**
     * load a file and return a promise
     *
     * @param {any} file
     * @returns a promise
     *
     * @memberOf TestHelper
     */
    TestHelper.prototype.loadFile = function (file) {
        var _this = this;
        var document = $rdf.sym($rdf.uri.join(file, this.base));
        this.targetDocument = document;
        return new Promise(function (fulfill, reject) {
            _this.fetcher.nowOrWhenFetched(document, {}, function (ok, body, xhr) {
                if (ok) {
                    // console.log('Loaded  ' + document)
                    fulfill(this);
                }
                else {
                    check(ok, body, xhr ? xhr.status : undefined);
                    reject();
                }
            });
        });
    };
    TestHelper.prototype.outputFile = function (file, format) {
        var _this = this;
        if (format) {
            this.setFormat(format);
        }
        var out;
        if (!file) {
            console.log('Result: ' + out);
            return;
        }
        var doc = $rdf.sym($rdf.uri.join(file, this.base));
        if (doc.uri.slice(0, 7) !== 'file://') {
            console.log('Can only write files just now, sorry: ' + doc.uri);
        }
        var fileName = doc.uri.slice(7);
        fileName = fileName.slice(1);
        try {
            if (this.contentType !== 'application/ld+json') {
                out = $rdf.serialize(this.targetDocument, this.kb, this.targetDocument.uri, this.contentType);
                return new Promise(function (fulfilled, rejected) {
                    fs.writeFile(fileName, out, "utf8", function (err) {
                        if (err) {
                            console.log('Error writing file <' + file + '> :' + err);
                            rejected(err);
                        }
                        // console.log('Written ' + fileName)
                        fulfilled();
                    });
                });
            }
            else {
                return new Promise(function (resolve, reject) {
                    try {
                        $rdf.serialize(_this.targetDocument, _this.kb, _this.targetDocument.uri, _this.contentType, function (err, res) {
                            if (err)
                                reject(err);
                            else
                                resolve(res);
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                }).then(function (out) {
                    return new Promise(function (fulfilled, rejected) {
                        fs.writeFile(fileName, out, "utf8", function (err) {
                            if (err) {
                                console.log('Error writing file <' + file + '> :' + err);
                                rejected(err);
                            }
                            // console.log('Written ' + fileName)
                            fulfilled();
                        });
                    });
                });
            }
        }
        catch (e) {
            console.log('Error in serializer: ' + e + this.stackString(e));
        }
    };
    TestHelper.prototype.dump = function (file) {
        var doc = $rdf.sym($rdf.uri.join(file, this.base));
        $rdf.term();
        var out;
        try {
            out = $rdf.serialize(null, this.kb, this.targetDocument.uri, 'application/n-quads'); // whole store
        }
        catch (e) {
            console.log('Error in serializer: ' + e + this.stackString(e));
        }
        console.log(out);
        if (doc.uri.slice(0, 7) !== 'file://') {
            // console.log('Can only write files just now, sorry: ' + doc.uri)
        }
        var fileName = doc.uri.slice(7); //
        return new Promise(function (fulfill, reject) {
            fs.writeFile(fileName, out, function (err) {
                if (err) {
                    console.log('Error writing file <' + file + '> :' + err);
                    reject(err);
                }
                // console.log('Written ' + fileName)
                fulfill();
            });
        });
    };
    TestHelper.prototype.size = function () {
        console.log(this.kb.statements.length + ' triples');
    };
    TestHelper.prototype.version = function () {
        // console.log('rdflib built: ' + $rdf.buildTime)
    };
    TestHelper.prototype.stackString = function (e) {
        var str = '' + e + '\n';
        if (!e.stack) {
            return str + 'No stack available.\n';
        }
        var lines = e.stack.toString().split('\n');
        var toprint = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('ecmaunit.js') > -1) {
                // remove useless bit of traceback
                break;
            }
            if (line.charAt(0) === '(') {
                line = 'function' + line;
            }
            var chunks = line.split('@');
            toprint.push(chunks);
        }
        // toprint.reverse();  No - I prefer the latest at the top by the error message -tbl
        for (var i = 0; i < toprint.length; i++) {
            str += '  ' + toprint[i][1] + '\n    ' + toprint[i][0];
        }
        return str;
    };
    TestHelper.prototype.reverseSlash = function (str) {
        // this would uniform the kb in windows and linux but it's still breaking the fetcher so I can't run it.
        // I think it should be placed inside the fetcher before inserting the literal referring to the loaded file in the kb,
        // but remember that xhr on windows wants "file://folder"
        if (str[0] !== "/") {
            str = "/" + str;
        }
        return str = str.replace(/\\/g, "/");
    };
    return TestHelper;
}());
exports.TestHelper = TestHelper;
function check(ok, message, status) {
    if (!ok) {
        console.log('Failed ' + status + ': ' + message);
    }
}
