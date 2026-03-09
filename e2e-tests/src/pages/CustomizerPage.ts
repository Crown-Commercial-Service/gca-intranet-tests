import { Page, Locator, expect } from "@playwright/test";
import TakeALook from "../models/TakeALook";
import QuickLinks from "../models/QuickLinks";

export default class CustomizerPage {
  readonly page: Page;

  readonly homepageOptionsButton: Locator;

  readonly takeALookTitle: Locator;
  readonly takeALookDescription: Locator;
  readonly takeALookLinkText: Locator;
  readonly takeALookLinkUrl: Locator;
  readonly quickLinksTitle: Locator;
  readonly quickLinksDescription: Locator;
  readonly quickLink1Text: Locator;
  readonly quickLink1Url: Locator;
  readonly quickLink2Text: Locator;
  readonly quickLink2Url: Locator;
  readonly quickLink3Text: Locator;
  readonly quickLink3Url: Locator;

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
    this.quickLinksTitle = page.getByLabel("Quick links: title");
    this.quickLinksDescription = page.getByLabel("Quick links: description");
    this.quickLink1Text = page.getByLabel("Quick link 1: text");
    this.quickLink1Url = page.getByLabel("Quick link 1: URL");
    this.quickLink2Text = page.getByLabel("Quick link 2: text");
    this.quickLink2Url = page.getByLabel("Quick link 2: URL");
    this.quickLink3Text = page.getByLabel("Quick link 3: text");
    this.quickLink3Url = page.getByLabel("Quick link 3: URL");
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

  async updateQuickLinks(quickLinks: QuickLinks): Promise<void> {
    await this.quickLinksTitle.fill(quickLinks.title);
    await this.quickLinksDescription.fill(quickLinks.description);

    if (quickLinks.links[0]) {
      await this.quickLink1Text.fill(quickLinks.links[0].text);
      await this.quickLink1Url.fill(quickLinks.links[0].url);
    }

    if (quickLinks.links[1]) {
      await this.quickLink2Text.fill(quickLinks.links[1].text);
      await this.quickLink2Url.fill(quickLinks.links[1].url);
    }

    if (quickLinks.links[2]) {
      await this.quickLink3Text.fill(quickLinks.links[2].text);
      await this.quickLink3Url.fill(quickLinks.links[2].url);
    }
  }

  async publish(): Promise<void> {
    await this.publishButton.click();
    await expect(this.publishedText).toBeVisible();
    await expect(this.publishedButton).toBeDisabled();
  }
}
