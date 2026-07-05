import { defineConfig } from '@playwright/test'

// Browser end-to-end tests (#713). These load the built browser bundle
// (dist/rdflib.min.js — run `npm run build:browser` first) into a real
// Chromium page and exercise parsing + store queries.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  reporter: 'list',
  use: {
    browserName: 'chromium'
  }
})
