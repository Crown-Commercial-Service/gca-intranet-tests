import { Page, Locator, expect } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y/assertions";
import type Post from "../models/Post";

export default abstract class BasePage {
  protected readonly page: Page;
  readonly breadcrumbs: Locator;
  readonly pagination: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.breadcrumbs = this.page.locator(".govuk-breadcrumbs");
    this.pagination = this.page.locator(
      ".pagination, [data-testid='news-pagination']",
    );
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

  async selectBreadcrumbLink(name: string): Promise<void> {
    const link = this.breadcrumbs.getByRole("link", { name });
    await expect(link).toBeVisible();
    await link.click();
  }

  async assertPaginationVisible(): Promise<void> {
    await expect(this.pagination).toBeVisible();
  }

  async selectPaginationLink(name: string | RegExp): Promise<void> {
    const link = this.pagination.getByRole("link", { name });
    await expect(link).toBeVisible();
    await link.click();
  }

  async assertBreadcrumbs(post: Post): Promise<void> {
    await expect(this.breadcrumbs).toBeVisible();

    const items = this.breadcrumbs.locator("li");

    const sectionTitle = this.getBreadcrumbSectionTitle(post);

    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText("Home");
    await expect(items.nth(1)).toContainText(sectionTitle);
    await expect(items.nth(2)).toContainText(post.title);
  }

  private getBreadcrumbSectionTitle(post: Post): string {
    switch (post.type) {
      case "news":
        return "News";
      case "blogs":
        return "Blogs";
      case "work_updates":
        return "Work Updates";
      default:
        throw new Error(`Unsupported breadcrumb type: ${post.type}`);
    }
  }
}
