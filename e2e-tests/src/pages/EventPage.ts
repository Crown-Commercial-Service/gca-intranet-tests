import { Page, Locator, expect } from "@playwright/test";
import Event from "../models/Events";
import BasePage from "./BasePage";
import {
  buildExpectedEventDateText,
  buildExpectedEventTimeText,
} from "../utils/formatters";

export default class EventPage extends BasePage {
  // readonly baseUrl?: string;

  readonly heading: Locator;
  readonly eventDate: Locator;
  readonly eventCategory: Locator;
  readonly eventLocation: Locator;
  readonly eventDetails: Locator;
  readonly eventsDate: Locator;

  // Event Selectors
  readonly eventSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    // this.baseUrl = baseUrl;

    this.heading = this.page.getByRole("heading", { level: 1 });
    this.eventDate = this.page.getByTestId("events-date");
    this.eventCategory = this.page.getByTestId("events-category");
    this.eventLocation = this.page.getByTestId("events-location");
    this.eventDetails = this.page.getByTestId("event-details");
    this.eventsDate = this.page.getByTestId("events-date");
    this.eventSection = "[data-testid='event-main']";
  }

  async gotoById(eventId: number): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/?p=${eventId}`
      : `/?p=${eventId}`;

    await this.page.goto(url, {
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

  async assertDateAndTime(event: Event): Promise<void> {
    await expect(this.eventDetails).toBeVisible();

    await expect(this.eventsDate).toContainText(
      buildExpectedEventDateText(event),
    );

    const expectedTime = buildExpectedEventTimeText(event);

    if (expectedTime) {
      await expect(this.eventDetails).toContainText(expectedTime);
    }
  }
}
