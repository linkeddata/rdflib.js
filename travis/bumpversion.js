/**
 * npm does not allow you to publish a package with the same version multiple times.
 * Thus, to publish prerelease versions tagged to the branch they're built from,
 * we need to generate unique version numbers that are also higher than versions already published.
 * To achieve this, we append `build<build_number>` to the version number.
 * The actual release version can eventually be published without the suffix.
 */

if (!process.env.TRAVIS_BUILD_NUMBER || process.env.TRAVIS_BUILD_NUMBER.length === 0) {
  console.error('Could not read the build number to bump the package version - aborting publish.')
  process.exit(1)
}

const fs = require('fs')
const path = require('path')

const packageJson = require('../package.json')
packageJson.version = `${packageJson.version}build${process.env.TRAVIS_BUILD_NUMBER}`
fs.writeFileSync(path.resolve(__dirname, '../package.json'), JSON.stringify(packageJson))
