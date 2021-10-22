// Matching a formula against another formula
// Assync as well as Synchronously
//
// W3C open source licence 2005.
//
// This builds on term.js, match.js (and identity.js?)
// to allow a query of a formula.
//
// Here we introduce for the first time a subclass of term: variable.
//
// SVN ID: $Id: query.js 25116 2008-11-15 16:13:48Z timbl $

//  Variable
//
// Compare with BlankNode.  They are similar, but a variable
// stands for something whose value is to be returned.
// Also, users name variables and want the same name back when stuff is printed
/* jsl:option explicit */ // Turn on JavaScriptLint variable declaration checking

import IndexedFormula  from './store'
import { defaultGraphURI as defaultDocumentURI } from './utils/default-graph-uri'
import log from './log'
import { docpart } from './uri'

/**
 * Query class, for tracking queries the user has in the UI.
 */
export class Query {
  constructor (name, id) {
    this.pat = new IndexedFormula() // The pattern to search for
    this.vars = [] // Used by UI code but not in query.js
    //    this.orderBy = [] // Not used yet
    this.name = name
    this.id = id
  }
}

/**
 * This function will match a pattern to the current Store
 *
 * The callback function is called whenever a match is found
 * When fetcher is supplied this will be called to load from the web
 * any new nodes as they are discovered.  This will cause the query to traverse the
 * graph of linked data, sometimes called "Link Following Query"
 *
 * @param myQuery - a knowledgebase containing a pattern to use as query
 * @param callback - whenever the pattern in myQuery is met this is called with
 *  the new bindings as parameter
 * @param fetcher? - If and only if,  you want link following, give a fetcher
 *                which has been created for the quadstore being queried.
 * @param onDone -  callback when query finished
 */
export function indexedFormulaQuery (myQuery, callback, fetcher, onDone) {
  /** Debug strings
  */
  function bindingDebug (b) {
    var str = ''
    var v
    for (v in b) {
      if (b.hasOwnProperty(v)) {
        str += '    ' + v + ' -> ' + b[v]
      }
    }
    return str
  }

  function bindingsDebug (nbs) {
    var str = 'Bindings: '
    var i
    var n = nbs.length
    for (i = 0; i < n; i++) {
      str += bindingDebug(nbs[i][0]) + ';\n\t'
    }
    return str
  } // bindingsDebug

  /** Unification
   *
   * Unification finds all bindings such that when the binding is applied
   * to one term it is equal to the other.
   * @returns {Arrray}-  a list of bindings, where a binding is an associative array
   *  mapping variuable to value.
   */
  function unifyTerm (self, other, bindings, formula) {
    var actual = bindings[self]
    if (actual === undefined) { // Not mapped
      if (self.isVar) {
        var b = []
        b[self] = other
        return [[ b, null ]] // Match
      }
      actual = self
    }
    if (!actual.complexType) {
      if (formula.redirections[actual]) {
        actual = formula.redirections[actual]
      }
      if (formula.redirections[other]) {
        other = formula.redirections[other]
      }
      if (actual.equals(other) || (actual.uri && actual.uri === defaultDocumentURI)) { // Used to mean 'any graph' in a query
        return [[ [], null ]]
      }
      return []
    }
    if (self instanceof Array) {
      if (!(other instanceof Array)) {
        return []
      }
      return unifyContents(self, other, bindings)
    }
    throw new Error('query.js: oops - code not written yet')
  // return undefined;  // for lint - no jslint objects to unreachables
  //    return actual.unifyContents(other, bindings)
  } // unifyTerm

  function unifyContents (self, other, bindings, formula) {
    var nbs2
    if (self.length !== other.length) {
      return [] // no way
    }
    if (!self.length) {
      return [[ [], null ]] // Success
    }
    var nbs = unifyTerm(self[0], other[0], bindings, formula)
    if (nbs.length === 0) {
      return nbs
    }
    var res = []
    var i
    var n = nbs.length
    var nb
    var j
    var m
    var v
    var nb2
    var bindings2
    for (i = 0; i < n; i++) { // for each possibility from the first term
      nb = nbs[i][0] // new bindings
      bindings2 = []
      for (v in nb) {
        if (nb.hasOwnProperty(v)) {
          bindings2[v] = nb[v] // copy
        }
      }
      for (v in bindings) {
        if (bindings.hasOwnProperty(v)) {
          bindings2[v] = bindings[v] // copy
        }
      }
      nbs2 = unifyContents(self.slice(1), other.slice(1), bindings2, formula)
      m = nbs2.length
      for (j = 0; j < m; j++) {
        nb2 = nbs2[j][0] // @@@@ no idea whether this is used or right
        for (v in nb) {
          if (nb.hasOwnProperty(v)) {
            nb2[v] = nb[v]
          }
        }
        res.push([nb2, null])
      }
    }
    return res
  } // unifyContents

  //  Matching
  //
  // Matching finds all bindings such that when the binding is applied
  // to one term it is equal to the other term.  We only match formulae.

  /** if x is not in the bindings array, return the var; otherwise, return the bindings **/
  function bind (x, binding) {
    var y = binding[x]
    if (y === undefined) {
      return x
    }
    return y
  }

  // When there are OPTIONAL clauses, we must return bindings without them if none of them
  // succeed. However, if any of them do succeed, we should not.  (This is what branchCount()
  // tracked. The problem currently is (2011/7) that when several optionals exist, and they
  // all match, multiple sets of bindings are returned, each with one optional filled in.)

  function union (a, b) {
    var c = {}
    var x
    for (x in a) {
      if (a.hasOwnProperty(x)) {
        c[x] = a[x]
      }
    }
    for (x in b) {
      if (b.hasOwnProperty(x)) {
        c[x] = b[x]
      }
    }
    return c
  }

  function OptionalBranchJunction (originalCallback, trunkBindings) {
    this.trunkBindings = trunkBindings
    this.originalCallback = originalCallback
    this.branches = []
    // this.results = []; // result[i] is an array of bindings for branch i
    // this.done = {};  // done[i] means all/any results are in for branch i
    // this.count = {}
    return this
  }

  OptionalBranchJunction.prototype.checkAllDone = function () {
    var i
    for (i = 0; i < this.branches.length; i++) {
      if (!this.branches[i].done) {
        return
      }
    }
    log.debug('OPTIONAL BIDNINGS ALL DONE:')
    this.doCallBacks(this.branches.length - 1, this.trunkBindings)
  }
  // Recrursively generate the cross product of the bindings
  OptionalBranchJunction.prototype.doCallBacks = function (b, bindings) {
    var j
    if (b < 0) {
      return this.originalCallback(bindings)
    }
    for (j = 0; j < this.branches[b].results.length; j++) {
      this.doCallBacks(b - 1, union(bindings, this.branches[b].results[j]))
    }
  }

  // A mandatory branch is the normal one, where callbacks
  // are made immediately and no junction is needed.
  // Might be useful for onFinsihed callback for query API.
  function MandatoryBranch (callback, onDone) {
    this.count = 0
    this.success = false
    this.done = false
    // this.results = []
    this.callback = callback
    this.onDone = onDone
    // this.junction = junction
    // junction.branches.push(this)
    return this
  }

  MandatoryBranch.prototype.reportMatch = function (bindings) {
    // log.error("@@@@ query.js 1"); // @@
    this.callback(bindings)
    this.success = true
  }

  MandatoryBranch.prototype.reportDone = function () {
    this.done = true
    log.info('Mandatory query branch finished.***')
    if (this.onDone !== undefined) {
      this.onDone()
    }
  }

  // An optional branch hoards its results.
  var OptionalBranch = function (junction) {
    this.count = 0
    this.done = false
    this.results = []
    this.junction = junction
    junction.branches.push(this)
    return this
  }

  OptionalBranch.prototype.reportMatch = function (bindings) {
    this.results.push(bindings)
  }

  OptionalBranch.prototype.reportDone = function () {
    log.debug('Optional branch finished - results.length = ' + this.results.length)
    if (this.results.length === 0) { // This is what optional means: if no hits,
      this.results.push({}) // mimic success, but with no bindings
      log.debug("Optional branch FAILED - that's OK.")
    }
    this.done = true
    this.junction.checkAllDone()
  }

  /** prepare -- sets the index of the item to the possible matches
   * @param f - formula
   * @param item - an Statement, possibly w/ vars in it
   * @param bindings - Bindings so far
   * @returns false if the query fails -- there are no items that match
  */
  function prepare (f, item, bindings) {
    var terms, termIndex, i, ind
    item.nvars = 0
    item.index = null
    // if (!f.statements) log.warn("@@@ prepare: f is "+f)
    //    log.debug("Prepare: f has "+ f.statements.length)
    // log.debug("Prepare: Kb size "+f.statements.length+" Preparing "+item)

    terms = [item.subject, item.predicate, item.object, item.why]
    ind = [f.subjectIndex, f.predicateIndex, f.objectIndex, f.whyIndex]
    for (i = 0; i < 4; i++) {
      let t = terms[i]
      // console.log("  Prepare (" + t + ") "+(t in bindings))
      if (t.uri && t.uri === defaultDocumentURI) { // chrome:session
        // console.log('     query: Ignoring slot ' + i)
      } else if (t.isVar && !(bindings[t] !== undefined)) {
        item.nvars++
      } else {
        t = bind(terms[i], bindings) // returns the RDF binding if bound, otherwise itself
        // if (terms[i]!=bind(terms[i],bindings) alert("Term: "+terms[i]+"Binding: "+bind(terms[i], bindings))
        if (f.redirections[f.id(t)]) {
          t = f.redirections[f.id(t)] // redirect
        }
        termIndex = ind[i][f.id(t)]

        if (!termIndex) {
          item.index = []
          return false // Query line cannot match
        }
        if ((item.index === null) || (item.index.length > termIndex.length)) { // Find smallest index
          item.index = termIndex
        }
      }
    }

    if (item.index === null) { // All 4 are variables?
      item.index = f.statements
    }
    return true
  } // prepare

  /** sorting function -- negative if self is easier **/
  // We always prefer to start with a URI to be able to browse a graph
  // this is why we put off items with more variables till later.
  function easiestQuery (self, other) {
    if (self.nvars !== other.nvars) {
      return self.nvars - other.nvars
    }
    return self.index.length - other.index.length
  }

  var matchIndex = 0 // index
  /** matches a pattern formula against the knowledge base, e.g. to find matches for table-view
  *
  * @param f - knowledge base formula
  * @param g - pattern formula (may have vars)
  * @param bindingsSoFar  - bindings accumulated in matching to date
  * @param level - spaces to indent stuff also lets you know what level of recursion you're at
  * @param fetcher - function (term, requestedBy) If you want link following
  * @param localCallback - function(bindings, pattern, branch) called on sucess
  * @returns nothing
  *
  * Will fetch linked data from the web iff the knowledge base an associated source fetcher (f.fetcher)
  ***/
  var match = function (f, g, bindingsSoFar, level, fetcher, localCallback, branch) {
    log.debug('Match begins, Branch count now: ' + branch.count + ' for ' + branch.pattern_debug)

    // log.debug("match: f has "+f.statements.length+", g has "+g.statements.length)
    var pattern = g.statements
    if (pattern.length === 0) { // when it's satisfied all the pattern triples
      log.debug('FOUND MATCH WITH BINDINGS:' + bindingDebug(bindingsSoFar))
      if (g.optional.length === 0) {
        branch.reportMatch(bindingsSoFar)
      } else {
        log.debug('OPTIONAL: ' + g.optional)
        var junction = new OptionalBranchJunction(callback, bindingsSoFar) // @@ won't work with nested optionals? nest callbacks
        var br = []
        var b
        for (b = 0; b < g.optional.length; b++) {
          br[b] = new OptionalBranch(junction) // Allocate branches to prevent premature ending
          br[b].pattern_debug = g.optional[b] // for diagnotics only
        }
        for (b = 0; b < g.optional.length; b++) {
          br[b].count = br[b].count + 1 // Count how many matches we have yet to complete
          match(f, g.optional[b], bindingsSoFar, '', fetcher, callback, br[b])
        }
      }
      branch.count--
      log.debug('Match ends -- success , Branch count now: ' + branch.count + ' for ' + branch.pattern_debug)
      return // Success
    }

    var item
    var i
    var n = pattern.length
    // log.debug(level + "Match "+n+" left, bs so far:"+bindingDebug(bindingsSoFar))

    // Follow links from variables in query
    if (fetcher) { // Fetcher is used to fetch URIs, function first term is a URI term, second is the requester
      var id = 'match' + matchIndex++
      var fetchResource = function (requestedTerm, id) {
        var docuri = requestedTerm.uri.split('#')[0]
        fetcher.nowOrWhenFetched(docuri, undefined, function (ok, body, xhr) {
          if (!ok) {
            console.log('Error following link to <' + requestedTerm.uri + '> in query: ' + body)
          }
          match(f, g, bindingsSoFar, level, fetcher, // match not match2 to look up any others necessary.
            localCallback, branch)
        })
      }
      for (i = 0; i < n; i++) {
        item = pattern[i] // for each of the triples in the query
        if (bindingsSoFar[item.subject] !== undefined &&
            bindingsSoFar[item.subject].uri && fetcher &&
            fetcher.getState(docpart(bindingsSoFar[item.subject].uri)) === 'unrequested') {
          // fetch the subject info and return to id
          fetchResource(bindingsSoFar[item.subject], id)
          return // only look up one per line this time, but we will come back again though match
        }
        if (bindingsSoFar[item.object] !== undefined &&
            bindingsSoFar[item.object].uri && fetcher &&
            fetcher.getState(docpart(bindingsSoFar[item.object].uri)) === 'unrequested') {
          fetchResource(bindingsSoFar[item.object], id)
          return
        }
      }
    } // if fetcher
    match2(f, g, bindingsSoFar, level, fetcher, localCallback, branch)
  } // match

  var constraintsSatisfied = function (bindings, constraints) {
    var res = true
    var x
    var test
    for (x in bindings) {
      if (bindings.hasOwnProperty(x)) {
        if (constraints[x]) {
          test = constraints[x].test
          if (test && !test(bindings[x])) {
            res = false
          }
        }
      }
    }
    return res
  }

  /** match2 -- stuff after the fetch **/
  var match2 = function (f, g, bindingsSoFar, level, fetcher, callback, branch) { // post fetch
    var pattern = g.statements
    var n = pattern.length
    var i
    var k
    var nk
    var v
    var bindings2
    var newBindings1
    var item
    for (i = 0; i < n; i++) { // For each statement left in the query, run prepare
      item = pattern[i]
      // log.info('match2: item=' + item + ', bindingsSoFar=' + bindingDebug(bindingsSoFar))
      prepare(f, item, bindingsSoFar)
      // if (item.index) console.log('     item.index.length ' + item.index.length)
    }
    pattern.sort(easiestQuery)
    item = pattern[0]
    // log.debug("Sorted pattern:\n"+pattern)
    var rest = f.formula()
    rest.optional = g.optional
    rest.constraints = g.constraints
    rest.statements = pattern.slice(1) // No indexes: we will not query g.
    log.debug(level + 'match2 searching ' + item.index.length + ' for ' + item +
      '; bindings so far=' + bindingDebug(bindingsSoFar))
    // var results = []
    var c
    var nc = item.index.length
    var nbs1
    var st
    var onward = 0
    // var x
    for (c = 0; c < nc; c++) { // For each candidate statement
      st = item.index[c] // for each statement in the item's index, spawn a new match with that binding
      nbs1 = unifyContents(
        [item.subject, item.predicate, item.object, item.why],
        [st.subject, st.predicate, st.object, st.why], bindingsSoFar, f)
      log.info(level + ' From first: ' + nbs1.length + ': ' + bindingsDebug(nbs1))
      nk = nbs1.length
      // branch.count += nk
      // log.debug("Branch count bumped "+nk+" to: "+branch.count)
      for (k = 0; k < nk; k++) { // For each way that statement binds
        bindings2 = []
        newBindings1 = nbs1[k][0]
        if (!constraintsSatisfied(newBindings1, g.constraints)) {
          // branch.count--
          log.debug('Branch count CS: ' + branch.count)
        } else {
          for (v in newBindings1) {
            if (newBindings1.hasOwnProperty(v)) {
              bindings2[v] = newBindings1[v] // copy
            }
          }
          for (v in bindingsSoFar) {
            if (bindingsSoFar.hasOwnProperty(v)) {
              bindings2[v] = bindingsSoFar[v] // copy
            }
          }

          branch.count++ // Count how many matches we have yet to complete
          onward++
          match(f, rest, bindings2, level + '  ', fetcher, callback, branch) // call match
        }
      }
    }
    branch.count--
    if (onward === 0) {
      log.debug('Match2 fails completely on ' + item)
    }
    log.debug('Match2 ends, Branch count: ' + branch.count + ' for ' + branch.pattern_debug)
    if (branch.count === 0) {
      log.debug('Branch finished.')
      branch.reportDone()
    }
  } // match2
  // ////////////////////////// Body of query()  ///////////////////////
  var f = this
  log.debug('Query on ' + this.statements.length)
  var trunck = new MandatoryBranch(callback, onDone)
  trunck.count++ // count one branch to complete at the moment
  if (myQuery.sync) {
    match(f, myQuery.pat, myQuery.pat.initBindings, '', fetcher, callback, trunck)
  } else { // Give up thread: Allow other activities to run
    setTimeout(function () {
      match(f, myQuery.pat, myQuery.pat.initBindings, '', fetcher, callback, trunck)
    }, 0)
  }

   // returns nothing; callback does the work
} // query
