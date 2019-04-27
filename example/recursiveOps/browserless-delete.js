#!/usr/bin/env node
const auth = require('solid-auth-cli')
const $rdf = require('../../') // rdflib
const store = $rdf.graph();
const fetcher = $rdf.fetcher(store,{fecth:auth.fetch})

if( process.argv.length < 3 ) {
    console.log("you must enter a directory to delete");
    process.exit(-1)
}
const target = process.argv[2]

console.log(`logging in`)
auth.login().then( session => {
    console.log(`logged in as <${session.webId}>`)
    fetcher.recursiveDelete( target ).then( res => {
       if(res) console.log(res)
    },e => console.log("Error deleting : "+e))
},e => console.log("Error logging in : "+e))
/* END */
