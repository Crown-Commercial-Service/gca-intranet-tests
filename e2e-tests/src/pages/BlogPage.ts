import { Page } from "@playwright/test";

export default class BlogPage {
  readonly page: Page;
  private readonly baseUrl?: string;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`${this.baseUrl ?? ""}/${slug}`, {
      waitUntil: "networkidle",
    });
  }
}
