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

  readonly workUpdatesColumn: Locator;
  readonly workUpdatesSection: Locator;
  readonly workUpdateCards: Locator;

  readonly workUpdateAvatarImg: Locator;
  readonly workUpdateLink: Locator;
  readonly workUpdateAuthor: Locator;
  readonly workUpdateDate: Locator;

  private readonly latestNewsColumnSelector =
    '[data-testid="latest-news-column"]';
  private readonly latestNewsCardSelector =
    '[data-testid="latest-news-featured-card"], [data-testid="latest-news-secondary-card"]';

  private readonly latestNewsFeaturedDateTestId = "latest-news-featured-date";
  private readonly latestNewsSecondaryDateTestId = "latest-news-secondary-date";

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

    this.latestNewsColumn = this.page.getByTestId("latest-news-column");

    this.workUpdatesColumn = this.page.getByTestId("work-updates-column");
    this.workUpdatesSection = this.workUpdatesColumn.getByTestId(
      "work-updates-section",
    );
    this.workUpdateCards =
      this.workUpdatesSection.getByTestId("work-update-card");

    const firstWorkUpdateCard = this.workUpdateCards.first();

    this.workUpdateAvatarImg = firstWorkUpdateCard
      .getByTestId("work-update-avatar")
      .locator("img");
    this.workUpdateLink = firstWorkUpdateCard.getByTestId("work-update-link");
    this.workUpdateAuthor =
      firstWorkUpdateCard.getByTestId("work-update-author");
    this.workUpdateDate = firstWorkUpdateCard.getByTestId("work-update-date");
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

  private wpUser(): string {
    return (
      process.env.WP_USER ||
      process.env.WP_API_USER ||
      process.env.WP_QA_ADMIN_USER ||
      ""
    ).trim();
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

    let everyPostHasFeaturedImage = true;
    for (const post of posts) {
      if (!post.featuredImagePath) {
        everyPostHasFeaturedImage = false;
        break;
      }
    }

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

  async assertSingleWorkUpdateOnHomepage(post: Post): Promise<void> {
    await expect(this.workUpdatesSection).toBeVisible();
    await expect(this.workUpdateCards).toHaveCount(1);

    await expect(this.workUpdateAvatarImg).toBeVisible();

    await expect(this.workUpdateLink).toBeVisible();
    await expect(this.workUpdateLink).toHaveText(post.title);

    await expect(this.workUpdateAuthor).toBeVisible();

    const wpUser = this.wpUser();
    if (wpUser) {
      await expect(this.workUpdateAuthor).toContainText(wpUser);
    }

    await expect(this.workUpdateDate).toBeVisible();
    await expect(this.workUpdateDate).toHaveText(
      dayjs(post.createdAt).format("Do MMMM YYYY"),
    );

    await this.workUpdateLink.click();
    await expect(this.paragraphSnippet(post.content)).toBeVisible();
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
