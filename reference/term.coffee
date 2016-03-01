###
# These are the classes corresponding to the RDF and N3 data models
#
# Designed to look like rdflib and cwm
#
# This is coffee see http://coffeescript.org
###

$rdf = {} unless $rdf?

###
  the superclass of all RDF Statement objects, that is
  $rdf.Symbol, $rdf.Literal, $rdf.BlankNode
  No class extends this yet, but it could be a place to put common behavior.
###
class $rdf.Node

    substitute:(bindings) -> this  # Default is to return this

class $rdf.Empty extends $rdf.Node
    termType: 'empty'
    toString: -> '()'
    toNT: @::toString

###
   A named node in an RDF graph
    todo: badly named.
    No, formally a URI is a string, this is a node whose name is a URI.
    Connolly pointed out it isa symbol on the language.
    @param uri the uri as string
###
class $rdf.Symbol extends $rdf.Node
    constructor: (@uri) ->
        # @value = @uri   # why? remove not used and wastefull
    termType: 'symbol'
    toString: -> "<#{@uri}>"
    toNT: @::toString
    doc: -> if @uri.indexOf('#') < 0 then @ else new $rdf.Symbol(@uri.split('#')[0])
    dir: ->
        str = @.doc()
        p = str.lastIndexOf('/')
        if p < 0 then throw "dir: No slash in path: " + str
        return new $rdf.Symbol(str.slice(0,p))

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

class $rdf.BlankNode extends $rdf.Node
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

class $rdf.Literal extends $rdf.Node
    constructor: (@value, @lang, @datatype) ->
        @lang ?= undefined
        if @lang == ''
            @lang = undefined
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

class $rdf.Collection extends $rdf.Node
    constructor: (initial) ->
        @id = $rdf.NextId++ # for hashString
        @elements = []
        @closed = false
        if typeof initial != 'undefined'
            @elements.push($rdf.term(s)) for s in initial

    termType: 'collection'
    toNT: -> $rdf.NTAnonymousNodePrefix + @id
    toString: -> '(' + @elements.join(' ') + ')'

    substitute: (bindings) ->
        return new $rdf.Collection(s.substitute(bindings) for s in @elements)

    append: (el) -> @elements.push el
    unshift: (el) -> @elements.unshift el
    shift: -> @elements.shift()
    close: -> @closed = true

$rdf.Collection::sameTerm = $rdf.BlankNode::sameTerm
$rdf.Collection::compareTerm = $rdf.BlankNode::compareTerm

###
 function to transform a value into an $rdf.Node
 @param val can be an rdf.Node, a date, string, number, boolean, or undefined. RDF Nodes are returned as is,
   undefined as undefined
###
$rdf.term = (val) ->
    switch typeof val
        when 'object'
            if val instanceof Date
                d2 = (x) -> (''+(100+x))[1...3] # just two digits
                value = '' + val.getUTCFullYear() + '-' + d2(val.getUTCMonth()+1) + '-' + d2(val.getUTCDate()) +
                        'T' + d2(val.getUTCHours()) + ':'+d2(val.getUTCMinutes()) + ':' + d2(val.getUTCSeconds()) + 'Z'
                return new $rdf.Literal value, undefined, $rdf.Symbol.prototype.XSDdateTime

            else if val instanceof Array
                x = new $rdf.Collection
                x.append($rdf.term(elt)) for elt in val
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

    throw "Can't make term from #{val} of type " + typeof val

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

    substitute:(bindings) ->
        new $rdf.Statement @subject.substitute(bindings),
            @predicate.substitute(bindings),
            @object.substitute(bindings), @why

$rdf.st = (subject, predicate, object, why) ->
    new $rdf.Statement subject, predicate, object, why

class $rdf.Formula extends $rdf.Node
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
        @statements.push new $rdf.Statement(s, p, o, why)

    addStatement: (st) ->
        @statements.push st

    substitute: (bindings) ->
        g = new $rdf.Formula
        g.addStatement s.substitute(bindings) for s in @.statements
        return g

    # convenience methods
    sym: (uri, name) ->
        if name?
            throw 'This feature (kb.sym with 2 args) is removed. Do not assume prefix mappings.'
            unless $rdf.ns[uri]
                throw "The prefix #{uri} is not set in the API"
            uri = $rdf.ns[uri] + name
        new $rdf.Symbol uri
    literal: (val, lang, dt) ->
        new $rdf.Literal "#{val}", lang, dt
    bnode: (id) ->
        new $rdf.BlankNode id
    formula: ->
        new $rdf.Formula
    collection: ->
        new $rdf.Collection
    #todo: this is really badly named. @@
    # It suggests that it creates a list, when in fact it creates a collection
    list: (values) ->
        r = new $rdf.Collection
        if values
            r.append(elt) for elt in values
        return r
    variable: (name) ->
        new $rdf.Variable name
    ns: (nsuri) ->
        (ln) -> new $rdf.Symbol(nsuri + (ln ? ''))

    ###
    transform an NTriples string format into an $rdf.Node
    The bnode bit should not be used on program-external values; designed
    for internal work such as storing a bnode id in an HTML attribute.
    This will only parse the strings generated by the vaious toNT() methods.
    ###
    fromNT: (str) ->
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

    # RDFS Inference
    # These are hand-written implementations of a backward-chaining reasoner over the RDFS axioms

    transitiveClosure: (seeds, predicate, inverse) ->
        # @param seeds:   a hash of NTs of classes to start with
        # @param predicate: The property to trace though
        # @param inverse: trace inverse direction
        done = {} # classes we have looked up
        agenda = {}
        for own k, v of seeds # take a copy
            agenda[k] = v
        loop
            t = do ->
                for own p of agenda
                    return p
            unless t?
                return done
            sups = if inverse then @each(undefined, predicate, @fromNT(t)) else @each(@fromNT(t), predicate)
            for elt in sups
                s = elt.toNT()
                if s of done
                    continue
                if s of agenda
                    continue
                agenda[s] = agenda[t]
            done[t] = agenda[t]
            delete agenda[t]

    ###
    For thisClass or any subclass, anything which has it is its type
    or is the object of something which has the type as its range, or subject
    of something which has the type as its domain
    We don't bother doing subproperty (yet?)as it doesn't seeem to be used much.
    Get all the Classes of which we can RDFS-infer the subject is a member
    @returns a hash of URIs
    ###
    findMembersNT: (thisClass) ->
        seeds = {}
        seeds[thisClass.toNT()] = true
        members = {}
        for own t of @transitiveClosure(seeds, @sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true)
            for st in @statementsMatching(undefined, @sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), @fromNT(t))
                members[st.subject.toNT()] = st
            for pred in @each(undefined, @sym('http://www.w3.org/2000/01/rdf-schema#domain'), @fromNT(t))
                for st in @statementsMatching(undefined, pred)
                    members[st.subject.toNT()] = st
            for pred in @each(undefined, @sym('http://www.w3.org/2000/01/rdf-schema#range'), @fromNT(t))
                for st in @statementsMatching(undefined, pred)
                    members[st.object.toNT()] = st
        return members


    ###
    transform a collection of NTriple URIs into their URI strings
    @param t some iterable colletion of NTriple URI strings
    @return a collection of the URIs as strings
    todo: explain why it is important to go through NT
    ###
    NTtoURI: (t) ->
        uris = {}
        for own k, v of t
            uris[k[1...-1]] = v if k[0] is '<'
        return uris

    findTypeURIs: (subject) ->
        @NTtoURI @findTypesNT subject

    findMemberURIs: (subject) ->
        @NTtoURI @findMembersNT subject

    ###
    Get all the Classes of which we can RDFS-infer the subject is a member
    todo: This will loop is there is a class subclass loop (Sublass loops are not illegal)
    Returns a hash table where key is NT of type and value is statement why we think so.
    Does NOT return terms, returns URI strings.
    We use NT representations in this version because they handle blank nodes.
    ###
    findTypesNT: (subject) ->
        rdftype = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
        types = []
        for st in @statementsMatching(subject, undefined, undefined) # fast
            if st.predicate.uri is rdftype
                types[st.object.toNT()] = st
            else
                # $rdf.log.warn('types: checking predicate ' + st.predicate.uri)
                for range in @each(st.predicate, @sym('http://www.w3.org/2000/01/rdf-schema#domain'))
                    types[range.toNT()] = st # A pointer to one part of the inference only
        for st in @statementsMatching(undefined, undefined, subject) # fast
            for domain in @each(st.predicate, @sym('http://www.w3.org/2000/01/rdf-schema#range'))
                types[domain.toNT()] = st
        return @transitiveClosure(types, @sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false)

    ###
    Get all the Classes of which we can RDFS-infer the subject is a subclass
    Returns a hash table where key is NT of type and value is statement why we think so.
    Does NOT return terms, returns URI strings.
    We use NT representations in this version because they handle blank nodes.
    ###
    findSuperClassesNT: (subject) ->
        types = []
        types[subject.toNT()] = true
        return @transitiveClosure(types, @sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false)

    ###
    Get all the Classes of which we can RDFS-infer the subject is a superclass
    Returns a hash table where key is NT of type and value is statement why we think so.
    Does NOT return terms, returns URI strings.
    We use NT representations in this version because they handle blank nodes.
    ###
    findSubClassesNT: (subject) ->
        types = []
        types[subject.toNT()] = true
        return @transitiveClosure(types, @sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true)

    ###
    Find the types in the list which have no *stored* supertypes
    We exclude the universal class, owl:Things and rdf:Resource, as it is information-free.
    ###
    topTypeURIs: (types) ->
        tops = []
        for own k, v of types
            n = 0
            for j in @each(@sym(k), @sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'))
                unless j.uri is 'http://www.w3.org/2000/01/rdf-schema#Resource'
                    n++
                    break
            unless n
                tops[k] = v
        if tops['http://www.w3.org/2000/01/rdf-schema#Resource']
            delete tops['http://www.w3.org/2000/01/rdf-schema#Resource']
        if tops['http://www.w3.org/2002/07/owl#Thing']
            delete tops['http://www.w3.org/2002/07/owl#Thing']
        return tops

    ###
    Find the types in the list which have no *stored* subtypes
    These are a set of classes which provide by themselves complete
    information -- the other classes are redundant for those who
    know the class DAG.
    ###
    bottomTypeURIs: (types) ->
        bots = []
        for own k, v of types
            subs = @each(undefined, @sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), @sym(k))
            bottom = true
            for elt in subs
                if elt.uri in types
                    bottom = false
                    break
            bots[k] = v if bottom
        return bots

#   Serialize to the given format
#
    serialize: (base, contentType, provenance) ->
        sz = $rdf.Serializer(this)
        sz.suggestNamespaces(@namespaces)
        sz.setBase(base)

        if provenance
            sts = @.statementsMatching(undefined, undefined, undefined, provenance)
        else
            sts = @statements

        switch contentType ? 'text/n3'
            when 'application/rdf+xml'
                documentString = sz.statementsToXML(sts);
            when 'text/n3', 'text/turtle'
                documentString = sz.statementsToN3(sts);
            else
                throw "serialize: Content-type "+contentType +" not supported.";

        return documentString




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

class $rdf.Variable extends $rdf.Node
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

    substitute:(bindings) ->
        bindings[@toNT()] ? this

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
    for own k, v of $rdf
        module.exports[k] = v
