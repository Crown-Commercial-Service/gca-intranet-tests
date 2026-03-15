import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class WorkUpdateList extends BasePage {
  private readonly baseUrl?: string;

  readonly container: Locator;
  readonly main: Locator;
  readonly posts: Locator;
  readonly postTitles: Locator;
  readonly postLinks: Locator;
  readonly postDescriptions: Locator;
  readonly postDates: Locator;
  readonly postLabels: Locator;
  readonly postTeams: Locator;

  // Accessibility Selectors
  readonly workUpdateListSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;

    this.container = this.page.getByTestId("work-update-container");
    this.main = this.page.getByTestId("work-update-main");
    this.posts = this.page.getByTestId("work-update-post");
    this.postTitles = this.page.getByTestId("work-update-post-title");
    this.postLinks = this.page.getByTestId("work-update-post-link");
    this.postDescriptions = this.page.getByTestId("work-update-decs");
    this.postDates = this.page.getByTestId("work-update-post-date");
    this.postLabels = this.page.getByTestId("work-update-tax");
    this.postTeams = this.page.getByTestId("work-update-team");
    this.workUpdateListSection = `[data-testid="${this.main}"]`;
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
    await expect(post.getByTestId("work-update-tax")).toContainText(label);
  }

  async assertPostHasTeam(title: string, team: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-team")).toContainText(team);
  }

  async assertPostHasDate(title: string, date: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-post-date")).toContainText(date);
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
}
