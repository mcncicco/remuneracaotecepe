const { defineConfig } = require('@playwright/test');

const baseURL = 'http://127.0.0.1:4173';

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL,
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    screenshot: 'off',
    trace: 'off',
    video: 'off'
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 }
      }
    },
    {
      name: 'chromium-mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      }
    }
  ],
  webServer: {
    command: 'node tests/server.mjs',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000
  }
});
