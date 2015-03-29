/************************************************************
 *
 * Project: rdflib.js, originally part of Tabulator project
 *
 * File: web.js
 *
 * Description: contains functions for requesting/fetching/retracting
 *  This implements quite a lot of the web architecture.
 * A fetcher is bound to a specific knowledge base graph, into which
 * it loads stuff and into which it writes its metadata
 * @@ The metadata should be optionally a separate graph
 *
 * - implements semantics of HTTP headers, Internet Content Types
 * - selects parsers for rdf/xml, n3, rdfa, grddl
 *
 * Dependencies:
 *
 * needs: util.js uri.js term.js rdfparser.js rdfa.js n3parser.js
 *      identity.js sparql.js jsonparser.js
 *
 * If jQuery is defined, it uses jQuery.ajax, else is independent of jQuery
 *
 ************************************************************/

/**
 * Things to test: callbacks on request, refresh, retract
 *   loading from HTTP, HTTPS, FTP, FILE, others?
 * To do:
 * Firing up a mail client for mid:  (message:) URLs
 */

if (typeof module !== 'undefined' && module.require) { // Node 
// For non-node, jasonld needs to be inlined in init.js etc
    $rdf.jsonld = require('jsonld');
    N3 = require('n3');
    asyncLib = require('async');
}

$rdf.Fetcher = function(store, timeout, async) {
    this.store = store
    this.thisURI = "http://dig.csail.mit.edu/2005/ajar/ajaw/rdf/sources.js" + "#SourceFetcher" // -- Kenny
    this.timeout = timeout ? timeout : 30000
    this.async = async != null ? async : true
    this.appNode = this.store.bnode(); // Denoting this session
    this.store.fetcher = this; //Bi-linked
    this.requested = {}
    this.lookedUp = {}
    this.handlers = []
    this.mediatypes = {}
    var sf = this
    var kb = this.store;
    var ns = {} // Convenience namespaces needed in this module:
    // These are delibertely not exported as the user application should
    // make its own list and not rely on the prefixes used here,
    // and not be tempted to add to them, and them clash with those of another
    // application.
    ns.link = $rdf.Namespace("http://www.w3.org/2007/ont/link#");
    ns.http = $rdf.Namespace("http://www.w3.org/2007/ont/http#");
    ns.httph = $rdf.Namespace("http://www.w3.org/2007/ont/httph#");
    ns.rdf = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    ns.rdfs = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
    ns.dc = $rdf.Namespace("http://purl.org/dc/elements/1.1/");


    $rdf.Fetcher.crossSiteProxy = function(uri) {
        if ($rdf.Fetcher.crossSiteProxyTemplate)
          return $rdf.Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
        else return undefined;
    };
    $rdf.Fetcher.RDFXMLHandler = function(args) {
        if (args) {
            this.dom = args[0]
        }
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                //sf.addStatus(xhr.req, 'parsing soon as RDF/XML...');
                var kb = sf.store;
                if (!this.dom) this.dom = $rdf.Util.parseXML(xhr.responseText);
/*                {
                    var dparser;
                    if ((typeof tabulator != 'undefined' && tabulator.isExtension)) {
                        dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(Components.interfaces.nsIDOMParser);
                    } else {
                        dparser = new DOMParser()
                    }
                    //strange things happen when responseText is empty
                    this.dom = dparser.parseFromString(xhr.responseText, 'application/xml')
                }
*/
                var root = this.dom.documentElement;
                if (root.nodeName == 'parsererror') { //@@ Mozilla only See issue/issue110
                    sf.failFetch(xhr, "Badly formed XML in " + xhr.resource.uri); //have to fail the request
                    throw new Error("Badly formed XML in " + xhr.resource.uri); //@@ Add details
                }
                // Find the last URI we actual URI in a series of redirects
                // (xhr.resource.uri is the original one)
                var lastRequested = kb.any(xhr.req, ns.link('requestedURI'));
                if (!lastRequested) {
                    lastRequested = xhr.resource;
                } else {
                    lastRequested = kb.sym(lastRequested.value);
                }
                var parser = new $rdf.RDFParser(kb);
                // sf.addStatus(xhr.req, 'parsing as RDF/XML...');
                parser.parse(this.dom, lastRequested.uri, lastRequested);
                kb.add(lastRequested, ns.rdf('type'), ns.link('RDFDocument'), sf.appNode);
                cb();
            }
        }
    };
    $rdf.Fetcher.RDFXMLHandler.term = this.store.sym(this.thisURI + ".RDFXMLHandler");
    $rdf.Fetcher.RDFXMLHandler.toString = function() {
        return "RDFXMLHandler"
    };
    $rdf.Fetcher.RDFXMLHandler.register = function(sf) {
        sf.mediatypes['application/rdf+xml'] = {}
    };
    $rdf.Fetcher.RDFXMLHandler.pattern = new RegExp("application/rdf\\+xml");

    // This would much better use on-board XSLT engine. @@
    $rdf.Fetcher.doGRDDL = function(kb, doc, xslturi, xmluri) {
        sf.requestURI('http://www.w3.org/2005/08/' + 'online_xslt/xslt?' + 'xslfile=' + escape(xslturi) + '&xmlfile=' + escape(xmluri), doc)
    };

    $rdf.Fetcher.XHTMLHandler = function(args) {
        if (args) {
            this.dom = args[0]
        }
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                if (!this.dom) {
                    var dparser;
                    if (typeof tabulator != 'undefined' && tabulator.isExtension) {
                        dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(Components.interfaces.nsIDOMParser);
                    } else {
                        dparser = new DOMParser()
                    }
                    this.dom = dparser.parseFromString(xhr.responseText, 'application/xml')
                }
                var kb = sf.store;

                // dc:title
                var title = this.dom.getElementsByTagName('title')
                if (title.length > 0) {
                    kb.add(xhr.resource, ns.dc('title'), kb.literal(title[0].textContent), xhr.resource)
                    // $rdf.log.info("Inferring title of " + xhr.resource)
                }

                // link rel
                var links = this.dom.getElementsByTagName('link');
                for (var x = links.length - 1; x >= 0; x--) {
                    sf.linkData(xhr, links[x].getAttribute('rel'), links[x].getAttribute('href'));
                }

                //GRDDL
                var head = this.dom.getElementsByTagName('head')[0]
                if (head) {
                    var profile = head.getAttribute('profile');
                    if (profile && $rdf.uri.protocol(profile) == 'http') {
                        // $rdf.log.info("GRDDL: Using generic " + "2003/11/rdf-in-xhtml-processor.");
                         $rdf.Fetcher.doGRDDL(kb, xhr.resource, "http://www.w3.org/2003/11/rdf-in-xhtml-processor", xhr.resource.uri)
/*			sf.requestURI('http://www.w3.org/2005/08/'
					  + 'online_xslt/xslt?'
					  + 'xslfile=http://www.w3.org'
					  + '/2003/11/'
					  + 'rdf-in-xhtml-processor'
					  + '&xmlfile='
					  + escape(xhr.resource.uri),
				      xhr.resource)
                        */
                    } else {
                        // $rdf.log.info("GRDDL: No GRDDL profile in " + xhr.resource)
                    }
                }
                kb.add(xhr.resource, ns.rdf('type'), ns.link('WebPage'), sf.appNode);
                // Do RDFa here
                if ($rdf.rdfa && $rdf.rdfa.parse)
                    $rdf.rdfa.parse(this.dom, kb, xhr.resource.uri);
                cb(); // Fire done callbacks
            }
        }
    };
    $rdf.Fetcher.XHTMLHandler.term = this.store.sym(this.thisURI + ".XHTMLHandler");
    $rdf.Fetcher.XHTMLHandler.toString = function() {
        return "XHTMLHandler"
    };
    $rdf.Fetcher.XHTMLHandler.register = function(sf) {
        sf.mediatypes['application/xhtml+xml'] = {
            'q': 0.3
        }
    };
    $rdf.Fetcher.XHTMLHandler.pattern = new RegExp("application/xhtml");


    /******************************************************/

    $rdf.Fetcher.XMLHandler = function() {
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                var kb = sf.store
                var dparser;
                if (typeof tabulator != 'undefined' && tabulator.isExtension) {
                    dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(Components.interfaces.nsIDOMParser);
                } else {
                    dparser = new DOMParser()
                }
                var dom = dparser.parseFromString(xhr.responseText, 'application/xml')

                // XML Semantics defined by root element namespace
                // figure out the root element
                for (var c = 0; c < dom.childNodes.length; c++) {
                    // is this node an element?
                    if (dom.childNodes[c].nodeType == 1) {
                        // We've found the first element, it's the root
                        var ns = dom.childNodes[c].namespaceURI;

                        // Is it RDF/XML?
                        if (ns != undefined && ns == ns['rdf']) {
                            sf.addStatus(xhr.req, "Has XML root element in the RDF namespace, so assume RDF/XML.")
                            sf.switchHandler('RDFXMLHandler', xhr, cb, [dom])
                            return
                        }
                        // it isn't RDF/XML or we can't tell
                        // Are there any GRDDL transforms for this namespace?
                        // @@ assumes ns documents have already been loaded
                        var xforms = kb.each(kb.sym(ns), kb.sym("http://www.w3.org/2003/g/data-view#namespaceTransformation"));
                        for (var i = 0; i < xforms.length; i++) {
                            var xform = xforms[i];
                            // $rdf.log.info(xhr.resource.uri + " namespace " + ns + " has GRDDL ns transform" + xform.uri);
                             $rdf.Fetcher.doGRDDL(kb, xhr.resource, xform.uri, xhr.resource.uri);
                        }
                        break
                    }
                }

                // Or it could be XHTML?
                // Maybe it has an XHTML DOCTYPE?
                if (dom.doctype) {
                    // $rdf.log.info("We found a DOCTYPE in " + xhr.resource)
                    if (dom.doctype.name == 'html' && dom.doctype.publicId.match(/^-\/\/W3C\/\/DTD XHTML/) && dom.doctype.systemId.match(/http:\/\/www.w3.org\/TR\/xhtml/)) {
                        sf.addStatus(xhr.req,"Has XHTML DOCTYPE. Switching to XHTML Handler.\n")
                        sf.switchHandler('XHTMLHandler', xhr, cb)
                        return
                    }
                }

                // Or what about an XHTML namespace?
                var html = dom.getElementsByTagName('html')[0]
                if (html) {
                    var xmlns = html.getAttribute('xmlns')
                    if (xmlns && xmlns.match(/^http:\/\/www.w3.org\/1999\/xhtml/)) {
                        sf.addStatus(xhr.req, "Has a default namespace for " + "XHTML. Switching to XHTMLHandler.\n")
                        sf.switchHandler('XHTMLHandler', xhr, cb)
                        return
                    }
                }

                // At this point we should check the namespace document (cache it!) and
                // look for a GRDDL transform
                // @@  Get namespace document <n>, parse it, look for  <n> grddl:namespaceTransform ?y
                // Apply ?y to   dom
                // We give up. What dialect is this?
                sf.failFetch(xhr, "Unsupported dialect of XML: not RDF or XHTML namespace, etc.\n"+xhr.responseText.slice(0,80));
            }
        }
    };
    $rdf.Fetcher.XMLHandler.term = this.store.sym(this.thisURI + ".XMLHandler");
    $rdf.Fetcher.XMLHandler.toString = function() {
        return "XMLHandler"
    };
    $rdf.Fetcher.XMLHandler.register = function(sf) {
        sf.mediatypes['text/xml'] = {
            'q': 0.2
        }
        sf.mediatypes['application/xml'] = {
            'q': 0.2
        }
    };
    $rdf.Fetcher.XMLHandler.pattern = new RegExp("(text|application)/(.*)xml");

    $rdf.Fetcher.HTMLHandler = function() {
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                var rt = xhr.responseText
                // We only handle XHTML so we have to figure out if this is XML
                // $rdf.log.info("Sniffing HTML " + xhr.resource + " for XHTML.");

                if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
                    sf.addStatus(xhr.req, "Has an XML declaration. We'll assume " +
                        "it's XHTML as the content-type was text/html.\n")
                    sf.switchHandler('XHTMLHandler', xhr, cb)
                    return
                }

                // DOCTYPE
                // There is probably a smarter way to do this
                if (rt.match(/.*<!DOCTYPE\s+html[^<]+-\/\/W3C\/\/DTD XHTML[^<]+http:\/\/www.w3.org\/TR\/xhtml[^<]+>/)) {
                    sf.addStatus(xhr.req, "Has XHTML DOCTYPE. Switching to XHTMLHandler.\n")
                    sf.switchHandler('XHTMLHandler', xhr, cb)
                    return
                }

                // xmlns
                if (rt.match(/[^(<html)]*<html\s+[^<]*xmlns=['"]http:\/\/www.w3.org\/1999\/xhtml["'][^<]*>/)) {
                    sf.addStatus(xhr.req, "Has default namespace for XHTML, so switching to XHTMLHandler.\n")
                    sf.switchHandler('XHTMLHandler', xhr, cb)
                    return
                }


                // dc:title	                       //no need to escape '/' here
                var titleMatch = (new RegExp("<title>([\\s\\S]+?)</title>", 'im')).exec(rt);
                if (titleMatch) {
                    var kb = sf.store;
                    kb.add(xhr.resource, ns.dc('title'), kb.literal(titleMatch[1]), xhr.resource); //think about xml:lang later
                    kb.add(xhr.resource, ns.rdf('type'), ns.link('WebPage'), sf.appNode);
                    cb(); //doneFetch, not failed
                    return;
                }

                sf.failFetch(xhr, "Sorry, can't yet parse non-XML HTML")
            }
        }
    };
    $rdf.Fetcher.HTMLHandler.term = this.store.sym(this.thisURI + ".HTMLHandler");
    $rdf.Fetcher.HTMLHandler.toString = function() {
        return "HTMLHandler"
    };
    $rdf.Fetcher.HTMLHandler.register = function(sf) {
        sf.mediatypes['text/html'] = {
            'q': 0.3
        }
    };
    $rdf.Fetcher.HTMLHandler.pattern = new RegExp("text/html");

    /***********************************************/

    $rdf.Fetcher.TextHandler = function() {
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                // We only speak dialects of XML right now. Is this XML?
                var rt = xhr.responseText

                // Look for an XML declaration
                if (rt.match(/\s*<\?xml\s+version\s*=[^<>]+\?>/)) {
                    sf.addStatus(xhr.req, "Warning: "+xhr.resource + " has an XML declaration. We'll assume "
                        + "it's XML but its content-type wasn't XML.\n")
                    sf.switchHandler('XMLHandler', xhr, cb)
                    return
                }

                // Look for an XML declaration
                if (rt.slice(0, 500).match(/xmlns:/)) {
                    sf.addStatus(xhr.req, "May have an XML namespace. We'll assume "
                            + "it's XML but its content-type wasn't XML.\n")
                    sf.switchHandler('XMLHandler', xhr, cb)
                    return
                }

                // We give up finding semantics - this is not an error, just no data
                sf.addStatus(xhr.req, "Plain text document, no known RDF semantics.");
                sf.doneFetch(xhr, [xhr.resource.uri]);
//                sf.failFetch(xhr, "unparseable - text/plain not visibly XML")
//                dump(xhr.resource + " unparseable - text/plain not visibly XML, starts:\n" + rt.slice(0, 500)+"\n")

            }
        }
    };
    $rdf.Fetcher.TextHandler.term = this.store.sym(this.thisURI + ".TextHandler");
    $rdf.Fetcher.TextHandler.toString = function() {
        return "TextHandler";
    };
    $rdf.Fetcher.TextHandler.register = function(sf) {
        sf.mediatypes['text/plain'] = {
            'q': 0.1
        }
    }
    $rdf.Fetcher.TextHandler.pattern = new RegExp("text/plain");

    /***********************************************/

    $rdf.Fetcher.N3Handler = function() {
        this.handlerFactory = function(xhr) {
            xhr.handle = function(cb) {
                // Parse the text of this non-XML file
                $rdf.log.debug("web.js: Parsing as N3 " + xhr.resource.uri); // @@@@ comment me out
                //sf.addStatus(xhr.req, "N3 not parsed yet...")
                var rt = xhr.responseText
                var p = $rdf.N3Parser(kb, kb, xhr.resource.uri, xhr.resource.uri, null, null, "", null)
                //                p.loadBuf(xhr.responseText)
                try {
                    p.loadBuf(xhr.responseText)

                } catch (e) {
                    var msg = ("Error trying to parse " + xhr.resource + " as Notation3:\n" + e +':\n'+e.stack)
                    // dump(msg+"\n")
                    sf.failFetch(xhr, msg)
                    return;
                }

                sf.addStatus(xhr.req, "N3 parsed: " + p.statementCount + " triples in " + p.lines + " lines.")
                sf.store.add(xhr.resource, ns.rdf('type'), ns.link('RDFDocument'), sf.appNode);
                args = [xhr.resource.uri]; // Other args needed ever?
                sf.doneFetch(xhr, args)
            }
        }
    };
    $rdf.Fetcher.N3Handler.term = this.store.sym(this.thisURI + ".N3Handler");
    $rdf.Fetcher.N3Handler.toString = function() {
        return "N3Handler";
    }
    $rdf.Fetcher.N3Handler.register = function(sf) {
        sf.mediatypes['text/n3'] = {
            'q': '1.0'
        } // as per 2008 spec
        sf.mediatypes['application/x-turtle'] = {
            'q': 1.0
        } // pre 2008
        sf.mediatypes['text/turtle'] = {
            'q': 1.0
        } // pre 2008
    }
    $rdf.Fetcher.N3Handler.pattern = new RegExp("(application|text)/(x-)?(rdf\\+)?(n3|turtle)")

    /***********************************************/

    $rdf.Util.callbackify(this, ['request', 'recv', 'headers', 'load', 'fail', 'refresh', 'retract', 'done']);

    this.addProtocol = function(proto) {
        sf.store.add(sf.appNode, ns.link("protocol"), sf.store.literal(proto), this.appNode)
    }

    this.addHandler = function(handler) {
        sf.handlers.push(handler)
        handler.register(sf)
    }

    this.switchHandler = function(name, xhr, cb, args) {
        var kb = this.store; var handler = null;
        for (var i=0; i<this.handlers.length; i++) {
            if (''+this.handlers[i] == name) {
                handler = this.handlers[i];
            }
        }
        if (handler == undefined) {
            throw 'web.js: switchHandler: name='+name+' , this.handlers ='+this.handlers+'\n' +
                    'switchHandler: switching to '+handler+'; sf='+sf +
                    '; typeof $rdf.Fetcher='+typeof $rdf.Fetcher +
                    ';\n\t $rdf.Fetcher.HTMLHandler='+$rdf.Fetcher.HTMLHandler+'\n' +
                    '\n\tsf.handlers='+sf.handlers+'\n'
        }
        (new handler(args)).handlerFactory(xhr);
        xhr.handle(cb)
    }

    this.addStatus = function(req, status) {
        //<Debug about="parsePerformance">
        var now = new Date();
        status = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "." + now.getMilliseconds() + "] " + status;
        //</Debug>
        var kb = this.store
        var s = kb.the(req, ns.link('status'));
        if (s && s.append) {
            s.append(kb.literal(status));
        } else {
            $rdf.log.warn("web.js: No list to add to: " + s + ',' + status); // @@@
        };
    }

    // Record errors in the system on failure
    // Returns xhr so can just do return this.failfetch(...)
    this.failFetch = function(xhr, status) {
        this.addStatus(xhr.req, status)
        kb.add(xhr.resource, ns.link('error'), status)
        this.requested[$rdf.uri.docpart(xhr.resource.uri)] = false
        if (xhr.userCallback) {
            xhr.userCallback(false, "Fetch of <" + xhr.resource.uri + "> failed: "+status, xhr)
        };
        this.fireCallbacks('fail', [xhr.requestedURI, status])
        xhr.abort()
        return xhr
    }

    this.linkData = function(xhr, rel, uri) {
        var x = xhr.resource;
        if (!uri) return;
        // See http://www.w3.org/TR/powder-dr/#httplink for describedby 2008-12-10
        if (rel == 'alternate' || rel == 'seeAlso' || rel == 'meta' || rel == 'describedby') {
            // var join = $rdf.uri.join2;   // doesn't work, now a method of rdf.uri
            var obj = kb.sym($rdf.uri.join(uri, xhr.resource.uri))
            if (obj.uri != xhr.resource) {
                kb.add(xhr.resource, ns.rdfs('seeAlso'), obj, xhr.resource);
                // $rdf.log.info("Loading " + obj + " from link rel in " + xhr.resource);
            }
        }
    };

    this.doneFetch = function(xhr, args) {
        this.addStatus(xhr.req, 'Done.')
        // $rdf.log.info("Done with parse, firing 'done' callbacks for " + xhr.resource)
        this.requested[xhr.resource.uri] = 'done'; //Kenny
        if (xhr.userCallback) {
            xhr.userCallback(true, undefined, xhr);
        };
        this.fireCallbacks('done', args)
    }

    this.store.add(this.appNode, ns.rdfs('label'), this.store.literal('This Session'), this.appNode);

    ['http', 'https', 'file', 'chrome'].map(this.addProtocol); // ftp? mailto:?
    [$rdf.Fetcher.RDFXMLHandler, $rdf.Fetcher.XHTMLHandler, $rdf.Fetcher.XMLHandler, $rdf.Fetcher.HTMLHandler, $rdf.Fetcher.TextHandler, $rdf.Fetcher.N3Handler ].map(this.addHandler)



    /** Note two nodes are now smushed
     **
     ** If only one was flagged as looked up, then
     ** the new node is looked up again, which
     ** will make sure all the URIs are dereferenced
     */
    this.nowKnownAs = function(was, now) {
        if (this.lookedUp[was.uri]) {
            if (!this.lookedUp[now.uri]) this.lookUpThing(now, was) //  @@@@  Transfer userCallback
        } else if (this.lookedUp[now.uri]) {
            if (!this.lookedUp[was.uri]) this.lookUpThing(was, now)
        }
    }





    // Looks up something.
    //
    // Looks up all the URIs a things has.
    // Parameters:
    //
    //  term:       canonical term for the thing whose URI is to be dereferenced
    //  rterm:      the resource which refered to this (for tracking bad links)
    //  force:      Load the data even if loaded before
    //  oneDone:   is called as callback(ok, errorbody, xhr) for each one
    //  allDone:   is called as callback(ok, errorbody) for all of them
    // Returns      the number of things looked up
    //
    this.lookUpThing = function(term, rterm, force, oneDone, allDone) {
        var uris = kb.uris(term) // Get all URIs
        var success = true;
        var errors = '';
        var outstanding = {};

        if (typeof uris !== 'undefined') {
            for (var i = 0; i < uris.length; i++) {
                var u = uris[i];
                outstanding[u] = true;
                this.lookedUp[u] = true;
                var sf = this;

                var requestOne = function requestOne(u1){
                    sf.requestURI($rdf.uri.docpart(u1), rterm, force, function(ok, body, xhr){
                        if (ok) {
                            if (oneDone) oneDone(true, u1);
                        } else {
                            if (oneDone) oneDone(false, body);
                            success = false;
                            errors += body + '\n';
                        };
                        delete outstanding[u];
                        for (x in outstanding) return;
                        if (allDone) allDone(success, errors);
                    });
                };
                requestOne(u);
            }
        }
        return uris.length
    }


    /*  Ask for a doc to be loaded if necessary then call back
    **
    ** Changed 2013-08-20:  Added (ok, body) params to callback
    **
    **/
    this.nowOrWhenFetched = function(uri, referringTerm, userCallback) {
        // Sanitize URI (remove #fragment)
        uri = (uri.indexOf('#') >= 0)?uri.slice(0, uri.indexOf('#')):uri;
        var sta = this.getState(uri);
        if (sta == 'fetched') return userCallback(true);

        // If it is 'failed', then shoulkd we try again?  I think so so an old error doens't get stuck
        //if (sta == 'unrequested')
        this.requestURI(uri, referringTerm, false, userCallback);
    }



    // Look up response header
    //
    // Returns: a list of header values found in a stored HTTP response
    //      or [] if response was found but no header found
    //      or undefined if no response is available.
    //
    this.getHeader = function(doc, header) {
        var kb = this.store;
        var requests = kb.each(undefined, ns.link("requestedURI"), doc.uri);
        for (var r=0; r<requests.length; r++) {
            var request = requests[r];
            if (request !== undefined) {
                var response = kb.any(request, ns.link("response"));
                if (request !== undefined) {
                    var results = kb.each(response, ns.httph(header.toLowerCase()));
                    if (results.length) {
                        return results.map(function(v){return v.value});
                    }
                    return [];
                }
            }
        }
        return undefined;
    };

    this.proxyIfNecessary = function(uri) {
        if (typeof tabulator != 'undefined' && tabulator.isExtension) return uri; // Extenstion does not need proxy
                        // browser does 2014 on as https browser script not trusted
        if ($rdf.Fetcher.crossSiteProxyTemplate && document && document.location
			&& ('' + document.location).slice(0,6) === 'https:'
                && uri.slice(0,5) === 'http:') {
              return $rdf.Fetcher.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
        }
        return uri;
    };
    
     
    this.saveRequestMetadata = function(xhr, kb, docuri) {
        var request = kb.bnode();
        xhr.resource = $rdf.sym(docuri);

        xhr.req = request;
        var now = new Date();
        var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
        kb.add(request, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + docuri), this.appNode);
        kb.add(request, ns.link("requestedURI"), kb.literal(docuri), this.appNode);

        kb.add(request, ns.link('status'), kb.collection(), this.appNode);
        return request;
    };
       
    this.saveResponseMetadata = function(xhr, kb) {
        var response = kb.bnode();

        kb.add(xhr.req, ns.link('response'), response);
        kb.add(response, ns.http('status'), kb.literal(xhr.status), response);
        kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response);

        xhr.headers = {}
        if ($rdf.uri.protocol(xhr.resource.uri) == 'http' || $rdf.uri.protocol(xhr.resource.uri) == 'https') {
            xhr.headers = $rdf.Util.getHTTPHeaders(xhr)
            for (var h in xhr.headers) { // trim below for Safari - adds a CR!
                kb.add(response, ns.httph(h.toLowerCase()), xhr.headers[h].trim(), response)
            }
        }
        return response;
    };
    

    /** Requests a document URI and arranges to load the document.
     ** Parameters:
     **	    term:  term for the thing whose URI is to be dereferenced
     **      rterm:  the resource which refered to this (for tracking bad links)
     **      force:  Load the data even if loaded before
     **      userCallback:  Called with (true) or (false, errorbody) after load is done or failed
     ** Return value:
     **	    The xhr object for the HTTP access
     **      null if the protocol is not a look-up protocol,
     **              or URI has already been loaded
     */
    this.requestURI = function(docuri, rterm, force, userCallback) { //sources_request_new
        if (docuri.indexOf('#') >= 0) { // hash
            throw ("requestURI should not be called with fragid: " + docuri);
        }

        var pcol = $rdf.uri.protocol(docuri);
        if (pcol == 'tel' || pcol == 'mailto' || pcol == 'urn') return null; // No look-up operation on these, but they are not errors
        var force = !! force
        var kb = this.store
        var args = arguments
        var docterm = kb.sym(docuri)
        if (!force && typeof(this.requested[docuri]) != "undefined") {
            return null
        }

        this.fireCallbacks('request', args); //Kenny: fire 'request' callbacks here
        // dump( "web.js: Requesting uri: " + docuri + "\n" );
        this.requested[docuri] = true

        if (rterm) {
            if (rterm.uri) { // A link betwen URIs not terms
                kb.add(docterm.uri, ns.link("requestedBy"), rterm.uri, this.appNode)
            }
        }

        if (rterm) {
            // $rdf.log.info('SF.request: ' + docuri + ' refd by ' + rterm.uri)
        }
        else {
            // $rdf.log.info('SF.request: ' + docuri + ' no referring doc')
        };


        var useJQuery = typeof jQuery != 'undefined';
        if (!useJQuery) {
            var xhr = $rdf.Util.XMLHTTPFactory();
            var req = xhr.req = kb.bnode();
            xhr.resource = docterm;
            xhr.requestedURI = args[0];
        } else {
            var req = kb.bnode(); 
        }
        var requestHandlers = kb.collection();
        var sf = this;

        var now = new Date();
        var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";

        kb.add(req, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + docuri), this.appNode)
        kb.add(req, ns.link("requestedURI"), kb.literal(docuri), this.appNode)
        kb.add(req, ns.link('status'), kb.collection(), this.appNode)

        // This should not be stored in the store, but in the JS data
        /*
        if (typeof kb.anyStatementMatching(this.appNode, ns.link("protocol"), $rdf.uri.protocol(docuri)) == "undefined") {
            // update the status before we break out
            this.failFetch(xhr, "Unsupported protocol: "+$rdf.uri.protocol(docuri))
            return xhr
        }
        */

        var onerrorFactory = function(xhr) { return function(event) {
            if ($rdf.Fetcher.crossSiteProxyTemplate && document && document.location && !xhr.proxyUsed) { // In mashup situation
                var hostpart = $rdf.uri.hostpart;
                var here = '' + document.location;
                var uri = xhr.resource.uri
                if (hostpart(here) && hostpart(uri) && hostpart(here) != hostpart(uri)) {
                    if (xhr.status === 401 || xhr.status === 403 || xhr.status === 404) {
                        onreadystatechangeFactory(xhr)();
                    } else {
                        newURI = $rdf.Fetcher.crossSiteProxy(uri);
                        sf.addStatus(xhr.req, "BLOCKED -> Cross-site Proxy to <" + newURI + ">");
                        if (xhr.aborted) return;

                        var kb = sf.store;
                        var oldreq = xhr.req;
                        kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), oldreq);


                        ////////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate of what will be done by requestURI below
                        /* var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                        kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req);

                        var now = new Date();
                        var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
                        kb.add(newreq, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                        kb.add(newreq, ns.link('status'), kb.collection(), this.appNode);
                        kb.add(newreq, ns.link("requestedURI"), kb.literal(newURI), this.appNode);

                        var response = kb.bnode();
                        kb.add(oldreq, ns.link('response'), response);
                        */
                        // kb.add(response, ns.http('status'), kb.literal(xhr.status), response);
                        // if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                        xhr.abort()
                        xhr.aborted = true

                        sf.addStatus(oldreq, 'done - redirected') // why
                        //the callback throws an exception when called from xhr.onerror (so removed)
                        //sf.fireCallbacks('done', args) // Are these args right? @@@   Noit done yet! done means success
                        sf.requested[xhr.resource.uri] = 'redirected';

                        var xhr2 = sf.requestURI(newURI, xhr.resource, force, userCallback);
                        xhr2.proxyUsed = true; //only try the proxy once

                        if (xhr2 && xhr2.req) {
                            kb.add(xhr.req,
                                kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                                xhr2.req,
                                sf.appNode);
                            return;
                        }
                    }
                }
            } else {
                if (xhr.withCredentials) {
                    console.log("@@ Retrying with no credentials for " + xhr.resource)
                    xhr.abort();
                    xhr.withCredentials = false;
                    sf.addStatus(xhr.req, "Credentials SUPPRESSED to see if that helps");
                    xhr.send(); // try again
                } else {
                    sf.failFetch(xhr, "XHR Error: "+event); // Alas we get no error message
                }
            }
        }; }

        // Set up callbacks
        var onreadystatechangeFactory = function(xhr) { return function() {
            var handleResponse = function() {
                if (xhr.handleResponseDone) return;
                xhr.handleResponseDone = true;
                var handler = null;
                var thisReq = xhr.req // Might have changes by redirect
                sf.fireCallbacks('recv', args)
                var kb = sf.store;
                sf.saveResponseMetadata(xhr, kb);
                sf.fireCallbacks('headers', [{uri: docuri, headers: xhr.headers}]);

                if (xhr.status >= 400) { // For extra dignostics, keep the reply
                //  @@@ 401 should cause  a retry with credential son
                // @@@ cache the credentials flag by host ????
                    if (xhr.responseText.length > 10) {
                        var response = kb.bnode();
                        kb.add(response, ns.http('content'), kb.literal(xhr.responseText), response);
                        if (xhr.statusText) {
                            kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response);
                        }
                        // dump("HTTP >= 400 responseText:\n"+xhr.responseText+"\n"); // @@@@
                    }
                    sf.failFetch(xhr, "HTTP error for " +xhr.resource + ": "+ xhr.status + ' ' + xhr.statusText);
                    return;
                }

                var loc = xhr.headers['content-location'];

                // deduce some things from the HTTP transaction
                var addType = function(cla) { // add type to all redirected resources too
                    var prev = thisReq;
                    if (loc) {
                        var docURI = kb.any(prev, ns.link('requestedURI'));
                        if (docURI != loc) {
                            kb.add(kb.sym(loc), ns.rdf('type'), cla, sf.appNode);
                        }
                    }
                    for (;;) {
                        var doc = kb.any(prev, ns.link('requestedURI'));
                        if (doc && doc.value) // convert Literal
                            kb.add(kb.sym(doc.value), ns.rdf('type'), cla, sf.appNode);
                        prev = kb.any(undefined, kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'), prev);
                        if (!prev) break;
                        var response = kb.any(prev, kb.sym('http://www.w3.org/2007/ont/link#response'));
                        if (!response) break;
                        var redirection = kb.any(response, kb.sym('http://www.w3.org/2007/ont/http#status'));
                        if (!redirection) break;
                        if (redirection != '301' && redirection != '302') break;
                    }
                }
                if (xhr.status == 200) {
                    addType(ns.link('Document'));
                    var ct = xhr.headers['content-type'];
                    if (ct) {
                        if (ct.indexOf('image/') == 0 || ct.indexOf('application/pdf') == 0) addType(kb.sym('http://purl.org/dc/terms/Image'));
                    }
                }

                if ($rdf.uri.protocol(xhr.resource.uri) == 'file' || $rdf.uri.protocol(xhr.resource.uri) == 'chrome') {
                    switch (xhr.resource.uri.split('.').pop()) {
                    case 'rdf':
                    case 'owl':
                        xhr.headers['content-type'] = 'application/rdf+xml';
                        break;
                    case 'n3':
                    case 'nt':
                    case 'ttl':
                        xhr.headers['content-type'] = 'text/n3';
                        break;
                    default:
                        xhr.headers['content-type'] = 'text/xml';
                    }
                }

                // If we have alread got the thing at this location, abort
                if (loc) {
                    var udoc = $rdf.uri.join(xhr.resource.uri, loc)
                    if (!force && udoc != xhr.resource.uri && sf.requested[udoc]) {
                        // should we smush too?
                        // $rdf.log.info("HTTP headers indicate we have already" + " retrieved " + xhr.resource + " as " + udoc + ". Aborting.")
                        sf.doneFetch(xhr, args)
                        xhr.abort()
                        return
                    }
                    sf.requested[udoc] = true
                }

                for (var x = 0; x < sf.handlers.length; x++) {
                    if (xhr.headers['content-type'] && xhr.headers['content-type'].match(sf.handlers[x].pattern)) {
                        handler = new sf.handlers[x]();
                        requestHandlers.append(sf.handlers[x].term) // FYI
                        break
                    }
                }

                var link;
                try {
                    link = xhr.getResponseHeader('link');
                }catch(e){}
                if (link) {
                    var rel = null;
                    var arg = link.replace(/ /g, '').split(';');
                    for (var i = 1; i < arg.length; i++) {
                        lr = arg[i].split('=');
                        if (lr[0] == 'rel') rel = lr[1];
                    }
                    var v = arg[0];
                    // eg. Link: <.meta>, rel=meta
                    if (v.length && v[0] == '<' && v[v.length-1] == '>' && v.slice)
                        v = v.slice(1, -1);
                    if (rel) // Treat just like HTML link element
                        sf.linkData(xhr, rel, v);
                }


                if (handler) {
                    try {
                        handler.handlerFactory(xhr);
                    } catch(e) { // Try to avoid silent errors
                        sf.failFetch(xhr, "Exception handling content-type " + xhr.headers['content-type'] + ' was: '+e);
                    };
                } else {
                    sf.doneFetch(xhr, args); //  Not a problem, we just don't extract data.
                    /*
                    // sf.failFetch(xhr, "Unhandled content type: " + xhr.headers['content-type']+
                    //        ", readyState = "+xhr.readyState);
                    */
                    return;
                }
            };

            // DONE: 4
            // HEADERS_RECEIVED: 2
            // LOADING: 3
            // OPENED: 1
            // UNSENT: 0

            // $rdf.log.debug("web.js: XHR " + xhr.resource.uri + ' readyState='+xhr.readyState); // @@@@ comment me out

            switch (xhr.readyState) {
            case 0:
                    var uri = xhr.resource.uri, newURI;
                    if (this.crossSiteProxyTemplate && document && document.location) { // In mashup situation
                        var hostpart = $rdf.uri.hostpart;
                        var here = '' + document.location;
                        if (hostpart(here) && hostpart(uri) && hostpart(here) != hostpart(uri)) {
                            newURI = this.crossSiteProxyTemplate.replace('{uri}', encodeURIComponent(uri));
                            sf.addStatus(xhr.req, "BLOCKED -> Cross-site Proxy to <" + newURI + ">");
                            if (xhr.aborted) return;

                            var kb = sf.store;
                            var oldreq = xhr.req;
                            kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), oldreq);


                            ////////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                            var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                            kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req);

                            var now = new Date();
                            var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
                            kb.add(newreq, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                            kb.add(newreq, ns.link('status'), kb.collection(), this.appNode);
                            kb.add(newreq, ns.link("requestedURI"), kb.literal(newURI), this.appNode);

                            var response = kb.bnode();
                            kb.add(oldreq, ns.link('response'), response);
                            // kb.add(response, ns.http('status'), kb.literal(xhr.status), response);
                            // if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                            xhr.abort()
                            xhr.aborted = true

                            sf.addStatus(oldreq, 'done') // why
                            if (xhr.userCallback) {
                                xhr.userCallback(true);
                            };
                            sf.fireCallbacks('done', args) // Are these args right? @@@
                            sf.requested[xhr.resource.uri] = 'redirected';

                            var xhr2 = sf.requestURI(newURI, xhr.resource);
                            if (xhr2 && xhr2.req) kb.add(xhr.req,
                                kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                                xhr2.req, sf.appNode);                             return;
                        }
                    }
                    sf.failFetch(xhr, "HTTP Blocked. (ReadyState 0) Cross-site violation for <"+
                    docuri+">");

                    break;

            case 3:
                // Intermediate state -- 3 may OR MAY NOT be called, selon browser.
                // handleResponse();   // In general it you can't do it yet as the headers are in but not the data
                break
            case 4:
                // Final state
                handleResponse();
                // Now handle
                if (xhr.handle) {
                    if (sf.requested[xhr.resource.uri] === 'redirected') {
                        break;
                    }
                    sf.fireCallbacks('load', args)
                    xhr.handle(function() {
                        sf.doneFetch(xhr, args)
                    })
                } else {
                    sf.addStatus(xhr.req, "Fetch OK. No known semantics.");
                    sf.doneFetch(xhr, args);
                    //sf.failFetch(xhr, "HTTP failed unusually. (no handler set) (x-site violation? no net?) for <"+
                    //    docuri+">");
                }
                break
            } // switch
        }; }


        // Map the URI to a localhost proxy if we are running on localhost
        // This is used for working offline, e.g. on planes.
        // Is the script istelf is running in localhost, then access all data in a localhost mirror.
        // Do not remove without checking with TimBL :)
        var uri2 = docuri;
        if (typeof tabulator != 'undefined' && tabulator.preferences.get('offlineModeUsingLocalhost')) {
            if (uri2.slice(0,7) == 'http://'  && uri2.slice(7,17) != 'localhost/') {
                uri2 = 'http://localhost/' + uri2.slice(7);
                $rdf.log.warn("Localhost kludge for offline use: actually getting <" + uri2 + ">");
            } else {
                // $rdf.log.warn("Localhost kludge NOT USED <" + uri2 + ">");
            };
        } else {
            // $rdf.log.warn("Localhost kludge OFF offline use: actually getting <" + uri2 + ">");
        }
        // 2014 probelm:
        // XMLHttpRequest cannot load http://www.w3.org/People/Berners-Lee/card.
        // A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin' header when the credentials flag is true.

        // @ Many ontology files under http: and need CORS wildcard -> can't have withCredentials
        var withCredentials = ( uri2.slice(0,6) === 'https:'); // @@ Kludge -- need for webid which typically is served from https

        var actualProxyURI = this.proxyIfNecessary(uri2);
        // Setup the request
        if (typeof jQuery !== 'undefined' && jQuery.ajax) {
            var xhr = jQuery.ajax({
                url: actualProxyURI,
                accepts: {'*': 'text/turtle,text/n3,application/rdf+xml'},
                processData: false,
                xhrFields: {
                    withCredentials: withCredentials
                },
                timeout: sf.timeout,
                error: function(xhr, s, e) {

                    xhr.req = req;   // Add these in case fails before .ajax returns
                    xhr.userCallback = userCallback;
                    xhr.resource = docterm;
                    xhr.requestedURI = uri2;
                    xhr.withCredentials = withCredentials; // Somehow gets lost by jq


                    if (s == 'timeout')
                        sf.failFetch(xhr, "requestTimeout");
                    else
                        onerrorFactory(xhr)(e);
                },
                success: function(d, s, xhr) {

                    xhr.req = req;
                    xhr.userCallback = userCallback;
                    xhr.resource = docterm;
                    xhr.requestedURI = uri2;

                    onreadystatechangeFactory(xhr)();
                }
            });

            xhr.req = req;
            xhr.userCallback = userCallback;
            xhr.resource = docterm;
            xhr.requestedURI = uri2;
            xhr.actualProxyURI = actualProxyURI;


        } else {
            var xhr = $rdf.Util.XMLHTTPFactory();
            xhr.onerror = onerrorFactory(xhr);
            xhr.onreadystatechange = onreadystatechangeFactory(xhr);
            xhr.timeout = sf.timeout;
            xhr.withCredentials = withCredentials;
            xhr.actualProxyURI = actualProxyURI;

            xhr.req = req;
            xhr.userCallback = userCallback;
            xhr.resource = docterm;
            xhr.requestedURI = uri2;

            xhr.ontimeout = function () {
                sf.failFetch(xhr, "requestTimeout");
            }
            try {
                xhr.open('GET', actualProxyURI, this.async);
            } catch (er) {
                return this.failFetch(xhr, "XHR open for GET failed for <"+uri2+">:\n\t" + er);
            }
        }

        // Set redirect callback and request headers -- alas Firefox Extension Only

        if (typeof tabulator != 'undefined' && tabulator.isExtension && xhr.channel &&
            ($rdf.uri.protocol(xhr.resource.uri) == 'http' ||
             $rdf.uri.protocol(xhr.resource.uri) == 'https')) {
            try {
                xhr.channel.notificationCallbacks = {
                    getInterface: function(iid) {
                        if (iid.equals(Components.interfaces.nsIChannelEventSink)) {
                            return {

                                onChannelRedirect: function(oldC, newC, flags) {
                                    if (xhr.aborted) return;
                                    var kb = sf.store;
                                    var newURI = newC.URI.spec;
                                    var oldreq = xhr.req;
                                    sf.addStatus(xhr.req, "Redirected: " + xhr.status + " to <" + newURI + ">");
                                    kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req);



                                    ////////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                                    var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                                    // xhr.resource = docterm
                                    // xhr.requestedURI = args[0]
                                    // var requestHandlers = kb.collection()

                                    // kb.add(kb.sym(newURI), ns.link("request"), req, this.appNode)
                                    kb.add(oldreq, ns.http('redirectedRequest'), newreq, this.appNode);

                                    var now = new Date();
                                    var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
                                    kb.add(newreq, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                                    kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
                                    kb.add(newreq, ns.link("requestedURI"), kb.literal(newURI), this.appNode)
                                    ///////////////


                                    //// $rdf.log.info('@@ sources onChannelRedirect'+
                                    //               "Redirected: "+
                                    //               xhr.status + " to <" + newURI + ">"); //@@
                                    var response = kb.bnode();
                                    // kb.add(response, ns.http('location'), newURI, response); Not on this response
                                    kb.add(oldreq, ns.link('response'), response);
                                    kb.add(response, ns.http('status'), kb.literal(xhr.status), response);
                                    if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                                    if (xhr.status - 0 != 303) kb.HTTPRedirects[xhr.resource.uri] = newURI; // same document as
                                    if (xhr.status - 0 == 301 && rterm) { // 301 Moved
                                        var badDoc = $rdf.uri.docpart(rterm.uri);
                                        var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.';
                                        if (rterm) {
                                            msg += ' Link in <' + badDoc + ' >should be changed';
                                            kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode);
                                        }
                                        // dump(msg+"\n");
                                    }
                                    xhr.abort()
                                    xhr.aborted = true

                                    sf.addStatus(oldreq, 'done') // why
                                    sf.fireCallbacks('done', args) // Are these args right? @@@
                                    sf.requested[xhr.resource.uri] = 'redirected';

                                    var hash = newURI.indexOf('#');
                                    if (hash >= 0) {
                                        var msg = ('Warning: ' + xhr.resource + ' HTTP redirects to' + newURI + ' which should not contain a "#" sign');
                                        // dump(msg+"\n");
                                        kb.add(xhr.resource, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg)
                                        newURI = newURI.slice(0, hash);
                                    }
                                    var xhr2 = sf.requestURI(newURI, xhr.resource);
                                    if (xhr2 && xhr2.req) kb.add(xhr.req,
                                        kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                                        xhr2.req, sf.appNode);

                                    // else dump("No xhr.req available for redirect from "+xhr.resource+" to "+newURI+"\n")
                                },

                                // See https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIChannelEventSink
                                asyncOnChannelRedirect: function(oldC, newC, flags, callback) {
                                    if (xhr.aborted) return;
                                    var kb = sf.store;
                                    var newURI = newC.URI.spec;
                                    var oldreq = xhr.req;
                                    sf.addStatus(xhr.req, "Redirected: " + xhr.status + " to <" + newURI + ">");
                                    kb.add(oldreq, ns.http('redirectedTo'), kb.sym(newURI), xhr.req);



                                    ////////////// Change the request node to a new one:  @@@@@@@@@@@@ Duplicate?
                                    var newreq = xhr.req = kb.bnode() // Make NEW reqest for everything else
                                    // xhr.resource = docterm
                                    // xhr.requestedURI = args[0]
                                    // var requestHandlers = kb.collection()

                                    // kb.add(kb.sym(newURI), ns.link("request"), req, this.appNode)
                                    kb.add(oldreq, ns.http('redirectedRequest'), newreq, xhr.req);

                                    var now = new Date();
                                    var timeNow = "[" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
                                    kb.add(newreq, ns.rdfs("label"), kb.literal(timeNow + ' Request for ' + newURI), this.appNode)
                                    kb.add(newreq, ns.link('status'), kb.collection(), this.appNode)
                                    kb.add(newreq, ns.link("requestedURI"), kb.literal(newURI), this.appNode)
                                    ///////////////


                                    //// $rdf.log.info('@@ sources onChannelRedirect'+
                                    //               "Redirected: "+
                                    //               xhr.status + " to <" + newURI + ">"); //@@
                                    var response = kb.bnode();
                                    // kb.add(response, ns.http('location'), newURI, response); Not on this response
                                    kb.add(oldreq, ns.link('response'), response);
                                    kb.add(response, ns.http('status'), kb.literal(xhr.status), response);
                                    if (xhr.statusText) kb.add(response, ns.http('statusText'), kb.literal(xhr.statusText), response)

                                    if (xhr.status - 0 != 303) kb.HTTPRedirects[xhr.resource.uri] = newURI; // same document as
                                    if (xhr.status - 0 == 301 && rterm) { // 301 Moved
                                        var badDoc = $rdf.uri.docpart(rterm.uri);
                                        var msg = 'Warning: ' + xhr.resource + ' has moved to <' + newURI + '>.';
                                        if (rterm) {
                                            msg += ' Link in <' + badDoc + ' >should be changed';
                                            kb.add(badDoc, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg, sf.appNode);
                                        }
                                        // dump(msg+"\n");
                                    }
                                    xhr.abort()
                                    xhr.aborted = true


                                    sf.addStatus(oldreq, 'done') // why

                                    if (xhr.userCallback) {
                                        xhr.userCallback(true);
                                    };
                                    sf.fireCallbacks('done', args) // Are these args right? @@@
                                    sf.requested[xhr.resource.uri] = 'redirected';

                                    var hash = newURI.indexOf('#');
                                    if (hash >= 0) {
                                        var msg = ('Warning: ' + xhr.resource + ' HTTP redirects to' + newURI + ' which should not contain a "#" sign');
                                        // dump(msg+"\n");
                                        kb.add(xhr.resource, kb.sym('http://www.w3.org/2007/ont/link#warning'), msg)
                                        newURI = newURI.slice(0, hash);
                                    }
                                    var xhr2 = sf.requestURI(newURI, xhr.resource);
                                    if (xhr2 && xhr2.req) kb.add(xhr.req,
                                        kb.sym('http://www.w3.org/2007/ont/link#redirectedRequest'),
                                        xhr2.req, sf.appNode);

                                    // else dump("No xhr.req available for redirect from "+xhr.resource+" to "+newURI+"\n")
                                } // asyncOnChannelRedirect
                            }
                        }
                        return Components.results.NS_NOINTERFACE
                    }
                }
            } catch (err) {
                 return sf.failFetch(xhr,
                        "@@ Couldn't set callback for redirects: " + err);
            }

        }

        try {
            var acceptstring = ""
            for (var type in this.mediatypes) {
                var attrstring = ""
                if (acceptstring != "") {
                    acceptstring += ", "
                }
                acceptstring += type
                for (var attr in this.mediatypes[type]) {
                    acceptstring += ';' + attr + '=' + this.mediatypes[type][attr]
                }
            }
            xhr.setRequestHeader('Accept', acceptstring)
            // $rdf.log.info('Accept: ' + acceptstring)

            // See http://dig.csail.mit.edu/issues/tabulator/issue65
            //if (requester) { xhr.setRequestHeader('Referer',requester) }
        } catch (err) {
            throw ("Can't set Accept header: " + err)
        }

        // Fire

        if (!useJQuery) {
            try {
                xhr.send(null)
            } catch (er) {
                return this.failFetch(xhr, "XHR send failed:" + er);
            }
            setTimeout(function() {
                if (xhr.readyState != 4 && sf.isPending(xhr.resource.uri)) {
                    sf.failFetch(xhr, "requestTimeout")
                }
            }, this.timeout);
            this.addStatus(xhr.req, "HTTP Request sent.");

        } else {
            this.addStatus(xhr.req, "HTTP Request sent (using jQuery)");
        }

        return xhr
    }

// this.requested[docuri]) != "undefined"

    this.objectRefresh = function(term) {
        var uris = kb.uris(term) // Get all URIs
        if (typeof uris != 'undefined') {
            for (var i = 0; i < uris.length; i++) {
                this.refresh(this.store.sym($rdf.uri.docpart(uris[i])));
                //what about rterm?
            }
        }
    }

    this.unload = function(term) {
        this.store.removeMany(undefined, undefined, undefined, term)
        delete this.requested[term.uri]; // So it can be loaded again
    }

    this.refresh = function(term) { // sources_refresh
        this.unload(term);
        this.fireCallbacks('refresh', arguments)
        this.requestURI(term.uri, undefined, true)
    }

    this.retract = function(term) { // sources_retract
        this.store.removeMany(undefined, undefined, undefined, term)
        if (term.uri) {
            delete this.requested[$rdf.uri.docpart(term.uri)]
        }
        this.fireCallbacks('retract', arguments)
    }

    this.getState = function(docuri) { // docState
        if (typeof this.requested[docuri] != "undefined") {
            if (this.requested[docuri]) {
                if (this.isPending(docuri)) {
                    return "requested"
                } else {
                    return "fetched"
                }
            } else {
                return "failed"
            }
        } else {
            return "unrequested"
        }
    }

    //doing anyStatementMatching is wasting time
    this.isPending = function(docuri) { // sources_pending
        //if it's not pending: false -> flailed 'done' -> done 'redirected' -> redirected
        return this.requested[docuri] == true;
    }

    var updatesVia = new $rdf.UpdatesVia(this);
};

$rdf.fetcher = function(store, timeout, async) { return new $rdf.Fetcher(store, timeout, async) };

// Parse a string and put the result into the graph kb
$rdf.parse = function parse(str, kb, base, contentType) {
    try {
    /*
        parseXML = function(str) {
            var dparser;
            if ((typeof tabulator != 'undefined' && tabulator.isExtension)) {
                dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(
                            Components.interfaces.nsIDOMParser);
            } else if (typeof module != 'undefined' ){ // Node.js
                var jsdom = require('jsdom');
                return jsdom.jsdom(str, undefined, {} );// html, level, options
            } else {
                dparser = new DOMParser()
            }
            return dparser.parseFromString(str, 'application/xml');
        }
        */
        if (contentType == 'text/n3' || contentType == 'text/turtle') {
            var p = $rdf.N3Parser(kb, kb, base, base, null, null, "", null)
            p.loadBuf(str)
            return;
        }

        if (contentType == 'application/rdf+xml') {
            var parser = new $rdf.RDFParser(kb);
            parser.parse($rdf.Util.parseXML(str), base, kb.sym(base));
            return;
        }

        if (contentType == 'application/rdfa') {  // @@ not really a valid mime type
            if ($rdf.rdfa && $rdf.rdfa.parse)
                $rdf.rdfa.parse($rdf.Util.parseXML(str), kb, base);
            return;
        }

        if (contentType == 'application/sparql-update') {  // @@ we handle a subset
            spaqlUpdateParser(store, str, base)

            if ($rdf.rdfa && $rdf.rdfa.parse)
                $rdf.rdfa.parse($rdf.Util.parseXML(str), kb, base);
            return;
        }


    } catch(e) {
        throw "Error trying to parse <"+base+"> as "+contentType+":\n"+e +':\n'+e.stack;
    }
    throw "Don't know how to parse "+contentType+" yet";

};

//   Serialize to the appropriate format
//
$rdf.serialize = function(target, kb, base, contentType, callback) {
    var documentString;
    var sz = $rdf.Serializer(kb);
    var newSts = kb.statementsMatching(undefined, undefined, undefined, target);
    sz.suggestNamespaces(kb.namespaces);
    sz.setBase(base);
    switch(contentType){
        case 'application/rdf+xml':
            documentString = sz.statementsToXML(newSts);
            break;
        case 'text/n3':
        case 'text/turtle':
        case 'application/x-turtle': // Legacy
        case 'application/n3': // Legacy
            documentString = sz.statementsToN3(newSts);
            break;
        case 'application/json+ld':
            var n3String = sz.statementsToN3(newSts);
            convertToJson(n3String, callback);
            break;
        case 'application/n-quads':
        case 'application/nquads': // @@@ just outpout the quads? Does not work for collections
            var n3String = sz.statementsToN3(newSts);
            documentString = convertToNQuads(n3String, callback);
            break;
        default:
            throw "serialise: Content-type "+ contentType +" not supported for data write";
    }
    return documentString;
};

////////////////// JSON-LD code currently requires Node
if (typeof module !== 'undefined' && module.require) { // Node
    var asyncLib = require('async');
    var jsonld = require('jsonld');
    var N3 = require('n3');

    var convertToJson = function(n3String, jsonCallback) {
        var jsonString = undefined;
        var n3Parser = N3.Parser();
        var n3Writer = N3.Writer({
            format: 'N-Quads'
        });
        asyncLib.waterfall([
            function(callback) {
                n3Parser.parse(n3String, callback);
            },
            function(triple, prefix, callback) {
                if (triple !== null) {
                    n3Writer.addTriple(triple);
                }
                if (typeof callback === 'function') {
                    n3Writer.end(callback);
                }
            },
            function(result, callback) {
                try {
                    jsonld.fromRDF(result, {
                        format: 'application/nquads'
                    }, callback);
                } catch (err) {
                    callback(err);
                }
            },
            function(json, callback) {
                jsonString = JSON.stringify(json);
                jsonCallback(null, jsonString);
            }
        ], function(err, result) {
            jsonCallback(err, jsonString);
        });
    }

    var convertToNQuads = function(n3String, nquadCallback) {
        var nquadString = undefined;
        var n3Parser = N3.Parser();
        var n3Writer = N3.Writer({
            format: 'N-Quads'
        });
        asyncLib.waterfall([
            function(callback) {
                n3Parser.parse(n3String, callback);
            },
            function(triple, prefix, callback) {
                if (triple !== null) {
                    n3Writer.addTriple(triple);
                }
                if (typeof callback === 'function') {
                    n3Writer.end(callback);
                }
            },
            function(result, callback) {
                nquadString = result;
                nquadCallback(null, nquadString);
            },
        ], function(err, result) {
            nquadCallback(err, nquadString);
        });
    }
}
// ends
