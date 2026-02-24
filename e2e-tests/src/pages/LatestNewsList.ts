import { Page, Locator, expect } from "@playwright/test";

export default class LatestNewsList {
  readonly page: Page;
  private readonly baseUrl?: string;

  readonly column: Locator;
  readonly featuredCard: Locator;
  readonly featuredLink: Locator;
  readonly featuredDate: Locator;

  readonly secondaryCards: Locator;
  readonly seeMoreLink: Locator;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

    this.column = this.page.getByTestId("latest-news-column");
    this.featuredCard = this.column.getByTestId("latest-news-featured-card");
    this.featuredLink = this.featuredCard.getByTestId(
      "latest-news-featured-link",
    );
    this.featuredDate = this.featuredCard.getByTestId(
      "latest-news-featured-date",
    );

    this.secondaryCards = this.column.getByTestId("latest-news-secondary-card");
    this.seeMoreLink = this.column.getByTestId("latest-news-see-more-link");
  }

  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl ?? "/", { waitUntil: "networkidle" });
    await expect(this.column).toBeVisible();
  }

  async openByTitle(title: string): Promise<void> {
    await expect(this.column).toBeVisible();
    await this.column.getByRole("link", { name: title }).click();
  }
}
