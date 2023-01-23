## How the UpdateManager Works

### Non-http(s) URI

  * is editable if either

    * document has triple declaring itself `a ont:MachineEditableDocument`
    * `wac-allow` header for document supports write for current user

  * is updated using `SPARQL PATCH` if

    * the response has one of the `accept-patch` or `ms-author-via` headers listed below

  * otherwise, is updated using `PUT`


### Http(s) URI

  * is editable if both

    * `wac-allow` header for document supports write for current user
    * the response has one of the `accept-patch` or `ms-author-via` headers listed below 

  * is updated using `SPARQL PATCH` if any

    * `accept-patch` header is `application/sparql-update` 
    * `accept-patch` header is `application/sparql-update-single-match`
    * `ms-author-via` header contains the word `SPARQL`

  * is updated using `PUT` if the `ms-author-via` header contains the word `DAV`

### Web Sockets

Updates via web sockets use the `updates-via` header to send and receive. See [`../src/updates-via.js`](../src/updates-via.js)

### About Headers

Headers include information from the server about how to interact with it.  You can see the headers for any response with a command like `curl --head URI` which, on the Solid Community server, produces something like the following (note the `WAC-Allow`, `MS-Author-Via`, and `Updates-Via` headers):

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

_**Note:** Currently, `rdflib` does not support `N3-PATCH` although it is, AFAIK, the only method of update mentioned in the specs.  Fixing this would require changes to the `editable` function to accept an `N3-PATCH` header and changes to the `fire` function to enable submission of an `N3-PATCH`.  See [SolidOS Issue#185](https://github.com/SolidOS/solidos/issues/185)._

_**Also Note:** When submitting a form, `PATCH` is used **except** when re-ordering elements in an ordered list, in which case `PUT` is used._
