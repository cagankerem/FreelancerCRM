import { defineConfig, devices } from "@playwright/test";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const BASE_URL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "line",
  outputDir: "test-results",
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: "**/cross-browser/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-smoke",
      testMatch: "**/cross-browser/**/*.spec.ts",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-smoke",
      testMatch: "**/cross-browser/**/*.spec.ts",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --hostname ${HOST} --port ${PORT}`,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: BASE_URL,
  },
});
