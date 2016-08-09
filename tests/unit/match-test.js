'use strict'
const test = require('tape')
const rdf = require('../../index')

const s1 = rdf.namedNode('https://example.com/subject1')
const p1 = rdf.namedNode('https://example.com/predicate1')
const o1 = rdf.namedNode('https://example.com/object1')
const triple1 = rdf.triple(s1, p1, o1)

const s2 = rdf.namedNode('https://example.com/subject2')
const p2 = rdf.namedNode('https://example.com/predicate2')
const o2 = rdf.namedNode('https://example.com/object2')
const triple2 = rdf.triple(s2, p2, o2)

const s3 = rdf.namedNode('https://example.com/subject3')
const p3 = rdf.namedNode('https://example.com/predicate3')
const o3 = rdf.namedNode('https://example.com/object3')
const triple3 = rdf.triple(s3, p3, o3)

const triple4 = rdf.triple(s1, p2, o3)

test('empty .match()', t => {
  let kb = rdf.graph()
  kb.addAll([ triple1, triple2, triple3 ])
  t.equals(kb.length, 3)
  let matches = kb.match()
  t.equals(matches.length, 3, 'An empty .match() should return all triples')
  t.end()
})

test('match on S', t => {
  let kb = rdf.graph()
  kb.addAll([ triple1, triple2, triple3, triple4 ])
  let s = 'https://example.com/subject1'
  let matches = kb.match(s)
  t.equals(matches.length, 2, 'match(subject) should return 2 triples')
  matches.sort()
  t.equals(matches[0].subject, s1)
  t.equals(matches[1].subject, s1)
  t.end()
})

test('match on P', t => {
  let kb = rdf.graph()
  kb.addAll([ triple1, triple2, triple3, triple4 ])
  let p = rdf.namedNode('https://example.com/predicate2')
  let matches = kb.match(null, p)
  t.equals(matches.length, 2, 'match(null, predicate) should return 2 triples')
  matches.sort()
  t.equals(matches[0].predicate, p2)
  t.equals(matches[1].predicate, p2)
  t.end()
})

test('match on SO', t => {
  let kb = rdf.graph()
  kb.addAll([ triple1, triple2, triple3, triple4 ])
  let matches = kb.match(
    'https://example.com/subject1',
    null,
    'https://example.com/object1'
  )
  t.equals(matches.length, 1, 'match(s, null, o) should return 1 triple')
  t.equals(matches[0].subject, s1)
  t.equals(matches[0].object, o1)
  t.end()
})
