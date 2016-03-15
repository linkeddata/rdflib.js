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

$rdf = {} unless $rdf?
$rdf.Util ?= {}

class $rdf.uri
    @join: (given, base) ->
        baseHash = base.indexOf '#'
        if baseHash > 0
            base = base[...baseHash]
        if given.length is 0
            # before chopping its filename off
            return base
        if given.indexOf('#') is 0
            return base + given

        colon = given.indexOf ':'
        if colon >= 0
            # absolute URI form overrides base URI
            return given
        baseColon = base.indexOf ':'
        if base.length is 0
            return given
        if baseColon < 0
            alert "Invalid base: #{base} in join with given: #{given}"
            return given

        # eg. http:
        baseScheme = base[..baseColon]
        if given.indexOf('//') is 0
            # starts with //
            return baseScheme + given
        if base.indexOf('//', baseColon) is baseColon + 1
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
        if given.indexOf('/') is 0
            return base[...baseSingle] + given

        path = base[baseSingle..]
        lastSlash = path.lastIndexOf '/'
        if lastSlash < 0
            return baseScheme + given

        # chop trailing filename from base
        if lastSlash >= 0 and lastSlash < path.length - 1
            path = path[..lastSlash]

        path += given

        # must apply to result of prev
        while path.match /[^\/]*\/\.\.\//
            # ECMAscript spec 7.8.5
            path = path.replace /[^\/]*\/\.\.\//, ''

        # spec vague on escaping
        path = path.replace /\.\//g, ''
        path = path.replace /\/\.$/, '/'

        base[...baseSingle] + path


    @commonHost: new RegExp('^[-_a-zA-Z0-9.]+:(//[^/]*)?/[^/]*$')

    @hostpart: (u) ->
        m = /[^\/]*\/\/([^\/]*)\//.exec(u)
        if m then m[1] else ''

    # relativize URI to a given base
    @refTo: (base, uri) ->
        unless base
            return uri
        if base is uri
            return ''
        # how much are they identical
        for c, i in uri
            if c != base[i]
                break
        if base[...i].match $rdf.Util.uri.commonHost
            k = uri.indexOf '//'
            if k < 0
                k = -2
            # first *single* slash
            l = uri.indexOf '/', k + 2
            if uri[l+1] != '/' and base[l+1] != '/' and uri[...l] is base[...l]
                # common path to single slash but no other common path segments
                return uri[l..]

        # fragment of base
        if uri[i] is '#' and base.length is i
            return uri[i..]
        while i > 0 and uri[i-1] != '/'
            i--
        if i < 3
            # no way
            return uri
        if base.indexOf('//', i-2) > 0 or uri.indexOf('//', i-2) > 0
            # unshared '//'
            return uri
        if base.indexOf(':', i) > 0
            # unshared '#'
            return uri

        n = 0
        n++ for c in base[i..] when c is '/'
        if n is 0 and i < uri.length and uri[i] is '#'
            return './' + uri[i..]
        if n is 0 and i is uri.length
            return './'

        s = ''
        if n > 0
            s += '../' for j in [1..n]
        s + uri[i..]

    # returns URI without the frag
    @docpart: (uri) ->
        i = uri.indexOf '#'
        if i < 0 then uri else uri[...i]

    # document in which a thing is defined
    @document: (x) =>
        $rdf.sym @docpart(x.uri)

    # return the protocol of a uri or null
    @protocol: (uri) ->
        i = uri.indexOf ':'
        if i < 0 then null else uri[...i]

#   @@ For now, allow old calling method through Util
#    2012-11 tbl
#
$rdf.Util.uri = $rdf.uri

if module?.exports?
    module.exports.Util ?= {}
    for own k, v of $rdf.Util
        module.exports.Util[k] = v
    module.exports.uri = $rdf.uri

#ends
