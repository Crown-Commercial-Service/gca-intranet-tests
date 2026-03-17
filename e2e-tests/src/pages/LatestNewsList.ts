import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";
import { formatDateNew } from "../utils/formatters";
import Post from "../models/Post";

export default class LatestNewsList extends BasePage {
  private readonly baseUrl?: string;

  readonly column: Locator;
  readonly featuredCard: Locator;
  readonly featuredLink: Locator;
  readonly featuredDate: Locator;

  readonly secondaryCards: Locator;
  readonly seeMoreLink: Locator;

  readonly main: Locator;
  readonly posts: Locator;
  readonly postTitles: Locator;
  readonly postLinks: Locator;
  readonly postDescriptions: Locator;
  readonly postMeta: Locator;
  readonly postCategoryTags: Locator;
  readonly postLabelTags: Locator;

  readonly latestNewsListSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;

    this.column = this.page.getByTestId("latest-news-column");
    this.featuredCard = this.column.getByTestId("latest-news-featured-card");
    this.featuredLink = this.featuredCard.getByTestId(
      "latest-news-featured-link",
    );
    this.featuredDate = this.featuredCard.getByTestId(
      "latest-news-featured-date",
    );

    this.secondaryCards = this.column.getByTestId("latest-news-secondary-card");
    this.seeMoreLink = this.column.getByTestId("latest-news-see-more-link");

    this.main = this.page.getByTestId("news-main");
    this.posts = this.page.getByTestId("news-post");
    this.postTitles = this.page.getByTestId("news-post-title");
    this.postLinks = this.page.getByTestId("news-post-link");
    this.postDescriptions = this.page.getByTestId("news-desc");
    this.postMeta = this.page.getByTestId("news-post-meta");
    this.postCategoryTags = this.page.getByTestId("archive-news-post-category");
    this.postLabelTags = this.page.getByTestId("archive-news-post-label");

    this.latestNewsListSection = "[data-testid='news-main']";
  }

  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl ?? "/", { waitUntil: "networkidle" });
    await expect(this.column).toBeVisible();
  }

  async gotoNewsList(): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/news`
      : "/news";
    await this.page.goto(url, { waitUntil: "networkidle" });
    await expect(this.main).toBeVisible();
  }

  async assertOnPageTwo(): Promise<void> {
    await expect(this.page).toHaveURL(/\/news\/page\/2\/$/);
  }

  async openByTitle(title: string): Promise<void> {
    await expect(this.column).toBeVisible();
    await this.column.getByRole("link", { name: title }).click();
  }

  postByTitle(title: string): Locator {
    return this.posts
      .filter({
        has: this.postLinks.filter({ hasText: title }),
      })
      .first();
  }

  async assertPostVisible(title: string): Promise<void> {
    await expect(this.postByTitle(title)).toBeVisible();
  }

  async assertPostCount(count: number): Promise<void> {
    await expect(this.posts).toHaveCount(count);
  }

  async selectPost(title: string): Promise<void> {
    const link = this.postByTitle(title).getByTestId("news-post-link");
    await expect(link).toBeVisible();
    await link.click();
  }

  async assertLatestNewsDate(post: Post): Promise<void> {
    await expect(
      this.postByTitle(post.title).getByTestId("news-post-meta"),
    ).toContainText(formatDateNew(post.createdAt));
  }

  async assertPostHasCategory(title: string, category: string): Promise<void> {
    await expect(
      this.postByTitle(title)
        .getByTestId("archive-news-post-category")
        .filter({ hasText: category })
        .first(),
    ).toBeVisible();
  }

  async assertPostHasLabel(title: string, label: string): Promise<void> {
    await expect(
      this.postByTitle(title)
        .getByTestId("archive-news-post-label")
        .filter({ hasText: label })
        .first(),
    ).toBeVisible();
  }
}
