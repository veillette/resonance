/**
 * Playwright configuration for fuzz testing.
 */

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/fuzz",
  timeout: 5 * 60 * 1000, // 5 minutes per test by default
  expect: {
    timeout: 10000,
  },
  fullyParallel: false, // Run tests sequentially for fuzz testing
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for fuzz tests
  workers: 1, // Single worker for fuzz testing
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
});
