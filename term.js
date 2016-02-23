/*
 * These are the classes corresponding to the RDF and N3 data models
 *
 * Designed to look like rdflib and cwm
 *
 * This is coffee see http://coffeescript.org
 */
var $rdf, k, v,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

if (typeof $rdf === "undefined" || $rdf === null) {
  $rdf = {};
}


/*
  the superclass of all RDF Statement objects, that is
  $rdf.Symbol, $rdf.Literal, $rdf.BlankNode
  No class extends this yet, but it could be a place to put common behavior.
 */

$rdf.Node = (function() {
  function Node() {}

  Node.prototype.substitute = function(bindings) {
    return this;
  };

  return Node;

})();

$rdf.Empty = (function(superClass) {
  extend(Empty, superClass);

  function Empty() {
    return Empty.__super__.constructor.apply(this, arguments);
  }

  Empty.prototype.termType = 'empty';

  Empty.prototype.toString = function() {
    return '()';
  };

  Empty.prototype.toNT = Empty.prototype.toString;

  return Empty;

})($rdf.Node);


/*
   A named node in an RDF graph
    todo: badly named.
    No, formally a URI is a string, this is a node whose name is a URI.
    Connolly pointed out it isa symbol on the language.
    @param uri the uri as string
 */

$rdf.Symbol = (function(superClass) {
  extend(Symbol, superClass);

  function Symbol(uri1) {
    this.uri = uri1;
  }

  Symbol.prototype.termType = 'symbol';

  Symbol.prototype.toString = function() {
    return "<" + this.uri + ">";
  };

  Symbol.prototype.toNT = Symbol.prototype.toString;

  Symbol.prototype.doc = function() {
    if (this.uri.indexOf('#') < 0) {
      return this;
    } else {
      return new $rdf.Symbol(this.uri.split('#')[0]);
    }
  };

  Symbol.prototype.dir = function() {
    var p, str;
    str = this.uri.split('#')[0]
    p = str.lastIndexOf('/');
    if (p < 0) {
      throw "dir: No slash in path: " + str;
    }
    return new $rdf.Symbol(str.slice(0, p));
  };

  Symbol.prototype.sameTerm = function(other) {
    if (!other) {
      return false;
    }
    return (this.termType === other.termType) && (this.uri === other.uri);
  };

  Symbol.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) {
      return -1;
    }
    if (this.classOrder > other.classOrder) {
      return +1;
    }
    if (this.uri < other.uri) {
      return -1;
    }
    if (this.uri > other.uri) {
      return +1;
    }
    return 0;
  };

  Symbol.prototype.XSDboolean = new Symbol('http://www.w3.org/2001/XMLSchema#boolean');

  Symbol.prototype.XSDdecimal = new Symbol('http://www.w3.org/2001/XMLSchema#decimal');

  Symbol.prototype.XSDfloat = new Symbol('http://www.w3.org/2001/XMLSchema#float');

  Symbol.prototype.XSDinteger = new Symbol('http://www.w3.org/2001/XMLSchema#integer');

  Symbol.prototype.XSDdateTime = new Symbol('http://www.w3.org/2001/XMLSchema#dateTime');

  Symbol.prototype.integer = new Symbol('http://www.w3.org/2001/XMLSchema#integer');

  return Symbol;

})($rdf.Node);

if ($rdf.NextId != null) {
  $rdf.log.error("Attempt to re-zero existing blank node id counter at " + $rdf.NextId);
} else {
  $rdf.NextId = 0;
}

$rdf.NTAnonymousNodePrefix = "_:n";

$rdf.BlankNode = (function(superClass) {
  extend(BlankNode, superClass);

  function BlankNode(id) {
    this.id = $rdf.NextId++;
    this.value = id ? id : this.id.toString();
  }

  BlankNode.prototype.termType = 'bnode';

  BlankNode.prototype.toNT = function() {
    return $rdf.NTAnonymousNodePrefix + this.id;
  };

  BlankNode.prototype.toString = BlankNode.prototype.toNT;

  BlankNode.prototype.sameTerm = function(other) {
    if (!other) {
      return false;
    }
    return (this.termType === other.termType) && (this.id === other.id);
  };

  BlankNode.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) {
      return -1;
    }
    if (this.classOrder > other.classOrder) {
      return +1;
    }
    if (this.id < other.id) {
      return -1;
    }
    if (this.id > other.id) {
      return +1;
    }
    return 0;
  };

  return BlankNode;

})($rdf.Node);

$rdf.Literal = (function(superClass) {
  extend(Literal, superClass);

  function Literal(value1, lang1, datatype) {
    this.value = value1;
    this.lang = lang1;
    this.datatype = datatype;
    if (this.lang == null) {
      this.lang = void 0;
    }
    if (this.lang === '') {
      this.lang = void 0;
    }
    if (this.datatype == null) {
      this.datatype = void 0;
    }
  }

  Literal.prototype.termType = 'literal';

  Literal.prototype.toString = function() {
    return "" + this.value;
  };

  Literal.prototype.toNT = function() {
    var str;
    str = this.value;
    if (typeof str === !'string') {
      if (typeof str === 'number') {
        return '' + str;
      }
      throw Error("Value of RDF literal is not string: " + str);
    }
    str = str.replace(/\\/g, '\\\\');
    str = str.replace(/\"/g, '\\"');
    str = str.replace(/\n/g, '\\n');
    str = "\"" + str + "\"";
    if (this.datatype) {
      str += '^^' + this.datatype.toNT();
    }
    if (this.lang) {
      str += '@' + this.lang;
    }
    return str;
  };

  Literal.prototype.sameTerm = function(other) {
    if (!other) {
      return false;
    }
    return (this.termType === other.termType) && (this.value === other.value) && (this.lang === other.lang) && ((!this.datatype && !other.datatype) || (this.datatype && this.datatype.sameTerm(other.datatype)));
  };

  Literal.prototype.compareTerm = function(other) {
    if (this.classOrder < other.classOrder) {
      return -1;
    }
    if (this.classOrder > other.classOrder) {
      return +1;
    }
    if (this.value < other.value) {
      return -1;
    }
    if (this.value > other.value) {
      return +1;
    }
    return 0;
  };

  return Literal;

})($rdf.Node);

$rdf.Collection = (function(superClass) {
  extend(Collection, superClass);

  function Collection(initial) {
    var i, len, s;
    this.id = $rdf.NextId++;
    this.elements = [];
    this.closed = false;
    if (typeof initial !== 'undefined') {
      for (i = 0, len = initial.length; i < len; i++) {
        s = initial[i];
        this.elements.push($rdf.term(s));
      }
    }
  }

  Collection.prototype.termType = 'collection';

  Collection.prototype.toNT = function() {
    return $rdf.NTAnonymousNodePrefix + this.id;
  };

  Collection.prototype.toString = function() {
    return '(' + this.elements.join(' ') + ')';
  };

  Collection.prototype.substitute = function(bindings) {
    var s;
    return new $rdf.Collection((function() {
      var i, len, ref, results1;
      ref = this.elements;
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        results1.push(s.substitute(bindings));
      }
      return results1;
    }).call(this));
  };

  Collection.prototype.append = function(el) {
    return this.elements.push(el);
  };

  Collection.prototype.unshift = function(el) {
    return this.elements.unshift(el);
  };

  Collection.prototype.shift = function() {
    return this.elements.shift();
  };

  Collection.prototype.close = function() {
    return this.closed = true;
  };

  return Collection;

})($rdf.Node);

$rdf.Collection.prototype.sameTerm = $rdf.BlankNode.prototype.sameTerm;

$rdf.Collection.prototype.compareTerm = $rdf.BlankNode.prototype.compareTerm;


/*
 function to transform a value into an $rdf.Node
 @param val can be an rdf.Node, a date, string, number, boolean, or undefined. RDF Nodes are returned as is,
   undefined as undefined
 */

$rdf.term = function(val) {
  var d2, dt, elt, i, len, value, x;
  switch (typeof val) {
    case 'object':
      if (val instanceof Date) {
        d2 = function(x) {
          return ('' + (100 + x)).slice(1, 3);
        };
        value = '' + val.getUTCFullYear() + '-' + d2(val.getUTCMonth() + 1) + '-' + d2(val.getUTCDate()) + 'T' + d2(val.getUTCHours()) + ':' + d2(val.getUTCMinutes()) + ':' + d2(val.getUTCSeconds()) + 'Z';
        return new $rdf.Literal(value, void 0, $rdf.Symbol.prototype.XSDdateTime);
      } else if (val instanceof Array) {
        x = new $rdf.Collection;
        for (i = 0, len = val.length; i < len; i++) {
          elt = val[i];
          x.append($rdf.term(elt));
        }
        return x;
      }
      return val;
    case 'string':
      return new $rdf.Literal(val);
    case 'number':
      if (('' + val).indexOf('e') >= 0) {
        dt = $rdf.Symbol.prototype.XSDfloat;
      } else if (('' + val).indexOf('.') >= 0) {
        dt = $rdf.Symbol.prototype.XSDdecimal;
      } else {
        dt = $rdf.Symbol.prototype.XSDinteger;
      }
      return new $rdf.Literal('' + val, void 0, dt);
    case 'boolean':
      return new $rdf.Literal((val ? '1' : '0'), void 0, $rdf.Symbol.prototype.XSDboolean);
    case 'undefined':
      return void 0;
  }
  throw ("Can't make term from " + val + " of type ") + typeof val;
};

$rdf.Statement = (function() {
  function Statement(subject, predicate, object, why) {
    this.subject = $rdf.term(subject);
    this.predicate = $rdf.term(predicate);
    this.object = $rdf.term(object);
    if (why != null) {
      this.why = why;
    }
  }

  Statement.prototype.toNT = function() {
    return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT()].join(' ') + ' .';
  };

  Statement.prototype.toString = Statement.prototype.toNT;

  Statement.prototype.substitute = function(bindings) {
    return new $rdf.Statement(this.subject.substitute(bindings), this.predicate.substitute(bindings), this.object.substitute(bindings), this.why);
  };

  return Statement;

})();

$rdf.st = function(subject, predicate, object, why) {
  return new $rdf.Statement(subject, predicate, object, why);
};

$rdf.Formula = (function(superClass) {
  extend(Formula, superClass);

  function Formula() {
    this.statements = [];
    this.constraints = [];
    this.initBindings = [];
    this.optional = [];
  }

  Formula.prototype.termType = 'formula';

  Formula.prototype.toNT = function() {
    return '{' + this.statements.join('\n') + '}';
  };

  Formula.prototype.toString = Formula.prototype.toNT;

  Formula.prototype.add = function(s, p, o, why) {
    return this.statements.push(new $rdf.Statement(s, p, o, why));
  };

  Formula.prototype.addStatement = function(st) {
    return this.statements.push(st);
  };

  Formula.prototype.substitute = function(bindings) {
    var g, i, len, ref, s;
    g = new $rdf.Formula;
    ref = this.statements;
    for (i = 0, len = ref.length; i < len; i++) {
      s = ref[i];
      g.addStatement(s.substitute(bindings));
    }
    return g;
  };

  Formula.prototype.sym = function(uri, name) {
    if (name != null) {
      throw 'This feature (kb.sym with 2 args) is removed. Do not assume prefix mappings.';
      if (!$rdf.ns[uri]) {
        throw "The prefix " + uri + " is not set in the API";
      }
      uri = $rdf.ns[uri] + name;
    }
    return new $rdf.Symbol(uri);
  };

  Formula.prototype.literal = function(val, lang, dt) {
    return new $rdf.Literal("" + val, lang, dt);
  };

  Formula.prototype.bnode = function(id) {
    return new $rdf.BlankNode(id);
  };

  Formula.prototype.formula = function() {
    return new $rdf.Formula;
  };

  Formula.prototype.collection = function() {
    return new $rdf.Collection;
  };

  Formula.prototype.list = function(values) {
    var elt, i, len, r;
    r = new $rdf.Collection;
    if (values) {
      for (i = 0, len = values.length; i < len; i++) {
        elt = values[i];
        r.append(elt);
      }
    }
    return r;
  };

  Formula.prototype.variable = function(name) {
    return new $rdf.Variable(name);
  };

  Formula.prototype.ns = function(nsuri) {
    return function(ln) {
      return new $rdf.Symbol(nsuri + (ln != null ? ln : ''));
    };
  };


  /*
  transform an NTriples string format into an $rdf.Node
  The bnode bit should not be used on program-external values; designed
  for internal work such as storing a bnode id in an HTML attribute.
  This will only parse the strings generated by the vaious toNT() methods.
   */

  Formula.prototype.fromNT = function(str) {
    var dt, k, lang, x;
    switch (str[0]) {
      case '<':
        return $rdf.sym(str.slice(1, -1));
      case '"':
        lang = void 0;
        dt = void 0;
        k = str.lastIndexOf('"');
        if (k < str.length - 1) {
          if (str[k + 1] === '@') {
            lang = str.slice(k + 2);
          } else if (str.slice(k + 1, k + 3) === '^^') {
            dt = $rdf.fromNT(str.slice(k + 3));
          } else {
            throw "Can't convert string from NT: " + str;
          }
        }
        str = str.slice(1, k);
        str = str.replace(/\\"/g, '"');
        str = str.replace(/\\n/g, '\n');
        str = str.replace(/\\\\/g, '\\');
        return $rdf.lit(str, lang, dt);
      case '_':
        x = new $rdf.BlankNode;
        x.id = parseInt(str.slice(3));
        $rdf.NextId--;
        return x;
      case '?':
        return new $rdf.Variable(str.slice(1));
    }
    throw "Can't convert from NT: " + str;
  };

  Formula.prototype.sameTerm = function(other) {
    if (!other) {
      return false;
    }
    return this.hashString() === other.hashString();
  };

  Formula.prototype.each = function(s, p, o, w) {
    var elt, i, l, len, len1, len2, len3, m, q, results, sts;
    results = [];
    sts = this.statementsMatching(s, p, o, w, false);
    if (s == null) {
      for (i = 0, len = sts.length; i < len; i++) {
        elt = sts[i];
        results.push(elt.subject);
      }
    } else if (p == null) {
      for (l = 0, len1 = sts.length; l < len1; l++) {
        elt = sts[l];
        results.push(elt.predicate);
      }
    } else if (o == null) {
      for (m = 0, len2 = sts.length; m < len2; m++) {
        elt = sts[m];
        results.push(elt.object);
      }
    } else if (w == null) {
      for (q = 0, len3 = sts.length; q < len3; q++) {
        elt = sts[q];
        results.push(elt.why);
      }
    }
    return results;
  };

  Formula.prototype.any = function(s, p, o, w) {
    var st;
    st = this.anyStatementMatching(s, p, o, w);
    if (st == null) {
      return void 0;
    } else if (s == null) {
      return st.subject;
    } else if (p == null) {
      return st.predicate;
    } else if (o == null) {
      return st.object;
    }
    return void 0;
  };

  Formula.prototype.holds = function(s, p, o, w) {
    var st;
    st = this.anyStatementMatching(s, p, o, w);
    return st != null;
  };

  Formula.prototype.holdsStatement = function(st) {
    return this.holds(st.subject, st.predicate, st.object, st.why);
  };

  Formula.prototype.the = function(s, p, o, w) {
    var x;
    x = this.any(s, p, o, w);
    if (x == null) {
      $rdf.log.error("No value found for the() {" + s + " " + p + " " + o + "}.");
    }
    return x;
  };

  Formula.prototype.whether = function(s, p, o, w) {
    return this.statementsMatching(s, p, o, w, false).length;
  };

  Formula.prototype.transitiveClosure = function(seeds, predicate, inverse) {
    var agenda, done, elt, i, k, len, s, sups, t, v;
    done = {};
    agenda = {};
    for (k in seeds) {
      if (!hasProp.call(seeds, k)) continue;
      v = seeds[k];
      agenda[k] = v;
    }
    while (true) {
      t = (function() {
        var p;
        for (p in agenda) {
          if (!hasProp.call(agenda, p)) continue;
          return p;
        }
      })();
      if (t == null) {
        return done;
      }
      sups = inverse ? this.each(void 0, predicate, this.fromNT(t)) : this.each(this.fromNT(t), predicate);
      for (i = 0, len = sups.length; i < len; i++) {
        elt = sups[i];
        s = elt.toNT();
        if (s in done) {
          continue;
        }
        if (s in agenda) {
          continue;
        }
        agenda[s] = agenda[t];
      }
      done[t] = agenda[t];
      delete agenda[t];
    }
  };


  /*
  For thisClass or any subclass, anything which has it is its type
  or is the object of something which has the type as its range, or subject
  of something which has the type as its domain
  We don't bother doing subproperty (yet?)as it doesn't seeem to be used much.
  Get all the Classes of which we can RDFS-infer the subject is a member
  @returns a hash of URIs
   */

  Formula.prototype.findMembersNT = function(thisClass) {
    var i, l, len, len1, len2, len3, len4, m, members, pred, q, ref, ref1, ref2, ref3, ref4, ref5, seeds, st, t, u;
    seeds = {};
    seeds[thisClass.toNT()] = true;
    members = {};
    ref = this.transitiveClosure(seeds, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true);
    for (t in ref) {
      if (!hasProp.call(ref, t)) continue;
      ref1 = this.statementsMatching(void 0, this.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), this.fromNT(t));
      for (i = 0, len = ref1.length; i < len; i++) {
        st = ref1[i];
        members[st.subject.toNT()] = st;
      }
      ref2 = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#domain'), this.fromNT(t));
      for (l = 0, len1 = ref2.length; l < len1; l++) {
        pred = ref2[l];
        ref3 = this.statementsMatching(void 0, pred);
        for (m = 0, len2 = ref3.length; m < len2; m++) {
          st = ref3[m];
          members[st.subject.toNT()] = st;
        }
      }
      ref4 = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#range'), this.fromNT(t));
      for (q = 0, len3 = ref4.length; q < len3; q++) {
        pred = ref4[q];
        ref5 = this.statementsMatching(void 0, pred);
        for (u = 0, len4 = ref5.length; u < len4; u++) {
          st = ref5[u];
          members[st.object.toNT()] = st;
        }
      }
    }
    return members;
  };


  /*
  transform a collection of NTriple URIs into their URI strings
  @param t some iterable colletion of NTriple URI strings
  @return a collection of the URIs as strings
  todo: explain why it is important to go through NT
   */

  Formula.prototype.NTtoURI = function(t) {
    var k, uris, v;
    uris = {};
    for (k in t) {
      if (!hasProp.call(t, k)) continue;
      v = t[k];
      if (k[0] === '<') {
        uris[k.slice(1, -1)] = v;
      }
    }
    return uris;
  };

  Formula.prototype.findTypeURIs = function(subject) {
    return this.NTtoURI(this.findTypesNT(subject));
  };

  Formula.prototype.findMemberURIs = function(subject) {
    return this.NTtoURI(this.findMembersNT(subject));
  };


  /*
  Get all the Classes of which we can RDFS-infer the subject is a member
  todo: This will loop is there is a class subclass loop (Sublass loops are not illegal)
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
   */

  Formula.prototype.findTypesNT = function(subject) {
    var domain, i, l, len, len1, len2, len3, m, q, range, rdftype, ref, ref1, ref2, ref3, st, types;
    rdftype = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    types = [];
    ref = this.statementsMatching(subject, void 0, void 0);
    for (i = 0, len = ref.length; i < len; i++) {
      st = ref[i];
      if (st.predicate.uri === rdftype) {
        types[st.object.toNT()] = st;
      } else {
        ref1 = this.each(st.predicate, this.sym('http://www.w3.org/2000/01/rdf-schema#domain'));
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          range = ref1[l];
          types[range.toNT()] = st;
        }
      }
    }
    ref2 = this.statementsMatching(void 0, void 0, subject);
    for (m = 0, len2 = ref2.length; m < len2; m++) {
      st = ref2[m];
      ref3 = this.each(st.predicate, this.sym('http://www.w3.org/2000/01/rdf-schema#range'));
      for (q = 0, len3 = ref3.length; q < len3; q++) {
        domain = ref3[q];
        types[domain.toNT()] = st;
      }
    }
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false);
  };


  /*
  Get all the Classes of which we can RDFS-infer the subject is a subclass
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
   */

  Formula.prototype.findSuperClassesNT = function(subject) {
    var types;
    types = [];
    types[subject.toNT()] = true;
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), false);
  };


  /*
  Get all the Classes of which we can RDFS-infer the subject is a superclass
  Returns a hash table where key is NT of type and value is statement why we think so.
  Does NOT return terms, returns URI strings.
  We use NT representations in this version because they handle blank nodes.
   */

  Formula.prototype.findSubClassesNT = function(subject) {
    var types;
    types = [];
    types[subject.toNT()] = true;
    return this.transitiveClosure(types, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), true);
  };


  /*
  Find the types in the list which have no *stored* supertypes
  We exclude the universal class, owl:Things and rdf:Resource, as it is information-free.
   */

  Formula.prototype.topTypeURIs = function(types) {
    var i, j, k, len, n, ref, tops, v;
    tops = [];
    for (k in types) {
      if (!hasProp.call(types, k)) continue;
      v = types[k];
      n = 0;
      ref = this.each(this.sym(k), this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'));
      for (i = 0, len = ref.length; i < len; i++) {
        j = ref[i];
        if (j.uri !== 'http://www.w3.org/2000/01/rdf-schema#Resource') {
          n++;
          break;
        }
      }
      if (!n) {
        tops[k] = v;
      }
    }
    if (tops['http://www.w3.org/2000/01/rdf-schema#Resource']) {
      delete tops['http://www.w3.org/2000/01/rdf-schema#Resource'];
    }
    if (tops['http://www.w3.org/2002/07/owl#Thing']) {
      delete tops['http://www.w3.org/2002/07/owl#Thing'];
    }
    return tops;
  };


  /*
  Find the types in the list which have no *stored* subtypes
  These are a set of classes which provide by themselves complete
  information -- the other classes are redundant for those who
  know the class DAG.
   */

  Formula.prototype.bottomTypeURIs = function(types) {
    var bots, bottom, elt, i, k, len, ref, subs, v;
    bots = [];
    for (k in types) {
      if (!hasProp.call(types, k)) continue;
      v = types[k];
      subs = this.each(void 0, this.sym('http://www.w3.org/2000/01/rdf-schema#subClassOf'), this.sym(k));
      bottom = true;
      for (i = 0, len = subs.length; i < len; i++) {
        elt = subs[i];
        if (ref = elt.uri, indexOf.call(types, ref) >= 0) {
          bottom = false;
          break;
        }
      }
      if (bottom) {
        bots[k] = v;
      }
    }
    return bots;
  };

  Formula.prototype.serialize = function(base, contentType, provenance) {
    var documentString, sts, sz;
    sz = $rdf.Serializer(this);
    sz.suggestNamespaces(this.namespaces);
    sz.setBase(base);
    if (provenance) {
      sts = this.statementsMatching(void 0, void 0, void 0, provenance);
    } else {
      sts = this.statements;
    }
    switch (contentType != null ? contentType : 'text/n3') {
      case 'application/rdf+xml':
        documentString = sz.statementsToXML(sts);
        break;
      case 'text/n3':
      case 'text/turtle':
        documentString = sz.statementsToN3(sts);
        break;
      default:
        throw "serialize: Content-type " + contentType(+" not supported.");
    }
    return documentString;
  };

  return Formula;

})($rdf.Node);

$rdf.sym = function(uri) {
  return new $rdf.Symbol(uri);
};

$rdf.lit = $rdf.Formula.prototype.literal;

$rdf.Namespace = $rdf.Formula.prototype.ns;

$rdf.variable = $rdf.Formula.prototype.variable;


/*
 * Variable
 *
 * Variables are placeholders used in patterns to be matched.
 * In cwm they are symbols which are the formula's list of quantified variables.
 * In sparl they are not visibily URIs.  Here we compromise, by having
 * a common special base URI for variables. Their names are uris,
 * but the ? nottaion has an implicit base uri of 'varid:'
 */

$rdf.Variable = (function(superClass) {
  extend(Variable, superClass);

  function Variable(rel) {
    this.base = 'varid:';
    this.uri = $rdf.Util.uri.join(rel, this.base);
  }

  Variable.prototype.termType = 'variable';

  Variable.prototype.toNT = function() {
    if (this.uri.slice(0, this.base.length) === this.base) {
      return '?' + this.uri.slice(this.base.length);
    }
    return "?" + this.uri;
  };

  Variable.prototype.toString = Variable.prototype.toNT;

  Variable.prototype.hashString = Variable.prototype.toNT;

  Variable.prototype.substitute = function(bindings) {
    var ref;
    return (ref = bindings[this.toNT()]) != null ? ref : this;
  };

  Variable.prototype.sameTerm = function(other) {
    if (!other) {
      false;
    }
    return (this.termType === other.termType) && (this.uri === other.uri);
  };

  return Variable;

})($rdf.Node);

$rdf.Literal.prototype.classOrder = 1;

$rdf.Collection.prototype.classOrder = 3;

$rdf.Formula.prototype.classOrder = 4;

$rdf.Symbol.prototype.classOrder = 5;

$rdf.BlankNode.prototype.classOrder = 6;

$rdf.Variable.prototype.classOrder = 7;

$rdf.fromNT = $rdf.Formula.prototype.fromNT;

$rdf.graph = function() {
  return new $rdf.IndexedFormula;
};

if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
  for (k in $rdf) {
    if (!hasProp.call($rdf, k)) continue;
    v = $rdf[k];
    module.exports[k] = v;
  }
}
