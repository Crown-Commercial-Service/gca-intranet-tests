import { Page, Locator, expect } from "@playwright/test";

export default class WordpressLoginPage {
  readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.usernameInput = this.page.getByLabel("Username or Email Address");
    this.passwordInput = this.page.getByLabel("Password", { exact: true });
    this.loginButton = this.page.getByRole("button", { name: "Log In" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/gcawebadmin", { waitUntil: "domcontentloaded" });
    await this.page.waitForURL(/gcawebadmin/i);

    await this.usernameInput.waitFor();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.page.waitForTimeout(300);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsAdmin(): Promise<void> {
    await this.login(
      process.env.WP_ADMIN_USERNAME!,
      process.env.WP_ADMIN_PASSWORD!,
    );
  }
}
