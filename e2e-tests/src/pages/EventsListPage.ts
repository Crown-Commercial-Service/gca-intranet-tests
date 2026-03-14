import { Page, Locator, expect } from "@playwright/test";

export default class EventsListPage {
  readonly page: Page;
  readonly baseUrl?: string;

  readonly eventsRows: Locator;
  readonly eventsLinks: Locator;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

    this.eventsRows = page.locator('[data-testid="events-row"]');
    this.eventsLinks = page.getByTestId("events-link");
  }

  async goto(): Promise<void> {
    await this.page.goto(`${this.baseUrl ?? ""}/events`, {
      waitUntil: "domcontentloaded",
    });
  }

  async selectEvent(title: string): Promise<void> {
    const link = this.eventsLinks.filter({ hasText: title });
    await expect(link).toBeVisible();
    await link.click();
  }

  async assertEventVisible(title: string): Promise<void> {
    const link = this.eventsLinks.filter({ hasText: title });
    await expect(link).toBeVisible();
  }

  async assertEventsCount(count: number): Promise<void> {
    await expect(this.eventsRows).toHaveCount(count);
  }
}
