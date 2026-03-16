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

  // Accessibility Selectors
  readonly latestNewsSection: string;

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
    this.latestNewsSection = "[data-testid='news-main']";
  }

  async goto(pathname: string): Promise<void> {
    await this.page.goto(this.resolve(pathname), { waitUntil: "networkidle" });
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

  async assertContent(text: string): Promise<void> {
    await expect(this.content).toContainText(text);
  }

  async assertAuthor(author: string): Promise<void> {
    await expect
      .poll(
        async () => {
          await this.page.reload({ waitUntil: "domcontentloaded" });

          return ((await this.publishedByAuthor.textContent()) ?? "")
            .replace(/\s+/g, " ")
            .trim();
        },
        {
          timeout: 15000,
          intervals: [500, 1000, 2000],
        },
      )
      .toBe(`By ${author}`);
  }

  // async assertAuthor(author: string): Promise<void> {
  //   await expect(this.publishedByAuthor).toHaveText(`By ${author}`);
  // }

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
