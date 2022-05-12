# Using authenticated and alternate fetches in rdflib

By default, `rdflib`'s fetcher uses `cross-fetch.fetch()` to preform reads and writes.  This is a plain `fetch`, similar to `wget` or `curl`, that does not carry any authentication information.  To use `rdflib` with private Solid data that requires authentication, the user or app needs to pass a different fetch method to `rdflib`.  This approach is also useful if you have created your own fetch, such as against Dropbox or a database.                                                                       

## The solidFetch variable                                                

To use an authenticated or alternate fetch with `rdflib`

1. Load the authentication library.
2. Use it to log in to your identity provider.
3a. Set the `global.solidFetch` (or `window.solidFetch` in a browser) equal to the auth library's fetch method.
3b. OR see below to create a custom fetcher
4. Load and use `rdflib`.  All fetches will be authenticated.

_**Important Note:** Prior to `rdflib` version `2.2.9`, this variable was named `solidFetcher`, so use that with older `rdflib`s.  Going forward, please use `solidFetch`._

### A CLI (out-of-browser) Example

```javascript                                                                   
async function test() {
    const auth = new (require("solid-node-client").SolidNodeClient)();
    await auth.login( your-credentials );                             
    global.solidFetch = auth.fetch;                                   
    const $rdf = global.$rdf = require('rdflib');                     
    const kb = $rdf.graph(); 
    const fetcher = $rdf.fetcher(kb);
    await fetcher.load( some-private-url );  
}
```               

### A Browser Example

This is a fully functional script; just change the `IdP` and `privateResource` addresses.

```html
<!DOCTYPE html><html><head><meta charset="UTF-8" />                             
    <script src="https://cdn.jsdelivr.net/npm/@inrupt/solid-client-authn-browse\
r@1.11.2/dist/solid-client-authn.bundle.js"></script>                           
    <script src="https://cdn.jsdelivr.net/npm/rdflib@2.2.6/dist/rdflib.min.js">\
</script>                                                                       
</head><body>                                                                   
    <button id="login">go</button>                                              
</body>                                                                         
<script>                                                                        
    const idp = "https://solidcommunity.net";                                   
    const privateResource = "https://jeff-zucker.solidcommunity.net/private/";  
    
    // Set the fetcher:
    window.solidFetcher = solidClientAuthentication.fetch;
    
    async function main(){                                               
        const kb = $rdf.graph();                                                                                    
        const fetcher = $rdf.fetcher(kb)                                        
        try {                                                                   
          await fetcher.load(privateResource);                                  
          alert("Private resource successfully loaded");                        
        }                                                                       
        catch(e) { alert(e) }                                                   
    }                                                                           
    document.getElementById('login').onclick = ()=> {                           
        solidClientAuthentication.login({                                                            
            oidcIssuer: idp,                                                    
            redirectUrl: window.location.href,                                  
            clientName: "rdflib test"                                           
        });                                                                     
    }                                                                           
    async function handleRedirectAfterLogin() {                                 
        const session = await solidClientAuthentication.handleIncomingRedirect();                                    
        if (session.info.isLoggedIn)  main();                            
    }                                                                           
    handleRedirectAfterLogin();                                                 
</script></html>                                                                
```


##  Custom fetchers

Another way to specify an authenticated or alternate fetch is to do it when you create the fetcher object.  This method follows the same steps as the first method, with two exceptions: omit the line *`global.solidFetch = auth.fetch`*; and instead of the line *`const fetcher = $rdf.fetcher(kb)`* use :
```javascript
const fetcher = $rdf.fetcher(kb,{fetch:auth.fetch.bind(auth)});
```
Doing things this way avoids using global variables, but also means that the changes to fetch need to be added every time you create a new fetcher object.

## Currently available libraries with authenticated fetch methods

* [Inrupt's Solid-Client-Authn-Browser](https://github.com/inrupt/solid-client-js) for use in browsers
* [Inrupt's Solid-Client-Authn-Node](https://github.com/inrupt/solid-client-js) for use in `node`, when you don't need full access to the local file system
* [Solid-Node-Client](https://github.com/solid/solid-node-client) for use in `node`, when you need full access to the local file system
