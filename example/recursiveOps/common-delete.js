if(typeof window==="undefined"){
    module.exports.run = run
    auth = require("solid-auth-cli")
    $rdf = require("../../")
}
const store   = $rdf.graph()
const fetcher = $rdf.fetcher(store)

async function run(targetFolder){
    let doIt = await isoConfirm(`Really delete <${targetFolder}>? y/n `)
    if( !doIt ){
        return Promise.reject("Aborting recursive delete ...")
    } 
    console.log(`logging in ...`)
    let session = await auth.login().catch( e=>{return Promise.reject("Error : "+e)})
    console.log(`logged in as <${session.webId}>`)
    console.log(`recursively deleting <${targetFolder}>`)
    await fetcher.recursiveDelete(targetFolder)
    return Promise.resolve("RecursiveDelete is all done!")
}
function isoConfirm(msg){
    if(typeof window != "undefined") return Promise.resolve( confirm(msg) )
    else {
        const { stdin, stdout } = process;
        return new Promise((resolve, reject) => {
            stdin.resume();
            stdout.write(msg);
            stdin.on('data', data => {
                resolve( data.toString().toLowerCase().trim()==="y" )
            });
            stdin.on('error', err => reject(err));
        });
    }
}
