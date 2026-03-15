import { Page, Locator, expect } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y/assertions";
import type Post from "../models/Post";

export default abstract class BasePage {
  protected readonly page: Page;

  readonly breadcrumbs: Locator;
  readonly pagination: Locator;
  readonly paginationPageNumbers: Locator;
  readonly visuallyHiddenText: Locator;

  // WordPress locators
  readonly posts: Locator;
  readonly titleInput: Locator;
  readonly contentInput: Locator;
  readonly authorSection: Locator;
  readonly authorSelect: Locator;
  readonly publishButton: Locator;
  readonly publishingSpinner: Locator;
  readonly publishMessage: Locator;
  readonly categoriesBox: Locator;
  readonly labelsBox: Locator;
  readonly teamBox: Locator;
  readonly authorImageBox: Locator;
  readonly addAuthorImageButton: Locator;
  readonly mediaModal: Locator;
  readonly mediaLibraryTab: Locator;
  readonly mediaSearchInput: Locator;
  readonly mediaAttachments: Locator;
  readonly selectMediaButton: Locator;
  readonly uploadFilesTab: Locator;
  readonly mediaFileInput: Locator;
  readonly excerptBox: Locator;
  readonly excerptInput: Locator;

  // News detail/list locators
  readonly details: Locator;
  readonly categoryTag: Locator;
  readonly taxonomyTag: Locator;

  protected constructor(page: Page) {
    this.page = page;

    this.breadcrumbs = this.page.locator(".govuk-breadcrumbs");
    this.pagination = this.page.locator(".pagination");
    this.paginationPageNumbers = this.pagination.locator(
      ".nav-links .page-numbers",
    );
    this.visuallyHiddenText = this.page.locator(".govuk-visually-hidden");

    this.posts = this.page.getByTestId("news-post");
    this.details = this.page.getByTestId("news-details");
    this.categoryTag = this.page.getByTestId("news-category");
    this.taxonomyTag = this.page.getByTestId("news-tax");

    this.titleInput = page.locator("#title");
    this.contentInput = page.locator("#content");
    this.authorSection = page.locator("#authordiv");
    this.authorSelect = page.locator("#post_author_override");
    this.publishButton = page.locator("#publish");
    this.publishingSpinner = page.locator("#publishing-action .spinner");
    this.publishMessage = page.locator("#message.updated, #message.notice");
    this.categoriesBox = page.locator("#categorychecklist");
    this.labelsBox = page.locator("#radio-labeldiv #labelchecklist");
    this.teamBox = page.locator(
      "#radio-responsible_teamdiv #responsible_teamchecklist",
    );
    this.authorImageBox = this.page.locator(".postbox.acf-postbox");
    this.addAuthorImageButton = this.authorImageBox.getByRole("link", {
      name: "Add Image",
    });
    this.mediaModal = this.page.locator(".media-modal");
    this.mediaLibraryTab = this.mediaModal.getByRole("tab", {
      name: "Media Library",
    });
    this.mediaSearchInput = this.mediaModal.getByPlaceholder("Search");
    this.mediaAttachments = this.mediaModal.locator(".attachment");
    this.selectMediaButton = this.mediaModal.getByRole("button", {
      name: "Select",
      exact: true,
    });
    this.uploadFilesTab = this.mediaModal.getByRole("tab", {
      name: "Upload files",
    });
    this.mediaFileInput = this.mediaModal.locator('input[type="file"]');
    this.excerptBox = this.page.locator("#postexcerpt");
    this.excerptInput = this.page.locator("#excerpt");
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async gotoEdit(postId: number): Promise<void> {
    await this.page.goto(`/wp-admin/post.php?post=${postId}&action=edit`, {
      waitUntil: "domcontentloaded",
    });
  }

  async selectAuthor(author: string): Promise<void> {
    await this.authorSection.scrollIntoViewIfNeeded();
    await expect(this.authorSelect).toBeVisible();

    const option = this.authorSelect
      .locator("option")
      .filter({ hasText: author })
      .first();

    const label = (await option.textContent())?.trim();

    expect(label).toBeTruthy();

    await this.authorSelect.selectOption({ label: label! });
  }

  async expectUrlToMatch(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  async a11y(): Promise<void> {
    await expectNoSeriousA11yViolations(this.page);
  }

  async selectBreadcrumbLink(name: string): Promise<void> {
    const link = this.breadcrumbs.getByRole("link", { name });
    await expect(link).toBeVisible();
    await link.click();
  }

  async fillExcerpt(post: Post): Promise<void> {
    await this.excerptBox.scrollIntoViewIfNeeded();
    await expect(this.excerptInput).toBeVisible();
    await this.excerptInput.fill(post.excerpt ?? "");
  }

  async assertPaginationVisible(): Promise<void> {
    await expect(this.pagination).toBeVisible();
  }

  async selectPaginationLink(name: string | RegExp): Promise<void> {
    const link = this.pagination.getByRole("link", { name });
    await expect(link).toBeVisible();
    await link.click();
  }

  async update(): Promise<void> {
    await this.publishButton.click();
    await this.waitForSaveToComplete();
  }

  async selectCategory(categoryName: string): Promise<void> {
    const categoryOption = this.categoriesBox
      .locator("label")
      .filter({ hasText: categoryName })
      .first();

    await expect(categoryOption).toBeVisible();
    await categoryOption.click();
  }

  async selectLabel(labelName: string): Promise<void> {
    const labelOption = this.labelsBox
      .locator("label.selectit")
      .filter({ hasText: labelName })
      .first();

    await expect(labelOption).toBeVisible();
    await labelOption.click();
  }

  async selectTeam(teamName: string): Promise<void> {
    const teamOption = this.teamBox
      .locator("label.selectit")
      .filter({ hasText: teamName })
      .first();

    await expect(teamOption).toBeVisible();
    await teamOption.click();
  }

  async assertCategory(category: string): Promise<void> {
    await this.assertTagVisible(this.categoryTag, category);
  }

  async assertLabel(label: string): Promise<void> {
    await this.assertTagVisible(this.taxonomyTag, label);
  }

  cardByTitle(cards: Locator, title: string): Locator {
    return cards
      .filter({
        has: this.page.getByRole("heading", { name: title }),
      })
      .first();
  }

  async assertCardVisible(cards: Locator, title: string): Promise<void> {
    await expect(this.cardByTitle(cards, title)).toBeVisible();
  }

  postByTitle(title: string): Locator {
    return this.cardByTitle(this.posts, title);
  }

  async assertPostHasCategory(title: string, category: string): Promise<void> {
    await this.assertPostHasTag(title, category);
  }

  async assertPostHasLabel(title: string, label: string): Promise<void> {
    await this.assertPostHasTag(title, label);
  }

  async assertPostHasTag(title: string, tag: string): Promise<void> {
    const tags = this.postByTitle(title).getByTestId("news-post-tags");
    await this.assertTagVisible(tags.locator(".govuk-tag"), tag);
  }

  async assertBreadcrumbs(post: Post): Promise<void> {
    await expect(this.breadcrumbs).toBeVisible();

    const items = this.breadcrumbs.locator("li");
    const sectionTitle = this.getBreadcrumbSectionTitle(post);

    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText("Home");
    await expect(items.nth(1)).toContainText(sectionTitle);
    await expect(items.nth(2)).toContainText(post.title);
  }

  lastPaginationPageNumber(): Locator {
    return this.paginationPageNumbers
      .filter({ hasNot: this.visuallyHiddenText })
      .last();
  }

  async goToLastPaginationPage(): Promise<void> {
    const lastPage = this.lastPaginationPageNumber();
    await expect(lastPage).toBeVisible();
    await lastPage.click();
  }

  async assertNextPaginationNotVisible(): Promise<void> {
    await expect(
      this.pagination.getByRole("link", { name: "Next page" }),
    ).toHaveCount(0);
  }

  async assertNextPaginationVisible(): Promise<void> {
    await expect(
      this.pagination.getByRole("link", { name: "Next page" }),
    ).toBeVisible();
  }

  async assertPreviousPaginationNotVisible(): Promise<void> {
    await expect(
      this.pagination.getByRole("link", { name: "Previous page" }),
    ).toHaveCount(0);
  }

  async assertPreviousPaginationVisible(): Promise<void> {
    await expect(
      this.pagination.getByRole("link", { name: "Previous page" }),
    ).toBeVisible();
  }

  async assertPaginationNotVisible(): Promise<void> {
    await expect(this.pagination).not.toBeVisible();
  }

  async addAuthorImage(fileName: string): Promise<void> {
    await this.authorImageBox.scrollIntoViewIfNeeded();
    await expect(this.addAuthorImageButton).toBeVisible();
    await this.addAuthorImageButton.click();

    await expect(this.mediaModal).toBeVisible();
    await expect(this.uploadFilesTab).toBeVisible();
    await this.uploadFilesTab.click();

    await expect(this.mediaFileInput).toBeAttached();
    await this.mediaFileInput.setInputFiles(`assets/images/${fileName}`);

    await expect(this.selectMediaButton).toBeEnabled({ timeout: 15000 });
    await this.selectMediaButton.click();
  }

  private async waitForSaveToComplete(): Promise<void> {
    await Promise.race([
      this.page.waitForURL(/post\.php\?post=\d+&action=edit(&message=1)?/),
      expect(this.publishMessage).toBeVisible(),
    ]);

    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.publishButton).toBeEnabled();
  }

  private async assertTagVisible(
    container: Locator,
    text: string,
  ): Promise<void> {
    await expect(container.filter({ hasText: text }).first()).toBeVisible();
  }

  private getBreadcrumbSectionTitle(post: Post): string {
    switch (post.type) {
      case "news":
        return "News";
      case "blogs":
        return "Blogs";
      case "work_updates":
        return "Work Updates";
      default:
        throw new Error(`Unsupported breadcrumb type: ${post.type}`);
    }
  }
}
