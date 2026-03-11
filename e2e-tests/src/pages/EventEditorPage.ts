import { Page, Locator, expect } from "@playwright/test";
import Event from "../../src/models/Events";
import { toEditorDateTime } from "../../src/utils/formatters";

export default class EventEditorPage {
  readonly page: Page;

  readonly titleInput: Locator;
  readonly contentInput: Locator;

  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly ctaLabelInput: Locator;
  readonly ctaDestinationInput: Locator;
  readonly categoriesBox: Locator;
  readonly eventLocationBox: Locator;

  readonly publishButton: Locator;
  readonly updateButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.titleInput = page.locator("#title");
    this.contentInput = page.locator("#content");
    this.categoriesBox = page.locator("#categorychecklist");
    this.eventLocationBox = page.locator("#event_locationchecklist");
    this.startDateInput = page.locator(
      'input[name="acf[202603101020a_202603101020b]"] + input.input',
    );

    this.endDateInput = page.locator(
      'input[name="acf[202603101020a_202603101020c]"] + input.input',
    );

    this.ctaLabelInput = page.locator("#acf-202603101020a_202603101020d");
    this.ctaDestinationInput = page.locator("#acf-202603101020a_202603101020e");

    this.publishButton = page.locator("#publish");
    this.updateButton = page.locator("#publish");
  }

  async gotoEdit(postId: number): Promise<void> {
    await this.page.goto(`/wp-admin/post.php?post=${postId}&action=edit`, {
      waitUntil: "domcontentloaded",
    });
  }

  async selectCategory(categoryName: string): Promise<void> {
    const categoryOption = this.categoriesBox
      .locator("label")
      .filter({ hasText: categoryName })
      .first();

    await expect(categoryOption).toBeVisible();
    await categoryOption.click();
  }

  async selectEventLocation(eventLocation: string): Promise<void> {
    const eventLocationOption = this.eventLocationBox
      .locator("label")
      .filter({ hasText: eventLocation })
      .first();

    await expect(eventLocationOption).toBeVisible();
    await eventLocationOption.click();
  }

  async fillEventDetails(event: Event): Promise<void> {
    await expect(this.startDateInput).toBeVisible();
    await this.startDateInput.fill(toEditorDateTime(event.startDate));

    await expect(this.endDateInput).toBeVisible();
    await this.endDateInput.fill(toEditorDateTime(event.endDate));

    if (event.ctaLabel) {
      await this.ctaLabelInput.fill(event.ctaLabel);
    }

    if (event.ctaDestination) {
      await this.ctaDestinationInput.fill(event.ctaDestination);
    }
  }

  async update(): Promise<void> {
    await this.publishButton.click();
  }

  async updateEventDetails(event: Event): Promise<void> {
    await this.fillEventDetails(event);
    await this.updateButton.click();
  }
}
