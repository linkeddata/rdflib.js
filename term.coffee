###
# These are the classes corresponding to the RDF and N3 data models
#
# Designed to look like rdflib and cwm
###

$rdf = {} unless $rdf?

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

    sameTerm: (other) ->
        unless other
            return false
        (@termType is other.termType) and (@uri is other.uri)

    compareTerm: (other) ->
        if @classOrder < other.classOrder then return -1
        if @classOrder > other.classOrder then return +1
        if @uri < other.uri then return -1
        if @uri > other.uri then return +1
        return 0

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

    sameTerm: (other) ->
        unless other
            return false
        (@termType is other.termType) and (@id is other.id)

    compareTerm: (other) ->
        if @classOrder < other.classOrder then return -1
        if @classOrder > other.classOrder then return +1
        if @id < other.id then return -1
        if @id > other.id then return +1
        return 0

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
        return str

    sameTerm: (other) ->
        unless other
            return false
        (@termType is other.termType) and (@value is other.value) and (@lang is other.lang) and
            ((!@datatype and !other.datatype) or (@datatype and @datatype.sameTerm(other.datatype)))

    compareTerm: (other) ->
        if @classOrder < other.classOrder then return -1
        if @classOrder > other.classOrder then return +1
        if @value < other.value then return -1
        if @value > other.value then return +1
        return 0

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

$rdf.Collection::sameTerm = $rdf.BlankNode::sameTerm
$rdf.Collection::compareTerm = $rdf.BlankNode::compareTerm

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
            else if (''+val).indexOf('.') >= 0
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
        @subject = $rdf.term subject
        @predicate = $rdf.term predicate
        @object = $rdf.term object
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
        @statements.push new $rdf.Statement s, p, o, why

    # convenience methods
    sym: (uri, name) ->
        if name?
            throw 'This feature (kb.sym with 2 args) is removed. Do not assume prefix mappings.'
            if !$rdf.ns[uri]
                throw "The prefix #{uri} is not set in the API"
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
        return r
    variable: (name) ->
        new $rdf.Variable name
    ns: (nsuri) ->
        (ln) -> new $rdf.Symbol(nsuri + (ln ? ''))

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

    sameTerm: (other) ->
        unless other
            return false
        @hashString() is other.hashString()

    each: (s, p, o, w) ->
        # Only one of s p o can be undefined, and w is optional.
        results = []
        sts = @statementsMatching s, p, o, w, false
        if !s?
            results.push elt.subject for elt in sts
        else if !p?
            results.push elt.predicate for elt in sts
        else if !o?
            results.push elt.object for elt in sts
        else if !w?
            results.push elt.why for elt in sts
        return results

    any: (s, p, o, w) ->
        st = @anyStatementMatching s, p, o, w
        if !st?
            return undefined
        else if !s?
            return st.subject
        else if !p?
            return st.predicate
        else if !o?
            return st.object
        return undefined

    holds: (s, p, o, w) ->
        st = @anyStatementMatching s, p, o, w
        return st?

    holdsStatement: (st) ->
        @holds st.subject, st.predicate, st.object, st.why

    the: (s, p, o, w) ->
        # the() should contain a check there is only one
        x = @any s, p, o, w
        unless x?
            $rdf.log.error "No value found for the() {#{s} #{p} #{o}}."
        return x

    whether: (s, p, o, w) ->
        @statementsMatching(s, p, o, w, false).length

$rdf.sym = (uri) -> new $rdf.Symbol uri
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

    sameTerm: (other) ->
        unless other
            false
        (@termType is other.termType) and (@uri is other.uri)

$rdf.Literal::classOrder = 1
$rdf.Collection::classOrder = 3
$rdf.Formula::classOrder = 4
$rdf.Symbol::classOrder = 5
$rdf.BlankNode::classOrder = 6
$rdf.Variable::classOrder = 7

$rdf.fromNT = $rdf.Formula::fromNT

$rdf.graph = -> new $rdf.IndexedFormula

if module?.exports?
    module.exports[k] = v for own k, v of $rdf
