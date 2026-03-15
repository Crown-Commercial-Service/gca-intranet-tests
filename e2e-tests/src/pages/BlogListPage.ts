import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class BlogListPage extends BasePage {
  private readonly baseUrl?: string;

  readonly container: Locator;
  readonly main: Locator;
  readonly posts: Locator;
  readonly postTitles: Locator;
  readonly postLinks: Locator;
  readonly postDescriptions: Locator;
  readonly postDates: Locator;
  readonly postLabels: Locator;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;

    this.container = this.page.getByTestId("blog-container");
    this.main = this.page.getByTestId("blog-main");
    this.posts = this.page.getByTestId("blog-post");
    this.postTitles = this.page.getByTestId("blog-post-title");
    this.postLinks = this.page.getByTestId("blog-post-link");
    this.postDescriptions = this.page.getByTestId("blog-decs");
    this.postDates = this.page.getByTestId("blog-post-date");
    this.postLabels = this.page.getByTestId("blog-tax");
  }

  async goto(): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/blog`
      : "/blog";

    await this.page.goto(url, { waitUntil: "networkidle" });
    await expect(this.main).toBeVisible();
  }

  async gotoBlogList(): Promise<void> {
    await this.goto();
  }

  postByTitle(title: string): Locator {
    return this.posts
      .filter({
        has: this.page.getByTestId("blog-post-link").filter({
          hasText: title,
        }),
      })
      .first();
  }

  async assertPostVisible(title: string): Promise<void> {
    await expect(this.postByTitle(title)).toBeVisible();
  }

  async openByTitle(title: string): Promise<void> {
    const link = this.postByTitle(title).getByTestId("blog-post-link");
    await expect(link).toBeVisible();
    await link.click();
  }

  async assertPostHasLabel(title: string, label: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("blog-tax")).toContainText(label);
  }

  async assertPostHasDate(title: string, date: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("blog-post-date")).toContainText(date);
  }

  async assertPostHasContent(title: string, content: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("blog-decs")).toContainText(content);
  }

  async assertPostHasFeaturedImage(title: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.locator("img")).toBeVisible();
  }

  async assertPostHasAuthor(title: string, author: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("blog-author")).toContainText(`By ${author}`);
  }

  async assertPostCount(count: number): Promise<void> {
    await expect(this.posts).toHaveCount(count);
  }
}
