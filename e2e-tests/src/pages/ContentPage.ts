import { Page } from "@playwright/test";
import BasePage from "./BasePage";

export default class ContentPage extends BasePage {
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }
}
