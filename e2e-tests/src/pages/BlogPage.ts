import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";
import { formatDateNew } from "../utils/formatters";

export default class BlogPage extends BasePage {
  // private readonly baseUrl?: string;

  readonly main: Locator;
  readonly title: Locator;
  readonly content: Locator;
  readonly author: Locator;
  readonly authorImage: Locator;
  readonly date: Locator;
  readonly blogLabel: Locator;

  // Accessibility Selectors
  readonly blogsSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    // this.baseUrl = baseUrl;

    this.main = this.page.getByTestId("blog-main");
    this.title = this.page.getByTestId("blog-title");
    this.content = this.page.getByTestId("blog-content");
    this.author = this.page.getByTestId("blog-detials").locator("span").first();
    this.authorImage = this.page.locator(".profile_img_wrapper img");
    this.date = this.page.getByTestId("blog-date");
    this.blogLabel = this.page.getByTestId("blog-tax");
    this.blogsSection = "[data-testid='blog-main']";
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
    await expect(this.author).toContainText(`By ${expected}`);
  }

  async assertFeaturedImageVisible(): Promise<void> {
    await expect(this.authorImage).toBeVisible();
  }

  async assertPublishedDate(value: string | Date): Promise<void> {
    const expected = formatDateNew(value);
    await expect(this.date).toContainText(expected);
  }
}
