let targetFolder = process.argv[2];
if(!targetFolder){
    console.log("Must enter a folder to delete!")
    process.exit();
}
let common = require('./common-delete.js')
common.run(targetFolder)
   .then(r=>{console.log(r);process.exit()})
   .catch(e=>{console.log(e);process.exit()})
