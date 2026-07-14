// Runs every unit test file in its own mocha process, so shared-state
// leaks between test files are caught (#400). Usage: npm run test:unit:isolation
const { spawnSync } = require('child_process')
const { readdirSync } = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const unitDir = path.join(__dirname, 'unit')
const files = readdirSync(unitDir)
  .filter(name => /-test\.(js|ts)$/.test(name))
  .sort()

const failures = []
for (const name of files) {
  const rel = path.join('tests', 'unit', name)
  console.log(`\n=== ${rel} (isolated) ===`)
  const result = spawnSync(process.execPath, [
    require.resolve('mocha/bin/mocha.js'),
    '--require', path.join(__dirname, 'babel-register.js'),
    rel
  ], { stdio: 'inherit', cwd: root })
  if (result.status !== 0) { failures.push(rel) }
}

if (failures.length > 0) {
  console.error(`\n${failures.length}/${files.length} test file(s) FAIL when run in isolation:`)
  for (const rel of failures) { console.error(`  - ${rel}`) }
  process.exit(1)
}
console.log(`\nAll ${files.length} unit test files pass in isolation`)
