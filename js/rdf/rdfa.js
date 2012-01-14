/*
 * jQuery RDFa @VERSION
 *                                U N T E S T E D      T R I A L    O N L Y
 *                                P O R T   I N   P R O G R E S S
 *
 * Copyright (c) 2008,2009 Jeni Tennison
 * Licensed under the MIT (MIT-LICENSE.txt)
 * 2010-06-11 Taken from http://code.google.com/p/rdfquery/source/checkout TBL
 * Callbacks for new triples removed -- should more logically be on the store
 * so as to make common for all sources
 *
 * Depends:
 *  uri.js
 *  term.js
 *  identity.js
 *  
 *  jquery.rdf.js
 */
/**
 * @fileOverview jQuery RDFa processing
 * @author <a href="mailto:jeni@jenitennison.com">Jeni Tennison</a>
 * @copyright (c) 2008,2009 Jeni Tennison
 * @license MIT license (MIT-LICENSE.txt)
 * @version 1.0
 * @requires jquery.uri.js
 * @requires jquery.xmlns.js
 * @requires jquery.curie.js
 * @requires jquery.datatype.js
 * @requires jquery.rdf.js
 */
 





/*
 * jQuery CURIE @VERSION
 * 
 * Copyright (c) 2008 Jeni Tennison
 * Licensed under the MIT (MIT-LICENSE.txt)
 *
 * Depends:
 *	jquery.uri.js
 *  jquery.xmlns.js
 */
/*global jQuery */

// The curie module itself is also the parse function
$rdf.curie = function (curie, options) {
    var
    opts = $rdf.Util.extend({}, $rdf.curie.defaults, options || {}),
        m = /^(([^:]*):)?(.+)$/.exec(curie),
        prefix = m[2],
        local = m[3],
        ns = opts.namespaces[prefix];
    if (prefix) {
        if (ns === undefined) {
            throw "Malformed CURIE: No namespace binding for " + prefix + " in CURIE " + curie;
        }
    } else if (opts.reserved.length && $rdf.Util.inArray(curie, opts.reserved) >= 0) {
        ns = opts.reservedNamespace;
        local = curie;
    } else if (opts.defaultNamespace === undefined) {
        // the default namespace is provided by the application; it's not clear whether
        // the default XML namespace should be used if there's a colon but no prefix
        throw "Malformed CURIE: No prefix and no default namespace for unprefixed CURIE " + curie;
    } else {
        ns = opts.defaultNamespace;
    }
    return $rdf.sym(ns.uri + local);
};

$rdf.curie.defaults = {
    namespaces: {},
    reserved: [],
    reservedNamespace: undefined,
    defaultNamespace: undefined
};

$rdf.curie.safeCurie = function (safeCurie, options) {
    var m = /^\[([^\]]+)\]$/.exec(safeCurie);
    return m ? $rdf.curie(m[1], options) : $rdf.sym(safeCurie);
};

$rdf.curie.createCurie = function (uri, options) {
    var opts = $rdf.Util.extend({}, $rdf.curie.defaults, options || {}),
        ns = opts.namespaces,
        curie;
    uri = $rdf.sym(uri).toString();
    for (var prefix in ns) {
        var namespace = ns[prefix];
        if (uri.substring(0, namespace.toString().length) === namespace.toString()) {
            curie = prefix + ':' + uri.substring(namespace.toString().length);
            return null;
        }
    };
    if (curie === undefined) {
        throw "No Namespace Binding: There's no appropriate namespace binding for generating a CURIE from " + uri;
    } else {
        return curie;
    }
};

// Extend JQuery with the curie functionr
$.fn.curie = function (curie, options) {
    var opts = $rdf.Util.extend({}, $rdf.curie.defaults, {
        namespaces: this.xmlns()
    }, options || {});
    return $rdf.curie(curie, opts);
};

$rdf.safeCurie = function (safeCurie, options) {
    var opts = $rdf.Util.extend({}, $rdf.curie.defaults, {
        namespaces: this.xmlns()
    }, options || {});
    return $rdf.curie.safeCurie(safeCurie, opts);
};

$rdf.createCurie = function (uri, options) {
    var opts = $rdf.Util.extend({}, $rdf.curie.defaults, {
        namespaces: this.xmlns()
    }, options || {});
    return $rdf.curie.createCurie(uri, opts);
};

$rdf.curie.defaults = {
    reserved: ['alternate', 'appendix', 'bookmark', 'cite', 'chapter', 'contents', 'copyright', 'first', 'glossary', 'help', 'icon', 'index', 'last', 'license', 'meta', 'next', 'p3pv1', 'prev', 'role', 'section', 'stylesheet', 'subsection', 'start', 'top', 'up'],
    reservedNamespace: 'http://www.w3.org/1999/xhtml/vocab#',
    defaultNamespace: undefined
};

$rdf.safeCurie = function (safeCurie, options) {
    var opts = $rdf.Util.extend({}, $rdf.curie.defaults, {
        namespaces: this.xmlns()
    }, options || {});
    return $rdf.safeCurie(safeCurie, opts);
};



//////////////////////////////////////////////////////////////////////////////

$rdf.rdfa = {};

$rdf.rdfa.parse = function (dom, kb, baseUri, doc) {
    return $rdf.rdfa.parseThis.call($(dom), kb, baseUri, doc); 
};

$rdf.rdfa.parseThis = function (kb, baseUri, doc) {
    this.kb = kb;
    this.baseUri = baseUri;
 

// Agenda:
//    fn.curie.
//   docResource   (relies on database-wide document base)
//  Replace all $jq.rdf.   with equivalent $rdf.
//
//  Note: The original jQuery "$" is now $jq in this code.
////////////////////////////////////////////////////

  //if ($ == undefined && tabulator && tabulator.jq) $ = tabulator.jq; // not sure hot this is upposed to be wired - tbl

  var
    ns = {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      xsd: "http://www.w3.org/2001/XMLSchema#",
      xml: 'http://www.w3.org/XML/1998/namespace',
      xmlns: 'http://www.w3.org/2000/xmlns/'
    },
    
    rdfXMLLiteral = ns.rdf + 'XMLLiteral',
    rdfXMLLiteralSym = kb.sym(rdfXMLLiteral),

    rdfaCurieDefaults = $rdf.curie.defaults,
    relReserved = [
      'alternate', 'appendix', 'bookmark', 'cite', 'chapter', 'contents', 'copyright',
      'first', 'glossary', 'help', 'icon', 'index', 'last', 'license', 'meta', 'next',
      'p3pv1', 'prev', 'role', 'section', 'stylesheet', 'subsection', 'start', 'top', 'up'
    ],

    attRegex = /\s([^ =]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^ >]+))/g,
    
    ncNameChar = '[-A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u10000-\uEFFFF\.0-9\u00B7\u0300-\u036F\u203F-\u2040]',
    ncNameStartChar = '[\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3\u4E00-\u9FA5\u3007\u3021-\u3029_]', //"
    ncNameRegex = new RegExp('^' + ncNameStartChar + ncNameChar + '*$'),

    docResource = kb.sym(baseUri),
    bnodeMap = {};
    
    var type = kb.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
    var why = docResource;

   parseEntities = function (string) {
      var result = "", m, entity;
      if (!/&/.test(string)) {
         return string;
      }
      while (string.length > 0) {
        m = /([^&]*)(&([^;]+);)(.*)/g.exec(string);
        if (m === null) {
          result += string;
          break;
        }
        result += m[1];
        entity = m[3];
        string = m[4];
        if (entity.charAt(0) === '#') {
          if (entity.charAt(1) === 'x') {
              result += String.fromCharCode(parseInt(entity.substring(2), 16));
          } else {
              result += String.fromCharCode(parseInt(entity.substring(1), 10));
          }
        } else {
          switch(entity) {
            case 'amp':
              result += '&';
              break;
            case 'nbsp':
              result += String.fromCharCode(160);
              break;
            case 'quot':
              result += '"';
              break;
            case 'apos':
              result += "'";
              break;
            default:
              result += '&' + entity + ';';
          }
        }
      }
      return result;
    };

    // @param elem is a JQ object
    // returns attrubtes an namespaces
    //
    getAttributes = function (elem) {
        var i, e, a, tag, name, value, attMap, prefix,
            atts = {},
            nsMap = {};
        var e = elem[0];
        nsMap[':length'] = 0;
      
        if (e.nodeType == 9) return  { atts: atts, namespaces: nsMap }; // Document 

        if (e.attributes && e.attributes.getNamedItemNS) {
            attMap = e.attributes;
            for (i = 0; i < attMap.length; i += 1) {
                a = attMap[i];
                if (/^xmlns(:(.+))?$/.test(a.nodeName) && a.nodeValue !== '') {
                    prefix = /^xmlns(:(.+))?$/.exec(a.nodeName)[2] || '';
                    if (ncNameRegex.test(prefix) && (prefix !== 'xml' || a.nodeValue === ns.xml) && (a.nodeValue !== ns.xml || prefix === 'xml') && prefix !== 'xmlns' && a.nodeValue !== ns.xmlns) {
                        nsMap[prefix] = $rdf.sym(a.nodeValue);
                        nsMap[':length'] += 1;
                    }
//              } else if (/rel|rev|lang|xml:lang/.test(a.nodeName)) {
//                      atts[a.nodeName] = a.nodeValue === '' ? undefined : a.nodeValue;
                } else if (/rel|rev|lang|xml:lang|about|href|src|resource|property|typeof|content|datatype/.test(a.nodeName)) {
                    atts[a.nodeName] = a.nodeValue === null ? undefined : a.nodeValue;
                }
            }
        } else { //   For IE, which hides namespaces to carefully
            tag = /<[^>]+>/.exec(e.outerHTML);
            a = attRegex.exec(tag);
            while (a !== null) {
                name = a[1];
                value = a[2] || a[3] || a[4];
                if (/^xmlns/.test(name) && name !== 'xmlns:' && value !== '') {
                    prefix = /^xmlns(:(.+))?$/.exec(name)[2] || '';
                    if (ncNameRegex.test(prefix) && (prefix !== 'xml' || a.nodeValue === ns.xml) && (a.nodeValue !== ns.xml || prefix === 'xml') && prefix !== 'xmlns' && a.nodeValue !== ns.xmlns) {
                        nsMap[prefix] = $rdf.sym(value);
                        nsMap[':length'] += 1;
                    }
                } else if (/about|href|src|resource|property|typeof|content|datatype|rel|rev|lang|xml:lang/.test(name)) {
                    atts[name] = parseEntities(value);
                }
                a = attRegex.exec(tag);
            }
            attRegex.lastIndex = 0;
        }
        return { atts: atts, namespaces: nsMap };
    };

    getAttribute = function (elem, attr) {
        var val = elem[0].getAttribute(attr);
//          if (attr === 'rev' || attr === 'rel' || attr === 'lang' || attr === 'xml:lang') {
//          val = val === '' ? undefined : val;
//          }
        return val === null ? undefined : val;
    };

    resourceFromUri = function (uri) {
      return kb.sym(uri);
    };

    resourceFromCurie = function (curie, elem, noblanks, options) {
      if (curie.substring(0, 2) === '_:') {
        if (noblanks) {
          return undefined;
        }
        var bn = bnodeMap[curie]
        if (bn) return bn;
        var bn = kb.bnode();
        bnodeMap[curie] = bn
        return bn;
      } else {
        try {
          return $rdf.curie(curie, options);
        } catch (e) {
          return undefined;
        }
      }
    },

    resourceFromSafeCurie = function (safeCurie, elem, options) {
      var m = /^\[(.*)\]$/.exec(safeCurie),
        base = options.base || elem.base();
      return m ? resourceFromCurie(m[1], elem, false, options) : $rdf.sym(safeCurie, base);
    },

    resourcesFromCuries = function (curies, elem, noblanks, options) {
      var i, resource, resources = [];
      curies = curies && curies.split ? curies.split(/[ \t\n\r\x0C]+/g) : [];
      for (i = 0; i < curies.length; i += 1) {
        if (curies[i] !== '') {
          resource = resourceFromCurie(curies[i], elem, noblanks, options);
          if (resource !== undefined) {
            resources.push(resource);
          }
        }
      }
      return resources;
    },

    /* @@ suppressed for now as we only read not change them -- timbl
    removeCurie = function (curies, resource, options) {
      var i, r, newCuries = [];
      resource = resource.type === 'uri' ? resource : $jq.rdf.resource(resource, options);
      curies = curies && curies.split ? curies.split(/\s+/) : [];
      for (i = 0; i < curies.length; i += 1) {
        if (curies[i] !== '') {
          r = resourceFromCurie(curies[i], null, false, options);
          if (r !== resource) {
            newCuries.push(curies[i]);
          }
        }
      }
      return newCuries.reverse().join(' ');
    },
    */

    $rdf.rdfaParser = function(kb, baseUri) {
        this.kb = kb;
        this.baseUri = baseUri;
        return true;
    }
    
    getObjectResource = function (elem, context, relation) {
        var r, resource, atts, curieOptions;
        context = context || {};
        atts = context.atts || getAttributes(elem).atts;
        r = relation === undefined ? atts.rel !== undefined || atts.rev !== undefined : relation;
        resource = atts.resource;
        resource = resource === undefined ? atts.href : resource;
        if (resource === undefined) {
            resource = r ? kb.bnode() : resource;
        } else {
            curieOptions = context.curieOptions || $rdf.Util.extend(
            {}, rdfaCurieDefaults, { namespaces: elem.xmlns() });
            resource = resourceFromSafeCurie(resource, elem, curieOptions);
        }
        return resource;
    };

    getSubject = function (elem, context, relation) {
      var r, atts, curieOptions, subject, skip = false;
      context = context || {};
      atts = context.atts || getAttributes(elem).atts;
      curieOptions = context.curieOptions || $rdf.Util.extend({},
            rdfaCurieDefaults, { namespaces: elem.xmlns(), base: elem.base() });
      r = relation === undefined ? atts.rel !== undefined || atts.rev !== undefined : relation;
      if (atts.about !== undefined) {
        subject = resourceFromSafeCurie(atts.about, elem, curieOptions);
      }
      if (subject === undefined && atts.src !== undefined) {
        subject = resourceFromSafeCurie(atts.src, elem, curieOptions);
      }
      if (!r && subject === undefined && atts.resource !== undefined) {
        subject = resourceFromSafeCurie(atts.resource, elem, curieOptions);
      }
      if (!r && subject === undefined && atts.href !== undefined) {
        subject = resourceFromSafeCurie(atts.href, elem, curieOptions);
      }
      if (subject === undefined) {
        if (/^(head|body)$/i.test(elem[0].nodeName)) {
          subject = docResource;
        } else if (atts['typeof'] !== undefined) {
          subject = kb.bnode();
        } else if (elem[0].parentNode && elem[0].parentNode.nodeType === 1) {
          subject = context.object || getObjectResource(elem.parent()) || getSubject(elem.parent()).subject;
          skip = !r && atts.property === undefined;
        } else {
          subject = docResource;
        }
      }
      return { subject: subject, skip: skip };
    };

    getLang = function (elem, context) {
      var lang;
      context = context || {};
      if (context.atts) {
        lang = context.atts.lang;
        lang = lang || context.atts['xml:lang'];
      } else {
        lang = elem[0].getAttribute('lang');
        try {
          lang = (lang === null || lang === '') ? elem[0].getAttribute('xml:lang') : lang;
        } catch (e) {
        }
        lang = (lang === null || lang === '') ? undefined : lang;
      }
      if (lang === undefined) {
        if (context.lang) {
          lang = context.lang;
        } else {
          if (elem[0].parentNode && elem[0].parentNode.nodeType === 1) {
            lang = getLang(elem.parent());
          }
        }
      }
      return lang;
    };

    entity = function (c) {
        switch (c) {
        case '<':
            return '&lt;';
        case '"':
            return '&quot;';
        case '&':
            return '&amp;';
        }
    };

    serialize = function (elem, ignoreNs) {
        var i, string = '', atts, a, name, ns, tag;
            elem.contents().each(function () {
        var j = $(this), // @@@ ?   Use of "this'?
            e = j[0];
        if (e.nodeType === 1) { // tests whether the node is an element
            name = e.nodeName.toLowerCase();
            string += '<' + name;
            if (e.outerHTML) {
                tag = /<[^>]+>/.exec(e.outerHTML);
                a = attRegex.exec(tag);
                while (a !== null) {
                if (!/^jQuery/.test(a[1])) {
                    string += ' ' + a[1] + '=';
                    string += a[2] ? a[3] : '"' + a[1] + '"';
                }
                a = attRegex.exec(tag);
            }
            attRegex.lastIndex = 0;
        } else {
            atts = e.attributes;
            for (i = 0; i < atts.length; i += 1) {
                a = atts.item(i);
                string += ' ' + a.nodeName + '="';
                string += a.nodeValue.replace(/[<"&]/g, entity);
                string += '"'; //'
            }
        }
        if (!ignoreNs) {
            ns = j.xmlns('');
            if (ns !== undefined && j.attr('xmlns') === undefined) {
                string += ' xmlns="' + ns + '"';
            }
        }
          string += '>';
          string += serialize(j, true);
          string += '</' + name + '>';
        } else if (e.nodeType === 8) { // tests whether the node is a comment
            string += '<!--';
            string += e.nodeValue;
            string += '-->';
        } else {
            string += e.nodeValue;
        }
      });
      return string;
    },

    // Originally:
    // This is the main function whcih extracts te RDFA
    // 'this' is a JQ object for the DOM element to be parsed
    // $rdf.rdfaParser(kb).rdfa.call($(element or document))
    // parseElement = function(element) {
    //     this.rdfa.call($(element));
    // };
    
    
    parse = function (context) {
      var i, subject, resource, lang, datatype, content, text,
        types, object, triple, parent,
        properties, rels, revs,
        forward, backward,
        triples = [], 
        callback, relCurieOptions,
        attsAndNs, atts, namespaces, ns,
        children = this.children();
      context = context || {};
      forward = context.forward || [];
      backward = context.backward || [];
      callback = context.callback || function () { return this; };
      attsAndNs = getAttributes(this);
      atts = attsAndNs.atts;
      context.atts = atts;
      namespaces = context.namespaces || this.xmlns();
      if (attsAndNs.namespaces[':length'] > 0) {
        namespaces = $rdf.Util.extend({}, namespaces);
        for (ns in attsAndNs.namespaces) {
          if (ns != ':length') {
            namespaces[ns] = attsAndNs.namespaces[ns];
          }
        }
      }
      context.curieOptions = $rdf.Util.extend({},
        rdfaCurieDefaults, { reserved: [], namespaces: namespaces, base: this.base() });
      relCurieOptions = $rdf.Util.extend({}, context.curieOptions, { reserved: relReserved });
      subject = getSubject(this, context);
      lang = getLang(this, context);
      if (subject.skip) {
        rels = context.forward;
        revs = context.backward;
        subject = context.subject;
        resource = context.object;
      } else {
        subject = subject.subject;
        if (forward.length > 0 || backward.length > 0) {
          parent = context.subject || getSubject(this.parent()).subject; // @@
          for (i = 0; i < forward.length; i += 1) {
            kb.add(parent, forward[i], subject, why);
            // triple = callback.call(triple, this.get(0), triple);
            //if (triple !== undefined && triple !== null) {
            //  triples = triples.concat(triple);
            //}
          }
          for (i = 0; i < backward.length; i += 1) {
            kb.add(subject, backward[i], parent, why);
            //triple = callback.call(triple, this.get(0), triple);
            //if (triple !== undefined && triple !== null) {
            //  triples = triples.concat(triple);
            //}
          }
        }
        resource = getObjectResource(this, context);
        types = resourcesFromCuries(atts['typeof'], this, false, context.curieOptions);
        for (i = 0; i < types.length; i += 1) {
          kb.add(subject, type, types[i], why);
          //triple = callback.call(triple, this.get(0), triple);
          //if (triple !== undefined && triple !== null) {
          //  triples = triples.concat(triple);
          //}
        }
        properties = resourcesFromCuries(atts.property, this, true, context.curieOptions);
        if (properties.length > 0) {
          datatype = atts.datatype;
          content = atts.content;
          text = this.text().replace(/"/g, '\\"'); //')
          if (datatype !== undefined && datatype !== '') {
            datatype = $rdf.curie(datatype, context.curieOptions);
            if (datatype.toString() === rdfXMLLiteral) {
              object = kb.literal(serialize(this), undefined, rdfXMLLiteralSym );
            } else if (content !== undefined) {
              object = kb.literal(content, kb.sym(datatype));
            } else {
              object = kb.literal(text, kb.sym(datatype));
            }
          } else if (content !== undefined) {
            if (lang === undefined) {
              object = kb.literal(content);
            } else {
              object = kb.literal(content, lang);
            }
          } else if (children.length === 0 ||
                     datatype === '') {
            lang = getLang(this, context);
            if (lang === undefined) {
              object = kb.literal(text);    //@@ removed extra double quote marks??
            } else {
              object = kb.literal(text, undefined, lang);
            }
          } else {
            object = kb.literal(serialize(this), kb.sym(rdfXMLLiteral));
          }
          for (i = 0; i < properties.length; i += 1) {
            kb.add(subject, properties[i], object, why);
          }
        } // if properties/length > 0
        rels = resourcesFromCuries(atts.rel, this, true, relCurieOptions);
        revs = resourcesFromCuries(atts.rev, this, true, relCurieOptions);
        if (atts.resource !== undefined || atts.href !== undefined) {
          // make the triples immediately
          if (rels !== undefined) {
            for (i = 0; i < rels.length; i += 1) {
              kb.add(subject, rels[i], resource, why);
            }
          }
          rels = [];
          if (revs !== undefined) {
            for (i = 0; i < revs.length; i += 1) {
              kb.add(resource, revs[i], subject, why);
            }
          }
          revs = [];
        }
      } // end subject not skip
      children.each(function () {
        parse.call($(this), { forward: rels, backward: revs,
            subject: subject, object: resource || subject,
            lang: lang, namespaces: namespaces, callback: callback });
      });
      return;
    }; // parse

    // Add to list of gleaners @@@
    gleaner = function (options) {
      var type, atts;
      if (options && options.about !== undefined) {
        atts = getAttributes(this).atts;
        if (options.about === null) {
          return atts.property !== undefined ||
                 atts.rel !== undefined ||
                 atts.rev !== undefined ||
                 atts['typeof'] !== undefined;
        } else {
          return getSubject(this, {atts: atts}).subject.value === options.about;
        }
      } else if (options && options.type !== undefined) {
            type = getAttribute(this, 'typeof');
        if (type !== undefined) {
            return options.type === null ? true : this.curie(type) === options.type;
        }
            return false;
        } else {
            return parse(this, options);
        }
    }
    
    // return;     // debug later   @@@@@@@@
    
    return parse.call(this); 
    // End of Parser object

}


  /**
   * Creates a {@link jQuery.rdf} object containing the RDF triples parsed from the RDFa found in the current jQuery selection or adds the specified triple as RDFa markup on each member of the current jQuery selection. To create an {@link jQuery.rdf} object, you will usually want to use {@link jQuery#rdf} instead, as this may perform other useful processing (such as of microformats used within the page).
   * @methodOf jQuery#
   * @name jQuery#rdfa
   * @param {jQuery.rdf.triple} [triple] The RDF triple to be added to each item in the jQuery selection.
   * @returns {jQuery.rdf}
   * @example
   * // Extract RDFa markup from all span elements contained inside #main
   * rdf = $('#main > span').rdfa();
   * @example
   * // Add RDFa markup to a particular element
   *  var span = $('#main > p > span');
   *  span.rdfa('&lt;> dc:date "2008-10-19"^^xsd:date .');
   */
   /*
   // 'this' is a jq bject whcih wraps an element
  $jq.fn.rdfa = function (triple) {
    if (triple === undefined) {
      var triples = $jq.map($(this), function (elem) {
        return rdfa.call($(elem));
      });
      return $jq.rdf({ triples: triples });
    } else {
      $(this).each(function () {
        addRDFa.call($(this), triple);
      });
      return this;
    }
  };
  */

  /**
   * Removes the specified RDFa markup from each of the items in the current jQuery selection. The input parameter can be either an object or an array of objects. The objects can either have a <code>type</code> property, in which case the specified type is removed from the RDFa provided on the selected elements, or a <code>property</code> property, in which case the specified property is removed from the RDFa provided on the selected elements.
   * @methodOf jQuery#
   * @name jQuery#removeRdfa
   * @param {Object|Object[]} triple The RDFa markup items to be removed
   * from the items in the jQuery selection.
   * @returns {jQuery} The original jQuery object.
   * @example 
   * // To remove a property resource or relation from an element 
   * $('#main > p > a').removeRdfa({ property: "dc:creator" });
   * @example
   * // To remove a type from an element
   * $('#main >p > a').removeRdfa({ type: "foaf:Person" });
   * @example
   * // To remove multiple triples from an element
   * $('#main > p > a').removeRdfa([{ property: "foaf:depicts" }, { property: "dc:creator" }]);
   */
   /*
  $jq.fn.removeRdfa = function (triple) {
    $(this).each(function () {
      removeRDFa.call($(this), triple);
    });
    return this;
  };

  $jq.rdf.gleaners.push(gleaner);
*/
/*
$rdf.parseRdfa = function(element, kb, baseUri) {
    var p = new $rdf.RDFaParser(kb, baseUri);
    p.rdfa.call(element);
};
*/
