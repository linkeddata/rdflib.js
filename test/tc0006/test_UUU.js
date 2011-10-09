//     Serialization tests
//

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
        'title': "Nested bnodes",
        'input': ' :Fred :knows [ :name [ :first "Alice"; :second "Bill" ]]. ',
        'expected': '{_:n1 <http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0006/#first> "Alice" . _:n1 <http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0006/#second> "Bill" . _:n0 <http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0006/#name> _:n1 . <http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0006/#Fred> <http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0006/#knows> _:n0 .}'
    },
    {
        'title': "Looped bnodes",
        'input': ' _:a :knows [ :knows _:a ]. ',
        'expected': '{_:n3 <http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0006/#knows> _:n2 . _:n2 <http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0006/#knows> _:n3 .}'
    });
    
    
    for(var i=0; i < tests.length; i++) {
        var test = tests[i];
        allResults += "<h2>" + test.title + "</h2>";
        var result, expected;
        try {
            var kb = $rdf.graph();
            $rdf.parse(test.input, kb, base, 'text/n3');
            result = kb.toNT();
            result = result.replace(/\n/g, ' ').trim()
            expected = test.expected.replace(/\n/g, ' ').trim()
        } catch(e) {
            result = "Runtime exception: "+e;
        }
        if(result != expected) {
                for (var j=0; j<result.length; j++) {
                    if (result[j] != expected[j]) {
                        allResults += "Diff at "+j+": '"+(result[j])+"' ("+result.charCodeAt(j)+") vs '"
                                    +test.expected[j]+"' ("+expected.charCodeAt(j)+").";
                    }
                }
                
                tc0006Passed = false;
                styleResult =  failStyle;
        }
        else {
                styleResult  =  passStyle;
        }
        allResults += "<p>EXPECTED: ("+test.expected.length+") " + escapeForXML(test.expected)+ "</p><p>RESULT ("+result.length+"): <span " + styleResult +">"+ escapeForXML(result) + "</p>";
        
    }
    if(showDetails) return allResults;
    else return tc0006Passed;
}

function test0(){
	return true;
}