var tcXXXXPassed = true;

function testTCXXXX(showDetails) {
	var result = "";
	var expected = "";
	var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"';
	var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"';
	var allResults = "<div><strong>Detailed Results:</strong></div>";
	var testTitles = [	"TITLE"
					 ];
	var expected =   [	true
					 ];
	var n = expected.length;
	var i=0;

	if(isOffline()) { // we're in off-line mode
		// use local test data
	}
	
	startBusy();
	for(i=0; i < n; i++) {
		allResults += "<h2>" + testTitles[i] + "</h2>";
		result = eval("test" + i + "()");
		if(result != expected[i]) {
			tcXXXXPassed = false;
			styleResult =  failStyle;
		}
		else {
			styleResult  =  passStyle;
		}
		allResults += "<p>EXPECTED: " + expected[i]+ "</p><p>RESULT: <span " + styleResult +">"+ result + "</p>";
	}
	stopBusy();
	if(showDetails) return allResults;
	else return tcXXXXPassed;
}		
	
function test0(){
	return true;
}