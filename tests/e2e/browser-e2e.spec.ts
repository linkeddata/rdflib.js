import { test, expect } from '@playwright/test'
import { existsSync } from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'

// Browser e2e for the built UMD bundle (#713): load dist/rdflib.min.js in
// Chromium via a <script src> tag (the documented consumer usage), then parse
// a small Turtle document and run store queries against it.
const bundlePath = path.join(__dirname, '..', '..', 'dist', 'rdflib.min.js')
const fixturePath = path.join(__dirname, 'e2e-fixture.html')

test('browser bundle parses Turtle and answers store queries', async ({ page }) => {
  test.skip(!existsSync(bundlePath), 'dist/rdflib.min.js missing — run `npm run build:browser` first')

  await page.goto(pathToFileURL(fixturePath).href)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.waitForFunction(() => (window as any).$rdf !== undefined)

  const result = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $rdf = (window as any).$rdf
    if (!$rdf) { throw new Error('$rdf global not exposed by the bundle') }

    const base = 'https://example.org/doc'
    const doc = $rdf.sym(base)
    const store = $rdf.graph()
    const turtle = [
      '@prefix : <#>.',
      '@prefix foaf: <http://xmlns.com/foaf/0.1/>.',
      ':alice a foaf:Person ; foaf:name "Alice" ; foaf:knows :bob .',
      ':bob a foaf:Person ; foaf:name "Bobé" .'
    ].join('\n')

    $rdf.parse(turtle, store, base, 'text/turtle')

    const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/')
    const alice = $rdf.sym(base + '#alice')
    const rdfType = $rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')

    const name = store.any(alice, FOAF('name'), null, doc)
    const bobName = store.any($rdf.sym(base + '#bob'), FOAF('name'), null, doc)
    const people = store.each(null, rdfType, FOAF('Person'), doc)

    return {
      statementCount: store.statements.length,
      aliceName: name && name.value,
      bobName: bobName && bobName.value,
      personCount: people.length
    }
  })

  expect(result.aliceName).toBe('Alice')
  expect(result.bobName).toBe('Bobé')
  expect(result.personCount).toBe(2)
  expect(result.statementCount).toBeGreaterThanOrEqual(5)
})
