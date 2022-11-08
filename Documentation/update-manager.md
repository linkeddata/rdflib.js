## How the UpdateManager Works

### Non-http(s) URI

  * is editable if 

    * document has triple declaring itself a ont:MachineEditableDocument
    * or wac-allow header for document supports write for current user

  * is updated using SPARQL PATCH if

    * the response has one of the accept-patch or ms-author-via headers listed below

  * otherwise, is updated using PUT


### Http(s) URI

  * is editable if    

    * wac-allow header for document supports write for current user
    * and the response has one of the accept-patch or ms-author-via headers listed below 

  * is updated using SPARQL PATCH if

    * accept patch header is "application/sparql-update" 
    * or accept patch header is "application/sparql-update-single-match"
    * or ms-author-via header contains the word "SPARQL"

  * is updated using PUT if the ms-author-via header contains the word "DAV"

### Web Sockets

A different mechanism for updates using web sockets uses the `updates-via` header to send and receive using sockets. See <src/updates-via>

### About Headers

Headers include information from the server about how to interact with it.  You can see the headers for any response with a command like `curl --head URI` which, on the Solid Community server produces something like this (note the `wac-allow,ms-author-via`, and `updates-via` headers):

```
HTTP/1.1 200 OK
X-Powered-By: solid-server/5.7.3
Vary: Accept, Authorization, Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Authorization, User, Location, Link, Vary, Last-Modified, ETag, Accept-Patch, Accept-Post, Updates-Via, Allow, WAC-Allow, Content-Length, WWW-Authenticate, MS-Author-Via, X-Powered-By
Allow: OPTIONS, HEAD, GET, PATCH, POST, PUT, DELETE
Link: <.acl>; rel="acl", <.meta>; rel="describedBy", <http://www.w3.org/ns/ldp#Container>; rel="type", <http://www.w3.org/ns/ldp#BasicContainer>; rel="type", <http://www.w3.org/ns/pim/space#Storage>; rel="type"
WAC-Allow: user="read",public="read"
MS-Author-Via: SPARQL
Updates-Via: wss://solidcommunity.net
Content-Type: text/html; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Wed, 19 Oct 2022 18:43:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

Note: Currently, `rdflib` does not support `N3-PATCH` although it is, AFAIK, the only method of update mentioned in the specs.  To fix this would require changes to the `editable` function to accept an `N3-PATCH` header and changes to the `fire` function to be able to submit an `N3-PATCH`.  See <https://github.com/SolidOS/solidos/issues/185>.

Also Note: When submitting a form, `PATCH` is used *except* when re-ordering elements in an ordered list, in which case `PUT` is used.
