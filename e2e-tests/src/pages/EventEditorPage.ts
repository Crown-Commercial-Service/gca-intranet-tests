import { Page, Locator, expect } from "@playwright/test";
import Event from "../../src/models/Events";
import { toEditorDate } from "../../src/utils/formatters";
import BasePage from "./BasePage";

export default class EventEditorPage extends BasePage {
  readonly titleInput: Locator;
  readonly contentInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly ctaLabelInput: Locator;
  readonly ctaDestinationInput: Locator;
  readonly eventLocationBox: Locator;
  readonly publishingSpinner: Locator;
  readonly publishMessage: Locator;
  readonly startTimeInput: Locator;
  readonly endTimeInput: Locator;
  readonly publishButton: Locator;
  readonly updateButton: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.locator("#title");
    this.contentInput = page.locator("#content");
    this.eventLocationBox = page.locator("#event_locationchecklist");
    this.publishingSpinner = page.locator("#publishing-action .spinner");
    this.publishMessage = page.locator("#message.updated, #message.notice");
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
    this.startDateInput = page.locator(
      'input[name="acf[202603101020a_202603101020b]"] + input.input',
    );

    this.startTimeInput = page.locator(
      'input[name="acf[202603101020a_202603101021c]"] + input.input',
    );

    this.endDateInput = page.locator(
      'input[name="acf[202603101020a_202603101020c]"] + input.input',
    );

    this.endTimeInput = page.locator(
      'input[name="acf[202603101020a_202603131021c]"] + input.input',
    );
  }

  async gotoEdit(postId: number): Promise<void> {
    await this.page.goto(`/wp-admin/post.php?post=${postId}&action=edit`, {
      waitUntil: "domcontentloaded",
    });
  }

  // async selectCategory(categoryName: string): Promise<void> {
  //   const categoryOption = this.categoriesBox
  //     .locator("label")
  //     .filter({ hasText: categoryName })
  //     .first();

  //   await expect(categoryOption).toBeVisible();
  //   await categoryOption.click();
  // }

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
    await this.selectDateFromDatePicker(
      this.startDateInput,
      toEditorDate(event.startDate),
    );

    await expect(this.startTimeInput).toBeVisible();
    await this.setTimeFromTimePicker(this.startTimeInput);

    await expect(this.endDateInput).toBeVisible();
    await this.selectDateFromDatePicker(
      this.endDateInput,
      toEditorDate(event.endDate),
    );

    await expect(this.endTimeInput).toBeVisible();
    await this.setTimeFromTimePicker(this.endTimeInput);

    if (event.ctaLabel) {
      await this.ctaLabelInput.fill(event.ctaLabel);
    }

    if (event.ctaDestination) {
      await this.ctaDestinationInput.fill(event.ctaDestination);
    }
  }

  async setTimeFromTimePicker(input: Locator): Promise<void> {
    await input.click();

    const nowButton = this.page.getByRole("button", { name: "Now" });
    await expect(nowButton).toBeVisible();

    await nowButton.click();
  }

  async selectDateFromDatePicker(input: Locator, value: string): Promise<void> {
    await input.click();
    await expect(input).toBeVisible();

    await input.fill("");
    await input.press("ControlOrMeta+a");
    await input.type(value, { delay: 20 });

    await input.press("Tab");

    await expect(input).toHaveValue(value);
  }
}
