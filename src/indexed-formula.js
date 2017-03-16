//  Identity management and indexing for RDF
//
// This file provides  IndexedFormula a formula (set of triples) which
// indexed by predicate, subject and object.
//
// It "smushes"  (merges into a single node) things which are identical
// according to owl:sameAs or an owl:InverseFunctionalProperty
// or an owl:FunctionalProperty
//
//
//  2005-10 Written Tim Berners-Lee
//  2007    Changed so as not to munge statements from documents when smushing
//
//
/* jsl:option explicit */
const ArrayIndexOf = require('./util').ArrayIndexOf
const Formula = require('./formula')
// const log = require('./log')
const RDFArrayRemove = require('./util').RDFArrayRemove
const Statement = require('./statement')
const Node = require('./node')
const Variable = require('./variable')

const owl_ns = 'http://www.w3.org/2002/07/owl#'
// var link_ns = 'http://www.w3.org/2007/ont/link#'

// Handle Functional Property
function handle_FP (formula, subj, pred, obj) {
  var o1 = formula.any(subj, pred, undefined)
  if (!o1) {
    return false // First time with this value
  }
  // log.warn("Equating "+o1.uri+" and "+obj.uri + " because FP "+pred.uri);  //@@
  formula.equate(o1, obj)
  return true
} // handle_FP

// Handle Inverse Functional Property
function handle_IFP (formula, subj, pred, obj) {
  var s1 = formula.any(undefined, pred, obj)
  if (!s1) {
    return false // First time with this value
  }
  // log.warn("Equating "+s1.uri+" and "+subj.uri + " because IFP "+pred.uri);  //@@
  formula.equate(s1, subj)
  return true
} // handle_IFP

function handleRDFType (formula, subj, pred, obj, why) {
  if (formula.typeCallback) {
    formula.typeCallback(formula, obj, why)
  }

  var x = formula.classActions[obj.hashString()]
  var done = false
  if (x) {
    for (var i = 0; i < x.length; i++) {
      done = done || x[i](formula, subj, pred, obj, why)
    }
  }
  return done // statement given is not needed if true
}

export default class IndexedFormula extends Formula { // IN future - allow pass array of statements to constructor
  constructor (features) {
    super()
    // this.statements = [] // As in Formula NO don't overwrite inherited
    // this.optional = []

    this.propertyActions = [] // Array of functions to call when getting statement with {s X o}
    // maps <uri> to [f(F,s,p,o),...]
    this.classActions = [] // Array of functions to call when adding { s type X }
    this.redirections = [] // redirect to lexically smaller equivalent symbol
    this.aliases = [] // reverse mapping to redirection: aliases for this
    this.HTTPRedirects = [] // redirections we got from HTTP
    this.subjectIndex = [] // Array of statements with this X as subject
    this.predicateIndex = [] // Array of statements with this X as subject
    this.objectIndex = [] // Array of statements with this X as object
    this.whyIndex = [] // Array of statements with X as provenance
    this.index = [
      this.subjectIndex,
      this.predicateIndex,
      this.objectIndex,
      this.whyIndex
    ]
    this.namespaces = {} // Dictionary of namespace prefixes
    this.features = features || [
      'sameAs',
      'InverseFunctionalProperty',
      'FunctionalProperty'
    ]
    this.initPropertyActions(this.features)
  }

  substitute (bindings) {
    var statementsCopy = this.statements.map(function (ea) {
      return ea.substitute(bindings)
    })
    // console.log('IndexedFormula subs statemnts:' + statementsCopy)
    var y = new IndexedFormula()
    y.add(statementsCopy)
    // console.log('indexed-form subs formula:' + y)
    return y
  }

  applyPatch (patch, target, patchCallback) { // patchCallback(err)
    const Query = require('./query').Query
    var targetKB = this
    var ds
    var binding = null

    // /////////// Debug strings
    /*
    var bindingDebug = function (b) {
      var str = ''
      var v
      for (v in b) {
        if (b.hasOwnProperty(v)) {
          str += '    ' + v + ' -> ' + b[v]
        }
      }
      return str
    }
*/
    var doPatch = function (onDonePatch) {
      if (patch['delete']) {
        ds = patch['delete']
        // console.log(bindingDebug(binding))
        // console.log('ds before substitute: ' + ds)
        if (binding) ds = ds.substitute(binding)
        // console.log('applyPatch: delete: ' + ds)
        ds = ds.statements
        var bad = []
        var ds2 = ds.map(function (st) { // Find the actual statemnts in the store
          var sts = targetKB.statementsMatching(st.subject, st.predicate, st.object, target)
          if (sts.length === 0) {
            // log.info("NOT FOUND deletable " + st)
            bad.push(st)
            return null
          } else {
            // log.info("Found deletable " + st)
            return sts[0]
          }
        })
        if (bad.length) {
          // console.log('Could not find to delete ' + bad.length + 'statements')
          // console.log('despite ' + targetKB.statementsMatching(bad[0].subject, bad[0].predicate)[0])
          return patchCallback('Could not find to delete: ' + bad.join('\n or '))
        }
        ds2.map(function (st) {
          targetKB.remove(st)
        })
      }
      if (patch['insert']) {
        // log.info("doPatch insert "+patch['insert'])
        ds = patch['insert']
        if (binding) ds = ds.substitute(binding)
        ds = ds.statements
        ds.map(function (st) {
          st.why = target
          targetKB.add(st.subject, st.predicate, st.object, st.why)
        })
      }
      onDonePatch()
    }
    if (patch.where) {
      // log.info("Processing WHERE: " + patch.where + '\n')
      var query = new Query('patch')
      query.pat = patch.where
      query.pat.statements.map(function (st) {
        st.why = target
      })

      var bindingsFound = []

      targetKB.query(query, function onBinding (binding) {
        bindingsFound.push(binding)
        // console.log('   got a binding: ' + bindingDebug(binding))
      },
        targetKB.fetcher,
        function onDone () {
          if (bindingsFound.length === 0) {
            return patchCallback('No match found to be patched:' + patch.where)
          }
          if (bindingsFound.length > 1) {
            return patchCallback('Patch ambiguous. No patch done.')
          }
          binding = bindingsFound[0]
          doPatch(patchCallback)
        })
    } else {
      doPatch(patchCallback)
    }
  }

  declareExistential (x) {
    if (!this._existentialVariables) this._existentialVariables = []
    this._existentialVariables.push(x)
    return x
  }

  initPropertyActions (features) {
    // If the predicate is #type, use handleRDFType to create a typeCallback on the object
    this.propertyActions['<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>'] =
      [ handleRDFType ]

    // Assumption: these terms are not redirected @@fixme
    if (ArrayIndexOf(features, 'sameAs') >= 0) {
      this.propertyActions['<http://www.w3.org/2002/07/owl#sameAs>'] = [
        function (formula, subj, pred, obj, why) {
          // log.warn("Equating "+subj.uri+" sameAs "+obj.uri);  //@@
          formula.equate(subj, obj)
          return true // true if statement given is NOT needed in the store
        }
      ] // sameAs -> equate & don't add to index
    }
    if (ArrayIndexOf(features, 'InverseFunctionalProperty') >= 0) {
      this.classActions['<' + owl_ns + 'InverseFunctionalProperty>'] = [
        function (formula, subj, pred, obj, addFn) {
          // yes subj not pred!
          return formula.newPropertyAction(subj, handle_IFP)
        }
      ] // IFP -> handle_IFP, do add to index
    }
    if (ArrayIndexOf(features, 'FunctionalProperty') >= 0) {
      this.classActions['<' + owl_ns + 'FunctionalProperty>'] = [
        function (formula, subj, proj, obj, addFn) {
          return formula.newPropertyAction(subj, handle_FP)
        }
      ] // FP => handleFP, do add to index
    }
  }

  /**
   * Adds a triple to the store.
   * Returns the statement added
   * (would it be better to return the original formula for chaining?)
   */
  add (subj, pred, obj, why) {
    var i
    if (arguments.length === 1) {
      if (subj instanceof Array) {
        for (i = 0; i < subj.length; i++) {
          this.add(subj[i])
        }
      } else if (subj instanceof Statement) {
        this.add(subj.subject, subj.predicate, subj.object, subj.why)
      } else if (subj instanceof IndexedFormula) {
        this.add(subj.statements)
      }
      return this
    }
    var actions
    var st
    if (!why) {
      // system generated
      why = this.fetcher ? this.fetcher.appNode : this.sym('chrome:theSession')
    }
    subj = Node.fromValue(subj)
    pred = Node.fromValue(pred)
    obj = Node.fromValue(obj)
    why = Node.fromValue(why)
    if (this.predicateCallback) {
      this.predicateCallback(this, pred, why)
    }
    // Action return true if the statement does not need to be added
    var predHash = this.canon(pred).hashString()
    actions = this.propertyActions[predHash] // Predicate hash
    var done = false
    if (actions) {
      // alert('type: '+typeof actions +' @@ actions='+actions)
      for (i = 0; i < actions.length; i++) {
        done = done || actions[i](this, subj, pred, obj, why)
      }
    }
    if (this.holds(subj, pred, obj, why)) { // Takes time but saves duplicates
      // console.log('rdflib: Ignoring dup! {' + subj + ' ' + pred + ' ' + obj + ' ' + why + '}')
      return null // @@better to return self in all cases?
    }
    // If we are tracking provenance, every thing should be loaded into the store
    // if (done) return new Statement(subj, pred, obj, why)
    // Don't put it in the store
    // still return this statement for owl:sameAs input
    var hash = [ this.canon(subj).hashString(), predHash,
      this.canon(obj).hashString(), this.canon(why).hashString()]
    st = new Statement(subj, pred, obj, why)
    for (i = 0; i < 4; i++) {
      var ix = this.index[i]
      var h = hash[i]
      if (!ix[h]) {
        ix[h] = []
      }
      ix[h].push(st) // Set of things with this as subject, etc
    }

    // log.debug("ADDING    {"+subj+" "+pred+" "+obj+"} "+why)
    this.statements.push(st)
    return st
  }

  addAll (statements) {
    statements.forEach(quad => {
      this.add(quad.subject, quad.predicate, quad.object, quad.graph)
    })
  }
  any (s, p, o, g) {
    var st = this.anyStatementMatching(s, p, o, g)
    if (st == null) {
      return void 0
    } else if (s == null) {
      return st.subject
    } else if (p == null) {
      return st.predicate
    } else if (o == null) {
      return st.object
    }
    return void 0
  }

  anyValue (s, p, o, g) {
    var y = this.any(s, p, o, g)
    return y ? y.value : void 0
  }

  anyStatementMatching (subj, pred, obj, why) {
    var x = this.statementsMatching(subj, pred, obj, why, true)
    if (!x || x.length === 0) {
      return undefined
    }
    return x[0]
  }

  /**
   * Returns the symbol with canonical URI as smushed
   */
  canon (term) {
    if (!term) {
      return term
    }
    var y = this.redirections[term.hashString()]
    if (!y) {
      return term
    }
    return y
  }

  check () {
    this.checkStatementList(this.statements)
    for (var p = 0; p < 4; p++) {
      var ix = this.index[p]
      for (var key in ix) {
        if (ix.hasOwnProperty(key)) {
          this.checkStatementList(ix[key], p)
        }
      }
    }
  }

  /**
   * Self-consistency checking for diagnostis only
   * Is each statement properly indexed?
   */
  checkStatementList (sts, from) {
    var names = ['subject', 'predicate', 'object', 'why']
    var origin = ' found in ' + names[from] + ' index.'
    var st
    for (var j = 0; j < sts.length; j++) {
      st = sts[j]
      var term = [ st.subject, st.predicate, st.object, st.why ]
      var arrayContains = function (a, x) {
        for (var i = 0; i < a.length; i++) {
          if (a[i].subject.sameTerm(x.subject) &&
            a[i].predicate.sameTerm(x.predicate) &&
            a[i].object.sameTerm(x.object) &&
            a[i].why.sameTerm(x.why)) {
            return true
          }
        }
      }
      for (var p = 0; p < 4; p++) {
        var c = this.canon(term[p])
        var h = c.hashString()
        if (!this.index[p][h]) {
          // throw new Error('No ' + name[p] + ' index for statement ' + st + '@' + st.why + origin)
        } else {
          if (!arrayContains(this.index[p][h], st)) {
            // throw new Error('Index for ' + name[p] + ' does not have statement ' + st + '@' + st.why + origin)
          }
        }
      }
      if (!arrayContains(this.statements, st)) {
        throw new Error('Statement list does not statement ' + st + '@' + st.why + origin)
      }
    }
  }

  close () {
    return this
  }

  /**
   * replaces @template with @target and add appropriate triples (no triple
   * removed)
   * one-direction replication
   * @method copyTo
   */
  copyTo (template, target, flags) {
    if (!flags) flags = []
    var statList = this.statementsMatching(template)
    if (ArrayIndexOf(flags, 'two-direction') !== -1) {
      statList.concat(this.statementsMatching(undefined, undefined, template))
    }
    for (var i = 0; i < statList.length; i++) {
      var st = statList[i]
      switch (st.object.termType) {
        case 'NamedNode':
          this.add(target, st.predicate, st.object)
          break
        case 'Literal':
        case 'BlankNode':
        case 'Collection':
          this.add(target, st.predicate, st.object.copy(this))
      }
      if (ArrayIndexOf(flags, 'delete') !== -1) {
        this.remove(st)
      }
    }
  }

  /**
   * simplify graph in store when we realize two identifiers are equivalent
   * We replace the bigger with the smaller.
   */
  equate (u1, u2) {
    // log.warn("Equating "+u1+" and "+u2); // @@
    // @@JAMBO Must canonicalize the uris to prevent errors from a=b=c
    // 03-21-2010
    u1 = this.canon(u1)
    u2 = this.canon(u2)
    var d = u1.compareTerm(u2)
    if (!d) {
      return true // No information in {a = a}
    }
    // var big
    // var small
    if (d < 0) { // u1 less than u2
      return this.replaceWith(u2, u1)
    } else {
      return this.replaceWith(u1, u2)
    }
  }

  formula (features) {
    return new IndexedFormula(features)
  }

  /**
   * Returns the number of statements contained in this IndexedFormula.
   * (Getter proxy to this.statements).
   * Usage:
   *    ```
   *    var kb = rdf.graph()
   *    kb.length  // -> 0
   *    ```
   * @return {Number}
   */
  get length () {
    return this.statements.length
  }

  /**
   * Returns any quads matching the given arguments.
   * Standard RDFJS Taskforce method for Source objects, implemented as an
   * alias to `statementsMatching()`
   * @method match
   * @param subject {Node|String|Object}
   * @param predicate {Node|String|Object}
   * @param object {Node|String|Object}
   * @param graph {NamedNode|String}
   */
  match (subject, predicate, object, graph) {
    return this.statementsMatching(
      Node.fromValue(subject),
      Node.fromValue(predicate),
      Node.fromValue(object),
      Node.fromValue(graph)
    )
  }

  /**
   * Find out whether a given URI is used as symbol in the formula
   */
  mentionsURI (uri) {
    var hash = '<' + uri + '>'
    return (!!this.subjectIndex[hash] ||
    !!this.objectIndex[hash] ||
    !!this.predicateIndex[hash])
  }

  // Existentials are BNodes - something exists without naming
  newExistential (uri) {
    if (!uri) return this.bnode()
    var x = this.sym(uri)
    return this.declareExistential(x)
  }

  newPropertyAction (pred, action) {
    // log.debug("newPropertyAction:  "+pred)
    var hash = pred.hashString()
    if (!this.propertyActions[hash]) {
      this.propertyActions[hash] = []
    }
    this.propertyActions[hash].push(action)
    // Now apply the function to to statements already in the store
    var toBeFixed = this.statementsMatching(undefined, pred, undefined)
    var done = false
    for (var i = 0; i < toBeFixed.length; i++) { // NOT optimized - sort toBeFixed etc
      done = done || action(this, toBeFixed[i].subject, pred, toBeFixed[i].object)
    }
    return done
  }

  // Universals are Variables
  newUniversal (uri) {
    var x = this.sym(uri)
    if (!this._universalVariables) this._universalVariables = []
    this._universalVariables.push(x)
    return x
  }

  // convenience function used by N3 parser
  variable (name) {
    return new Variable(name)
  }

  /**
   * Find an unused id for a file being edited: return a symbol
   * (Note: Slow iff a lot of them -- could be O(log(k)) )
   */
  nextSymbol (doc) {
    for (var i = 0; ;i++) {
      var uri = doc.uri + '#n' + i
      if (!this.mentionsURI(uri)) return this.sym(uri)
    }
  }

  query (myQuery, callback, fetcher, onDone) {
    let indexedFormulaQuery = require('./query').indexedFormulaQuery
    return indexedFormulaQuery.call(this, myQuery, callback, fetcher, onDone)
  }

  /**
   * Finds a statement object and removes it
   */
  remove (st) {
    if (st instanceof Array) {
      for (var i = 0; i < st.length; i++) {
        this.remove(st[i])
      }
      return this
    }
    if (st instanceof IndexedFormula) {
      return this.remove(st.statements)
    }
    var sts = this.statementsMatching(st.subject, st.predicate, st.object,
      st.why)
    if (!sts.length) {
      throw new Error('Statement to be removed is not on store: ' + st)
    }
    this.removeStatement(sts[0])
    return this
  }

  /**
   * Removes all statemnts in a doc
   */
  removeDocument (doc) {
    var sts = this.statementsMatching(undefined, undefined, undefined, doc).slice() // Take a copy as this is the actual index
    for (var i = 0; i < sts.length; i++) {
      this.removeStatement(sts[i])
    }
    return this
  }

  /**
   * remove all statements matching args (within limit) *
   */
  removeMany (subj, pred, obj, why, limit) {
    // log.debug("entering removeMany w/ subj,pred,obj,why,limit = " + subj +", "+ pred+", " + obj+", " + why+", " + limit)
    var sts = this.statementsMatching(subj, pred, obj, why, false)
    // This is a subtle bug that occcured in updateCenter.js too.
    // The fact is, this.statementsMatching returns this.whyIndex instead of a copy of it
    // but for perfromance consideration, it's better to just do that
    // so make a copy here.
    var statements = []
    for (var i = 0; i < sts.length; i++) statements.push(sts[i])
    if (limit) statements = statements.slice(0, limit)
    for (i = 0; i < statements.length; i++) this.remove(statements[i])
  }

  removeMatches (subject, predicate, object, why) {
    this.removeStatements(this.statementsMatching(subject, predicate, object,
      why))
    return this
  }

  /**
   * Remove a particular statement object from the store
   *
   * st    a statement which is already in the store and indexed.
   *      Make sure you only use this for these.
   *    Otherwise, you should use remove() above.
   */
  removeStatement (st) {
    // log.debug("entering remove w/ st=" + st)
    var term = [ st.subject, st.predicate, st.object, st.why ]
    for (var p = 0; p < 4; p++) {
      var c = this.canon(term[p])
      var h = c.hashString()
      if (!this.index[p][h]) {
        // log.warn ("Statement removal: no index '+p+': "+st)
      } else {
        RDFArrayRemove(this.index[p][h], st)
      }
    }
    RDFArrayRemove(this.statements, st)
    return this
  }

  removeStatements (sts) {
    for (var i = 0; i < sts.length; i++) {
      this.remove(sts[i])
    }
    return this
  }

  /**
   * Replace big with small, obsoleted with obsoleting.
   */
  replaceWith (big, small) {
    // log.debug("Replacing "+big+" with "+small) // @@
    var oldhash = big.hashString()
    var newhash = small.hashString()
    var moveIndex = function (ix) {
      var oldlist = ix[oldhash]
      if (!oldlist) {
        return // none to move
      }
      var newlist = ix[newhash]
      if (!newlist) {
        ix[newhash] = oldlist
      } else {
        ix[newhash] = oldlist.concat(newlist)
      }
      delete ix[oldhash]
    }
    // the canonical one carries all the indexes
    for (var i = 0; i < 4; i++) {
      moveIndex(this.index[i])
    }
    this.redirections[oldhash] = small
    if (big.uri) {
      // @@JAMBO: must update redirections,aliases from sub-items, too.
      if (!this.aliases[newhash]) {
        this.aliases[newhash] = []
      }
      this.aliases[newhash].push(big) // Back link
      if (this.aliases[oldhash]) {
        for (i = 0; i < this.aliases[oldhash].length; i++) {
          this.redirections[this.aliases[oldhash][i].hashString()] = small
          this.aliases[newhash].push(this.aliases[oldhash][i])
        }
      }
      this.add(small, this.sym('http://www.w3.org/2007/ont/link#uri'), big.uri)
      // If two things are equal, and one is requested, we should request the other.
      if (this.fetcher) {
        this.fetcher.nowKnownAs(big, small)
      }
    }
    moveIndex(this.classActions)
    moveIndex(this.propertyActions)
    // log.debug("Equate done. "+big+" to be known as "+small)
    return true // true means the statement does not need to be put in
  }

  /**
   * Return all equivalent URIs by which this is known
   */
  allAliases (x) {
    var a = this.aliases[this.canon(x).hashString()] || []
    a.push(this.canon(x))
    return a
  }

  /**
   * Compare by canonical URI as smushed
   */
  sameThings (x, y) {
    if (x.sameTerm(y)) {
      return true
    }
    var x1 = this.canon(x)
    //    alert('x1='+x1)
    if (!x1) return false
    var y1 = this.canon(y)
    //    alert('y1='+y1); //@@
    if (!y1) return false
    return (x1.uri === y1.uri)
  }

  setPrefixForURI (prefix, nsuri) {
    // TODO: This is a hack for our own issues, which ought to be fixed
    // post-release
    // See http://dig.csail.mit.edu/cgi-bin/roundup.cgi/$rdf/issue227
    if (prefix === 'tab' && this.namespaces['tab']) {
      return
    } // There are files around with long badly generated prefixes like this
    if (prefix.slice(0, 2) === 'ns' || prefix.slice(0, 7) === 'default') {
      return
    }
    this.namespaces[prefix] = nsuri
  }

  /**
   * Return statements matching a pattern
   * ALL CONVENIENCE LOOKUP FUNCTIONS RELY ON THIS!
   */
  statementsMatching (subj, pred, obj, why, justOne) {
    // log.debug("Matching {"+subj+" "+pred+" "+obj+"}")
    var pat = [ subj, pred, obj, why ]
    var pattern = []
    var hash = []
    var wild = [] // wildcards
    var given = [] // Not wild
    var p
    var list
    for (p = 0; p < 4; p++) {
      pattern[p] = this.canon(Node.fromValue(pat[p]))
      if (!pattern[p]) {
        wild.push(p)
      } else {
        given.push(p)
        hash[p] = pattern[p].hashString()
      }
    }
    if (given.length === 0) {
      return this.statements
    }
    if (given.length === 1) { // Easy too, we have an index for that
      p = given[0]
      list = this.index[p][hash[p]]
      if (list && justOne) {
        if (list.length > 1) {
          list = list.slice(0, 1)
        }
      }
      list = list || []
      return list
    }
    // Now given.length is 2, 3 or 4.
    // We hope that the scale-free nature of the data will mean we tend to get
    // a short index in there somewhere!
    var best = 1e10 // really bad
    var best_i
    var i
    for (i = 0; i < given.length; i++) {
      p = given[i] // Which part we are dealing with
      list = this.index[p][hash[p]]
      if (!list) {
        return [] // No occurrences
      }
      if (list.length < best) {
        best = list.length
        best_i = i // (not p!)
      }
    }
    // Ok, we have picked the shortest index but now we have to filter it
    var best_p = given[best_i]
    var possibles = this.index[best_p][hash[best_p]]
    var check = given.slice(0, best_i).concat(given.slice(best_i + 1)) // remove best_i
    var results = []
    var parts = [ 'subject', 'predicate', 'object', 'why' ]
    for (var j = 0; j < possibles.length; j++) {
      var st = possibles[j]

      for (i = 0; i < check.length; i++) { // for each position to be checked
        p = check[i]
        if (!this.canon(st[parts[p]]).sameTerm(pattern[p])) {
          st = null
          break
        }
      }
      if (st != null) {
        results.push(st)
        if (justOne) break
      }
    }
    return results
  }

  /**
   *  A list of all the URIs by which this thing is known
   */
  uris (term) {
    var cterm = this.canon(term)
    var terms = this.aliases[cterm.hashString()]
    if (!cterm.uri) return []
    var res = [ cterm.uri ]
    if (terms) {
      for (var i = 0; i < terms.length; i++) {
        res.push(terms[i].uri)
      }
    }
    return res
  }
}

IndexedFormula.handleRDFType = handleRDFType
