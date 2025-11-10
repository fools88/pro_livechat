import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    baseURL: 'http://127.0.0.1:4173',
  },
});
