import { TestHelper } from './test-helper';

let helper = new TestHelper()

helper.loadFile("t1.ttl").then((val) => {
  console.log("done");
  process.exit()
})
