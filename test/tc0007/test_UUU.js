//     Serialization tests ...
//

var tc0007Passed = true;


var mainifest_uri = 'http://www.w3.org/2006/07/SWD/RDFa/testsuite/xhtml1-testcases/rdfa-xhtml1-test-manifest.rdf';
// var mainifest_uri = 'http://localhost/www.w3.org/2006/07/SWD/RDFa/testsuite/xhtml1-testcases/rdfa-xhtml1-test-manifest.rdf';

var TD = $rdf.Namespace('http://www.w3.org/2006/03/test-description#');
var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');

var base = 'http://dig.csail.mit.edu/hg/tabulator/raw-file/tip/chrome/content/test/tc0007/';

var kludgeForOfflineUse = function kludgeForOfflineUse(uri) {
    return uri; // comment out on planes
    return uri.replace('http://', 'http://localhost/');
}

function escapeForXML(str) {
    if (typeof str == 'undefined') return '@@@undefined@@@@';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

// HTTP get
//
// @@ param uri
// @@ Param callback takes (error, body)

var httpGetContents = function httpGetContents(uri,  callback) {
    uri = kludgeForOfflineUse(uri);
    var xhr = $rdf.Util.XMLHTTPFactory();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var success = (!xhr.status || (xhr.status >= 200 && xhr.status < 300));
            if (!success) {
                callback(false, "HTTP GET failed for <"+uri+"> status = "+
                xhr.status+", "+xhr.statusText+", body length = "+xhr.responseText.length);
            } else {
               callback(true, xhr.responseText);
            }    
        }
    }

    if(false) {
        try {
            $rdf.Util.enablePrivilege("UniversalBrowserRead")
        } catch(e) {
            alert("Failed to get privileges: " + e)
        }
    }
    
    xhr.open('GET', uri, true);  // async=true
    // xhr.setRequestHeader('Content-type', 'application/sparql-query');
    xhr.send();
}


function testTC0007(showDetails, callback) {
    var result = "";
    var expected = "";
    var failStyle = 'style="border: solid 2px red; padding: 1px 2px;"';
    var passStyle = 'style="border: solid 2px green; padding: 1px 2px;"';
    //var allResults = "<div><strong>Detailed Results:</strong></div>";
    var tests = [ ];
    
    callback(0, '<p>got here</p>');

    var meta = $rdf.graph();
    var fetcher = $rdf.fetcher(meta, undefined, false);
    fetcher.nowOrWhenFetched(kludgeForOfflineUse(mainifest_uri), undefined, function(error, body) {


        callback(0, "<p>Loaded <a href='"+escapeForXML(mainifest_uri)+"'>manifest</a></p>" );
        
 
        
        function loadDataAndRunTest(test, number){

            test.no = number;
            var xtitle = escapeForXML(meta.any(test, DC('title')).value);
            // callback(0, "<p>Loaded test: "+xtitle+"</p>");
            test.input = meta.any(test, TD('informationResourceInput'));
            test.expected =  meta.any(test, TD('informationResourceResults'));
            test.purpose = meta.any(test, TD('purpose')).value;
            
            var report = "<h2>" + xtitle + 
                    "</h2>\n<p>"+escapeForXML(test.purpose)+"</p>";

            test.inputData = test.expectedData = null;
            
            var tryTest = function() {
                if (test.inputData != null && test.expectedData != null) {
                    callback(0, "<hr><p>"+test.no+") <a href='"+test.uri+"'>"+xtitle+"</a></p>");
                    try {
                        var kb = $rdf.graph();
                        $rdf.parse(test.inputData, kb, base, 'application/rdfa');
                        callback(0, "<p>Parsed for test "+test.no+". "+
                        "<a href='"+test.input.uri+"'>Test data</a>:<pre>"+escapeForXML(test.inputData)+"</pre>"
                        +"<br/>Results:<pre>"
                        + escapeForXML(kb.toString()) +
                        "</pre></p><p><a href='"+test.expected.uri+"'>Expected SPARQL</a>: <pre>"+escapeForXML(test.expectedData)+"</pre></p>");

                    } catch(e) {

                        callback(1, "<p style='background-color: #fcc'>Exception for test "
                                +test.no+": "+e+'</p>')
                        if (typeof e == 'Object') {
                            var details = ""; 
                            for (var prop in e) {  
                               details += '' + prop+ ": '"+ e[prop]+ "';\n"; 
                            } 
                            callback(1, "<p style='background-color: #fcc'>Details:"+details+'</p>');
                        }
                    }

                }
            }
            // callback(0, "<p>"+escapeForXML(test.purpose)+"</p>");
            httpGetContents(test.input.uri, function(ok, body) {
                if (!ok) {
                    callback(1, "<p class='error'>Error getting input <"+test.input.uri+"> : "+
                        escapeForXML(body)+"</p>");
                } else {
                    test.inputData = body;
                    tryTest();
                }
            });
            
            httpGetContents(test.expected.uri, function(ok, body) {
                if (!ok) {
                    callback(1, "<p class='error'>Error getting expected <"+test.expected.uri+"> : "+
                        escapeForXML(body)+"</p>");
                } else {
                    test.expectedData = body;
                    tryTest();
                }
            });
            return;
        }; // loadDataAndRunTest
        
        
        // var cases = meta.each(undefined, RDF('type'), TD('TestCase'));
        var tests = meta.each(undefined, TD('reviewStatus'), TD('approved'));
        
        // Just try 1 for now
        loadDataAndRunTest(meta.sym(
        'http://www.w3.org/2006/07/SWD/RDFa/testsuite/xhtml1-testcases/Test0001'), 1);
        
        for(var i=0; i < tests.length; i++) loadDataAndRunTest(tests[i], i+1);

    
    });

}

function test0(){
	return true;
}