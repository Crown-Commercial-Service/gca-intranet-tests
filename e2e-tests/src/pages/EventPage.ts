import { Page, Locator, expect } from "@playwright/test";
import Event from "../models/Events";

export default class EventPage {
  readonly page: Page;
  readonly baseUrl?: string;

  readonly heading: Locator;
  readonly eventDate: Locator;
  readonly eventCategory: Locator;
  readonly eventLocation: Locator;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

    this.heading = page.getByRole("heading", { level: 1 });
    this.eventDate = page.getByTestId("events-date");
    this.eventCategory = page.getByTestId("events-category");
    this.eventLocation = page.getByTestId("events-location");
  }

  async goto(eventId: number): Promise<void> {
    await this.page.goto(`${this.baseUrl}/?p=${eventId}`, {
      waitUntil: "domcontentloaded",
    });
  }

  async assertHeading(title: string): Promise<void> {
    await expect(this.heading).toHaveText(title);
  }

  async assertCategory(category: string): Promise<void> {
    await expect(this.eventCategory).toHaveText(category);
  }

  async assertLocation(location: string): Promise<void> {
    await expect(this.eventLocation).toHaveText(location);
  }

  async assertDate(date: string): Promise<void> {
    await expect(this.eventDate).toContainText(date);
  }
}
