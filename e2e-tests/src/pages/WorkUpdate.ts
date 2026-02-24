import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class WorkUpdate extends BasePage {
  private readonly baseUrl?: string;

  readonly title: Locator;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;

    this.title = this.page.getByRole("heading").first();
  }

  async goto(pathname: string): Promise<void> {
    await this.page.goto(this.resolve(pathname), { waitUntil: "networkidle" });
  }

  async assertTitle(expected: string): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.title).toContainText(expected);
  }

  private resolve(pathname: string): string {
    if (!this.baseUrl) return pathname;
    const base = this.baseUrl.replace(/\/+$/, "");
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `${base}${path}`;
  }
}
