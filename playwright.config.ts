import { defineConfig } from '@playwright/test'

// Browser end-to-end tests (#713): load the built browser bundle
// (dist/rdflib.min.js, from `npm run build:browser`) into a Chromium page.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  reporter: 'list',
  use: {
    browserName: 'chromium'
  }
})
