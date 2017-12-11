let fetch = require('node-fetch')
let assert = require('assert')
let path = require('path')
let tar = require('tar')
let fs = require('fs-extra')
let Mocha = require('mocha')
let Test = Mocha.Test
let Suite = Mocha.Suite
let $rdf = require('../lib/index.js')
const TARGET_DIR = path.join(__dirname, 'downloaded-turtle-tests/')
const TurtleTestRepo = 'https://www.w3.org/2013/TurtleTests/TESTS.tar.gz'
let TurtleTestManifest = path.join(TARGET_DIR, 'manifest.ttl')
let ManifestStructure = null

loadAndRunTestManifest()

function loadAndRunTestManifest () {
  fs.pathExists(TurtleTestManifest).then(manifestExists => {
    if (manifestExists) {
      runTestManifest()
    } else {
      console.log('GETting Turtle tests from ' + TurtleTestRepo)
      fetch(TurtleTestRepo)
        .then(res => {
          if (res.status === 200) {
            res.body.pipe(
              tar.x({
                strip: 1,
                cwd: TARGET_DIR
              }).on('finish', runTestManifest)
            )
          } else {
            throw Error('GET ' + TurtleTestRepo + ' yielded a ' + res.status)
          }
        })
        .catch(e => {
          throw e
        })
    }
  })
  function runTestManifest () {
    let manifestURL = 'file://' + TurtleTestManifest
    var manifestGraph = $rdf.graph()
    $rdf.fetcher(manifestGraph, {a:1}).nowOrWhenFetched(manifestURL, {}, function (ok, body, xhr) {
      console.log('Loaded  ' + manifestURL)
      const rdfs = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#')
      const rdf = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
      const mf = $rdf.Namespace('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#')
      let manifestNode = manifestGraph.the(null, rdf('type'), mf('Manifest'))
      console.log(manifestGraph.the(manifestNode, rdfs('comment'), null))

      let mocha = new Mocha
      let suite = Suite.create(mocha.suite, manifestGraph.the(manifestNode, rdfs('comment'), null).value)
      let entries = manifestGraph.the(manifestNode, mf('entries'), null).elements
      Promise.all(entries.reduce((acc, entry) => {
        switch (manifestGraph.the(entry, rdf('type'), null).value) {
        case 'http://www.w3.org/ns/rdftest#TestTurtleEval':
          let test = ['name', 'action', 'result'].reduce((t, k) => {
            t[k] = manifestGraph.the(entry, mf(k), null).value
            return t
          }, {})
          return acc.concat(Promise.all(['action', 'result'].map(k => {
            return new Promise((resolve, reject) => {
              var graph = $rdf.graph()
              $rdf.fetcher(graph, {a:1}).nowOrWhenFetched(test[k], {}, function (ok, body, xhr) {
                if (ok) {
                  resolve({ role: k, graph: graph.length })
                } else {
                  reject(Error(body))
                }
              })
            })
          })).then(pair => {
            let mochaTest = new Test(test.name, () => {
              assert.equal(pair[0].length, pair[1].length) // !! replace with graph isomorphism
            })
            suite.addTest(mochaTest)
            return [test.name].concat(pair, mochaTest)
          }).catch(e => {
            let mochaTest = new Test(test.name, done => {
              done(e)
            })
            suite.addTest(mochaTest)
            return [test.name].concat(e, mochaTest)
          }))
          
        default:
          return acc
        }
      }, [])).then(l => {
        // console.log(l)
        mocha.run()
      })
    })
  }
}

