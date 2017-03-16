/*      Serialization of RDF Graphs
**
** Tim Berners-Lee 2006
** This is was http://dig.csail.mit.edu/2005/ajar/ajaw/js/rdf/serialize.js
** This is or was https://github.com/linkeddata/rdflib.js/blob/master/src/serializer.js
** Licence: MIT
*/
const NamedNode = require('./named-node')
const BlankNode = require('./blank-node')
const Uri = require('./uri')
const Util = require('./util')
const XSD = require('./xsd')

var Serializer = (function () {
  var __Serializer = function (store) {
    this.flags = ''
    this.base = null

    this.prefixes = [] // suggested prefixes
    this.namespaces = [] // complementary indexes

    this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#') // XML code assumes this!
    this.suggestPrefix('xml', 'reserved:reservedForFutureUse') // XML reserves xml: in the spec.

    this.namespacesUsed = [] // Count actually used and so needed in @prefixes
    this.keywords = ['a'] // The only one we generate at the moment
    this.prefixchars = 'abcdefghijklmnopqustuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    this.incoming = null // Array not calculated yet
    this.formulas = [] // remebering original formulae from hashes
    this.store = store
  }

  __Serializer.prototype.setBase = function (base) { this.base = base; return this }

  __Serializer.prototype.setFlags = function (flags) { this.flags = flags || ''; return this }

  __Serializer.prototype.toStr = function (x) {
    var s = x.toNT()
    if (x.termType === 'Graph') {
      this.formulas[s] = x // remember as reverse does not work
    }
    return s
  }

  __Serializer.prototype.fromStr = function (s) {
    if (s[0] === '{') {
      var x = this.formulas[s]
      if (!x) console.log('No formula object for ' + s)
      return x
    }
    return this.store.fromNT(s)
  }
  /* Accumulate Namespaces
  **
  ** These are only hints.  If two overlap, only one gets used
  ** There is therefore no guarantee in general.
  */
  __Serializer.prototype.suggestPrefix = function (prefix, uri) {
    if (prefix.slice(0, 7) === 'default') return // Try to weed these out
    if (prefix.slice(0, 2) === 'ns') return //  From others inferior algos
    if (!prefix || !uri) return // empty strings not suitable
    if (prefix in this.namespaces || uri in this.prefixes) return // already used
    this.prefixes[uri] = prefix
    this.namespaces[prefix] = uri
  }

  // Takes a namespace -> prefix map
  __Serializer.prototype.suggestNamespaces = function (namespaces) {
    for (var px in namespaces) {
      this.suggestPrefix(px, namespaces[px])
      return this
    }
  }

  __Serializer.prototype.checkIntegrity = function () {
    var p, ns
    for (p in this.namespaces) {
      if (this.prefixes[this.namespaces[p]] !== p) {
        throw new Error('Serializer integity error 1: ' + p + ', ' +
        this.namespaces[p] + ', ' + this.prefixes[this.namespaces[p]] + '!')
      }
    }
    for (ns in this.prefixes) {
      if (this.namespaces[this.prefixes[ns]] !== ns) {
        throw new Error('Serializer integity error 2: ' + ns + ', ' +
        this.prefixs[ns] + ', ' + this.namespaces[this.prefixes[ns]] + '!')
      }
    }
  }

  // Make up an unused prefix for a random namespace
  __Serializer.prototype.makeUpPrefix = function (uri) {
    var p = uri
    function canUseMethod (pp) {
      if (!__Serializer.prototype.validPrefix.test(pp)) return false // bad format
      if (pp === 'ns') return false // boring
      if (pp in this.namespaces) return false // already used
      this.prefixes[uri] = pp
      this.namespaces[pp] = uri
      return pp
    }
    var canUse = canUseMethod.bind(this)

    if ('#/'.indexOf(p[p.length - 1]) >= 0) p = p.slice(0, -1)
    var slash = p.lastIndexOf('/')
    if (slash >= 0) p = p.slice(slash + 1)
    var i = 0
    while (i < p.length) {
      if (this.prefixchars.indexOf(p[i])) {
        i++
      } else {
        break
      }
    }
    p = p.slice(0, i)

    if (p.length < 6 && (canUse(p))) return p // exact is best
    if (canUse(p.slice(0, 3))) return p.slice(0, 3)
    if (canUse(p.slice(0, 2))) return p.slice(0, 2)
    if (canUse(p.slice(0, 4))) return p.slice(0, 4)
    if (canUse(p.slice(0, 1))) return p.slice(0, 1)
    if (canUse(p.slice(0, 5))) return p.slice(0, 5)
    if (!__Serializer.prototype.validPrefix.test(p)) {
      p = 'n' // Otherwise the loop below may never termimnate
    }
    for (var j = 0; ; j++) if (canUse(p.slice(0, 3) + j)) return p.slice(0, 3) + j
  }

  __Serializer.prototype.rootSubjects = function (sts) {
    var incoming = {}
    var subjects = {}
    var allBnodes = {}

    /* This scan is to find out which nodes will have to be the roots of trees
    ** in the serialized form. This will be any symbols, and any bnodes
    ** which hve more or less than one incoming arc, and any bnodes which have
    ** one incoming arc but it is an uninterrupted loop of such nodes back to itself.
    ** This should be kept linear time with repect to the number of statements.
    ** Note it does not use any indexing of the store.
    */
    for (var i = 0; i < sts.length; i++) {
      var st = sts[i]
      var checkMentions = function (x) {
        if (!incoming.hasOwnProperty(x)) incoming[x] = []
        incoming[x].push(st.subject) // List of things which will cause this to be printed
      }
      var st2 = [st.subject, st.predicate, st.object]
      st2.map(function (y) {
        if (y.termType === 'BlankNode') {
          allBnodes[y.toNT()] = true
        } else if (y.termType === 'Collection') {
          y.elements.forEach(function (z) {
            checkMentions(z) // bnodes in collections important
          })
        }
      })
      checkMentions(sts[i].object)
      var ss = subjects[this.toStr(st.subject)] // Statements with this as subject
      if (!ss) ss = []
      ss.push(st)
      subjects[this.toStr(st.subject)] = ss // Make hash. @@ too slow for formula?
    }

    var roots = []
    for (var xNT in subjects) {
      if (!subjects.hasOwnProperty(xNT)) continue
      var y = this.fromStr(xNT)
      if ((y.termType !== 'BlankNode') || !incoming[y] || (incoming[y].length !== 1)) {
        roots.push(y)
        continue
      }
    }
    this.incoming = incoming // Keep for serializing @@ Bug for nested formulas

    // Now do the scan using existing roots
    var rootsHash = {}
    for (var k = 0; k < roots.length; k++) {
      rootsHash[roots[k].toNT()] = true
    }
    return {'roots': roots, 'subjects': subjects,
    'rootsHash': rootsHash, 'incoming': incoming}
  }

  // //////////////////////////////////////////////////////

  __Serializer.prototype.toN3 = function (f) {
    return this.statementsToN3(f.statements)
  }

  __Serializer.prototype._notQNameChars = '\t\r\n !"#$%&\'()*.,+/;<=>?@[\\]^`{|}~'
  __Serializer.prototype._notNameChars =
    (__Serializer.prototype._notQNameChars + ':')

  __Serializer.prototype.explicitURI = function (uri) {
    if (this.flags.indexOf('r') < 0 && this.base) {
      uri = Uri.refTo(this.base, uri)
    } else if (this.flags.indexOf('u') >= 0) { // Unicode encoding NTriples style
      uri = backslashUify(uri)
    } else {
      uri = hexify(uri)
    }
    return '<' + uri + '>'
  }

  __Serializer.prototype.statementsToNTriples = function (sts) {
    var sorted = sts.slice()
    sorted.sort()
    var str = ''
    var rdfns = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
    var self = this
    var kb = this.store
    var termToNT = function (x) {
      if (x.termType !== 'Collection') {
        return self.atomicTermToN3(x)
      }
      var list = x.elements
      var rest = kb.sym(rdfns + 'nill')
      for (var i = list.length - 1; i >= 0; i--) {
        var bnode = new BlankNode()
        str += termToNT(bnode) + ' ' + termToNT(kb.sym(rdfns + 'first')) + ' ' + termToNT(list[i]) + '.\n'
        str += termToNT(bnode) + ' ' + termToNT(kb.sym(rdfns + 'rest')) + ' ' + termToNT(rest) + '.\n'
        rest = bnode
      }
      return self.atomicTermToN3(rest)
    }
    for (var i = 0; i < sorted.length; i++) {
      var st = sorted[i]
      var s = ''
      s += termToNT(st.subject) + ' '
      s += termToNT(st.predicate) + ' '
      s += termToNT(st.object) + ' '
      if (this.flags.indexOf('q') >= 0) { // Do quads not nrtiples
        s += termToNT(st.why) + ' '
      }
      s += '.\n'
      str += s
    }
    return str
  }

  __Serializer.prototype.statementsToN3 = function (sts) {
    var indent = 4
    var width = 80
    var kb = this.store
    // A URI Map alows us to put the type statemnts at the top.
    var uriMap = {'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'aaa:00'}
    var SPO = function (x, y) { // Do limited canonicalization of bnodes
      return Util.heavyCompareSPO(x, y, kb, uriMap)
    }
    sts.sort(SPO)

    if (this.base && !this.defaultNamespace){
      this.defaultNamespace = this.base + '#'
    }

    var predMap = {}
    if (this.flags.indexOf('s') < 0) {
      predMap['http://www.w3.org/2002/07/owl#sameAs'] = '='
    }
    if (this.flags.indexOf('t') < 0) {
      predMap['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = 'a'
    }
    if (this.flags.indexOf('i') < 0) {
      predMap['http://www.w3.org/2000/10/swap/log#implies'] = '=>'
    }
    // //////////////////////// Arrange the bits of text

    var spaces = function (n) {
      var s = ''
      for (var i = 0; i < n; i++) s += ' '
      return s
    }

    var treeToLine = function (tree) {
      var str = ''
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        var s2 = (typeof branch === 'string') ? branch : treeToLine(branch)
        // Note the space before the dot in case statement ends 123. which is in fact allowed but be conservative.
        if (i !== 0) {
          var ch = str.slice(-1) || ' '
          if (s2 === ',' || s2 === ';') {
            // no gap
          } else if (s2 === '.' && !('0123456789.'.includes(ch))) { // no gap except after number
            // no gap
          } else {
            str += ' ' // separate from previous token
          }
        }
        str += s2
      }
      return str
    }

    // Convert a nested tree of lists and strings to a string
    var treeToString = function (tree, level) {
      var str = ''
      var lastLength = 100000
      if (level === undefined) level = -1
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        if (typeof branch !== 'string') {
          var substr = treeToString(branch, level + 1)
          if (
            substr.length < 10 * (width - indent * level) &&
              substr.indexOf('"""') < 0) { // Don't mess up multiline strings
            var line = treeToLine(branch)
            if (line.length < (width - indent * level)) {
              branch = line //   Note! treat as string below
              substr = ''
            }
          }
          if (substr) lastLength = 10000
          str += substr
        }
        if (typeof branch === 'string') {
          if (branch.length === 1 && str.slice(-1) === '\n') {
            if (',.;'.indexOf(branch) >= 0) {
              str = str.slice(0, -1) + branch + '\n' //  slip punct'n on end
              lastLength += 1
              continue
            }
          }
          if (lastLength < (indent * level + 4) ||  // if new line not necessary
            lastLength + branch.length + 1 < width && ';.'.indexOf(str[str.length - 2]) < 0) { // or the string fits on last line
            str = str.slice(0, -1) + ' ' + branch + '\n' // then continue on this line
            lastLength += branch.length + 1
          } else {
            let line = spaces(indent * level) + branch
            str += line + '\n'
            lastLength = line.length
            if (level < 0) {
              str += '\n' // extra blank line
              lastLength = 100000 // don't touch
            }
          }
        }
      }
      return str
    }

    // //////////////////////////////////////////// Structure for N3
    // Convert a set of statements into a nested tree of lists and strings
    function statementListToTreeMethod (statements) {
      var stats = this.rootSubjects(statements)
      var roots = stats.roots
      var results = []
      for (var i = 0; i < roots.length; i++) {
        var root = roots[i]
        results.push(subjectTree(root, stats))
      }
      return results
    }
    var statementListToTree = statementListToTreeMethod.bind(this)

    // The tree for a subject
    function subjectTree (subject, stats) {
      if (subject.termType === 'BlankNode' && !stats.incoming[subject]) {
        return objectTree(subject, stats, true).concat(['.']) // Anonymous bnode subject
      }
      return [ termToN3(subject, stats) ].concat([propertyTree(subject, stats)]).concat(['.'])
    }
    // The property tree for a single subject or anonymous node
    function propertyTreeMethod (subject, stats) {
      var results = []
      var lastPred = null
      var sts = stats.subjects[this.toStr(subject)] || [] // relevant statements
      if (typeof sts === 'undefined') {
        throw new Error('Cant find statements for ' + subject)
      }

      var objects = []
      for (var i = 0; i < sts.length; i++) {
        var st = sts[i]
        if (st.predicate.uri === lastPred) {
          objects.push(',')
        } else {
          if (lastPred) {
            results = results.concat([objects]).concat([';'])
            objects = []
          }
          results.push(predMap[st.predicate.uri]
            ? predMap[st.predicate.uri] : termToN3(st.predicate, stats))
        }
        lastPred = st.predicate.uri
        objects.push(objectTree(st.object, stats))
      }
      results = results.concat([objects])
      return results
    }
    var propertyTree = propertyTreeMethod.bind(this)

    function objectTreeMethod (obj, stats, force) {
      if (obj.termType === 'BlankNode' &&
        (force || stats.rootsHash[obj.toNT()] === undefined)) {// if not a root
        if (stats.subjects[this.toStr(obj)]) {
          return ['[', propertyTree(obj, stats), ']']
        } else {
          return '[]'
        }
      }
      return termToN3(obj, stats)
    }
    var objectTree = objectTreeMethod.bind(this)

    function termToN3Method (expr, stats) { //
      var i, res
      switch (expr.termType) {
        case 'Graph':
          res = ['{']
          res = res.concat(statementListToTree(expr.statements))
          return res.concat(['}'])

        case 'Collection':
          res = ['(']
          for (i = 0; i < expr.elements.length; i++) {
            res.push([ objectTree(expr.elements[i], stats) ])
          }
          res.push(')')
          return res

        default:
          return this.atomicTermToN3(expr)
      }
    }
    __Serializer.prototype.termToN3 = termToN3
    var termToN3 = termToN3Method.bind(this)

    function prefixDirectivesMethod () {
      var str = ''
      if (this.defaultNamespace) {
        str += '@prefix : ' + this.explicitURI(this.defaultNamespace) + '.\n'
      }
      for (var ns in this.prefixes) {
        if (!this.prefixes.hasOwnProperty(ns)) continue
        if (!this.namespacesUsed[ns]) continue
        str += '@prefix ' + this.prefixes[ns] + ': ' + this.explicitURI(ns) +
          '.\n'
      }
      return str + '\n'
    }
    var prefixDirectives = prefixDirectivesMethod.bind(this)
    // Body of statementsToN3:
    var tree = statementListToTree(sts)
    return prefixDirectives() + treeToString(tree)
  }
  // //////////////////////////////////////////// Atomic Terms

  //  Deal with term level things and nesting with no bnode structure
  __Serializer.prototype.atomicTermToN3 = function atomicTermToN3 (expr, stats) {
    switch (expr.termType) {
      case 'BlankNode':
      case 'Variable':
        return expr.toNT()
      case 'Literal':
        var val = expr.value.toString() // should be a string already
        if (expr.datatype && this.flags.indexOf('x') < 0) { // Supress native numbers
          switch (expr.datatype.uri) {

            case 'http://www.w3.org/2001/XMLSchema#integer':
              return val

            case 'http://www.w3.org/2001/XMLSchema#decimal': // In urtle must have dot
              if (val.indexOf('.') < 0) val += '.0'
              return val

            case 'http://www.w3.org/2001/XMLSchema#double': // Must force use of 'e'
              if (val.indexOf('.') < 0) val += '.0'
              if (val.indexOf('e') < 0) val += 'e0'
              return val

            case 'http://www.w3.org/2001/XMLSchema#boolean':
              return expr.value ? 'true' : 'false'
          }
        }
        var str = this.stringToN3(expr.value)
        if (expr.language) {
          str += '@' + expr.language
        } else if (!expr.datatype.equals(XSD.string)) {
          str += '^^' + this.atomicTermToN3(expr.datatype, stats)
        }
        return str
      case 'NamedNode':
        return this.symbolToN3(expr)
      default:
        throw new Error('Internal: atomicTermToN3 cannot handle ' + expr + ' of termType: ' + expr.termType)
    }
  }

  //  stringToN3:  String escaping for N3

  __Serializer.prototype.validPrefix = new RegExp(/^[a-zA-Z][a-zA-Z0-9]*$/)

  __Serializer.prototype.forbidden1 = new RegExp(/[\\"\b\f\r\v\t\n\u0080-\uffff]/gm)
  __Serializer.prototype.forbidden3 = new RegExp(/[\\"\b\f\r\v\u0080-\uffff]/gm)
  __Serializer.prototype.stringToN3 = function stringToN3 (str, flags) {
    if (!flags) flags = 'e'
    var res = ''
    var i, j, k
    var delim
    var forbidden
    if (str.length > 20 && // Long enough to make sense
        str.slice(-1) !== '"' && // corner case'
        flags.indexOf('n') < 0 && // Force single line
        (str.indexOf('\n') > 0 || str.indexOf('"') > 0)) {
      delim = '"""'
      forbidden = __Serializer.prototype.forbidden3
    } else {
      delim = '"'
      forbidden = __Serializer.prototype.forbidden1
    }
    for (i = 0; i < str.length;) {
      forbidden.lastIndex = 0
      var m = forbidden.exec(str.slice(i))
      if (m == null) break
      j = i + forbidden.lastIndex - 1
      res += str.slice(i, j)
      var ch = str[j]
      if (ch === '"' && delim === '"""' && str.slice(j, j + 3) !== '"""') {
        res += ch
      } else {
        k = '\b\f\r\t\v\n\\"'.indexOf(ch) // No escaping of bell (7)?
        if (k >= 0) {
          res += '\\' + 'bfrtvn\\"'[k]
        } else {
          if (flags.indexOf('e') >= 0) { // Unicode escaping in strings not unix style
            res += '\\u' + ('000' +
              ch.charCodeAt(0).toString(16).toLowerCase()).slice(-4)
          } else { // no 'e' flag
            res += ch
          }
        }
      }
      i = j + 1
    }
    return delim + res + str.slice(i) + delim
  }
  //  A single symbol, either in  <> or namespace notation

  __Serializer.prototype.symbolToN3 = function symbolToN3 (x) { // c.f. symbolString() in notation3.py
    var uri = x.uri
    var j = uri.indexOf('#')
    if (j < 0 && this.flags.indexOf('/') < 0) {
      j = uri.lastIndexOf('/')
    }
    if (j >= 0 && this.flags.indexOf('p') < 0 &&
      // Can split at namespace but only if http[s]: URI or file: or ws[s] (why not others?)
      (uri.indexOf('http') === 0 || uri.indexOf('ws') === 0 || uri.indexOf('file') === 0)) {
      var canSplit = true
      for (var k = j + 1; k < uri.length; k++) {
        if (__Serializer.prototype._notNameChars.indexOf(uri[k]) >= 0) {
          canSplit = false
          break
        }
      }
/*
      if (uri.slice(0, j + 1) === this.base + '#') { // base-relative
        if (canSplit) {
          return ':' + uri.slice(j + 1) // assume deafult ns is local
        } else {
          return '<#' + uri.slice(j + 1) + '>'
        }
      }
*/
      if (canSplit) {
        var localid = uri.slice(j + 1)
        var namesp = uri.slice(0, j + 1)
        if (this.defaultNamespace && this.defaultNamespace === namesp &&
            this.flags.indexOf('d') < 0) { // d -> suppress default
          if (this.flags.indexOf('k') >= 0 &&
            this.keyords.indexOf(localid) < 0) {
            return localid
          }
          return ':' + localid
        }
        // this.checkIntegrity() //  @@@ Remove when not testing
        var prefix = this.prefixes[namesp]
        if (!prefix) prefix = this.makeUpPrefix(namesp)
        if (prefix) {
          this.namespacesUsed[namesp] = true
          return prefix + ':' + localid
        }
      // Fall though if can't do qname
      }
    }
    return this.explicitURI(uri)
  }
  // String escaping utilities

  function hexify (str) { // also used in parser
    return encodeURI(str)
  }

  function backslashUify (str) {
    var res = ''
    var k
    for (var i = 0; i < str.length; i++) {
      k = str.charCodeAt(i)
      if (k > 65535) {
        res += '\\U' + ('00000000' + k.toString(16)).slice(-8) // convert to upper?
      } else if (k > 126) {
        res += '\\u' + ('0000' + k.toString(16)).slice(-4)
      } else {
        res += str[i]
      }
    }
    return res
  }

  // /////////////////////////// Quad store serialization

  // @para. write  - a function taking a single string to be output
  //
  __Serializer.prototype.writeStore = function (write) {
    var kb = this.store
    var fetcher = kb.fetcher
    var session = fetcher && fetcher.appNode

    // The core data

    var sources = this.store.index[3]
    for (var s in sources) { // -> assume we can use -> as short for log:semantics
      var source = kb.fromNT(s)
      if (session && source.sameTerm(session)) continue
      write('\n' + this.atomicTermToN3(source) + ' ' +
        this.atomicTermToN3(kb.sym('http://www.w3.org/2000/10/swap/log#semantics')) +
          ' { ' + this.statementsToN3(kb.statementsMatching(
          undefined, undefined, undefined, source)) + ' }.\n')
    }

    // The metadata from HTTP interactions:

    kb.statementsMatching(undefined,
      kb.sym('http://www.w3.org/2007/ont/link#requestedURI')).map(
      function (st) {
        write('\n<' + st.object.value + '> log:metadata {\n')
        var sts = kb.statementsMatching(undefined, undefined, undefined, st.subject)
        write(this.statementsToN3(this.statementsToN3(sts)))
        write('}.\n')
      })

    // Inferences we have made ourselves not attributable to anyone else

    var metaSources = []
    if (session) metaSources.push(session)
    var metadata = []
    metaSources.map(function (source) {
      metadata = metadata.concat(kb.statementsMatching(undefined, undefined, undefined, source))
    })
    write(this.statementsToN3(metadata))
  }

  // ////////////////////////////////////////////// XML serialization

  __Serializer.prototype.statementsToXML = function (sts) {
    var indent = 4
    var width = 80

    var namespaceCounts = [] // which have been used
    namespaceCounts['http://www.w3.org/1999/02/22-rdf-syntax-ns#'] = true

    var liPrefix = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#_' // prefix for ordered list items

    // //////////////////////// Arrange the bits of XML text

    var spaces = function (n) {
      var s = ''
      for (var i = 0; i < n; i++) s += ' '
      return s
    }

    var XMLtreeToLine = function (tree) {
      var str = ''
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        var s2 = (typeof branch === 'string') ? branch : XMLtreeToLine(branch)
        str += s2
      }
      return str
    }

    // Convert a nested tree of lists and strings to a string
    var XMLtreeToString = function (tree, level) {
      var str = ''
      var line
      var lastLength = 100000
      if (!level) level = 0
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        if (typeof branch !== 'string') {
          var substr = XMLtreeToString(branch, level + 1)
          if (
            substr.length < 10 * (width - indent * level) &&
            substr.indexOf('"""') < 0) { // Don't mess up multiline strings
            line = XMLtreeToLine(branch)
            if (line.length < (width - indent * level)) {
              branch = '   ' + line //   @@ Hack: treat as string below
              substr = ''
            }
          }
          if (substr) lastLength = 10000
          str += substr
        }
        if (typeof branch === 'string') {
          if (lastLength < (indent * level + 4)) { // continue
            str = str.slice(0, -1) + ' ' + branch + '\n'
            lastLength += branch.length + 1
          } else {
            line = spaces(indent * level) + branch
            str += line + '\n'
            lastLength = line.length
          }
        } else { // not string
        }
      }
      return str
    }

    function statementListToXMLTreeMethod (statements) {
      this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
      var stats = this.rootSubjects(statements)
      var roots = stats.roots
      var results = []
      for (var i = 0; i < roots.length; i++) {
        var root = roots[i]
        results.push(subjectXMLTree(root, stats))
      }
      return results
    }
    var statementListToXMLTree = statementListToXMLTreeMethod.bind(this)

    function escapeForXML (str) {
      if (typeof str === 'undefined') return '@@@undefined@@@@'
      return str.replace(/[&<"]/g, function (m) {
        switch (m[0]) {
          case '&':
            return '&amp;'
          case '<':
            return '&lt;'
          case '"':
            return '&quot;' // '
        }
      })
    }

    function relURIMethod (term) {
      return escapeForXML((this.base) ? Util.uri.refTo(this.base, term.uri) : term.uri)
    }
    var relURI = relURIMethod.bind(this)

    // The tree for a subject
    function subjectXMLTreeMethod (subject, stats) {
      var results = []
      var type, t, st, pred
      var sts = stats.subjects[this.toStr(subject)] // relevant statements
      if (typeof sts === 'undefined') { // empty bnode
        return propertyXMLTree(subject, stats)
      }

      // Sort only on the predicate, leave the order at object
      // level undisturbed.  This leaves multilingual content in
      // the order of entry (for partner literals), which helps
      // readability.
      //
      // For the predicate sort, we attempt to split the uri
      // as a hint to the sequence
      sts.sort(function (a, b) {
        var ap = a.predicate.uri
        var bp = b.predicate.uri
        if (ap.substring(0, liPrefix.length) === liPrefix || bp.substring(0, liPrefix.length) === liPrefix) { // we're only interested in sorting list items
          return ap.localeCompare(bp)
        }

        var as = ap.substring(liPrefix.length)
        var bs = bp.substring(liPrefix.length)
        var an = parseInt(as, 10)
        var bn = parseInt(bs, 10)
        if (isNaN(an) || isNaN(bn) ||
          an !== as || bn !== bs) { // we only care about integers
          return ap.localeCompare(bp)
        }

        return an - bn
      })

      for (var i = 0; i < sts.length; i++) {
        st = sts[i]
        // look for a type
        if (st.predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && !type && st.object.termType === 'symbol') {
          type = st.object
          continue // don't include it as a child element
        }

        // see whether predicate can be replaced with "li"
        pred = st.predicate
        if (pred.uri.substr(0, liPrefix.length) === liPrefix) {
          var number = pred.uri.substr(liPrefix.length)
          // make sure these are actually numeric list items
          var intNumber = parseInt(number, 10)
          if (number === intNumber.toString()) {
            // was numeric; don't need to worry about ordering since we've already
            // sorted the statements
            pred = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#li')
          }
        }

        t = qname(pred)
        switch (st.object.termType) {
          case 'BlankNode':
            if (stats.incoming[st.object].length === 1) { // there should always be something in the incoming array for a bnode
              results = results.concat(['<' + t + ' rdf:parseType="Resource">',
                subjectXMLTree(st.object, stats),
                '</' + t + '>'])
            } else {
              results = results.concat(['<' + t + ' rdf:nodeID="' +
                st.object.toNT().slice(2) + '"/>'])
            }
            break
          case 'NamedNode':
            results = results.concat(['<' + t + ' rdf:resource="' +
              relURI(st.object) + '"/>'])
            break
          case 'Literal':
            results = results.concat(['<' + t +
            (st.object.datatype.equals(XSD.string)
              ? ''
              : ' rdf:datatype="' + escapeForXML(st.object.datatype.uri) + '"') +
            (st.object.language ? ' xml:lang="' + st.object.language + '"' : '') +
            '>' + escapeForXML(st.object.value) +
            '</' + t + '>'])
            break
          case 'Collection':
            results = results.concat(['<' + t + ' rdf:parseType="Collection">',
              collectionXMLTree(st.object, stats),
              '</' + t + '>'])
            break
          default:
            throw new Error("Can't serialize object of type " + st.object.termType + ' into XML')
        } // switch
      }

      var tag = type ? qname(type) : 'rdf:Description'

      var attrs = ''
      if (subject.termType === 'BlankNode') {
        if (!stats.incoming[subject] || stats.incoming[subject].length !== 1) { // not an anonymous bnode
          attrs = ' rdf:nodeID="' + subject.toNT().slice(2) + '"'
        }
      } else {
        attrs = ' rdf:about="' + relURI(subject) + '"'
      }

      return [ '<' + tag + attrs + '>' ].concat([results]).concat(['</' + tag + '>'])
    }

    var subjectXMLTree = subjectXMLTreeMethod.bind(this)

    function collectionXMLTree (subject, stats) {
      var res = []
      for (var i = 0; i < subject.elements.length; i++) {
        res.push(subjectXMLTree(subject.elements[i], stats))
      }
      return res
    }

    // The property tree for a single subject or anonymos node
    function propertyXMLTreeMethod (subject, stats) {
      var results = []
      var sts = stats.subjects[this.toStr(subject)] // relevant statements
      if (!sts) return results // No relevant statements
      sts.sort()
      for (var i = 0; i < sts.length; i++) {
        var st = sts[i]
        switch (st.object.termType) {
          case 'BlankNode':
            if (stats.rootsHash[st.object.toNT()]) { // This bnode has been done as a root -- no content here @@ what bout first time
              results = results.concat(['<' + qname(st.predicate) + ' rdf:nodeID="' + st.object.toNT().slice(2) + '">',
                '</' + qname(st.predicate) + '>'])
            } else {
              results = results.concat(['<' + qname(st.predicate) + ' rdf:parseType="Resource">',
                propertyXMLTree(st.object, stats),
                '</' + qname(st.predicate) + '>'])
            }
            break
          case 'NamedNode':
            results = results.concat(['<' + qname(st.predicate) + ' rdf:resource="' +
              relURI(st.object) + '"/>'])
            break
          case 'Literal':
            results = results.concat(['<' + qname(st.predicate) +
              (st.object.datatype.equals(XSD.string) ? '' : ' rdf:datatype="' + escapeForXML(st.object.datatype.value) + '"') +
              (st.object.language ? ' xml:lang="' + st.object.language + '"' : '') +
              '>' + escapeForXML(st.object.value) +
              '</' + qname(st.predicate) + '>'])
            break
          case 'Collection':
            results = results.concat(['<' + qname(st.predicate) + ' rdf:parseType="Collection">',
              collectionXMLTree(st.object, stats),
              '</' + qname(st.predicate) + '>'])
            break
          default:
            throw new Error("Can't serialize object of type " + st.object.termType + ' into XML')
        } // switch
      }
      return results
    }
    var propertyXMLTree = propertyXMLTreeMethod.bind(this)

    function qnameMethod (term) {
      var uri = term.uri

      var j = uri.indexOf('#')
      if (j < 0 && this.flags.indexOf('/') < 0) {
        j = uri.lastIndexOf('/')
      }
      if (j < 0) throw new Error('Cannot make qname out of <' + uri + '>')

      for (var k = j + 1; k < uri.length; k++) {
        if (__Serializer.prototype._notNameChars.indexOf(uri[k]) >= 0) {
          throw new Error('Invalid character "' + uri[k] + '" cannot be in XML qname for URI: ' + uri)
        }
      }
      var localid = uri.slice(j + 1)
      var namesp = uri.slice(0, j + 1)
      if (this.defaultNamespace && this.defaultNamespace === namesp &&
        this.flags.indexOf('d') < 0) { // d -> suppress default
        return localid
      }
      var prefix = this.prefixes[namesp]
      if (!prefix) prefix = this.makeUpPrefix(namesp)
      namespaceCounts[namesp] = true
      return prefix + ':' + localid
    }
    var qname = qnameMethod.bind(this)

    // Body of toXML:

    var tree = statementListToXMLTree(sts)
    var str = '<rdf:RDF'
    if (this.defaultNamespace) {
      str += ' xmlns="' + escapeForXML(this.defaultNamespace) + '"'
    }
    for (var ns in namespaceCounts) {
      if (!namespaceCounts.hasOwnProperty(ns)) continue
      // Rel uris in xml ns is not strictly allowed in the XMLNS spec but needed in practice often
      var ns2 = (this.base && this.flags.includes('z')) ? Util.uri.refTo(this.base, ns) : ns
      str += '\n xmlns:' + this.prefixes[ns] + '="' + escapeForXML(ns2) + '"'
    }
    str += '>'

    var tree2 = [str, tree, '</rdf:RDF>'] // @@ namespace declrations
    return XMLtreeToString(tree2, -1)
  } // End @@ body

  var Serializer = function (store) { return new __Serializer(store) }
  return Serializer
}())

module.exports = Serializer
