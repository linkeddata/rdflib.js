/*
 * jsdiff-cli
 * https://github.com/kelsadita/jsdiff-cli
 *
 * Copyright (c) 2013 Kalpesh Adhatrao
 * Licensed under the MIT license.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */
'use strict';

(function () {
  require('colors')
  var jsdiff = require('diff')
  var fs = require('fs')

  var args = process.argv.slice(2)
  var file1 = args[0]
  var file2 = args[1]

  var data1 = fs.readFileSync(file1, 'utf-8')
  var data2 = fs.readFileSync(file2, 'utf-8')

  var diff = jsdiff.diffChars(data1, data2)

  diff.forEach(function (part) {
    var color = part.added ? 'green'
      : part.removed ? 'red' : 'grey'

    process.stderr.write(part.value[color])
  })
  console.log()
  if (diff.length > 1) {
    process.exit(1)
  }
})()
