import { Page, Locator, expect } from "@playwright/test";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import type Post from "../models/Post";
import {
  expectNoSeriousA11yViolations,
  expectNoSeriousA11yViolationsForSelector,
} from "../a11y/assertions";

dayjs.extend(advancedFormat);

type CharLimits = {
  titleMax: number;
  paragraphMax: number;
};

export default class HomePage {
  readonly page: Page;
  private readonly baseUrl?: string;

  readonly latestNewsColumn: Locator;

  readonly latestNewsFeaturedCard: Locator;
  readonly latestNewsFeaturedDate: Locator;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

    this.latestNewsColumn = this.page.getByTestId("latest-news-column");

    this.latestNewsFeaturedCard = this.latestNewsColumn.getByTestId(
      "latest-news-featured-card",
    );

    this.latestNewsFeaturedDate = this.latestNewsFeaturedCard.getByTestId(
      "latest-news-featured-date",
    );
  }

  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl ?? "/", { waitUntil: "networkidle" });
  }

  async checkAccessibility(): Promise<void> {
    await expectNoSeriousA11yViolations(this.page);
  }

  async checkLatestNewsAccessibility(): Promise<void> {
    await expectNoSeriousA11yViolationsForSelector(
      this.page,
      '[data-testid="latest-news-column"]',
    );
  }

  async assertLatestNewsFeaturedDate(
    publishedDate: string | Date,
  ): Promise<void> {
    await expect(this.latestNewsFeaturedCard).toBeVisible();
    await expect(this.latestNewsFeaturedDate).toBeVisible();

    const uiText =
      (await this.latestNewsFeaturedDate.textContent())?.trim() ?? "";
    const expected = dayjs(publishedDate).format("Do MMMM YYYY");

    expect(uiText).toBe(expected);
  }

  private articleLink(title: string): Locator {
    return this.page.getByRole("link", { name: title });
  }

  private articleCard(title: string): Locator {
    return this.latestNewsColumn
      .locator(
        '[data-testid="latest-news-featured-card"], [data-testid="latest-news-secondary-card"]',
      )
      .filter({ has: this.articleLink(title) });
  }

  private paragraphSnippet(content: string): Locator {
    const snippet = content.slice(0, 40);
    return this.page.getByText(snippet);
  }

  async openLatestArticle(title: string): Promise<void> {
    await this.articleLink(title).click();
  }

  async assertLatestNewsLayout(posts: Post[]): Promise<void> {
    if (posts.length === 0) {
      throw new Error("Expected at least one post");
    }

    const latestPost = posts[0];
    await expect(this.articleLink(latestPost.title)).toBeVisible();

    for (const post of posts) {
      const card = this.articleCard(post.title);

      await expect(card).toBeVisible();
      await expect(this.articleLink(post.title)).toBeVisible();

      const dateLocator = card.getByTestId("latest-news-featured-date");
      const hasFeaturedDate = (await dateLocator.count()) > 0;

      const dateEl = hasFeaturedDate
        ? dateLocator.first()
        : card.getByTestId("latest-news-secondary-date").first();

      await expect(dateEl).toBeVisible();

      const uiDate = (await dateEl.textContent())?.trim() ?? "";
      const expectedDate = dayjs(post.createdAt).format("Do MMMM YYYY");

      expect(uiDate).toBe(expectedDate);
    }

    const everyPostHasFeaturedImage = posts.every((post) =>
      Boolean(post.featuredImagePath),
    );

    if (everyPostHasFeaturedImage) {
      const renderedImageCount = await this.page.getByRole("img").count();
      expect(renderedImageCount).toBeGreaterThanOrEqual(posts.length);
    }

    if (posts.length > 1) {
      for (const post of posts) {
        await expect(this.articleLink(post.title)).toBeVisible();
      }
    }
  }

  async assertLatestNewsCharLimits(
    posts: Post[],
    limits: CharLimits,
  ): Promise<void> {
    for (const post of posts) {
      await expect(this.articleLink(post.title)).toHaveText(post.title);
      await expect(this.paragraphSnippet(post.content)).toBeVisible();

      const runId = process.env.PW_RUN_ID ?? "";
      const titleWithoutRunId = post.title.endsWith(runId)
        ? post.title.slice(0, -runId.length).trimEnd()
        : post.title;

      expect(titleWithoutRunId.length).toBeLessThanOrEqual(limits.titleMax);
      expect(post.content.length).toBeLessThanOrEqual(limits.paragraphMax);
    }
  }
}
