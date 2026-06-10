import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";
import { formatDateNew } from "../utils/formatters";

export default class BlogListPage extends BasePage {

  readonly container: Locator;
  readonly main: Locator;
  readonly posts: Locator;
  readonly postTitles: Locator;
  readonly postLinks: Locator;
  readonly postDescriptions: Locator;
  readonly postDates: Locator;
  readonly postLabels: Locator;
  readonly filters: Locator;
  readonly blogsListSection: string;

  constructor(page: Page) {
    super(page);

    this.container = this.page.getByTestId("blog-container");
    this.main = this.page.getByTestId("blog-main");
    this.posts = this.page.getByTestId("blog-post");
    this.postTitles = this.page.getByTestId("blog-post-title");
    this.postLinks = this.page.getByTestId("blog-post-link");
    this.postDescriptions = this.page.getByTestId("blog-decs");
    this.postDates = this.page.getByTestId("blog-post-date");
    this.postLabels = this.page.getByTestId("blog-tax");
    this.filters = this.page.getByTestId("archive-filters");
    this.blogsListSection = "[data-testid='blog-main']";
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

  async assertPostHasDate(title: string, value: string | Date): Promise<void> {
    const post = this.postByTitle(title);
    const expected = formatDateNew(value);

    await expect(post.getByTestId("blog-post-date")).toContainText(expected);
  }

  async assertPostHasContent(title: string, content: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("blog-decs")).toContainText(content);
  }

  async assertPostHasFeaturedImage(title: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.locator("img")).toBeVisible();
  }

  async assertPostCount(count: number): Promise<void> {
    await expect(this.posts).toHaveCount(count);
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

  private filterCheckbox(slug: string): Locator {
    return this.page.locator(`#filter_label-${slug}`);
  }

  async applyLabelFilter(slug: string): Promise<void> {
    await this.expandFilterSection("Type of article");

    const checkbox = this.filterCheckbox(slug);
    await expect(checkbox).toBeVisible();

    await Promise.all([
      this.page.waitForURL(
        (url) => url.searchParams.getAll("filter_label[]").includes(slug),
        { waitUntil: "networkidle" },
      ),
      checkbox.check(),
    ]);

    await expect(this.main).toBeVisible();
  }

  async assertLabelFilterAvailable(
    slug: string,
    label: string,
  ): Promise<void> {
    await this.expandFilterSection("Type of article");
    const checkbox = this.filterCheckbox(slug);
    await expect(checkbox).toBeVisible();
    await expect(
      this.page.locator(`label[for="filter_label-${slug}"]`),
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
