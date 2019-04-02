// Test rdfa parser
//
// See http://www.w3.org/TR/rdfa-syntax/  etc
//


const MANIFESTS = [ 'fetched/html4-manifest.ttl',
                    'fetched/html5-manifest.ttl',
                    'fetched/xhtml11-manifest.ttl']

const $rdf = require('./../../lib/index.js')
const auth = require('solid-auth-cli')
const fetch = auth.fetch

const mv = $rdf.Namespace('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#')
const rat = $rdf.Namespace('http://rdfa.info/vocabs/rdfa-test#')
const RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const TYPE = RDF('type')

// xconsole.log('type ' + TYPE)

var kb = $rdf.graph()
var fetcher = $rdf.fetcher(kb)
const load = fetcher.load.bind(fetcher)

const base = 'file://' + process.cwd() + '/'

function argToURI (arg) {
  const rel = encodeURI(arg)
  return $rdf.uri.join(rel, base)
}

function argToThing (arg) {
  const rel = encodeURI(arg)
  const uri = $rdf.uri.join(rel, base)
  console.log('    uri ' + uri)
  return $rdf.sym(uri)
}

function display (doc) {
  var out = $rdf.serialize(doc, kb, doc.uri, 'text/n3')
  console.log(`\n Contents of ${doc} : ` + out)
}

/* Like:
m:0178
    a r:PositiveEvaluationTest;
    rd:comment
        "Checks to make sure @prefix with multiple entires creates multiple URI mappings";
    tes:action <http://rdfa.info/test-suite/test-cases/rdfa1.1/html4/0178.html>;
    tes:name "Test 0178: Test @prefix with multiple mappings";
    tes:result <http://rdfa.info/test-suite/test-cases/rdfa1.1/html4/0178.ttl>;
    te:classification te:required.
*/

// Like http://rdfa.info/test-suite/test-cases/rdfa1.1/html4/0001.html
// or http://rdfa.info/test-suite/test-cases/rdfa1.1/xhtml1/0001.xhtml
function munge (x) {
  return $rdf.sym(x.uri.replace('http://rdfa.info/test-suite/test-cases/rdfa1.1/xhtml1/',
                                 base +  'fetched/xhtml1-rdfa1.0/'))
}

/** Convert things like
*/
function convertLists (kb, doc) {
   RDF('')
   var nils = kb.doc(null, null, null, doc)
}

async function runTest (test, number) {
    const tt = kb.the(test, TYPE)
    var name = kb.the(test, mv('name'))
    var ttt = tt.uri.split('#')[1]
    // console.log(`\n${ttt}: ${name}`)
    if (tt.sameTerm(rat('PositiveEvaluationTest'))) {
      // console.log('PositiveEvaluationTest')
      var action = kb.the(test, mv('action'))
      // console.log(' action ' + action)
      // action = munge(action)
      // console.log('    munged action ' + action)

      const result = kb.the(test, mv('result'))
      var resp = await fetch(action.uri)
      if (resp.status !== 200) {
        console.log(' fetch status ' + resp.status)
      }
      var inputText = await resp.text()
      // console.log('   input text length ' + inputText.length)

      function callback (err, x) {
        if (err) throw err
      }
      $rdf.parse(inputText, kb, action.uri, 'application/xhtml+xml', callback)
      var len = kb.statementsMatching(null, null, null, action).length
      try {
        await kb.fetcher.load(result)
      } catch (err) {
        let msg  = `${ttt} TEST DATA ERROR on test ${name}: loading expected result:🔴\n ${err}`
        console.error(msg)
        return msg
      }
      var len2 = kb.statementsMatching(null, null, null, result).length

      function asString (st) {
        return '' + st.subject.toNT() + ' ' +  st.predicate.toNT() + ' ' + st.object.toNT()
      }
      var expectedStatements = kb.statementsMatching(null, null, null, action).map(asString)
      expectedStatements.sort()
      let expected = expectedStatements.join('\n')

      var actualStatements = kb.statementsMatching(null, null, null, result).map(asString)
      actualStatements.sort()
      let actual = actualStatements.join('\n')


      var expectedCode = $rdf.serialize(result, kb, action.uri, 'text/n3')
      var foundCode = $rdf.serialize(action, kb, action.uri, 'text/n3') // Serialize from same base
      if (expected === actual) {
        console.info(`${number}) ${ttt}: ${name} passed! ✅`)
        return null
      } else {
         let msg = `${number}) ${ttt} FAIL: ${name}: parsed data differs:🔴\n###### Input:\n${inputText}\n<<<<< Expected:\n${expectedCode}\n====Found:\n${foundCode}\n >>>>>`
         console.error(msg)
         return msg
         // throw new Error(msg)
      }


    } else if (tt.sameTerm(rat('NegativeEvaluationTest'))) { // @@ codeme
      console.log('NegativeEvaluationTest')
      const action = kb.the(test, mv('action'))
      console.log(' action ' + action)
      var msg =  `${ttt} not handled yet 🔴`
      return

    } else { // other type
    throw new TypeError('Unknown test type: ' + tt)
  }
}

async function go () {
  var errors = 0, tests = 0

  //const manifest = argToThing(MANIFESTS[2])
  for (var man of MANIFESTS) {
    var manifest = argToThing(man)
    console.log(`\nInput manifest ${manifest}: `)
    await fetcher.load(manifest)
    // display(manifest)
    var sts = kb.statementsMatching(null, mv('entries'), null, manifest)
    console.log(' entries total ' + sts.length)
    if (sts.length !== 1) throw new Error('Should be just one')

    var m = sts[0].subject
    console.log('  manifest subject ' + m)

    var entryList = kb.the(m, mv('entries'), null, manifest)

    console.log('Manifest entries ' + entryList.elements.length)

    for (var test of entryList.elements) {
      tests += 1
      var err = await runTest(test, tests)
      if (err) errors += 1
      // console.log(` So far ... found ${errors} total errors in ${tests} tests `)
    }
  }

  console.log(`Found ${errors} total errors in ${tests} tests `)
  return errors
}

go().then((errors)  => process.exit(errors), (err) => {
  console.log(err)
  process.exit(-1)
})

// ENDS
