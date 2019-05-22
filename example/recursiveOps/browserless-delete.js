const auth    = require("solid-auth-cli")
const $rdf    = require("../../")
const store   = $rdf.graph()
const fetcher = $rdf.fetcher(store)

let targetFolder = process.argv[2];
if(!targetFolder){
    console.log("Must enter a folder to delete!")
    process.exit();
}

console.log(`logging in ...`)
auth.login().then( (session)=> {
    console.log(`logged in as <${session.webId}>`)
    console.log(`recursively deleting <${targetFolder}>`)
    fetcher.recursiveDelete(targetFolder).then( r=>{
        if(r) console.log(r)
        process.exit();
    }).catch( e=>{console.log("Error : "+e)})
})

