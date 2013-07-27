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

    append: (el) -> @elements.push el
    unshift: (el) -> @elements.unshift el
    shift: -> @elements.shift()
    close: -> @closed = true

$rdf.Collection::sameTerm = $rdf.BlankNode::sameTerm
$rdf.Collection::compareTerm = $rdf.BlankNode::compareTerm

###
 function to transform a value into an RDF Node, ie. a Literal, IRI, Bnode.
 @param val can be an rdf node or a date, string, number, boolean, or undefined. RDF Nodes are returned as is, as
  is undefined
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

###
  An RDF Statement composed of Subject, Predicate, Object and an optional W for the graph
  The graph identifier can be used for provenece or inference
###
class $rdf.Statement
    constructor: (subject, predicate, object, why) ->
        @subject = $rdf.term subject
        @predicate = $rdf.term predicate
        @object = $rdf.term object
        @why = why if why?
    # transforms statement to NTriples format
    toNT: -> [@subject.toNT(), @predicate.toNT(), @object.toNT()].join(' ') + ' .'
    toString: @::toNT

###
  Short cut to function for creating an rdf$Statement
###
$rdf.st = (subject, predicate, object, why) ->
    new $rdf.Statement subject, predicate, object, why

###
   set of statements, where Statements include graph locations.
   Hence also a set of graphs, including a default graph
   Forumla contain convenience methods to create RDF
###
class $rdf.Formula

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

    # convenience methods

    ###
      create an $rdf.Symbol from the uri+name
      @param uri the prefix uri as String
      @param name as String
      @return $rdf.Symbol
    ###
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
    list: (values) ->
        r = new $rdf.Collection
        if values
            r.append(elt) for elt in values
        return r
    variable: (name) ->
        new $rdf.Variable name
    # given a base string construct a function that given a string constructs an $rdf.Symbols
    # by concatenating that base and a terminal string ln
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

    ###
    Find all the values matching the undefined element in pattern (s,p,o,w)
    Only one of s p o can be undefined, and w is optional. The others must be $rdf.terms
    ###
    each: (s, p, o, w) ->
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

    ###
    Find the first value found to be matching the undefined element in pattern (s,p,o,w)
    Only one of s p o can be undefined, and w is optional. The others must be $rdf.terms
    @return the value or undefined
    ###
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
        else if !w?
            return st.why
        return undefined

    ###
      @return does the formula contain $rdf.Statement(s,p,o,w) ?
    ###
    holds: (s, p, o, w) ->
        st = @anyStatementMatching s, p, o, w
        return st?
    ###
      @param an $rdf.Statement
      @return does the formula contain the statement ?
    ###
    holdsStatement: (st) ->
        @holds st.subject, st.predicate, st.object, st.why

    the: (s, p, o, w) ->
        # the() should contain a check there is only one
        x = @any s, p, o, w
        unless x?
            $rdf.log.error "No value found for the() {#{s} #{p} #{o}}."
        return x

    ###
      @return does the formulae contain the $rdf.Statement(s,p,o,w)
    ###
    whether: (s, p, o, w) ->
        @statementsMatching(s, p, o, w, false).length

    # RDFS Inference
    # These are hand-written implementations of a backward-chaining reasoner over the RDFS axioms

    ###
     @param seeds   a hash of NTs of classes to start with
     @param predicate The property to trace though
     @param inverse trace inverse direction
    ###
    transitiveClosure: (seeds, predicate, inverse) ->
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

    findMembersNT: (thisClass) ->
        # For thisClass or any subclass, anything which has it is its type
        # or is the object of something which has the type as its range, or subject
        # of something which has the type as its domain
        # We don't bother doing subproperty (yet?)as it doesn't seeem to be used much.
        # Get all the Classes of which we can RDFS-infer the subject is a member
        # @returns hash of URIs
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

    NTtoURI: (t) ->
        uris = {}
        for own k, v of t
            uris[k[1...-1]] = v if k[0] is '<'
        return uris

    findTypeURIs: (subject) ->
        @NTtoURI @findTypesNT subject

    findMemberURIs: (subject) ->
        @NTtoURI @findMembersNT subject

    findTypesNT: (subject) ->
        # Get all the Classes of which we can RDFS-infer the subject is a member
        # ** @@ This will loop is there is a class subclass loop (Sublass loops are not illegal)
        # Returns a hash table where key is NT of type and value is statement why we think so.
        # Does NOT return terms, returns URI strings.
        # We use NT representations in this version because they handle blank nodes.
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

    findSuperClassesNT: (subject) ->
        # Get all the Classes of which we can RDFS-infer the subject is a subclass
        # Returns a hash table where key is NT of type and value is statement why we think so.
        # Does NOT return terms, returns URI strings.
        # We use NT representations in this version because they handle blank nodes.
        types = []
        types[subject.toNT()] = true
        return @transitiveClosure(types, @sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false)

    findSubClassesNT: (subject) ->
        # Get all the Classes of which we can RDFS-infer the subject is a superclass
        # Returns a hash table where key is NT of type and value is statement why we think so.
        # Does NOT return terms, returns URI strings.
        # We use NT representations in this version because they handle blank nodes.
        types = []
        types[subject.toNT()] = true
        return @transitiveClosure(types, @sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true)

    topTypeURIs: (types) ->
        # Find the types in the list which have no *stored* supertypes
        # We exclude the universal class, owl:Things and rdf:Resource, as it is information-free.
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

    bottomTypeURIs: (types) ->
        # Find the types in the list which have no *stored* subtypes
        # These are a set of classes which provide by themselves complete
        # information -- the other classes are redundant for those who
        # know the class DAG.
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
    for own k, v of $rdf
        module.exports[k] = v
