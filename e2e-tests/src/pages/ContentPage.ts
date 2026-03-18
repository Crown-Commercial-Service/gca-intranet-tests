import { Page } from "@playwright/test";
import BasePage from "./BasePage";

export default class ContentPage extends BasePage {
  private readonly baseUrl?: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;
  }

  async gotoById(postId: number): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/?p=${postId}`
      : `/?p=${postId}`;
    await this.page.goto(url, { waitUntil: "networkidle" });
  }
}
