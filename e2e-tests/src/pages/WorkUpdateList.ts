import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class WorkUpdateList extends BasePage {
  private readonly baseUrl?: string;

  readonly section: Locator;
  readonly cards: Locator;
  readonly main: Locator;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;

    this.main = this.page.getByTestId("work-update-main");
    this.section = this.page.getByTestId("work-updates-section");
    this.cards = this.section.getByTestId("work-update-card");
  }

  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl ?? "/", { waitUntil: "networkidle" });
    await expect(this.section).toBeVisible();
  }

  async openByTitle(title: string): Promise<void> {
    await expect(this.section).toBeVisible();
    await this.section.getByRole("link", { name: title }).click();
  }

  async gotoWorkUpdateList(): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/work_update`
      : "/work_update";

    await this.page.goto(url, { waitUntil: "networkidle" });
    await expect(this.main).toBeVisible();
  }

  async assertPostHasTeam(title: string, team: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-team")).toContainText(team);
  }

  async assertPostHasAuthor(title: string, author: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-author")).toContainText(
      `By ${author}`,
    );
  }

  async assertPostHasDate(title: string, date: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-date")).toContainText(date);
  }

  async assertPostHasContent(title: string, content: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-content")).toContainText(
      content,
    );
  }

  async assertPostHasAuthorImage(title: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(
      post.getByTestId("work-update-avatar").locator("img"),
    ).toBeVisible();
  }

  async assertPostHasLabel(title: string, label: string): Promise<void> {
    const post = this.postByTitle(title);
    await expect(post.getByTestId("work-update-tax")).toContainText(label);
  }

  async assertPostVisible(title: string): Promise<void> {
    await this.page.pause()
    await expect(this.postByTitle(title)).toBeVisible();
  }
}
