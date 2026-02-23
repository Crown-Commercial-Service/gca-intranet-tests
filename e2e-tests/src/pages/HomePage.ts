import { Page, Locator, expect } from "@playwright/test";
import type Post from "../models/Post";
import {
  expectNoSeriousA11yViolations,
  expectNoSeriousA11yViolationsForSelector,
} from "../a11y/assertions";

type CharLimits = {
  titleMax: number;
  paragraphMax: number;
};

export default class HomePage {
  readonly page: Page;
  private readonly baseUrl?: string;

  readonly latestNewsColumn: Locator;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.latestNewsColumn = this.page.getByTestId("latest-news-column");
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

  private articleLink(title: string): Locator {
    return this.page.getByRole("link", { name: title });
  }

  private articleCard(title: string): Locator {
    return this.page.locator("article").filter({
      has: this.articleLink(title),
    });
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

      const possibleDateElements = card.locator("p, time, span");
      const possibleDateCount = await possibleDateElements.count();

      if (possibleDateCount > 0) {
        await expect(possibleDateElements.first()).toBeVisible();
      }
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