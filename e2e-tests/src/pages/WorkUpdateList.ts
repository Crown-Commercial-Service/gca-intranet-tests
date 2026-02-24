import { Page, Locator, expect } from "@playwright/test";

export default class WorkUpdateList {
  readonly page: Page;
  private readonly baseUrl?: string;

  readonly section: Locator;
  readonly cards: Locator;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

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
}
