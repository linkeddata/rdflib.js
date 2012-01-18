/* Demo application for Addressbook 
 */
// Some From http://brondsema.net/blog/index.php/2006/11/25/javascript_rdfparser_from_tabulator


// For quick access to those namespaces:
var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/")
var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#")
var OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#")
var DC = $rdf.Namespace("http://purl.org/dc/elements/1.1/")
var RSS = $rdf.Namespace("http://purl.org/rss/1.0/")
var XSD = $rdf.Namespace("http://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#dt-")
var CONTACT = $rdf.Namespace("http://www.w3.org/2000/10/swap/pim/contact#")



function card(who,kb) {
    var snip = '<div>'
    var image = kb.any(who, FOAF('img'));
    if (!image) image = kb.any(who, FOAF('depiction'));
    if (image) {
        snip += '<img src="' + image.uri +'" align="right" height="100"/>';
    }
    var nam = kb.any(who, FOAF('name'));
    if (!nam) { nam = "???";}
    snip+="<h3> <a href='"+who.uri+"'>"+nam+"</a></h3>";

    nam = kb.any(who, FOAF('phone'));
    if (nam) {
        snip+="<p>"+nam+"</p>";
    }
    snip += "</div>"
    return snip
};




// TestStore implementation from dig.csail.mit.edu/2005/ajar/ajaw/test/rdf/rdfparser.test.html
// RDFIndexedFormula from dig.csail.mit.edu/2005/ajar/ajaw/rdf/identity.js
//  (extends RDFFormula from dig.csail.mit.edu/2005/ajar/ajaw/rdf/term.js which has no indexing and smushing)
// for the real implementation used by Tabulator which uses indexing and smushing

// var kb = new TestStore()



var uri = 'http://bblfish.net/people/henry/card#me';



function draw (person,kb) {
    $("#description").html(card(person,kb))
    $("#url").attr("value",person.uri)
    var friends = kb.each(person, FOAF('knows'));
    var i, n = friends.length, friend;
    var lis = "";

    for (i = 0; i < n; i++) {
        friend = friends[i];
        var names = kb.each(friend, FOAF('name'))
        if (names.length != 0) {
            lis += "<li><a href='" + friend.uri + "'>" + names[0] + "</a></li>"

        }
    }
    $("#foaf").html(lis)
    $("#foaf a").bind('click',function() {
        redraw($(this).attr("href"))
        return false
    })
}

function redraw(webid) {
    var kb = $rdf.graph();
    var person = $rdf.sym(webid);
    var docURI = uri.slice(0, uri.indexOf('#'));
    var fetch = $rdf.fetcher(kb);
    fetch.nowOrWhenFetched(docURI, undefined, function() { draw(person,kb) });
}





