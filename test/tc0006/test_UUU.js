var tc0006Passed = true;

var base = "http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0006/";

function escapeForXML(str) {
    if (typeof str == 'undefined') return '@@@undefined@@@@';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function testTC0006(showDetails) {
    var result = "";
    var expected = "";
    var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"';
    var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"';
    var allResults = "<div><strong>Detailed Results:</strong></div>";
    var tests = [ ];

    tests.push({
        'title': "Nested bnodes"
        'input': """  :Fred :knows [ :name [ :first "Alice"; :second "Bill" ]]. """  
    });
    
    
    for(var i=0; i < tests.length; i++) {
        var test = tests[i];
        allResults += "<h2>" + test.title + "</h2>";
        var result;
        try {
            var kb = $rdf.graph();
            $rdf.parse(test.input, kb, base, 'text/n3');
            result = kb.toNT()
        } catch(e) {
            result = "Runtime exception: "+e;
        }
        if(result != test.expected) {
                tc0006Passed = false;
                styleResult =  failStyle;
        }
        else {
                styleResult  =  passStyle;
        }
        allResults += "<p>EXPECTED: " + escapeForXML(expected[i])+ "</p><p>RESULT: <span " + styleResult +">"+ escapeForXML(result) + "</p>"; /// encode for XML!!
    }
    if(showDetails) return allResults;
    else return tc0006Passed;
}

function test0(){
	return true;
}