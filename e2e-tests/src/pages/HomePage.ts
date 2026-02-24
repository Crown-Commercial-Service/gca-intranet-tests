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

  private readonly latestNewsColumnSelector =
    '[data-testid="latest-news-column"]';
  private readonly latestNewsCardSelector =
    '[data-testid="latest-news-featured-card"], [data-testid="latest-news-secondary-card"]';

  private readonly latestNewsFeaturedDateTestId = "latest-news-featured-date";
  private readonly latestNewsSecondaryDateTestId = "latest-news-secondary-date";

  private readonly workUpdatesSectionTestId = "work-updates-section";
  private readonly workUpdateCardTestId = "work-update-card";
  private readonly workUpdateAvatarTestId = "work-update-avatar";
  private readonly workUpdateLinkTestId = "work-update-link";
  private readonly workUpdateAuthorTestId = "work-update-author";
  private readonly workUpdateDateTestId = "work-update-date";

  readonly workUpdatesSection: Locator;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

    this.latestNewsColumn = this.page.getByTestId("latest-news-column");
    this.workUpdatesSection = this.page.getByTestId(
      this.workUpdatesSectionTestId,
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
      this.latestNewsColumnSelector,
    );
  }

  private articleLink(title: string): Locator {
    return this.page.getByRole("link", { name: title });
  }

  private latestNewsCard(title: string): Locator {
    return this.latestNewsColumn
      .locator(this.latestNewsCardSelector)
      .filter({ has: this.articleLink(title) });
  }

  private latestNewsFeaturedDate(card: Locator): Locator {
    return card.getByTestId(this.latestNewsFeaturedDateTestId);
  }

  private latestNewsSecondaryDate(card: Locator): Locator {
    return card.getByTestId(this.latestNewsSecondaryDateTestId);
  }

  private async latestNewsDateElement(card: Locator): Promise<Locator> {
    const featured = this.latestNewsFeaturedDate(card);
    if ((await featured.count()) > 0) return featured.first();
    return this.latestNewsSecondaryDate(card).first();
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
      const card = this.latestNewsCard(post.title);

      await expect(card).toBeVisible();
      await expect(this.articleLink(post.title)).toBeVisible();

      const dateEl = await this.latestNewsDateElement(card);
      await expect(dateEl).toBeVisible();

      const uiDate = (await dateEl.textContent())?.trim() ?? "";
      const expectedDate = dayjs(post.createdAt).format("Do MMMM YYYY");
      expect(uiDate).toBe(expectedDate);
    }

    let allHaveImages = true;
    for (const post of posts) {
      if (!post.featuredImagePath) {
        allHaveImages = false;
        break;
      }
    }

    if (allHaveImages) {
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

  private workUpdateCardByTitle(title: string): Locator {
    return this.workUpdatesSection
      .getByTestId(this.workUpdateCardTestId)
      .filter({ has: this.page.getByRole("link", { name: title }) });
  }

  async assertWorkUpdateOnHomepage(post: Post): Promise<void> {
    const card = this.workUpdateCardByTitle(post.title);

    await expect(card).toHaveCount(1);
    await expect(card).toBeVisible();

    const link = card.getByTestId(this.workUpdateLinkTestId);
    await expect(link).toBeVisible();
    await expect(link).toHaveText(post.title);

    const avatar = card.getByTestId(this.workUpdateAvatarTestId).locator("img");
    await expect(avatar.first()).toBeVisible();

    const expectedUser = (
      process.env.WP_USER ||
      process.env.WP_API_USER ||
      ""
    ).trim();
    if (expectedUser) {
      const author = card.getByTestId(this.workUpdateAuthorTestId);
      await expect(author).toContainText(expectedUser);
    }

    const date = card.getByTestId(this.workUpdateDateTestId);
    await expect(date).toBeVisible();

    const uiDate = (await date.textContent())?.trim() ?? "";
    const expectedDate = dayjs(post.createdAt).format("Do MMMM YYYY");
    expect(uiDate).toBe(expectedDate);
  }
}
