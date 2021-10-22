/**
 * Copyright (c) 2012 Henry Story
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */


// For quick access to namespace often used in foaf profiles
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

/**
 * run on initialization
 */
function initialize() {
    cardTemplate = $("#user_wrapper").clone()
    //todo: place the proxy default somewhere else ( where?) so it can be easy to configure
    $rdf.Fetcher.crossSiteProxyTemplate="http://data.fm/proxy?uri={uri}"
}

/**
 * render the card for the user identified by who as described in the graph/knowledge base kb
 */
function card(who,kb) {
    var newCard = cardTemplate.clone()

    /** mailboxes in foaf are usually written as <mailto:henry.story@bblfish.net> . This
     * function removes the 'mailto:' part, if it exists */
    function removeProtocol(uri) {
        if (uri && uri.termType === 'NamedNode') {
          var parts= uri.split(":")
          if (parts.length > 1) return parts[1]
          else return "unset"
        } else return uri
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

    var findFirst = function() {
        var obj = undefined
        var i=0
        while (!obj && i < arguments.length) {
            obj = kb.any(who, arguments[i++]);
        }
        return obj
    }

    var img = findFirst(FOAF('img'),FOAF('depiction'))
    var c = newCard.find(".depiction")
    if (img) c.attr("src",img.uri)
    else c.hide()

    var nam = findFirst(FOAF('name'))
    if (!nam) { nam = "???"}
    else nam = nam.value
    newCard.find(".name").text(nam)

    var nick = findFirst(FOAF('nick'));
    if (!nick) { nick = "" } else nick = nick.value
    newCard.find(".nickname").text(nick)

    var mbox = kb.any(who, FOAF('mbox'));
    var email_el = newCard.find(".email .user_info_input")
    if (mbox) {
        email_el.text(removeProtocol(mbox.uri))
        email_el.attr("href",mbox.uri)
    } else {
        email_el.hide()
    }

    var phone = kb.any(who, FOAF('phone'));
    var phone_el = newCard.find(".phone .user_info_input")
    if (phone) {
        phone_el.text(removeProtocol(phone.uri))
        phone_el.attr("href",phone.uri)
    } else {
        phone_el.hide()
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

/**
 * fill out the html template for the person identified by the WebID person as described in the knowledge
 * base kb, in column col of the explorer
 */
function friends (person,kb,col) {
    var panel = "#panel"+col
    var friends = kb.each(person, FOAF('knows'));
    var i, n = friends.length, friend;
    var lis = "";

    for (i = 0; i < n; i++) {
        friend = friends[i];
        if (friend && friend.termType === 'NamedNode') { //only show people with a WebID for the moment.
            var name = kb.any(friend, FOAF('name'))
            if (!name) {
                name = friend.uri
            }
            lis += "<span class='listing_user' href='" + friend.uri + "'>" + name + "</span><br>"
        }
    }
    for (var i=col+1; i<=3;i++) {
        $("#panel"+i).empty()
    }
    $(panel).html(lis)
    $(panel+" span").bind('click',function() {
        redraw($(this).attr("href"),col)
        return false
    })
}

/**
 *  redraw the screen when the selected user identified by webid is pressed in
 *  explorer column col
 */
function redraw(webid, col) {
    if (!col) col = 0
    var person = $rdf.sym(webid);
    var indexOf = webid.indexOf('#');
    var docURI
    if (indexOf >= 0)
        docURI = webid.slice(0, indexOf)
    else  docURI = webid
    var kb = graphs[docURI]
    if (!kb) {
        //if the knowledge base was not initialised fetch info from the web (if need CORS go through CORS proxy)
        kb = graphs[docURI] = new $rdf.IndexedFormula();
        var fetch = $rdf.fetcher(kb);
        fetch.nowOrWhenFetched(docURI, undefined, function(ok, body) {
            // @@ check ok
            card(person,kb)
            friends(person,kb,col+1)
        });
    } else {  //this does not take into account ageing!
        card(person,kb)
        friends(person,kb,col+1)
    }

}



