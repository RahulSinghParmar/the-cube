import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  workers: 1,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', testMatch: /(?:shell|compatibility|fallback|layout)\.spec\.js/, use: {
      browserName: 'firefox',
      // Linux's headless Firefox cannot create the WebGL context on the runner.
      // CI supplies Xvfb and Mesa software rendering; keep canvas assertions.
      headless: !(process.env.CI && process.platform === 'linux'),
      launchOptions: { firefoxUserPrefs: { 'webgl.force-enabled': true } },
    } },
    { name: 'webkit', testMatch: /(?:shell|compatibility|fallback|layout)\.spec\.js/, use: { browserName: 'webkit' } },
  ],
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, screenshot: 'on' },
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
