import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class BlogPage extends BasePage {
  private readonly baseUrl?: string;

  readonly main: Locator;
  readonly title: Locator;
  readonly content: Locator;
  readonly author: Locator;
  readonly featuredImage: Locator;
  readonly publishedDate: Locator;
  readonly blogLabel: Locator;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;

    this.main = this.page.getByTestId("blog-main");
    this.title = this.page.getByRole("heading").first();
    this.content = this.page.locator(".govuk-body").first();
    this.author = this.page.getByTestId("published-by-author");
    this.featuredImage = this.page.getByRole("img").first();
    this.publishedDate = this.page.locator(".govuk-body-s").first();
    this.blogLabel = this.page.getByTestId("blog-tax");
  }

  async goto(slug: string): Promise<void> {
    const base = this.baseUrl ? this.baseUrl.replace(/\/+$/, "") : "";
    const path = slug.startsWith("/") ? slug : `/${slug}`;

    await this.page.goto(`${base}${path}`, {
      waitUntil: "networkidle",
    });
  }

  async gotoById(postId: number): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/?p=${postId}`
      : `/?p=${postId}`;

    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  async assertTitle(expected: string): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.title).toContainText(expected);
  }

  async assertContent(expected: string): Promise<void> {
    await expect(this.content).toContainText(expected);
  }

  async assertBlogLabel(expected: string): Promise<void> {
    await expect(this.blogLabel).toContainText(expected);
  }

  async assertAuthor(expected: string): Promise<void> {
    await expect(this.author).toContainText(expected);
  }

  async assertFeaturedImageVisible(): Promise<void> {
    await expect(this.featuredImage).toBeVisible();
  }

  async assertPublishedDate(expected: string): Promise<void> {
    await expect(this.publishedDate).toContainText(expected);
  }
}
