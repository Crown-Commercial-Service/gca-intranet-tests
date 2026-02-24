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

  private readonly latestNewsColumnTestId = "latest-news-column";
  private readonly latestNewsFeaturedCardTestId = "latest-news-featured-card";
  private readonly latestNewsSecondaryCardTestId = "latest-news-secondary-card";
  private readonly latestNewsFeaturedDateTestId = "latest-news-featured-date";
  private readonly latestNewsSecondaryDateTestId = "latest-news-secondary-date";

  private readonly workUpdatesSectionTestId = "work-updates-section";
  private readonly workUpdateCardTestId = "work-update-card";
  private readonly workUpdateAvatarTestId = "work-update-avatar";
  private readonly workUpdateLinkTestId = "work-update-link";
  private readonly workUpdateAuthorTestId = "work-update-author";
  private readonly workUpdateDateTestId = "work-update-date";

  readonly latestNewsColumn: Locator;
  readonly workUpdatesSection: Locator;
  readonly workUpdateCards: Locator;
  readonly workUpdateSeeMoreLink: Locator;

  private readonly latestNewsColumnSelector: string;
  private readonly latestNewsCardSelector: string;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

    this.latestNewsColumn = this.page.getByTestId(this.latestNewsColumnTestId);

    this.workUpdatesSection = this.page.getByTestId(
      this.workUpdatesSectionTestId,
    );

    this.workUpdateCards = this.workUpdatesSection.getByTestId(
      this.workUpdateCardTestId,
    );

    this.workUpdateSeeMoreLink = this.workUpdatesSection.getByRole("link", {
      name: "More work updates",
    });

    this.latestNewsColumnSelector = `[data-testid="${this.latestNewsColumnTestId}"]`;

    this.latestNewsCardSelector = [
      `[data-testid="${this.latestNewsFeaturedCardTestId}"]`,
      `[data-testid="${this.latestNewsSecondaryCardTestId}"]`,
    ].join(", ");
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

  async assertWorkUpdatesOrder(posts: Post[]): Promise<void> {
    if (posts.length === 0) {
      throw new Error("Expected at least one work update");
    }

    await expect(this.workUpdatesSection).toBeVisible();

    const cards = this.workUpdatesSection.getByTestId(
      this.workUpdateCardTestId,
    );

    const visibleCount = await cards.count();
    expect(visibleCount).toBeGreaterThanOrEqual(posts.length);

    for (let i = 0; i < posts.length; i++) {
      const card = cards.nth(i);
      const link = card.getByTestId(this.workUpdateLinkTestId);

      await expect(card).toBeVisible();
      await expect(link).toBeVisible();
      await expect(link).toHaveText(posts[i].title);
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

  async assertWorkUpdateCharLimits(
    post: Post,
    maxDisplayedChars: number,
  ): Promise<void> {
    const card = this.workUpdateCardByTitle(post.title);

    await expect(card).toHaveCount(1);
    await expect(card).toBeVisible();

    const link = card.getByTestId(this.workUpdateLinkTestId);

    const uiTitle = await link.innerText();

    expect(uiTitle.length).toBeLessThan(post.title.length);
    expect(uiTitle.length).toBeLessThanOrEqual(maxDisplayedChars);
  }

  private workUpdateCardByTitle(title: string): Locator {
    return this.workUpdateCards.filter({
      has: this.page.getByRole("link", { name: title }),
    });
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

  private workUpdateLinkByTitle(title: string): Locator {
    return this.workUpdateCards
      .filter({ has: this.page.getByRole("link", { name: title }) })
      .getByTestId(this.workUpdateLinkTestId);
  }

  async selectWorkItemLink(post: Post): Promise<void> {
    const link = this.workUpdateLinkByTitle(post.title);
    await expect(link).toHaveCount(1);
    await link.click();
  }
}
