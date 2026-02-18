import baseConfig from "./playwright.config";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  ...baseConfig,
  testDir: "tests/a11y",
  testIgnore: undefined,
});
