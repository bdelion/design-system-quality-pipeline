import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/browser',
  testMatch: '**/*.spec.ts',
  timeout: 120000,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'data/browser-report', open: 'never' }]],
  outputDir: 'data/browser-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'retain-on-failure',
    ...(process.platform === 'win32' ? { channel: 'msedge' } : {})
  }
});
