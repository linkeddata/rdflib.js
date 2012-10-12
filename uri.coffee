###
# Implements URI-specific functions
#
# See RFC 2386
#
# See also:
#   http://www.w3.org/2005/10/ajaw/uri.js
#   http://www.w3.org/2000/10/swap/uripath.py
#
###

$rdf = {} if not $rdf?
$rdf.Util ?= {}

class $rdf.Util.uri
    @join: (given, base) ->
        baseHash = base.indexOf '#'
        if baseHash > 0
            base = base[..baseHash-1]
        if given.length == 0
            # before chopping its filename off
            return base
        if given.indexOf '#' == 0
            return base + given

        colon = given.indexOf ':'
        if colon >= 0
            # absolute URI form overrides base URI
            return given
        baseColon = base.indexOf ':'
        if base.length == 0
            return given
        if baseColon < 0
            alert "Invalid base: #{base} in join with given: #{given}"
            return given

        # eg. http:
        baseScheme = base[..baseColon]
        if given.indexOf('//') == 0
            # starts with //
            return baseScheme + given
        if base.indexOf('//', baseColon) == baseColon + 1
            # any hostpart
            baseSingle = base.indexOf('/', baseColon+3)
            if baseSingle < 0
                if base.length - baseColon - 3 > 0
                    return base + '/' + given
                else
                    return baseScheme + given
        else
            baseSingle = base.indexOf('/', baseColon+1)
            if baseSingle < 0
                if base.length - baseColon - 1 > 0
                    return base + '/' + given
                else
                    return baseScheme + given

        # starts with / but not //
        if given.indexOf '/' == 0
            return base[..baseSingle-1] + given

        path = base[baseSingle..]
        lastSlash = path.lastIndexOf '/'
        if lastSlash < 0
            return baseScheme + given

        # chop trailing filename from base
        if lastSlash >= 0 and lastSlash < path.length - 1
            path = path[..lastSlash]

        path += given
        while path.match /[^\/]*\/\.\.\// # must apply to result of prev
            # ECMAscript spec 7.8.5
            path = path.replace /[^\/]*\/\.\.\//, ''
            # spec vague on escaping
            path = path.replace /\.\//g, ''
            path = path.replace /\/\.$/, '/'

        base.slice[..baseSingle-1] + path

    if tabulator?.isExtension
        @join2: (given, base) ->
            tIOService = Components.classes['@mozilla.org/network/io-service;1']
                                   .getService(Components.interfaces.nsIIOService)
            baseURI = tIOService.newURI(base, null, null)
            tIOService.newURI(baseURI.resolve(given), null, null).spec
    else
        @join2: @join

    @commonHost: new RegExp('^[-_a-zA-Z0-9.]+:(//[^/]*)?/[^/]*$')

    @hostpart: (u) ->
        m = /[^\/]*\/\/([^\/]*)\//.exec(u)
        if m then m[1] else ''

    # relativize URI to a given base
    @refTo: (base, uri) ->
        if not base
            return uri
        if base == uri
            return ''
        # how much are they identical
        for c, i in uri
            if c != base[i]
                break
        if base[..i-1].match $rdf.Util.uri.commonHost
            k = uri.indexOf '//'
            if k < 0
                k = -2
            # first *single* slash
            l = uri.indexOf '/', k + 2
            if uri[l+1] != '/' and base[l+1] != '/' and uri[..l-1] == base[..l-1]
                # common path to single slash but no other common path segments
                return uri[l..]

        # fragment of base
        if uri[i] == '#' and base.length == i
            return uri[i..]
        while i > 0 and uri[i-1] != '/'
            i--
        if i < 3
            # no way
            return uri
        if base.indexOf '//', i-2 > 0 or uri.indexOf '//', i-2 > 0
            # unshared '//'
            return uri
        if base.indexOf ':', i > 0
            # unshared '#'
            return uri

        n = 0
        n++ for c in base[i..] when c == '/'
        if n == 0 and i < uri.length and uri[i] == '#'
            return './' + uri[i..]
        if n == 0 and i == uri.length
            return './'

        s = ''
        if n > 0
            s += '../' for j in [1..n]
        s + uri[i..]

    # returns URI without the frag
    @docpart: (uri) ->
        i = uri.indexOf '#'
        if i < 0 then uri else uri[..i-1]

    # document in which a thing is defined
    @document: (x) =>
        $rdf.sym @docpart(x.uri)

    # return the protocol of a uri or null
    @protocol: (uri) ->
        i = uri.indexOf ':'
        if i < 0 then null else uri[..i-1]

module?.exports = $rdf.Util.uri
