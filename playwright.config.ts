import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://localhost:5001/api/health',
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: process.env.TEST_PORT!,
        NODE_ENV: 'test',
        DATABASE_URL: process.env.TEST_DATABASE_URL!,
        BETTER_AUTH_SECRET: process.env.TEST_BETTER_AUTH_SECRET!,
        BETTER_AUTH_URL: process.env.TEST_BETTER_AUTH_URL!,
        CLIENT_URL: process.env.TEST_CLIENT_URL!,
      },
    },
    {
      command: 'npm run dev:client',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      env: {
        API_PORT: process.env.TEST_PORT!,
      },
    },
  ],
});
