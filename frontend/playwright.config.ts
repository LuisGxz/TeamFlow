import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Assumes the API (http://localhost:5190) and the Angular app are reachable.
 * The dev server is started automatically; the .NET API must be running separately
 * (it needs SQL Server), e.g. `dotnet run --project ../backend/src/TeamFlow.Api`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'line' : 'list',
  timeout: 45_000,
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'en-US',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
