import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class StaffDirectoryPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly directorateSelect: Locator;
  readonly teamsSection: Locator;
  readonly searchTitle: Locator;
  readonly searchGrid: Locator;
  readonly staffCards: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);

    this.searchInput = page.locator("#sd-search-input");
    this.searchButton = page.locator("#sd-search-btn");
    this.directorateSelect = page.locator("#sd-directorate-select");
    this.teamsSection = page.locator("#sd-teams-section");
    this.searchTitle = page.locator("#sd-search-title");
    this.searchGrid = page.locator("#sd-search-grid");
    this.staffCards = page.locator(".sd-staff-card");
    this.emptyMessage = page.getByText(
      "Select a directorate or search by name to see results",
    );
  }

  async goto(): Promise<void> {
    await this.page.goto("/staff-directory/", { waitUntil: "networkidle" });
  }

  async search(query: string): Promise<void> {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await expect(this.searchTitle).toBeVisible();
  }

  async selectDirectorate(name: string): Promise<void> {
    await expect(this.directorateSelect).toBeVisible();
    await this.directorateSelect.selectOption(name);
    await expect(this.teamsSection).toBeVisible();
  }

  async selectTeam(team: string): Promise<void> {
    const teamButton = this.teamsSection.locator(
      `button[data-team="${team}"]`,
    );
    await expect(teamButton).toBeVisible();
    await teamButton.click();
    await expect(this.staffCards.first()).toBeVisible();
  }

  async assertEmptyMessage(): Promise<void> {
    await expect(this.emptyMessage).toBeVisible();
  }

  async assertResultCount(expected: number): Promise<void> {
    const expectedFragment =
      expected === 1
        ? `Found ${expected} result`
        : `Found ${expected} results`;
    await expect(this.searchTitle).toContainText(expectedFragment);
    await expect(this.staffCards).toHaveCount(expected);
  }

  cardByName(name: string): Locator {
    return this.staffCards.filter({
      has: this.page.locator(".sd-staff-card__name", { hasText: name }),
    });
  }

  async assertStaffCard(
    name: string,
    role: string,
    manager: string,
  ): Promise<void> {
    const card = this.cardByName(name);
    await expect(card).toHaveCount(1);
    await expect(card.locator(".sd-staff-card__name")).toContainText(name);
    await expect(card.locator(".sd-staff-card__role")).toContainText(role);
    await expect(card.locator(".sd-staff-card__manager")).toContainText(
      manager,
    );
  }

  async openStaffProfile(name: string): Promise<void> {
    const link = this.cardByName(name).locator(".sd-staff-card__link");
    await expect(link).toBeVisible();
    await link.click();
  }
}
