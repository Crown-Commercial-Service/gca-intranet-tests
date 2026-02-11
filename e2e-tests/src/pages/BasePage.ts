import { Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y/assertions";

export default abstract class BasePage {
  protected readonly page: Page;

  protected constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async a11y() {
    await expectNoSeriousA11yViolations(this.page);
  }
}
