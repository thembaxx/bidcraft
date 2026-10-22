import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: true, workers: 2, timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:3000', browserName: 'chromium', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox'] }, trace: 'retain-on-failure', storageState: './tests/fixtures/onboarding-completed.storage.json' },
  webServer: { command: 'npm run start -- --hostname 127.0.0.1', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 30_000 },
});
