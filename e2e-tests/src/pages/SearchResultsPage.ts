import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";
import { getVisibleTruncatedText } from "../utils/formatters";

export default class SearchResultsPage extends BasePage {
  readonly baseUrl?: string;

  readonly container: Locator;
  readonly main: Locator;
  readonly row: Locator;
  readonly column: Locator;

  readonly heading: Locator;
  readonly searchQuery: Locator;

  readonly searchForm: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  readonly resultsCount: Locator;
  readonly results: Locator;
  readonly resultCards: Locator;
  readonly pagination: Locator;

  readonly resultTitles: Locator;
  readonly resultLinks: Locator;
  readonly resultExcerpts: Locator;
  readonly resultTerms: Locator;
  readonly resultTitleLinks: Locator;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.baseUrl = baseUrl;

    this.container = this.page.getByTestId("search-container");
    this.main = this.page.getByTestId("search-main");
    this.row = this.page.getByTestId("search-row");
    this.column = this.page.getByTestId("search-col");

    this.heading = this.page.getByTestId("search-heading");
    this.searchQuery = this.heading.locator(".gca-search-query");

    this.searchForm = this.page.getByTestId("search-results-form");
    this.searchInput = this.page.getByLabel("Search the intranet");
    this.searchButton = this.searchForm.getByRole("button", {
      name: "Search",
    });

    this.resultsCount = this.page.getByTestId("search-result-count");
    this.results = this.page.getByTestId("search-results");
    this.resultCards = this.page.getByTestId("search-result");
    this.pagination = this.page.getByTestId("search-pagination");

    this.resultTitles = this.page.getByTestId("search-result-title");
    this.resultLinks = this.page.getByTestId("search-result-link");
    this.resultExcerpts = this.page.getByTestId("search-result-excerpt");
    this.resultTerms = this.page.getByTestId("search-result-terms");
    this.resultTitleLinks = this.page.getByTestId("search-result-link");
  }

  async goto(query: string): Promise<void> {
    const url = this.baseUrl
      ? `${this.baseUrl.replace(/\/+$/, "")}/?s=${encodeURIComponent(query)}`
      : `/?s=${encodeURIComponent(query)}`;

    await this.page.goto(url, {
      waitUntil: "networkidle",
    });

    await expect(this.main).toBeVisible();
  }

  resultByTitle(title: string): Locator {
    return this.resultCards
      .filter({
        has: this.page.getByTestId("search-result-link").filter({
          hasText: title,
        }),
      })
      .first();
  }

  async assertHeadingContainsQuery(query: string): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.searchQuery).toContainText(query);
  }

  async assertSearchInputVisible(): Promise<void> {
    await expect(this.searchInput).toBeVisible();
  }

  async assertSearchInputValue(query: string): Promise<void> {
    await expect(this.searchInput).toHaveValue(query);
  }

  async search(query: string): Promise<void> {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await expect(this.main).toBeVisible();
  }

  async assertResultsCountVisible(): Promise<void> {
    await expect(this.resultsCount).toBeVisible();
  }

  async assertResultsCount(expected: number): Promise<void> {
    await expect(this.resultsCount).toContainText(
      `Found ${expected} result(s)`,
    );
  }

  async assertResultCount(expected: number): Promise<void> {
    await expect(this.resultCards).toHaveCount(expected);
  }

  async assertFirstResultTitle(title: string): Promise<void> {
    await expect(
      this.resultCards.first().getByTestId("search-result-link"),
    ).toContainText(title);
  }

  async assertResultVisible(title: string): Promise<void> {
    await expect(this.resultByTitle(title)).toBeVisible();
  }

  async assertResultHasType(title: string, type: string): Promise<void> {
    const result = this.resultByTitle(title);
    await expect(result.getByTestId("search-result-title")).toContainText(
      `${type} -`,
    );
  }

  async assertResultHasLink(title: string): Promise<void> {
    const result = this.resultByTitle(title);
    await expect(
      result.getByRole("link", {
        name: title,
      }),
    ).toBeVisible();
  }

  async assertResultHasExcerpt(title: string): Promise<void> {
    const result = this.resultByTitle(title);
    await expect(result.getByTestId("search-result-excerpt")).toBeVisible();
  }

  async assertResultDoesNotHaveTerm(
    title: string,
    term: string,
  ): Promise<void> {
    const result = this.resultByTitle(title);
    const terms = result.getByTestId("search-result-terms");

    await expect(
      terms.locator(".tag_label").filter({ hasText: term }),
    ).toHaveCount(0);
  }

  async assertResultHasTerm(title: string, term: string): Promise<void> {
    const result = this.resultByTitle(title);
    await expect(
      result
        .getByTestId("search-result-terms")
        .getByText(term, { exact: true }),
    ).toBeVisible();
  }

  async assertNoResultsMessageVisible(keyword: string): Promise<void> {
    await expect(this.main).toContainText(
      `No results found for “${keyword}”. Try a different search term.`,
    );
  }

  async assertPaginationVisible(): Promise<void> {
    await expect(this.pagination).toBeVisible();
  }

  async assertPaginationNotVisible(): Promise<void> {
    await expect(this.pagination).not.toBeVisible();
  }

  async assertResultsInOrder(titles: string[]): Promise<void> {
    await expect(this.resultCards).toHaveCount(titles.length);

    for (let index = 0; index < titles.length; index++) {
      await expect(
        this.resultCards.nth(index).getByTestId("search-result-link"),
      ).toContainText(titles[index]);
    }
  }

  async assertResultTitleIsTruncated(fullTitle: string): Promise<void> {
    const prefix = fullTitle.trim().slice(0, 25);

    const link = this.resultLinks.filter({ hasText: prefix }).first();

    await expect(link).toBeVisible();

    const actual = ((await link.textContent()) ?? "")
      .replace(/\s+/g, " ")
      .trim();

    expect(actual).not.toBe(fullTitle.trim());

    const visiblePart = getVisibleTruncatedText(actual);
    expect(fullTitle.startsWith(visiblePart)).toBe(true);
  }

  async assertResultExcerptIsTruncated(fullText: string): Promise<void> {
    const prefix = fullText.trim().slice(0, 25);

    const excerpt = this.resultExcerpts.filter({ hasText: prefix }).first();

    await expect(excerpt).toBeVisible();

    const actual = ((await excerpt.textContent()) ?? "")
      .replace(/\s+/g, " ")
      .trim();

    expect(actual).not.toBe(fullText.trim());

    const visiblePart = getVisibleTruncatedText(actual);
    expect(fullText.startsWith(visiblePart)).toBe(true);
  }

  async assertResultNotVisible(title: string): Promise<void> {
    await expect(this.resultByTitle(title)).toHaveCount(0);
  }
}
