import { Page, Locator, expect } from "@playwright/test";
import type Post from "../models/Post";
import { formatPostDate } from "../utils/formatters";
import AxeBuilder from "@axe-core/playwright";

export default class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/");
  }

  async a11y() {
    const results = await new AxeBuilder({ page: this.page }).analyze();

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(seriousOrCritical).toEqual([]);
  }

  private articleLink(title: string): Locator {
    return this.page.getByRole("link", { name: title });
  }

  latestArticleLink(title: string): Locator {
    return this.page.getByRole("link", { name: title });
  }

  async openLatestArticle(title: string) {
    await this.latestArticleLink(title).click();
  }

  private articleParagraphSnippet(content: string): Locator {
    const snippet = content.slice(0, 40);
    return this.page.getByText(snippet);
  }

  private articleParagraph(content: string): Locator {
    return this.page.getByText(content);
  }

  private articleImage(): Locator {
    return this.page.getByRole("img").first();
  }

  private assertHasPosts(posts: Post[]) {
    if (!posts.length) {
      throw new Error("assertLatestNewsLayout expects at least 1 post");
    }
  }

  private async assertLatestVisible(latest: Post) {
    await expect(this.articleLink(latest.title)).toBeVisible();
  }

  private async assertDateRendered(posts: Post[]) {
    const formattedDate = formatPostDate(posts[0].createdAt);
    await expect(this.page.getByText(formattedDate)).toHaveCount(posts.length);
  }

  private async assertImagesRendered(posts: Post[]) {
    const shouldHaveImages = posts.every((p) => !!p.featuredImagePath);
    if (!shouldHaveImages) return;

    const imgCount = await this.page.getByRole("img").count();
    expect(imgCount).toBeGreaterThanOrEqual(posts.length);
  }

  private async assertTitlesInOrder(posts: Post[]) {
    const postLinks = this.page.getByRole("link").filter({ hasText: "Post" });

    for (let i = 0; i < posts.length; i++) {
      await expect(postLinks.nth(i)).toHaveText(posts[i].title);
    }
  }

  async assertLatestNewsLayout(posts: Post[]) {
    this.assertHasPosts(posts);

    const latest = posts[0];

    await this.assertLatestVisible(latest);
    await this.assertDateRendered(posts);
    await this.assertImagesRendered(posts);

    if (posts.length === 1) return;

    await this.assertTitlesInOrder(posts);
  }

  async assertLatestNewsCharLimits(
    posts: Post[],
    {
      titleMax,
      paragraphMax,
    }: {
      titleMax: number;
      paragraphMax: number;
    },
  ) {
    for (const post of posts) {
      await expect(this.articleLink(post.title)).toHaveText(post.title);
      await expect(this.articleParagraphSnippet(post.content)).toBeVisible();

      expect(post.title.length).toBeLessThanOrEqual(titleMax);
      expect(post.content.length).toBeLessThanOrEqual(paragraphMax);
    }
  }
}
