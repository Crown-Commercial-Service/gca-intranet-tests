import { Page, Locator, expect } from "@playwright/test";
import TakeALook from "../models/TakeALook";

export default class CustomizerPage {
  readonly page: Page;

  readonly homepageOptionsButton: Locator;

  readonly takeALookTitle: Locator;
  readonly takeALookDescription: Locator;
  readonly takeALookLinkText: Locator;
  readonly takeALookLinkUrl: Locator;
  readonly publishButton: Locator;
  readonly publishedText: Locator;
  readonly publishedButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.homepageOptionsButton = page.getByRole("button", {
      name: "Homepage options",
    });

    this.takeALookTitle = page.getByLabel("Take a look: title");
    this.takeALookDescription = page.getByLabel("Take a look: description");
    this.takeALookLinkText = page.getByLabel("Take a look: link text");
    this.takeALookLinkUrl = page.getByLabel("Take a look: link URL");
    this.publishButton = page.getByRole("button", {
      name: "Publish",
      exact: true,
    });
    this.publishedText = page.getByText("Published", { exact: true });
    this.publishedButton = page.getByRole("button", {
      name: "Published",
      exact: true,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto("/wp-admin/customize.php", {
      waitUntil: "domcontentloaded",
    });
  }

  async openHomepageOptions(): Promise<void> {
    await this.homepageOptionsButton.click();
  }

  async updateTakeALook(takeALook: TakeALook): Promise<void> {
    await this.takeALookTitle.fill(takeALook.title);
    await this.takeALookDescription.fill(takeALook.description);
    await this.takeALookLinkText.fill(takeALook.linkText);
    await this.takeALookLinkUrl.fill(takeALook.linkUrl);
  }

  async publish(): Promise<void> {
    await this.publishButton.click();
    await expect(this.publishedText).toBeVisible();
    await expect(this.publishedButton).toBeDisabled();
  }
}
