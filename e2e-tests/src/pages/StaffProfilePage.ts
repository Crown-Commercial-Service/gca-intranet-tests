import { Page, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class StaffProfilePage extends BasePage {
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async assertStaffDetails(name: string, role: string): Promise<void> {
    await expect(this.page.getByText(name, { exact: false }).first()).toBeVisible();
    await expect(this.page.getByText(role, { exact: false }).first()).toBeVisible();
  }
}
