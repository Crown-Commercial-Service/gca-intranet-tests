import { Page } from "@playwright/test";

export default class BlogListPage {
  readonly page: Page;
  private readonly baseUrl?: string;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async goto(): Promise<void> {
    await this.page.goto(`${this.baseUrl ?? ""}/blog/`, {
      waitUntil: "networkidle",
    });
  }
}
