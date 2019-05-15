#!/usr/bin/env node
const auth = require('solid-auth-cli')
const $rdf = require('../../') // rdflib
const store = $rdf.graph();
const fetcher = $rdf.fetcher(store,{fetch:auth.fetch})

if( process.argv.length < 4 ) {
    console.log("you must enter directories to copy from and to");
    process.exit(-1)
}
const here  = process.argv[2]
const there = process.argv[3]

console.log(`logging in`)
auth.login().then( session => {
    console.log(`logged in as <${session.webId}>`)
    fetcher.recursiveCopy( here, there, {copyACL:true} ).then( res => {
        console.log("Success! "+res);
    },e => console.log("Error copying : "+e))
},e => console.log("Error logging in : "+e))
/* END */
