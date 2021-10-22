###
# Updates-Via
###

$rdf = {} unless $rdf?

class $rdf.UpdatesSocket
    constructor: (@parent, @via) ->
        @connected = false
        @pending = {}
        @subscribed = {}
        @socket = {}
        try
            @socket = new WebSocket via
            @socket.onopen = @onOpen
            @socket.onclose = @onClose
            @socket.onmessage = @onMessage
            @socket.onerror = @onError
        catch error
            @onError error

    _decode: (q) ->
        r = {}
        for i, elt of (elt.split('=') for elt in q.split('&'))
            [k, v] = [decodeURIComponent(elt[0]), decodeURIComponent(elt[1])]
            unless r[k]?
                r[k] = []
            r[k].push v
        r

    _send: (method, uri, data) =>
        message = [method, uri, data].join ' '
        @socket.send? message

    _subscribe: (uri) =>
        @_send 'sub', uri, ''
        @subscribed[uri] = true

    onOpen: (e) =>
        @connected = true
        for uri of @pending
            delete @pending[uri]
            @_subscribe uri

    onClose: (e) =>
        @connected = false
        for uri of @subscribed
            @pending[uri] = true
        @subscribed = {}

    onMessage: (e) =>
        message = e.data.split ' '
        if message[0] is 'ping'
            @socket.send? 'pong ' + message[1...].join(' ')
        else if message[0] is 'pub'
            @parent.onUpdate message[1], @_decode(message[2])

    onError: (e) =>
#        console.log [this, 'onError', arguments]
        throw 'onError' + e
                       
    subscribe: (uri) =>
        if @connected
            @_subscribe uri
        else
            @pending[uri] = true

class $rdf.UpdatesVia
    constructor: (@fetcher) ->
        @graph = {}
        @via = {}
        @fetcher.addCallback 'headers', @onHeaders

    register: (via, uri) =>
        unless @via[via]?
            @via[via] = new $rdf.UpdatesSocket @, via
        @via[via].subscribe uri

    onHeaders: (d) =>
        return true unless d.headers?
        return true unless WebSocket?
        etag = d.headers['etag']
        via = d.headers['updates-via']
        uri = d.uri
        if etag and via
            @graph[uri] =
                etag: etag
                via: via
            @register via, uri
        return true

    onUpdate: (uri, d) =>
        @fetcher.refresh($rdf.sym uri)

if module?.exports?
    for own k, v of $rdf
        module.exports[k] = v
