import { Page } from "@playwright/test";
import BasePage from "./BasePage";

export default class BlogPage extends BasePage {
  private readonly baseUrl?: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;
  }

  async goto(slug: string): Promise<void> {
    const base = this.baseUrl ? this.baseUrl.replace(/\/+$/, "") : "";
    const path = slug.startsWith("/") ? slug : `/${slug}`;

    await this.page.goto(`${base}${path}`, {
      waitUntil: "networkidle",
    });
  }
}
