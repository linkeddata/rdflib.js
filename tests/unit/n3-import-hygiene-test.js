import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

// Guards the deep-import discipline for the n3 dependency (#449): a root
// `import ... from 'n3'` pulls in n3's package index, which drags
// N3StreamWriter (and its readable-stream/Node polyfill chain) into
// downstream browser bundles. Runtime code must deep-import the specific
// `n3/lib/<Class>.js` module it needs instead.
//
// This is the source-level guard; the bundle-level assertion (grepping the
// webpack output for N3StreamWriter/readable-stream) lives with the browser
// e2e job.

const SRC_DIR = path.join(__dirname, '..', '..', 'src')
const ROOT_N3_IMPORT = /(?:from\s+(['"])n3\1|require\((['"])n3\2\))/

function sourceFiles (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(ts|js)$/.test(entry.name) ? [full] : []
  })
}

describe('n3 import hygiene (#449)', () => {
  it('no module under src/ imports the n3 package root', () => {
    const offenders = sourceFiles(SRC_DIR)
      .filter(file => ROOT_N3_IMPORT.test(fs.readFileSync(file, 'utf8')))
      .map(file => path.relative(SRC_DIR, file))

    expect(
      offenders,
      `root 'n3' import found in: ${offenders.join(', ')}; ` +
      "deep-import the class instead (e.g. `import N3jsParser from 'n3/lib/N3Parser.js'`)"
    ).to.deep.equal([])
  })
})
