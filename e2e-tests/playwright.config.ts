import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.PW_BASE_URL || `http://localhost:${PORT}`;
const NEXT_APP_DIR = process.env.NEXT_APP_DIR || "..";

const commonEnv = {
  ...process.env,
  AUTH_STRATEGY: "stub",
  API_STUB_ENABLED: "true",
};

export default defineConfig({
  testDir: "tests",

  timeout: 30_000,
  expect: { timeout: 10_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "desktop-edge",
      use: {
        ...devices["Desktop Edge"],
        channel: "msedge",
      },
    },
    {
      name: "mobile-chromium-android",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop-firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "desktop-webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chromium-iphone",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "mobile-webkit-iphone",
      use: {
        ...devices["iPhone 14"],
        browserName: "webkit",
      },
    },
  ],

  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: `npm --prefix ${NEXT_APP_DIR} run dev -- -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: commonEnv,
      },
});
