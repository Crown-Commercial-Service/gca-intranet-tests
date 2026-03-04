import dotenv from "dotenv";
import baseConfig from "./playwright.config";
import { defineConfig } from "@playwright/test";

dotenv.config({ path: ".env", quiet: true });

export default defineConfig({
  ...baseConfig,
  testDir: "tests/a11y",
  testIgnore: [],
});