import { Page, Locator, expect } from "@playwright/test";
import TakeALook from "../models/TakeALook";
import QuickLinks from "../models/QuickLinks";

type Menu = {
  name: string;
};

export default class CustomizerPage {
  readonly page: Page;

  readonly homepageOptionsButton: Locator;
  readonly menusButton: Locator;
  readonly createNewMenuButton: Locator;
  readonly menuNameInput: Locator;
  readonly primaryNavigationCheckbox: Locator;
  readonly nextButton: Locator;
  readonly addItemsButton: Locator;
  readonly searchMenuItemsInput: Locator;
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
    this.searchMenuItemsInput = page.locator("#menu-items-search");
    this.menusButton = page.getByRole("button", {
      name: "Menus",
    });

    this.menuNameInput = page.locator(
      "#customize-control-add_menu-name input.menu-name-field",
    );
    this.primaryNavigationCheckbox = page.locator(
      '#customize-control-add_menu-locations input.menu-location[data-location-id="primary"]',
    );

    this.nextButton = page.locator("#customize-new-menu-submit");

    this.createNewMenuButton = page.getByRole("button", {
      name: "Create New Menu",
    });
    this.addItemsButton = page.locator(".add-new-menu-item");

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

  async createMenu(menu: Menu): Promise<void> {
    await this.menusButton.click();
    await this.createNewMenuButton.click();
    await this.menuNameInput.fill(menu.name);
    await this.primaryNavigationCheckbox.check();
    await this.nextButton.click();
    await this.addItemsButton.click();
  }

  async addPageToMenu(pageTitle: string): Promise<void> {
    await expect(this.searchMenuItemsInput).toBeVisible();
    await this.searchMenuItemsInput.fill(pageTitle);

    const pageButton = this.page
      .locator(".menu-item-bar")
      .getByText(pageTitle, { exact: true })
      .first();

    await expect(pageButton).toBeVisible();
    await pageButton.click();
    await this.searchMenuItemsInput.fill("");
  }

  async makeSubMenuItem(
    childTitle: string,
    parentTitle: string,
  ): Promise<void> {
        await this.page.pause();
    const childItem = this.page
      .locator(".menu-item")
      .filter({ hasText: childTitle })
      .first();

    const parentItem = this.page
      .locator(".menu-item")
      .filter({ hasText: parentTitle })
      .first();

    await expect(childItem).toBeVisible();
    await expect(parentItem).toBeVisible();
    await this.page.pause();

    const childBox = await childItem.boundingBox();
    const parentBox = await parentItem.boundingBox();

    if (!childBox || !parentBox) {
      throw new Error("Could not get menu item position for drag and drop.");
    }

    await this.page.mouse.move(
      childBox.x + childBox.width / 2,
      childBox.y + childBox.height / 2,
    );
    await this.page.mouse.down();

    await this.page.mouse.move(
      parentBox.x + 80,
      parentBox.y + parentBox.height + 10,
      { steps: 10 },
    );

    await this.page.mouse.up();
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

  async buildMenu(
    menu: { parent: string; children: string[] }[],
    menuName = "GCA Menu Navigation",
  ): Promise<void> {
    await this.createMenu({
      name: menuName,
    });

    for (const section of menu) {
      await this.addPageToMenu(section.parent);
    }

    for (const section of menu) {
      for (const child of section.children) {
        await this.addPageToMenu(child);
      }
    }

    for (const section of menu) {
      for (const child of [...section.children].reverse()) {
        await this.makeSubMenuItem(child, section.parent);
      }
    }
  }

  async publish(): Promise<void> {
    await this.publishButton.click();
    await expect(this.publishedText).toBeVisible();
    await expect(this.publishedButton).toBeDisabled();
  }
}
