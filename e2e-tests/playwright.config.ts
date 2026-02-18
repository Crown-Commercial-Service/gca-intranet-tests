import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Load local env first (WP_DOCKER_CWD, PW_BASE_URL)
dotenv.config({ path: ".env.local" });
dotenv.config();

const BASE_URL = process.env.PW_BASE_URL || "http://localhost:8080";

export default defineConfig({
  testDir: "tests",
  // Runs once before the suite (theme activation, etc)
  globalSetup: require.resolve("./src/global-setup-wp"),
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
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    // Add these back when you’re ready:
    // { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "desktop-webkit", use: { ...devices["Desktop Safari"] } },
    // { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    // { name: "mobile-webkit", use: { ...devices["iPhone 14"] } },
  ],
});
