import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4183',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @pwacn/playground preview --host 127.0.0.1 --port 4183',
      port: 4183,
      reuseExistingServer: false,
    },
    {
      command: 'pnpm --filter @pwacn/kitchen-sink preview --host 127.0.0.1 --port 4174',
      port: 4174,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: 'iphone-safari',
      use: { ...devices['iPhone 15 Pro'], browserName: 'webkit' },
    },
    {
      name: 'pixel-chrome',
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
    {
      name: 'galaxy-chrome',
      use: { ...devices['Galaxy S9+'], browserName: 'chromium' },
    },
  ],
});
