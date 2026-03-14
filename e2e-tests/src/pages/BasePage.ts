import { Page, Locator, expect } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y/assertions";
import type Post from "../models/Post";

export default abstract class BasePage {
  protected readonly page: Page;
  readonly breadcrumbs: Locator;
  readonly pagination: Locator;

  // Wordpress locators
  readonly titleInput: Locator;
  readonly contentInput: Locator;
  readonly authorSection: Locator;
  readonly authorSelect: Locator;
  readonly publishButton: Locator;
  readonly publishingSpinner: Locator;
  readonly publishMessage: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.breadcrumbs = this.page.locator(".govuk-breadcrumbs");
    this.pagination = this.page.locator(
      ".pagination, [data-testid='news-pagination']",
    );
    this.titleInput = page.locator("#title");
    this.contentInput = page.locator("#content");
    this.authorSection = page.locator("#authordiv");
    this.authorSelect = page.locator("#post_author_override");
    this.publishButton = page.locator("#publish");
    this.publishingSpinner = page.locator("#publishing-action .spinner");
    this.publishMessage = page.locator("#message.updated, #message.notice");
  }

  async goto(path: string) {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async gotoEdit(postId: number): Promise<void> {
    await this.page.goto(`/wp-admin/post.php?post=${postId}&action=edit`, {
      waitUntil: "domcontentloaded",
    });
  }

  async selectAuthor(author: string): Promise<void> {
    await this.authorSection.scrollIntoViewIfNeeded();
    await this.authorSelect.selectOption({ label: author });
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


  async update(): Promise<void> {
    await this.publishButton.click();
    await this.waitForSaveToComplete();
    await this.page.pause();
  }

  // async updateEventDetails(event: Event): Promise<void> {
  //   await this.fillEventDetails(event);
  //   await this.update();
  // }

  private async waitForSaveToComplete(): Promise<void> {
    await Promise.race([
      this.page.waitForURL(/post\.php\?post=\d+&action=edit(&message=1)?/),
      expect(this.publishMessage).toBeVisible(),
    ]);

    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.publishButton).toBeEnabled();
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
