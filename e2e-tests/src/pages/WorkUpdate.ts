import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class WorkUpdate extends BasePage {
  // private readonly baseUrl?: string;

  readonly container: Locator;
  readonly main: Locator;
  readonly title: Locator;
  readonly details: Locator;
  readonly date: Locator;
  readonly tax: Locator;
  readonly team: Locator;
  readonly content: Locator;
  readonly author: Locator;
  readonly authorImage: Locator;

  // Accessibility Selectors
  readonly workUpdateSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    // this.baseUrl = baseUrl;

    this.container = this.page.getByTestId("work-update-container");
    this.main = this.page.getByTestId("work-update-main");
    this.title = this.page.getByTestId("work-update-title");
    this.details = this.page.getByTestId("work-update-detials");
    this.date = this.page.getByTestId("work-update-date");
    this.tax = this.page.getByTestId("work-update-tax");
    this.team = this.page.getByTestId("work-update-team");
    this.content = this.page.getByTestId("work-update-content");
    this.author = this.details.locator("span").first();
    this.authorImage = this.page.locator(".profile_img_wrapper img");
    this.workUpdateSection = "[data-testid='work-update-main']";
  }

  async goto(pathname: string): Promise<void> {
    await this.page.goto(this.resolve(pathname), { waitUntil: "networkidle" });
  }

  async gotoById(postId: number): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/?p=${postId}`
      : `/?p=${postId}`;

    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  async assertTitle(expected: string): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.title).toContainText(expected);
  }

  async assertAuthorImageVisible(): Promise<void> {
    await expect(this.authorImage).toBeVisible();
  }

  async assertContent(expected: string): Promise<void> {
    await expect(this.content).toContainText(expected);
  }

  async assertAuthor(expected: string): Promise<void> {
    await expect(this.author).toContainText(`By ${expected}`);
  }

  async assertPublishedDate(expected: string): Promise<void> {
    await expect(this.date).toContainText(expected);
  }

  async assertWorkUpdateLabel(expected: string): Promise<void> {
    await expect(this.tax).toContainText(expected);
  }

  async assertWorkUpdateTeam(expected: string): Promise<void> {
    await expect(this.team).toContainText(expected);
  }

  private resolve(pathname: string): string {
    if (!this.baseUrl) return pathname;
    const base = this.baseUrl.replace(/\/+$/, "");
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `${base}${path}`;
  }
}
