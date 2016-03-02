// some utility functions used throughout the test cases detailed view
function viewSource (fileName, offlineMode) {
  $('#viewSourceCode').attr('disabled', 'disabled')
  $.ajax({
    url: fileName,
    dataType: 'script',
    success: function (data) {
      var cmdStyle = 'color: black; font-weight: bold; border-bottom: 1px solid #9f9f9f; padding: 0.1em; width:100%'
      var sourceStyle = 'position: static; top: 1em; left: 4em; -moz-box-shadow:0 0 6px rgba(0, 0, 0, 0.5); -moz-border-radius: 2px; padding: 0.1em; background: white; width:90%'
      var sourceCmd = "<div style='" + cmdStyle + "'><button id='closeSourceView'>close</button> " + fileName + '</div>'
      var sourceContent = "<div id='sourceView' style='" + sourceStyle + "'>" + sourceCmd + "<pre style='margin-left: 0.5em;'>" + escapeEntities(data) + '</pre></div>'
      if (offlineMode) $('#header').after(sourceContent)
      else $('#header').before(sourceContent)
    },
    error: function (msg) {
      alert("Can't display " + fileName)
    }
  })
}

function hideSource () {
  $('#sourceView').remove()
  $('#viewSourceCode').removeAttr('disabled')
}

function escapeEntities (text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function startBusy () {
  $('#header').after("<div id='busy'><img src='../img/busy.gif' width='32px' alt='busy /></div>")
}

function stopBusy () {
  $('#busy').remove()
}

function stackString (e) {
  var str = '' + e + '\n'
  if (!e.stack) {
    return str + 'No stack available.\n'
  }
  var lines = e.stack.toString().split('\n')
  var toprint = []
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    if (line.indexOf('ecmaunit.js') > -1) {
      // remove useless bit of traceback
      break
    }
    if (line.charAt(0) == '(') {
      line = 'function' + line
    }
    var chunks = line.split('@')
    toprint.push(chunks)
  }
  // toprint.reverse();  No - I prefer the latest at the top by the error message -tbl

  for (var i = 0; i < toprint.length; i++) {
    str += '  ' + toprint[i][1] + '\n    ' + toprint[i][0]
  }
  return str
}
