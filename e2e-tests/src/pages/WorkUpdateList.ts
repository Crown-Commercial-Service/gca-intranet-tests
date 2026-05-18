import { Page, Locator, expect } from "@playwright/test";
import { formatDateNew } from "../utils/formatters";
import BasePage from "./BasePage";

export default class WorkUpdateList extends BasePage {
  // private readonly baseUrl?: string;

  readonly container: Locator;
  readonly main: Locator;
  readonly posts: Locator;
  readonly postTitles: Locator;
  readonly postLinks: Locator;
  readonly postDescriptions: Locator;
  readonly postDates: Locator;
  readonly postLabels: Locator;
  readonly postTeams: Locator;

  readonly filters: Locator;

  // Work update Selectors
  readonly workUpdateListSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    // this.baseUrl = baseUrl;

    this.container = this.page.getByTestId("work-update-container");
    this.main = this.page.getByTestId("work-update-main");
    this.posts = this.page.getByTestId("work-update-post");
    this.postTitles = this.page.getByTestId("work-update-post-title");
    this.postLinks = this.page.getByTestId("work-update-post-link");
    this.postDescriptions = this.page.getByTestId("work-update-decs");
    this.postDates = this.page.getByTestId("work-update-post-date");
    this.postLabels = this.page.getByTestId("work-update-tax");
    this.postTeams = this.page.getByTestId("work-update-team");
    this.filters = this.page.getByTestId("archive-filters");
    this.workUpdateListSection = "[data-testid='work-update-main']";
  }

  private postLabelTag(post: Locator): Locator {
    return post.locator(".tag_label.green");
  }

  private postTeamTag(post: Locator): Locator {
    return post.locator(".tag_label.grey");
  }

  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl ?? "/", { waitUntil: "networkidle" });
    await expect(this.container).toBeVisible();
  }

  async gotoWorkUpdateList(): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/work_update`
      : "/work_update";

    await this.page.goto(url, { waitUntil: "networkidle" });
    await expect(this.main).toBeVisible();
  }

  postByTitle(title: string): Locator {
    return this.posts
      .filter({
        has: this.page.getByTestId("work-update-post-link").filter({
          hasText: title,
        }),
      })
      .first();
  }

  async assertPostVisible(title: string): Promise<void> {
    await expect(this.postByTitle(title)).toBeVisible();
  }

  async openByTitle(title: string): Promise<void> {
    const link = this.postByTitle(title).getByTestId("work-update-post-link");
    await expect(link).toBeVisible();
    await link.click();
  }

  async assertPostHasLabel(title: string, label: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(this.postLabelTag(post)).toContainText(label);
  }

  async assertPostHasTeam(title: string, team: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(this.postTeamTag(post)).toContainText(team);
  }

  async assertPostHasDate(title: string, value: string | Date): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-post-date")).toContainText(
      formatDateNew(value),
    );
  }
  async assertPostHasContent(title: string, content: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-decs")).toContainText(content);
  }

  async assertPostHasAuthorImage(title: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.locator(".work_update_profile_img img")).toBeVisible();
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

  private filterCheckbox(filterTerm: string, slug: string): Locator {
    return this.page.locator(`#filter_${filterTerm}-${slug}`);
  }

  async applyLabelFilter(slug: string): Promise<void> {
    await this.expandFilterSection("Type of article");
    await this.toggleFilter("label", slug);
  }

  async applyTeamFilter(slug: string): Promise<void> {
    await this.expandFilterSection("Responsible Team");
    await this.toggleFilter("responsible_team", slug);
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

  async assertLabelFilterAvailable(
    slug: string,
    label: string,
  ): Promise<void> {
    await this.expandFilterSection("Type of article");
    const checkbox = this.filterCheckbox("label", slug);
    await expect(checkbox).toBeVisible();
    await expect(
      this.page.locator(`label[for="filter_label-${slug}"]`),
    ).toContainText(label);
  }

  async assertTeamFilterAvailable(slug: string, team: string): Promise<void> {
    await this.expandFilterSection("Responsible Team");
    const checkbox = this.filterCheckbox("responsible_team", slug);
    await expect(checkbox).toBeVisible();
    await expect(
      this.page.locator(`label[for="filter_responsible_team-${slug}"]`),
    ).toContainText(team);
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
