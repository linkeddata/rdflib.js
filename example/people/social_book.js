/**
 * Copyright (c) 2012 Henry Story
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */


// For quick access to those namespaces:
var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/")
var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#")
var OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#")
var DC = $rdf.Namespace("http://purl.org/dc/elements/1.1/")
var RSS = $rdf.Namespace("http://purl.org/rss/1.0/")
var XSD = $rdf.Namespace("http://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#dt-")
var CONTACT = $rdf.Namespace("http://www.w3.org/2000/10/swap/pim/contact#")


var graphs = {}

var cardTemplate = ""

function initialize() {
    cardTemplate = $("#user_wrapper").clone()

}

function card(who,kb) {
    var newCard = cardTemplate.clone()

    function removeProtocol(uri) {
        var parts= uri.split(":")
        if (parts.length > 1) return parts[1]
        else return uri
    }

    var query = "PREFIX contact:  <http://www.w3.org/2000/10/swap/pim/contact#> \n"+
        "SELECT ?city ?country ?postcode ?street \n"+
        "WHERE {\n"+
        "  "+who+" contact:home ?h . \n" +
        "  ?h contact:address ?addr  . \n"+
        "  OPTIONAL { ?addr contact:city ?city . } \n"+
        "  OPTIONAL { ?addr contact:country ?country . } \n"+
        "  OPTIONAL { ?addr contact:postalCode ?postcode . } \n"+
        "  OPTIONAL { ?addr contact:street ?street . } \n"+
        "}";

    var eq = $rdf.SPARQLToQuery(query,false,kb)
    var onresult = function(result) {
        function ifE(name) {
            var res = result[name]
            if (res) return res + "<br>"
            else return " "
        }
        var addr = ifE("?street")+ifE("?postcode")+ifE("?city")+ifE("?country")
        $("#user_wrapper .address .user_info_input").html(addr)
    }
    var onDone  = function() {   }

    kb.query(eq,onresult,undefined,onDone)

    var image = kb.any(who, FOAF('img'));
    if (!image) image = kb.any(who, FOAF('depiction'));
    if (image) newCard.find(".depiction").attr("src",image.uri)

    var nam = kb.any(who, FOAF('name'));
    if (!nam) { nam = "???";}
    newCard.find(".name").text(nam.value)

    var nick = kb.any(who, FOAF('nick'));
    newCard.find(".nickname").text(nick.value)

    var mbox = kb.any(who, FOAF('mbox'));
    if (mbox) {
        var email_el = newCard.find(".email .user_info_input")
        email_el.text(removeProtocol(mbox.uri))
        email_el.attr("href",mbox.uri)
    }

    var phone = kb.any(who, FOAF('phone'));
    if (phone) {
        var phone_el = newCard.find(".phone .user_info_input")
        phone_el.text(removeProtocol(phone.uri))
        phone_el.attr("href",phone.uri)
    }

    var bday = kb.any(who, FOAF('birthday'));
    if (bday) {

    }
    $("#user_wrapper").replaceWith(newCard)
}




// TestStore implementation from dig.csail.mit.edu/2005/ajar/ajaw/test/rdf/rdfparser.test.html
// RDFIndexedFormula from dig.csail.mit.edu/2005/ajar/ajaw/rdf/identity.js
//  (extends RDFFormula from dig.csail.mit.edu/2005/ajar/ajaw/rdf/term.js which has no indexing and smushing)
// for the real implementation used by Tabulator which uses indexing and smushing

// var kb = new TestStore()



var uri = 'http://bblfish.net/people/henry/card#me';

function friends (person,kb,col) {
    var panel = "#panel"+col
    var friends = kb.each(person, FOAF('knows'));
    var i, n = friends.length, friend;
    var lis = "";

    for (i = 0; i < n; i++) {
        friend = friends[i];
        var name = kb.any(friend, FOAF('name'))
        if (!name) {
            name = friend.uri
        }
        lis +=  "<span class='listing_user' href='" + friend.uri + "'>" + name + "</span><br>"
    }
    $(panel).html(lis)
    $(panel+" span").bind('click',function() {
        redraw($(this).attr("href"),col)
        return false
    })
}

function redraw(webid, col) {
    if (!col) col = 0
    var person = $rdf.sym(webid);
    var docURI = webid.slice(0, webid.indexOf('#'));
    var kb = graphs[docURI]
    if (!kb) {
        kb = graphs[docURI] = new $rdf.IndexedFormula();
    }
    var fetch = $rdf.fetcher(kb);
    fetch.crossSiteProxyTemplate="http://data.fm/proxy?uri="
    fetch.nowOrWhenFetched(docURI, undefined, function() {
        card(person,kb)
        friends(person,kb,col+1)
    });
}



