import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";
import { formatDateNew } from "../utils/formatters";

export default class BlogPage extends BasePage {
  // private readonly baseUrl?: string;

  readonly main: Locator;
  readonly title: Locator;
  readonly content: Locator;
  readonly author: Locator;
  readonly authorImage: Locator;
  readonly date: Locator;
  readonly blogLabel: Locator;

  // Social: likes + comments
  readonly socialSection: Locator;
  readonly postLikeButton: Locator;
  readonly commentForm: Locator;
  readonly commentTextarea: Locator;
  readonly postCommentButton: Locator;
  readonly commentsList: Locator;
  readonly comments: Locator;
  readonly mentionList: Locator;

  // Accessibility Selectors
  readonly blogsSection: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    // this.baseUrl = baseUrl;

    this.main = this.page.getByTestId("blog-main");
    this.title = this.page.getByTestId("blog-title");
    this.content = this.page.getByTestId("blog-content");
    this.author = this.page.getByTestId("blog-detials").locator("span").first();
    this.authorImage = this.page.locator(".profile_img_wrapper img");
    this.date = this.page.getByTestId("blog-date");
    this.blogLabel = this.page.getByTestId("blog-tax");

    this.socialSection = this.page.locator("section.gca-lc");
    this.postLikeButton = this.socialSection.locator(
      '[data-action="toggle-post-like"]',
    );
    this.commentForm = this.socialSection.locator("form.gca-lc__form").filter({
      has: this.page.locator('input[name="parent_id"][value="0"]'),
    });
    this.commentTextarea = this.commentForm.locator("textarea.gca-lc__textarea");
    this.postCommentButton = this.commentForm.locator(
      "button.gca-lc__submit-btn",
    );
    this.commentsList = this.socialSection.locator(".gca-lc__list");
    this.comments = this.commentsList.locator(".gca-lc__comment");
    this.mentionList = this.commentForm.locator(".gca-lc__mention-list");

    this.blogsSection = "[data-testid='blog-main']";
  }

  async goto(slug: string): Promise<void> {
    const base = this.baseUrl ? this.baseUrl.replace(/\/+$/, "") : "";
    const path = slug.startsWith("/") ? slug : `/${slug}`;

    await this.page.goto(`${base}${path}`, {
      waitUntil: "networkidle",
    });
  }

  async assertTitle(expected: string): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.title).toContainText(expected);
  }

  async assertContent(expected: string): Promise<void> {
    await expect(this.content).toContainText(expected);
  }

  async assertBlogLabel(expected: string): Promise<void> {
    await expect(this.blogLabel).toContainText(expected);
  }

  async assertAuthor(expected: string): Promise<void> {
    await expect(this.author).toContainText(`By ${expected}`);
  }

  async assertFeaturedImageVisible(): Promise<void> {
    await expect(this.authorImage).toBeVisible();
  }

  async assertPublishedDate(value: string | Date): Promise<void> {
    const expected = formatDateNew(value);
    await expect(this.date).toContainText(expected);
  }

  async gotoPath(link: string): Promise<void> {
    await this.page.goto(link, { waitUntil: "networkidle" });
  }

  private commentByText(text: string): Locator {
    return this.comments
      .filter({
        has: this.page.locator(".gca-lc__comment-text", { hasText: text }),
      })
      .first();
  }

  async addComment(text: string): Promise<void> {
    await this.commentTextarea.fill(text);
    await this.postCommentButton.click();
  }

  async submitComment(): Promise<void> {
    await this.postCommentButton.click();
  }

  async assertCommentVisible(author: string, text: string): Promise<void> {
    const comment = this.commentByText(text);
    await expect(comment).toBeVisible();
    await expect(comment.locator(".gca-lc__comment-author")).toContainText(
      author,
    );
  }

  async assertCommentNotVisible(text: string): Promise<void> {
    await expect(
      this.comments.filter({
        has: this.page.locator(".gca-lc__comment-text", { hasText: text }),
      }),
    ).toHaveCount(0);
  }

  async likeComment(text: string): Promise<void> {
    await this.commentByText(text)
      .locator('[data-action="toggle-comment-like"]')
      .click();
  }

  async assertLikeCount(text: string, count: number): Promise<void> {
    const likeCount = this.commentByText(text).locator("[data-like-count]");
    await expect(likeCount).toHaveText(String(count));
  }

  async startDeleteComment(text: string): Promise<void> {
    await this.commentByText(text)
      .locator('[data-action="delete-comment"]')
      .click();
  }

  private get deleteConfirmation(): Locator {
    return this.page.locator(".gca-lc-delete-modal__dialog");
  }

  async assertDeleteConfirmationVisible(): Promise<void> {
    await expect(this.deleteConfirmation).toBeVisible();
  }

  async confirmDeleteComment(): Promise<void> {
    await this.deleteConfirmation
      .locator('[data-action="confirm-delete-comment"]')
      .click();
  }

  async assertDeleteUnavailable(text: string): Promise<void> {
    await expect(
      this.commentByText(text).locator('[data-action="delete-comment"]'),
    ).toHaveCount(0);
  }

  async replyToComment(parentText: string, replyText: string): Promise<void> {
    const parent = this.commentByText(parentText);
    await parent.locator('[data-action="show-reply-form"]').click();

    const id = ((await parent.getAttribute("id")) ?? "").replace(
      "gca-lc-comment-",
      "",
    );
    const replyForm = this.page.locator(`#gca-lc-reply-form-${id}`);
    await replyForm.locator("textarea.gca-lc__textarea").fill(replyText);
    await replyForm.locator("button.gca-lc__submit-btn").click();
  }

  async assertReplyVisible(
    _parentText: string,
    author: string,
    replyText: string,
  ): Promise<void> {
    const reply = this.commentByText(replyText);
    await expect(reply).toBeVisible();
    await expect(reply.locator(".gca-lc__comment-author")).toContainText(
      author,
    );
  }

  async composeCommentWithMention(
    prefix: string,
    user: { username: string },
  ): Promise<void> {
    await this.commentTextarea.click();
    await this.commentTextarea.fill("");
    await this.commentTextarea.pressSequentially(`${prefix}@${user.username}`);

    const option = this.mentionList
      .getByRole("option")
      .filter({ hasText: user.username })
      .first();
    await expect(option).toBeVisible();
    await option.click();
  }

  async assertCommentMentions(
    author: string,
    mentionedUser: { username: string },
  ): Promise<void> {
    const comment = this.comments
      .filter({
        has: this.page.locator(".gca-lc__comment-author", { hasText: author }),
      })
      .first();
    await expect(comment).toBeVisible();
    await expect(comment.locator(".gca-lc__comment-text")).toContainText(
      mentionedUser.username,
    );
  }
}
