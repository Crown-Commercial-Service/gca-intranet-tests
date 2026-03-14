import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class LatestNews extends BasePage {
  private readonly baseUrl?: string;

  readonly title: Locator;

  readonly main: Locator;
  readonly featuredImage: Locator;
  readonly details: Locator;
  readonly content: Locator;
  readonly publishedBy: Locator;
  readonly publishedByAuthor: Locator;
  readonly tags: Locator;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;

    this.title = this.page.getByTestId("news-title");
    this.main = this.page.getByTestId("news-main");
    this.featuredImage = this.page.getByTestId("news-featured-image");
    this.details = this.page.getByTestId("news-details");
    this.content = this.page.getByTestId("news-content");
    this.publishedBy = this.page.getByTestId("published-by");
    this.publishedByAuthor = this.page.getByTestId("published-by-author");
    this.tags = this.details.locator(".govuk-tag");
  }

  async goto(pathname: string): Promise<void> {
    await this.page.goto(this.resolve(pathname), { waitUntil: "networkidle" });
  }

  async gotoById(postId: number): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/?p=${postId}`
      : `/?p=${postId}`;
    await this.page.goto(url, { waitUntil: "networkidle" });
    await this.page.pause();
  }

  async assertTitle(expected: string): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.title).toContainText(expected);
  }

  async assertContent(text: string): Promise<void> {
    await expect(this.content).toContainText(text);
  }

  async assertAuthor(author: string): Promise<void> {
    await expect(this.publishedByAuthor).toHaveText(`By ${author}`);
  }

  async assertCategory(category: string): Promise<void> {
    await expect(this.tags.filter({ hasText: category }).first()).toBeVisible();
  }

  async assertLabel(label: string): Promise<void> {
    await expect(this.tags.filter({ hasText: label }).first()).toBeVisible();
  }

  async assertFeaturedImageVisible(): Promise<void> {
    await expect(this.featuredImage).toBeVisible();
  }

  private resolve(pathname: string): string {
    if (!this.baseUrl) return pathname;

    const base = this.baseUrl.replace(/\/+$/, "");
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

    return `${base}${path}`;
  }
}
