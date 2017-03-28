"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var test_helper_1 = require("./test-helper");
var helper = new test_helper_1.TestHelper();
helper.loadFile("t1.ttl").then(function (val) {
    console.log("done");
    process.exit();
});
