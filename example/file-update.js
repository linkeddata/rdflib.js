// import {SolidNodeClient} from '../../solid-node-client';
// import * as $rdf from '../';
const SolidNodeClient = require('../../../solid-node-client').SolidNodeClient;
const $rdf = require('../')
const client = new SolidNodeClient({parser:$rdf});

const store   = $rdf.graph();
const fetcher = $rdf.fetcher(store,{fetch:client.fetch.bind(client)});
const updater = new $rdf.UpdateManager(store);

let testUrl   = `file://${process.cwd()}/test.ttl`;

let subject   = store.sym(testUrl);
let predicate = store.sym('https://example.org/message');
let object    = store.literal('hello world');
let why       = subject.doc();
let newObject = store.literal('hello rdflib-via-solid-node-client world');

async function main(){
  store.add( subject, predicate, object, why );
  await fetcher.putBack( why );
  await store.remove( subject, predicate, object, why );
  show('before load');
  await fetcher.load(why)
  show('after load');
  let ins = $rdf.st( subject, predicate, newObject, why )
  let del = store.statementsMatching( subject, predicate )
  updater.update(del, ins, async (uri, ok, message, response) => {
    if(ok) {
      await fetcher.load(why);
      show('after update');
      let response = await fetcher.webOperation('DELETE',why);
      console.log("\nDelete operation returned status : "+response.status)
    }
    else {
      console.warn("Could not update :"+message)
    }
  });
}
function show(state){
  let message = store.any( subject, predicate );
  if(message) console.warn("\n",state + ' store contains '+message.value)
  else console.warn("\n",state + ' store is empty')
}
main();
