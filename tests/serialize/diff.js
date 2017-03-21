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
