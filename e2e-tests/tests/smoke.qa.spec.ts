import { test, expect } from "@playwright/test";

test.describe("QA Smoke Test", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("body")).toBeVisible();
  });
});
