import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  workers: 1,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', testMatch: /(?:shell|compatibility)\.spec\.js/, use: { browserName: 'firefox' } },
    { name: 'webkit', testMatch: /(?:shell|compatibility)\.spec\.js/, use: { browserName: 'webkit' } },
  ],
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, screenshot: 'on' },
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
