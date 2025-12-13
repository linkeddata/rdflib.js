/*      Serialization of RDF Graphs
**
** Tim Berners-Lee 2006
** This is was http://dig.csail.mit.edu/2005/ajar/ajaw/js/rdf/serialize.js
** This is or was https://github.com/linkeddata/rdflib.js/blob/main/src/serializer.js
** Licence: MIT
*/
import * as ttl2jsonld from '@frogcat/ttl2jsonld'
import solidNs from 'solid-namespace'
import CanonicalDataFactory from './factories/canonical-data-factory'
import * as Uri from './uri'
import * as Util from './utils-js'
import { createXSD } from './xsd'


export default function createSerializer(store) {
  return new Serializer(store)
};

export class Serializer {
  constructor(store) {
    this.flags = ''
    this.base = null

    this.prefixes = [] // suggested prefixes
    this.namespaces = [] // complementary
    const nsKeys = Object.keys(solidNs())
    for (const i in nsKeys) {
      const uri = solidNs()[nsKeys[i]]('')
      const prefix = nsKeys[i]
      this.prefixes[uri] = prefix
      this.namespaces[prefix] = uri
    }

    this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#') // XML code assumes this!
    this.suggestPrefix('xml', 'reserved:reservedForFutureUse') // XML reserves xml: in the spec.

    this.namespacesUsed = [] // Count actually used and so needed in @prefixes
    this.keywords = ['a'] // The only one we generate at the moment
    this.prefixchars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    this.incoming = null // Array not calculated yet
    this.formulas = [] // remembering original formulae from hashes
    this.store = store
    this.rdfFactory = store.rdfFactory || CanonicalDataFactory
    this.xsd = createXSD(this.rdfFactory)
  }

  setBase(base) {
    this.base = base
    return this
  }

  /**
   * Set serializer behavior flags. Letters can be combined with spaces.
   * Examples: 'si', 'deinprstux', 'si dr', 'o'.
   * Notable flags:
   *  - 'o': do not abbreviate to a prefixed name when the local part contains a dot
   */
  setFlags(flags) {
    this.flags = flags || ''
    return this
  }

  toStr(x) {
    var s = x.toNT()
    if (x.termType === 'Graph') {
      this.formulas[s] = x // remember as reverse does not work
    }
    return s
  }

  fromStr(s) {
    if (s[0] === '{') {
      var x = this.formulas[s]
      if (!x) console.log('No formula object for ' + s)
      return x
    }
    return this.store.fromNT(s)
  }

  /**
   * Defines a set of [prefix, namespace] pairs to be used by this Serializer instance.
   * Overrides previous prefixes if any
   * @param namespaces
   * @return {Serializer}
   */
  setNamespaces(namespaces) {
    for (var px in namespaces) {
      this.setPrefix(px, namespaces[px])
    }
    return this
  }

  /**
   * Defines a namespace prefix, overriding any existing prefix for that URI
   * @param prefix
   * @param uri
   */
  setPrefix(prefix, uri) {
    if (prefix.slice(0, 7) === 'default') return // Try to weed these out
    if (prefix.slice(0, 2) === 'ns') return //  From others inferior algos
    if (!prefix || !uri) return // empty strings not suitable

    // remove any existing prefix targeting this uri
    // for (let existingPrefix in this.namespaces) {
    //   if (this.namespaces[existingPrefix] == uri)
    //     delete this.namespaces[existingPrefix];
    // }

    // remove any existing mapping for this prefix
    for (let existingNs in this.prefixes) {
      if (this.prefixes[existingNs] == prefix)
        delete this.prefixes[existingNs]
    }

    this.prefixes[uri] = prefix
    this.namespaces[prefix] = uri
  }


  /* Accumulate Namespaces
  **
  ** These are only hints.  If two overlap, only one gets used
  ** There is therefore no guarantee in general.
  */
  suggestPrefix(prefix, uri) {
    if (prefix.slice(0, 7) === 'default') return // Try to weed these out
    if (prefix.slice(0, 2) === 'ns') return //  From others inferior algos
    if (!prefix || !uri) return // empty strings not suitable
    if (prefix in this.namespaces || uri in this.prefixes) return // already used
    this.prefixes[uri] = prefix
    this.namespaces[prefix] = uri
  }

  // Takes a namespace -> prefix map
  suggestNamespaces(namespaces) {
    for (var px in namespaces) {
      this.suggestPrefix(px, namespaces[px])
    }
    return this
  }

  checkIntegrity() {
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
  makeUpPrefix(uri) {
    var p = uri
    function canUseMethod (pp) {
      if (!this.validPrefix.test(pp)) return false // bad format
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
      if (this.prefixchars.indexOf(p[i]) >= 0) {
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
    if (!this.validPrefix.test(p)) {
      p = 'n' // Otherwise the loop below may never termimnate
    }
    for (var j = 0; ; j++) if (canUse(p.slice(0, 3) + j)) return p.slice(0, 3) + j
  }

  rootSubjects(sts) {
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

  toN3(f) {
    return this.statementsToN3(f.statements)
  }

  _notQNameChars = '\t\r\n !"#$%&\'()*,+/;<=>?@[\\]^`{|}~' // issue#228
  _notNameChars =
    (this._notQNameChars + ':')

  // Validate if a string is a valid PN_LOCAL per Turtle 1.1 spec
  // Allows dots inside the local name but not as trailing character
  // Also allows empty local names (for URIs ending in / or #)
  isValidPNLocal(local) {
    // Empty local name is valid (e.g., ex: for http://example.com/)
    if (local.length === 0) return true
    
    // Cannot end with a dot
    if (local[local.length - 1] === '.') return false
    
    // Check each character (allow dots mid-string)
    for (var i = 0; i < local.length; i++) {
      var ch = local[i]
      // Dot is allowed unless it's the last character (checked above)
      if (ch === '.') continue
      // Other characters must not be in the blacklist
      if (this._notNameChars.indexOf(ch) >= 0) {
        return false
      }
    }
    return true
  }

  explicitURI(uri) {
    if (this.flags.indexOf('r') < 0 && this.base) {
      uri = Uri.refTo(this.base, uri)
    } else if (this.flags.indexOf('u') >= 0) { // Unicode encoding NTriples style
      uri = backslashUify(uri)
    } else {
      uri = hexify(decodeURI(uri))
    }
    return '<' + uri + '>'
  }

  statementsToNTriples(sts) {
    var sorted = sts.slice()
    sorted.sort()
    var str = ''
    var rdfns = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
    var self = this
    var kb = this.store
    var factory = this.rdfFactory
    var termToNT = function (x) {
      if (x.termType !== 'Collection') {
        return self.atomicTermToN3(x)
      }
      var list = x.elements
      var rest = kb.sym(rdfns + 'nill')
      for (var i = list.length - 1; i >= 0; i--) {
        var bnode = factory.blankNode()
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

  statementsToN3(sts) {
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
        // Note the space before the dot in case statement ends with 123 or colon. which is in fact allowed but be conservative.
        if (i !== 0) {
          var ch = str.slice(-1) || ' '
          if (s2 === ',' || s2 === ';') {
            // no gap
          } else if (s2 === '.' && !('0123456789.:'.includes(ch))) { // no gap except after number and colon
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
              str = str.slice(0, -1)
              // be conservative and ensure a whitespace between some chars and a final dot, as in treeToLine above
              if (branch == '.' && '0123456789.:'.includes(str.charAt(str.length-1))) {
                str += ' '
                lastLength += 1
              }
              str += branch + '\n' //  slip punct'n on end
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

    function objectTreeMethod(obj, stats, force) {
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

    function termToN3Method(expr, stats) { //
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
    Serializer.prototype.termToN3 = termToN3
    var termToN3 = termToN3Method.bind(this)

    function prefixDirectivesMethod () {
      var str = ''
      if (this.flags.indexOf('d') < 0 && this.defaultNamespace) {
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
  atomicTermToN3 (expr, stats) {
    switch (expr.termType) {
      case 'BlankNode':
      case 'Variable':
        return expr.toNT()
      case 'Literal':
        var val = expr.value
        if (typeof val !== 'string') {
          throw new TypeError('Value of RDF literal node must be a string')
        }
        // var val = expr.value.toString() // should be a string already
        if (expr.datatype && this.flags.indexOf('x') < 0) { // Supress native numbers
          switch (expr.datatype.uri) {

            case 'http://www.w3.org/2001/XMLSchema#integer':
              return val

            case 'http://www.w3.org/2001/XMLSchema#decimal': // In Turtle, must have dot
              if (val.indexOf('.') < 0) val += '.0'
              return val

            case 'http://www.w3.org/2001/XMLSchema#double': {
              // Must force use of 'e'
              const eNotation = val.toLowerCase().indexOf('e') > 0
              if (val.indexOf('.') < 0 && !eNotation) val += '.0'
              if (!eNotation) val += 'e0'
              return val
            }

            case 'http://www.w3.org/2001/XMLSchema#boolean':
              return expr.value === '1' ? 'true' : 'false'
          }
        }
        var str = this.stringToN3(expr.value, this.flags)
        if (expr.language) {
          str += '@' + expr.language
        } else if (!expr.datatype.equals(this.xsd.string)) {
          str += '^^' + this.atomicTermToN3(expr.datatype, stats)
        }
        return str
      case 'NamedNode':
        return this.symbolToN3(expr)
      case 'DefaultGraph':
        return ''
      default:
        throw new Error('Internal: atomicTermToN3 cannot handle ' + expr + ' of termType: ' + expr.termType)
    }
  }

  //  stringToN3:  String escaping for N3

  validPrefix = new RegExp(/^[a-zA-Z][a-zA-Z0-9]*$/)

  forbidden1 = new RegExp(/[\\"\b\f\r\v\t\n\u0080-\uffff]/gm)
  forbidden3 = new RegExp(/[\\"\b\f\r\v\u0080-\uffff]/gm)
  stringToN3(str, flags) {
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
      forbidden = this.forbidden3
    } else {
      delim = '"'
      forbidden = this.forbidden1
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

  symbolToN3 (x) { // c.f. symbolString() in notation3.py
    var uri = x.uri
    var j = uri.indexOf('#')
    if (j < 0 && this.flags.indexOf('/') < 0) {
      j = uri.lastIndexOf('/')
    }
    if (j >= 0 && this.flags.indexOf('p') < 0 &&
      // Can split at namespace but only if http[s]: URI or file: or ws[s] (why not others?)
      (uri.indexOf('http') === 0 || uri.indexOf('ws') === 0 || uri.indexOf('file') === 0)) {
      var localid = uri.slice(j + 1)
      var namesp = uri.slice(0, j + 1)
      // Don't split if namespace is just the protocol (e.g., https://)
      // A valid namespace should have content after the protocol
  var minNamespaceLength = uri.indexOf('://') + 4 // e.g., "http://x" minimum
  // Also don't split if namespace is the base directory (would serialize as relative URI)
  var baseDir = this.base ? this.base.slice(0, Math.max(this.base.lastIndexOf('/'), this.base.lastIndexOf('#')) + 1) : null
  var namespaceIsBaseDir = baseDir && namesp === baseDir
  // If flag 'o' is present, forbid dots in local part when abbreviating
  var forbidDotLocal = this.flags.indexOf('o') >= 0 && localid.indexOf('.') >= 0
  var canSplit = !namespaceIsBaseDir && !forbidDotLocal && namesp.length > minNamespaceLength && this.isValidPNLocal(localid)
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

  // /////////////////////////// Quad store serialization

  // @para. write  - a function taking a single string to be output
  //
  writeStore(write) {
    var kb = this.store
    var fetcher = kb.fetcher
    var session = fetcher && fetcher.appNode

    // The core data

    var sources = this.store.index[3]
    for (var s in sources) { // -> assume we can use -> as short for log:semantics
      var source = kb.fromNT(s)
      if (session && source.equals(session)) continue
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

  statementsToXML(sts) {
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
        if (st.predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && !type && st.object.termType === 'NamedNode') {
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
            pred = this.rdfFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#li')
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
            (st.object.language ? ' xml:lang="' + st.object.language + '"' :
              (st.object.datatype.equals(this.xsd.string)
                ? ''
                : ' rdf:datatype="' + escapeForXML(st.object.datatype.uri) + '"')) +
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
              (st.object.language ? 
                ' xml:lang="' + st.object.language + '"' :
                (st.object.datatype.equals(this.xsd.string) ? '' : ' rdf:datatype="' + escapeForXML(st.object.datatype.value) + '"')) 
              + '>' + escapeForXML(st.object.value) +
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
        if (this._notNameChars.indexOf(uri[k]) >= 0) {
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

  statementsToJsonld (sts) {
    // ttl2jsonld creates context keys for all ttl prefix
    // context keys must be absolute IRI ttl2jsonld@0.0.8
    /* function findId (itemObj) {
      if (itemObj['@id']) {
        const item = itemObj['@id'].split(':')
        if (keys[item[0]]) itemObj['@id'] = jsonldObj['@context'][item[0]] + item[1]
      }
      const itemValues = Object.values(itemObj)
      for (const i in itemValues) {
        if (typeof itemValues[i] !== 'string') { // @list contains array
          findId(itemValues[i])
        }
      }
    } */
    const turtleDoc = this.statementsToN3(sts)
    const jsonldObj = ttl2jsonld.parse(turtleDoc)
    return JSON.stringify(jsonldObj, null, 2)
  }

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
