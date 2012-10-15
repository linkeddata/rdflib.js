###
# These are the classes corresponding to the RDF and N3 data models
#
# Designed to look like rdflib and cwm
###

$rdf = {} if not $rdf?

class $rdf.Empty
    termType: 'empty'
    toString: -> '()'
    toNT: @::toString

class $rdf.Symbol
    constructor: (@uri) ->
        @value = @uri   # why?
    termType: 'symbol'
    toString: -> "<#{@uri}>"
    toNT: @::toString

    # precalculated symbols
    XSDboolean: new @('http://www.w3.org/2001/XMLSchema#boolean')
    XSDdecimal: new @('http://www.w3.org/2001/XMLSchema#decimal')
    XSDfloat: new @('http://www.w3.org/2001/XMLSchema#float')
    XSDinteger: new @('http://www.w3.org/2001/XMLSchema#integer')
    XSDdateTime: new @('http://www.w3.org/2001/XMLSchema#dateTime')
    integer: new @('http://www.w3.org/2001/XMLSchema#integer') # Used?

if $rdf.NextId?
    $rdf.log.error "Attempt to re-zero existing blank node id counter at #{$rdf.NextId}"
else
    $rdf.NextId = 0

$rdf.NTAnonymousNodePrefix = "_:n"

class $rdf.BlankNode
    constructor: (id) ->
        @id = $rdf.NextId++
        @value = if id then id else @id.toString()
    termType: 'bnode'
    toNT: -> $rdf.NTAnonymousNodePrefix + @id
    toString: @::toNT

class $rdf.Literal
    constructor: (@value, @lang, @datatype) ->
        @lang ?= undefined
        @datatype ?= undefined
    termType: 'literal'
    toString: -> "#{@value}"
    toNT: ->
        str = @value
        if typeof str is not 'string'
            if typeof str is 'number' then return ''+str
            throw Error("Value of RDF literal is not string: #{str}")
        str = str.replace /\\/g, '\\\\'  # escape backslashes
        str = str.replace /\"/g, '\\"'   # escape quotes
        str = str.replace /\n/g, '\\n'   # escape newlines
        str = "\"#{str}\""
        if @datatype
            str += '^^' + @datatype.toNT()
        if @lang
            str += '@' + @lang
        str

class $rdf.Collection
    constructor: ->
        @id = $rdf.NextId++ # for hashString
        @elements = []
        @closed = false
    termType: 'collection'
    toNT: -> $rdf.NTAnonymousNodePrefix + @id
    toString: -> '(' + @elements.join(' ') + ')'

    append: (el) -> @elements.push(el)
    unshift: (el) -> @elements.unshift(el)
    shift: -> @elements.shift()
    close: -> @closed = true

$rdf.term = (val) ->
    switch typeof val
        when 'object'
            if val instanceof Date
                d2 = (x) -> (''+(100+x))[1...3] # just two digits
                value = ''+ val.getUTCFullYear() + '-' + d2(val.getUTCMonth()+1) +'-'+d2(val.getUTCDate())+
                        'T'+d2(val.getUTCHours())+':'+d2(val.getUTCMinutes())+':'+d2(val.getUTCSeconds())+'Z'
                return new $rdf.Literal value, undefined, $rdf.Symbol.prototype.XSDdateTime

            else if val instanceof Array
                x = new $rdf.Collection
                x.append $rdf.term(elt) for elt in val
                return x

            return val

        when 'string'
            return new $rdf.Literal val

        when 'number'
            if (''+val).indexOf('e') >= 0
                dt = $rdf.Symbol.prototype.XSDfloat
            else if (''+val).indexOf('.')>=0
                dt = $rdf.Symbol.prototype.XSDdecimal
            else
                dt = $rdf.Symbol.prototype.XSDinteger
            return new $rdf.Literal ''+val, undefined, dt

        when 'boolean'
            return new $rdf.Literal (if val then '1' else '0'), undefined, $rdf.Symbol.prototype.XSDboolean

        when 'undefined'
            return undefined

    throw "Can't make term from " + val + " of type " + typeof val

class $rdf.Statement
    # This is a triple with an optional reason
    # The reason can point to provenece or inference

    constructor: (subject, predicate, object, why) ->
        @subject = $rdf.term(subject)
        @predicate = $rdf.term(predicate)
        @object = $rdf.term(object)
        @why = why if why?
    toNT: -> [@subject.toNT(), @predicate.toNT(), @object.toNT()].join(' ') + ' .'
    toString: @::toNT

$rdf.st = (subject, predicate, object, why) ->
    new $rdf.Statement subject, predicate, object, why

class $rdf.Formula
    # set of statements

    constructor: ->
        @statements = []
        @constraints = []
        @initBindings = []
        @optional = []
    termType: 'formula'
    toNT: -> '{' + @statements.join('\n') + '}'
    toString: @::toNT

    add: (s, p, o, why) ->
        @statements.push(new $rdf.Statement s, p, o, why)

    # convenience methods
    sym: (uri, name) ->
        if name?
            throw 'This feature (kb.sym with 2 args) is removed. Do not assume prefix mappings.'
            if !$rdf.ns[uri]
                throw 'The prefix "'+uri+'" is not set in the API'
            uri = $rdf.ns[uri] + name
        new $rdf.Symbol uri
    literal: (val, lang, dt) ->
        new $rdf.Literal val.toString(), lang, dt
    bnode: (id) ->
        new $rdf.BlankNode id
    formula: ->
        new $rdf.Formula
    collection: ->
        new $rdf.Collection
    list: (values) ->
        r = new $rdf.Collection
        if values
            r.append elt for elt in values
        r
    variable: (name) ->
        new $rdf.Variable name
    ns: (nsuri) ->
        (ln) -> new $rdf.Symbol(nsuri + (if ln? then ln else ''))

    fromNT: (str) ->
        # The bnode bit should not be used on program-external values; designed
        # for internal work such as storing a bnode id in an HTML attribute.
        # This will only parse the strings generated by the vaious toNT() methods.
        switch str[0]
            when '<'
                return $rdf.sym str[1...-1]

            when '"'
                lang = undefined
                dt = undefined
                k = str.lastIndexOf '"'
                if k < str.length - 1
                    if str[k+1] is '@'
                        lang = str[k+2...]
                    else if str[k+1...k+3] is '^^'
                        dt = $rdf.fromNT str[k+3...]
                    else
                        throw "Can't convert string from NT: #{str}"

                str = str[1...k]
                str = str.replace /\\"/g,  '"'   # unescape quotes
                str = str.replace /\\n/g,  '\n'  # unescape newlines
                str = str.replace /\\\\/g, '\\'  # unescape backslashes
                return $rdf.lit str, lang, dt

            when '_'
                x = new $rdf.BlankNode
                x.id = parseInt str[3...]
                $rdf.NextId--
                return x

            when '?'
                return new $rdf.Variable str[1...]

        throw "Can't convert from NT: #{str}"


$rdf.sym = (uri) -> new $rdf.Symbol(uri)
$rdf.lit = $rdf.Formula::literal
$rdf.Namespace = $rdf.Formula::ns
$rdf.variable = $rdf.Formula::variable

###
# Variable
#
# Variables are placeholders used in patterns to be matched.
# In cwm they are symbols which are the formula's list of quantified variables.
# In sparl they are not visibily URIs.  Here we compromise, by having
# a common special base URI for variables. Their names are uris,
# but the ? nottaion has an implicit base uri of 'varid:'
###

class $rdf.Variable
    constructor: (rel) ->
        @base = 'varid:'
        @uri = $rdf.Util.uri.join rel, @base
    termType: 'variable'
    toNT: ->
        if @uri[...@base.length] is @base
            return '?' + @uri[@base.length...]
        "?#{@uri}"
    toString: @::toNT
    hashString: @::toNT
    classOrder: 7

$rdf.fromNT = $rdf.Formula::fromNT

$rdf.graph = ->
    new $rdf.IndexedFormula

if module?.exports?
    module.exports[k] = v for own k, v of $rdf
