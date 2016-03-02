function fillTOC () {
  $('#toc').append("<div style='font-size: 80%; border-bottom: 1px solid #e6e6e6; margin-bottom: 5px'><a href='#main'>Overview</a></div>")
  $('.testcase h2').each(function () {
    var buffer = $(this).text()
    buffer = buffer.substring(0, buffer.indexOf(':'))
    $('#toc').append("<div style='font-size: 80%;'><a href='#sec" + buffer + "'>" + buffer + '</a></div>')
  })
}

function runAllTests () {
  setStatus('Running all tests ...')
  $('#main .testcase .runTest').each(function () {
    var scriptURI = $(this).attr('resource') // the URI of the test script to call
    var methodBase = $(this).parent().parent().parent().find("span[property='dcterms:identifier']").attr('content') // the test ID to construct the test method
    var outElement = $(this).parent().parent().parent().find('h2') // the HTML element for the results
    runTest(scriptURI, methodBase, outElement)
  })
}

function runTest (testTargetURI, testID, testOut) {
  var testTargetMethod = 'test' + testID

  $.ajax({
    url: testTargetURI,
    dataType: 'script',
    success: function (data) {
      setStatus('Running test with ' + testTargetMethod + '() in ' + testTargetURI)
      var overallResult = eval(testTargetMethod + '(false);')
      if (overallResult) testOut.css('color', 'green')
      else testOut.css('color', 'red')
      setStatus('Done.')
    },
    error: function (msg) {
      setStatus('Error running test: ' + msg)
      testOut.html("<span style='border: solid 2px #FF3;'>" + testTargetURI + ' NOT FOUND</span>')
    }
  })
}

function setStatus (msg) {
  $('#status').html(msg)
}
