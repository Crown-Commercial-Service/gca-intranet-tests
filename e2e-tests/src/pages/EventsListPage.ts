import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class EventsListPage extends BasePage {
  readonly eventsRows: Locator;
  readonly eventsLinks: Locator;

  readonly main: Locator;
  readonly posts: Locator;
  readonly postTitles: Locator;
  readonly postLinks: Locator;
  readonly filters: Locator;
  readonly postsContainer: Locator;
  readonly monthHeadings: Locator;
  readonly upcomingTab: Locator;
  readonly pastTab: Locator;

  // Event Selectors
  readonly eventsListSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.eventsRows = page.locator('[data-testid="events-row"]');
    this.eventsLinks = page.getByTestId("events-link");

    this.main = this.page.getByTestId("archive-event-main");
    this.posts = this.page.getByTestId("archive-event-post");
    this.postTitles = this.page.getByTestId("archive-event-post-title");
    this.postLinks = this.page.getByTestId("archive-event-post-link");
    this.filters = this.page.getByTestId("archive-filters");
    this.postsContainer = this.page.getByTestId("archive-event-posts");
    this.monthHeadings = this.page.getByTestId("archive-event-month-heading");
    this.upcomingTab = this.page.getByTestId("events-tab-upcoming");
    this.pastTab = this.page.getByTestId("events-tab-past");

    this.eventsListSection = "[data-testid='archive-event-main']";
  }

  async goto(): Promise<void> {
    await this.page.goto("/event", {
      waitUntil: "domcontentloaded",
    });
  }

  async gotoEventsList(): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/event`
      : "/event";

    await this.page.goto(url, { waitUntil: "networkidle" });
    await expect(this.main).toBeVisible();
  }

  async gotoPastEventsList(): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/event/?view=past`
      : "/event/?view=past";

    await this.page.goto(url, { waitUntil: "networkidle" });
    await expect(this.main).toBeVisible();
  }

  async selectEvent(title: string): Promise<void> {
    const link = this.eventsLinks.filter({ hasText: title });
    await expect(link).toBeVisible();
    await link.click();
  }

  async assertEventVisible(title: string): Promise<void> {
    const link = this.eventsLinks.filter({ hasText: title });
    await expect(link).toBeVisible();
  }

  async assertEventsCount(count: number): Promise<void> {
    await expect(this.eventsRows).toHaveCount(count);
  }

  postByTitle(title: string): Locator {
    return this.posts
      .filter({
        has: this.postLinks.filter({ hasText: title }),
      })
      .first();
  }

  async assertPostVisible(title: string): Promise<void> {
    await expect(this.postByTitle(title)).toBeVisible();
  }

  async assertPostNotVisible(title: string): Promise<void> {
    await expect(
      this.posts.filter({
        has: this.postLinks.filter({ hasText: title }),
      }),
    ).toHaveCount(0);
  }

  private filterSection(sectionTitle: string): Locator {
    return this.filters
      .locator("[data-filter-section]")
      .filter({ hasText: sectionTitle })
      .first();
  }

  async expandFilterSection(sectionTitle: string): Promise<void> {
    const section = this.filterSection(sectionTitle);
    const toggle = section.locator("[data-toggle-section]");
    const body = section.locator("[data-section-body]");

    await expect(toggle).toBeVisible();

    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }

    await expect(body).toBeVisible();
  }

  private filterCheckbox(slug: string): Locator {
    return this.page.locator(`#filter_category-${slug}`);
  }

  async applyCategoryFilter(slug: string): Promise<void> {
    await this.expandFilterSection("Category");

    const checkbox = this.filterCheckbox(slug);
    await expect(checkbox).toBeVisible();

    await Promise.all([
      this.page.waitForURL(
        (url) => url.searchParams.getAll("filter_category[]").includes(slug),
        { waitUntil: "networkidle" },
      ),
      checkbox.check(),
    ]);

    await expect(this.main).toBeVisible();
  }

  async assertCategoryFilterAvailable(
    slug: string,
    label: string,
  ): Promise<void> {
    await this.expandFilterSection("Category");
    const checkbox = this.filterCheckbox(slug);
    await expect(checkbox).toBeVisible();
    await expect(
      this.page.locator(`label[for="filter_category-${slug}"]`),
    ).toContainText(label);
  }

  async selectSortOrder(order: "newest" | "oldest"): Promise<void> {
    const radio = this.page.locator(`#sort-${order}`);
    await expect(radio).toBeVisible();

    await Promise.all([
      this.page.waitForURL(
        (url) => url.searchParams.get("sort") === order,
        { waitUntil: "networkidle" },
      ),
      radio.check(),
    ]);

    await expect(this.main).toBeVisible();
  }

  async assertPostBefore(
    firstTitle: string,
    secondTitle: string,
  ): Promise<void> {
    const titles = (await this.postTitles.allTextContents()).map((t) =>
      t.trim(),
    );
    const firstIdx = titles.findIndex((t) => t.includes(firstTitle));
    const secondIdx = titles.findIndex((t) => t.includes(secondTitle));

    expect(firstIdx, `Expected to find "${firstTitle}" on page`).toBeGreaterThanOrEqual(0);
    expect(
      secondIdx,
      `Expected "${firstTitle}" to appear before "${secondTitle}"`,
    ).toBeGreaterThan(firstIdx);
  }

  async assertMonthHeadingVisible(monthYear: string): Promise<void> {
    await expect(
      this.monthHeadings.filter({ hasText: monthYear }).first(),
    ).toBeVisible();
  }

  async assertEventUnderMonthHeading(
    eventTitle: string,
    monthYear: string,
  ): Promise<void> {
    const items = await this.postsContainer.locator(":scope > *").all();

    let currentMonth: string | null = null;
    let found = false;

    for (const item of items) {
      const testid = await item.getAttribute("data-testid");

      if (testid === "archive-event-month-heading") {
        currentMonth = ((await item.textContent()) ?? "").trim();
        continue;
      }

      if (testid === "archive-event-post" && currentMonth === monthYear) {
        const title = (
          (await item
            .getByTestId("archive-event-post-title")
            .textContent()) ?? ""
        ).trim();

        if (title.includes(eventTitle)) {
          found = true;
          break;
        }
      }
    }

    expect(
      found,
      `Expected "${eventTitle}" to be grouped under "${monthYear}" heading`,
    ).toBe(true);
  }
}
