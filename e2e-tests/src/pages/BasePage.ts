import { Page, Locator, expect } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y/assertions";
import type Post from "../models/Post";

export default abstract class BasePage {
  protected readonly page: Page;
  readonly breadcrumbs: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.breadcrumbs = this.page.locator(".govuk-breadcrumbs");
  }

  async goto(path: string) {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async expectUrlToMatch(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  async a11y() {
    await expectNoSeriousA11yViolations(this.page);
  }

  async assertBreadcrumbs(post: Post): Promise<void> {
    await expect(this.breadcrumbs).toBeVisible();

    const items = this.breadcrumbs.locator("li");

    await expect(items.nth(0)).toContainText("Home");

    const type = String(post.type);

    const shouldShowCategory = type !== "blogs" && Boolean(post.category);

    if (shouldShowCategory) {
      await expect(items).toHaveCount(3);
      await expect(items.nth(1)).toContainText(post.category as string);
      await expect(items.nth(2)).toContainText(post.title);
      return;
    }

    await expect(items).toHaveCount(2);
    await expect(items.nth(1)).toContainText(post.title);
  }
}
