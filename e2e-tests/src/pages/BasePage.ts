import { Page, Locator, expect } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y/assertions";
import type Post from "../models/Post";

export default abstract class BasePage {
  protected readonly page: Page;

  readonly breadcrumbs: Locator;
  readonly pagination: Locator;

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

  // News detail/list locators
  readonly details: Locator;
  readonly categoryTag: Locator;
  readonly taxonomyTag: Locator;

  protected constructor(page: Page) {
    this.page = page;

    this.breadcrumbs = this.page.locator(".govuk-breadcrumbs");
    this.pagination = this.page.locator(
      ".pagination, [data-testid='news-pagination']",
    );

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

  async assertCategory(category: string): Promise<void> {
    await this.assertTagVisible(this.categoryTag, category);
  }

  async assertLabel(label: string): Promise<void> {
    await this.assertTagVisible(this.taxonomyTag, label);
  }

  postByTitle(title: string): Locator {
    return this.posts
      .filter({
        has: this.page.getByTestId("news-post-link").filter({ hasText: title }),
      })
      .first();
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

// import { Page, Locator, expect } from "@playwright/test";
// import { expectNoSeriousA11yViolations } from "../a11y/assertions";
// import type Post from "../models/Post";

// export default abstract class BasePage {
//   protected readonly page: Page;
//   readonly breadcrumbs: Locator;
//   readonly pagination: Locator;

//   // Wordpress locators
//   readonly titleInput: Locator;
//   readonly contentInput: Locator;
//   readonly authorSection: Locator;
//   readonly authorSelect: Locator;
//   readonly publishButton: Locator;
//   readonly publishingSpinner: Locator;
//   readonly publishMessage: Locator;
//   readonly categoriesBox: Locator;
//   readonly labelsBox: Locator;

//   protected constructor(page: Page) {
//     this.page = page;
//     this.breadcrumbs = this.page.locator(".govuk-breadcrumbs");
//     this.pagination = this.page.locator(
//       ".pagination, [data-testid='news-pagination']",
//     );
//     this.titleInput = page.locator("#title");
//     this.contentInput = page.locator("#content");
//     this.authorSection = page.locator("#authordiv");
//     this.authorSelect = page.locator("#post_author_override");
//     this.publishButton = page.locator("#publish");
//     this.publishingSpinner = page.locator("#publishing-action .spinner");
//     this.publishMessage = page.locator("#message.updated, #message.notice");
//     this.categoriesBox = page.locator("#categorychecklist");
//     this.labelsBox = page.locator("#radio-labeldiv #labelchecklist");
//   }

//   async goto(path: string) {
//     await this.page.goto(path, { waitUntil: "domcontentloaded" });
//   }

//   async gotoEdit(postId: number): Promise<void> {
//     await this.page.pause();
//     await this.page.goto(`/wp-admin/post.php?post=${postId}&action=edit`, {
//       waitUntil: "domcontentloaded",
//     });
//   }

//   async selectAuthor(author: string): Promise<void> {
//     await this.authorSection.scrollIntoViewIfNeeded();
//     await expect(this.authorSelect).toBeVisible();

//     const option = this.authorSelect
//       .locator("option")
//       .filter({ hasText: author })
//       .first();
//     const label = (await option.textContent())?.trim();

//     expect(label).toBeTruthy();

//     await this.authorSelect.selectOption({ label: label! });
//   }

//   async expectUrlToMatch(pattern: RegExp): Promise<void> {
//     await expect(this.page).toHaveURL(pattern);
//   }

//   async a11y() {
//     await expectNoSeriousA11yViolations(this.page);
//   }

//   async selectBreadcrumbLink(name: string): Promise<void> {
//     const link = this.breadcrumbs.getByRole("link", { name });
//     await expect(link).toBeVisible();
//     await link.click();
//   }

//   async assertPaginationVisible(): Promise<void> {
//     await expect(this.pagination).toBeVisible();
//   }

//   async selectPaginationLink(name: string | RegExp): Promise<void> {
//     const link = this.pagination.getByRole("link", { name });
//     await expect(link).toBeVisible();
//     await link.click();
//   }

//   async update(): Promise<void> {
//     await this.publishButton.click();
//     await this.waitForSaveToComplete();
//   }

//   // async updateEventDetails(event: Event): Promise<void> {
//   //   await this.fillEventDetails(event);
//   //   await this.update();
//   // }

//   async selectCategory(categoryName: string): Promise<void> {
//     const categoryOption = this.categoriesBox
//       .locator("label")
//       .filter({ hasText: categoryName })
//       .first();

//     await expect(categoryOption).toBeVisible();
//     await categoryOption.click();
//   }

//   private async waitForSaveToComplete(): Promise<void> {
//     await Promise.race([
//       this.page.waitForURL(/post\.php\?post=\d+&action=edit(&message=1)?/),
//       expect(this.publishMessage).toBeVisible(),
//     ]);

//     await this.page.waitForLoadState("domcontentloaded");
//     await expect(this.publishButton).toBeEnabled();
//   }

//   async assertBreadcrumbs(post: Post): Promise<void> {
//     await expect(this.breadcrumbs).toBeVisible();

//     const items = this.breadcrumbs.locator("li");

//     const sectionTitle = this.getBreadcrumbSectionTitle(post);

//     await expect(items).toHaveCount(3);
//     await expect(items.nth(0)).toContainText("Home");
//     await expect(items.nth(1)).toContainText(sectionTitle);
//     await expect(items.nth(2)).toContainText(post.title);
//   }

//   private getBreadcrumbSectionTitle(post: Post): string {
//     switch (post.type) {
//       case "news":
//         return "News";
//       case "blogs":
//         return "Blogs";
//       case "work_updates":
//         return "Work Updates";
//       default:
//         throw new Error(`Unsupported breadcrumb type: ${post.type}`);
//     }
//   }

//   async selectLabel(labelName: string): Promise<void> {
//     const labelOption = this.labelsBox
//       .locator("label.selectit")
//       .filter({ hasText: labelName })
//       .first();

//     await expect(labelOption).toBeVisible();
//     await labelOption.click();
//   }
// }
