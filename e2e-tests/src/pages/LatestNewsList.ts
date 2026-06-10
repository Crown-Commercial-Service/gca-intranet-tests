import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";
import { formatDateNew } from "../utils/formatters";
import Post from "../models/Post";

export default class LatestNewsList extends BasePage {

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

  readonly filters: Locator;

  readonly latestNewsListSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);

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

    this.filters = this.page.getByTestId("archive-filters");

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

  async assertPostNotVisible(title: string): Promise<void> {
    await expect(
      this.posts.filter({
        has: this.postLinks.filter({ hasText: title }),
      }),
    ).toHaveCount(0);
  }

  private filterSection(sectionTitle: string): Locator {
    return this.filters
      .locator("[data-filter-section]")
      .filter({ hasText: sectionTitle })
      .first();
  }

  async expandFilterSection(sectionTitle: string): Promise<void> {
    const section = this.filterSection(sectionTitle);
    const toggle = section.locator("[data-toggle-section]");
    const body = section.locator("[data-section-body]");

    await expect(toggle).toBeVisible();

    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }

    await expect(body).toBeVisible();
  }

  private filterCheckbox(filterTerm: string, slug: string): Locator {
    return this.page.locator(`#filter_${filterTerm}-${slug}`);
  }

  async applyCategoryFilter(slug: string): Promise<void> {
    await this.expandFilterSection("Category");
    await this.toggleFilter("category", slug);
  }

  async applyLabelFilter(slug: string): Promise<void> {
    await this.expandFilterSection("Type of article");
    await this.toggleFilter("label", slug);
  }

  private async toggleFilter(filterTerm: string, slug: string): Promise<void> {
    const checkbox = this.filterCheckbox(filterTerm, slug);
    await expect(checkbox).toBeVisible();

    await Promise.all([
      this.page.waitForURL(
        (url) =>
          url.searchParams.getAll(`filter_${filterTerm}[]`).includes(slug),
        { waitUntil: "networkidle" },
      ),
      checkbox.check(),
    ]);

    await expect(this.main).toBeVisible();
  }

  async assertCategoryFilterAvailable(
    slug: string,
    label: string,
  ): Promise<void> {
    await this.expandFilterSection("Category");
    const checkbox = this.filterCheckbox("category", slug);
    await expect(checkbox).toBeVisible();
    await expect(
      this.page.locator(`label[for="filter_category-${slug}"]`),
    ).toContainText(label);
  }

  async selectSortOrder(order: "newest" | "oldest"): Promise<void> {
    const radio = this.page.locator(`#sort-${order}`);
    await expect(radio).toBeVisible();

    await Promise.all([
      this.page.waitForURL(
        (url) => url.searchParams.get("sort") === order,
        { waitUntil: "networkidle" },
      ),
      radio.check(),
    ]);

    await expect(this.main).toBeVisible();
  }

  async assertPostBefore(
    firstTitle: string,
    secondTitle: string,
  ): Promise<void> {
    const titles = (await this.postTitles.allTextContents()).map((t) =>
      t.trim(),
    );
    const firstIdx = titles.findIndex((t) => t.includes(firstTitle));
    const secondIdx = titles.findIndex((t) => t.includes(secondTitle));

    expect(firstIdx, `Expected to find "${firstTitle}" on page`).toBeGreaterThanOrEqual(0);
    expect(
      secondIdx,
      `Expected "${firstTitle}" to appear before "${secondTitle}"`,
    ).toBeGreaterThan(firstIdx);
  }
}
