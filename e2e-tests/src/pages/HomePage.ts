import { Page, Locator, expect } from "@playwright/test";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import type Post from "../models/Post";
import type TakeALook from "../models/TakeALook";
import type QuickLinks from "../models/QuickLinks";
import {
  expectNoSeriousA11yViolations,
  expectNoSeriousA11yViolationsForSelectors,
} from "../a11y/assertions";
import { htmlToPlainText, getVisibleTruncatedText } from "../utils/formatters";

dayjs.extend(advancedFormat);

type CharLimits = {
  titleMax: number;
  paragraphMax: number;
};

export default class HomePage {
  readonly page: Page;
  private readonly baseUrl?: string;

  readonly primaryNavigationSelector = "#primaryNav";

  private readonly primaryNavigationParentLinksSelector =
    ".nav-list--primary > li > a";

  private readonly primaryNavigationSubMenuSelector = ".sub-menu li a";

  private readonly latestNewsColumnTestId = "latest-news-column";
  private readonly latestNewsFeaturedCardTestId = "latest-news-featured-card";
  private readonly latestNewsSecondaryCardTestId = "latest-news-secondary-card";
  private readonly latestNewsFeaturedDateTestId = "latest-news-featured-date";
  private readonly latestNewsSecondaryDateTestId = "latest-news-secondary-date";

  private readonly workUpdatesSectionTestId = "work-updates-section";
  private readonly workUpdateCardTestId = "work-update-card";
  private readonly workUpdateLinkTestId = "work-update-link";
  private readonly workUpdateAuthorTestId = "work-update-author";
  private readonly workUpdateSeeMoreLinkTestId = "work-updates-see-more-link";

  private readonly blogsSectionTestId = "blogs-column";
  private readonly blogCardTestId = "blogs-card";
  private readonly blogAvatarTestId = "blogs-avatar";
  private readonly blogLinkTestId = "blogs-link";
  private readonly blogAuthorTestId = "blogs-author";
  private readonly blogDateTestId = "blogs-date";

  private readonly takeALookColumnTestId = "take-a-look-column";
  private readonly takeALookHeadingTestId = "take-a-look-heading";
  private readonly takeALookSubheadingTestId = "take-a-look-subheading";
  private readonly takeALookLinkTestId = "take-a-look-link";
  private readonly takeALookHeaderTestId = "take-a-look-header";

  private readonly quickLinksTestId = "quick-links";
  private readonly quickLinksHeaderTestId = "quick-links-header";
  private readonly quickLinksHeadingTestId = "quick-links-heading";
  private readonly quickLinksSubheadingTestId = "quick-links-subheading";
  private readonly quickLinksListTestId = "quick-links-list";
  private readonly quickLinksItemTestId = "quick-links-item";

  readonly primaryNavigation: Locator;
  readonly primaryNavigationParentLinks: Locator;

  readonly latestNewsColumn: Locator;
  readonly workUpdatesSection: Locator;
  readonly workUpdateCards: Locator;
  readonly workUpdateSeeMoreLink: Locator;

  readonly blogsSection: Locator;
  readonly blogCard: Locator;
  readonly blogSeeMoreLink: Locator;

  readonly takeALookColumn: Locator;
  readonly takeALookHeading: Locator;
  readonly takeALookSubheading: Locator;
  readonly takeALookLink: Locator;
  readonly takeALookLinkText: Locator;
  readonly takeALookHeader: Locator;

  readonly quickLinks: Locator;
  readonly quickLinksHeader: Locator;
  readonly quickLinksHeading: Locator;
  readonly quickLinksSubheading: Locator;
  readonly quickLinksList: Locator;
  readonly quickLinksItems: Locator;

  readonly latestNewsSectionSelector: string;
  readonly workUpdatesSectionSelector: string;
  readonly blogsSectionSelector: string;
  readonly takeALookColumnSelector: string;
  readonly quickLinksSelector: string;
  readonly subMenuNavigation: string;

  private readonly latestNewsCardSelector: string;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl;

    this.primaryNavigation = this.page.locator(this.primaryNavigationSelector);

    this.primaryNavigationParentLinks = this.primaryNavigation.locator(
      this.primaryNavigationParentLinksSelector,
    );
    this.subMenuNavigation = ".sub-menu";

    this.latestNewsColumn = this.page.getByTestId(this.latestNewsColumnTestId);

    this.workUpdatesSection = this.page.getByTestId(
      this.workUpdatesSectionTestId,
    );

    this.workUpdateCards = this.workUpdatesSection.getByTestId(
      this.workUpdateCardTestId,
    );

    this.workUpdateSeeMoreLink = this.workUpdatesSection.getByTestId(
      this.workUpdateSeeMoreLinkTestId,
    );

    this.blogsSection = this.page.getByTestId(this.blogsSectionTestId);
    this.blogCard = this.blogsSection.getByTestId(this.blogCardTestId);
    this.blogSeeMoreLink = this.page.getByRole("link", { name: "More blogs" });

    // --- Take a look ---
    this.takeALookColumn = this.page.getByTestId(this.takeALookColumnTestId);
    this.takeALookHeading = this.page.getByTestId(this.takeALookHeadingTestId);
    this.takeALookSubheading = this.page.getByTestId(
      this.takeALookSubheadingTestId,
    );
    this.takeALookLink = this.page.getByTestId(this.takeALookLinkTestId);
    this.takeALookHeader = this.page.getByTestId(this.takeALookHeaderTestId);
    this.takeALookLinkText = this.takeALookColumn.locator(
      "p.gca-take-a-look__text",
    );

    // --- Quick links ---
    this.quickLinks = this.page.getByTestId(this.quickLinksTestId);
    this.quickLinksHeader = this.page.getByTestId(this.quickLinksHeaderTestId);
    this.quickLinksHeading = this.page.getByTestId(
      this.quickLinksHeadingTestId,
    );
    this.quickLinksSubheading = this.page.getByTestId(
      this.quickLinksSubheadingTestId,
    );
    this.quickLinksList = this.page.getByTestId(this.quickLinksListTestId);
    this.quickLinksItems = this.page.getByTestId(this.quickLinksItemTestId);

    this.latestNewsSectionSelector = `[data-testid="${this.latestNewsColumnTestId}"]`;
    this.workUpdatesSectionSelector = `[data-testid="${this.workUpdatesSectionTestId}"]`;
    this.blogsSectionSelector = `[data-testid="${this.blogsSectionTestId}"]`;
    this.takeALookColumnSelector = `[data-testid="${this.takeALookColumnTestId}"]`;
    this.quickLinksSelector = `[data-testid="${this.quickLinksTestId}"]`;

    this.latestNewsCardSelector = [
      `[data-testid="${this.latestNewsFeaturedCardTestId}"]`,
      `[data-testid="${this.latestNewsSecondaryCardTestId}"]`,
    ].join(", ");
  }

  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl ?? "/", { waitUntil: "networkidle" });
  }

  async checkAccessibility(): Promise<void> {
    await expectNoSeriousA11yViolations(this.page);
  }

  async checkAccessibilityFor(selectors: string[]): Promise<void> {
    await expectNoSeriousA11yViolationsForSelectors(this.page, selectors);
  }

  // ---------------------------------------------------------
  // Take a look assertions
  // ---------------------------------------------------------

  async assertTakeALookComponent(takeALook: TakeALook): Promise<void> {
    await expect(this.takeALookColumn).toBeVisible();
    await expect(this.takeALookHeader).toBeVisible();

    // title
    await expect(this.takeALookHeading).toBeVisible();

    // wait until the heading contains part of the new title
    await expect(this.takeALookHeading).toContainText(
      takeALook.title.slice(0, 5),
    );

    const uiTitle = (await this.takeALookHeading.innerText()).trim();
    const visiblePart = getVisibleTruncatedText(uiTitle);

    expect(takeALook.title.startsWith(visiblePart)).toBe(true);

    // description
    const uiDesc = (await this.takeALookSubheading.innerText()).trim();
    expect(uiDesc.length).toBeLessThanOrEqual(40);

    // link
    await expect(this.takeALookLink).toBeVisible();
    await expect(this.takeALookLink).toHaveAttribute("href", takeALook.linkUrl);

    // link text
    await expect(this.takeALookLinkText).toBeVisible();
    await expect(this.takeALookLinkText).toHaveText(takeALook.linkText);
  }

  // ---------------------------------------------------------
  // Quick links assertions
  // ---------------------------------------------------------

  async assertQuickLinksComponent(quickLinks: QuickLinks): Promise<void> {
    await expect(this.quickLinks).toBeVisible();
    await expect(this.quickLinksHeader).toBeVisible();

    // title
    await expect(this.quickLinksHeading).toBeVisible();
    await expect(this.quickLinksHeading).toContainText(
      quickLinks.title.slice(0, 5),
    );

    const quickLinksTitle = (await this.quickLinksHeading.innerText()).trim();
    const visibleTitle = getVisibleTruncatedText(quickLinksTitle);
    expect(quickLinks.title.startsWith(visibleTitle)).toBe(true);

    // description
    await expect(this.quickLinksSubheading).toBeVisible();
    const quickLinksDescription = (
      await this.quickLinksSubheading.innerText()
    ).trim();
    expect(quickLinksDescription.length).toBeLessThanOrEqual(43); // TODO: needs to be 40 not 43

    // links
    await expect(this.quickLinksList).toBeVisible();
    await expect(this.quickLinksItems).toHaveCount(quickLinks.links.length);

    for (let index = 0; index < quickLinks.links.length; index++) {
      const expectedLink = quickLinks.links[index];
      const quickLinkItem = this.quickLinksItems.nth(index);
      const quickLinkText = quickLinkItem.locator(".gca-quick-links__text");

      await expect(quickLinkItem).toBeVisible();
      await expect(quickLinkItem).toHaveAttribute("href", expectedLink.url);
      await expect(quickLinkText).toHaveText(expectedLink.text);
    }
  }

  private articleLink(title: string): Locator {
    return this.page.getByRole("link", { name: title });
  }

  private latestNewsCard(title: string): Locator {
    return this.latestNewsColumn
      .locator(this.latestNewsCardSelector)
      .filter({ has: this.articleLink(title) });
  }

  private latestNewsFeaturedDate(card: Locator): Locator {
    return card.getByTestId(this.latestNewsFeaturedDateTestId);
  }

  private latestNewsSecondaryDate(card: Locator): Locator {
    return card.getByTestId(this.latestNewsSecondaryDateTestId);
  }

  private async latestNewsDateElement(card: Locator): Promise<Locator> {
    const featured = this.latestNewsFeaturedDate(card);
    if ((await featured.count()) > 0) return featured.first();
    return this.latestNewsSecondaryDate(card).first();
  }

  private paragraphSnippet(content: string): Locator {
    const plainText = htmlToPlainText(content);
    const snippet = plainText.slice(0, 40);
    return this.page.getByText(snippet);
  }

  async openLatestArticle(title: string): Promise<void> {
    await this.articleLink(title).click();
  }

  async assertLatestNewsLayout(posts: Post[]): Promise<void> {
    if (posts.length === 0) {
      throw new Error("Expected at least one post");
    }

    const latestPost = posts[0];
    await expect(this.articleLink(latestPost.title)).toBeVisible();

    for (const post of posts) {
      const card = this.latestNewsCard(post.title);

      await expect(card).toBeVisible();
      await expect(this.articleLink(post.title)).toBeVisible();

      const dateEl = await this.latestNewsDateElement(card);
      await expect(dateEl).toBeVisible();

      const uiDate = (await dateEl.textContent())?.trim() ?? "";
      const expectedDate = dayjs(post.createdAt).format("Do MMMM YYYY");
      expect(uiDate).toBe(expectedDate);
    }

    let allHaveImages = true;
    for (const post of posts) {
      if (!post.featuredImagePath) {
        allHaveImages = false;
        break;
      }
    }

    if (allHaveImages) {
      const renderedImageCount = await this.page.getByRole("img").count();
      expect(renderedImageCount).toBeGreaterThanOrEqual(posts.length);
    }

    if (posts.length > 1) {
      for (const post of posts) {
        await expect(this.articleLink(post.title)).toBeVisible();
      }
    }
  }

  async assertWorkUpdatesOrder(posts: Post[]): Promise<void> {
    await expect(this.workUpdatesSection).toBeVisible();
    expect(await this.workUpdateCards.count()).toBeGreaterThanOrEqual(
      posts.length,
    );

    for (let i = 0; i < posts.length; i++) {
      const text = (
        await this.workUpdateCards
          .nth(i)
          .getByTestId(this.workUpdateLinkTestId)
          .innerText()
      ).trim();

      expect(posts[i].title.startsWith(getVisibleTruncatedText(text))).toBe(
        true,
      );
    }
  }

  async assertLatestNewsCharLimits(
    posts: Post[],
    limits: CharLimits,
  ): Promise<void> {
    for (const post of posts) {
      await expect(this.articleLink(post.title)).toHaveText(post.title);
      await expect(this.paragraphSnippet(post.content)).toBeVisible();

      const runId = process.env.PW_RUN_ID ?? "";
      const titleWithoutRunId = post.title.endsWith(runId)
        ? post.title.slice(0, -runId.length).trimEnd()
        : post.title;

      expect(titleWithoutRunId.length).toBeLessThanOrEqual(limits.titleMax);
      expect(post.content.length).toBeLessThanOrEqual(limits.paragraphMax);
    }
  }

  async assertWorkUpdateCharLimits(post: Post): Promise<void> {
    const link = this.workUpdateCards
      .first()
      .getByTestId(this.workUpdateLinkTestId);

    const uiTitle = (await link.innerText()).trim();

    expect(uiTitle).not.toBe(post.title);

    const visiblePart = getVisibleTruncatedText(uiTitle);
    expect(post.title.startsWith(visiblePart)).toBe(true);
  }

  private workUpdateCardByTitle(title: string): Locator {
    return this.cardByStableTitle(
      this.workUpdateCards,
      this.workUpdateLinkTestId,
      title,
    );
  }

  async assertWorkUpdateOnHomepage(post: Post): Promise<void> {
    const card = this.page.getByTestId("work-update-card");
    await expect(card).toHaveCount(1);

    const link = card.getByTestId("work-update-link");
    const actual = ((await link.textContent()) ?? "").trim();
    const visiblePart = getVisibleTruncatedText(actual);

    expect(post.title.startsWith(visiblePart)).toBe(true);
    expect(actual.endsWith("...")).toBe(true);
    await expect(card.getByTestId("work-update-author")).toHaveText(
      `By ${process.env.WP_ADMIN_USERNAME}`,
    );
    await expect(
      card.getByTestId("work-update-avatar").locator("img"),
    ).toHaveAttribute("src", /.+/);
    await expect(card.getByTestId("work-update-date")).toHaveText(
      dayjs(post.createdAt).format("Do MMMM YYYY"),
    );
  }

  private workUpdateLinkByTitle(title: string): Locator {
    const cards = this.page
      .getByTestId("work-updates-section")
      .getByTestId("work-update-card");
    return this.getLinkByTitlePrefix(cards, "work-update-link", title);
  }

  async selectWorkItemLink(post: Post): Promise<void> {
    const link = this.workUpdateLinkByTitle(post.title);
    await expect(link).toBeVisible();
    await link.click();
  }

  async assertWorkUpdateAuthor(
    title: string,
    expectedAuthor?: string,
  ): Promise<void> {
    const card = this.workUpdateCardByTitle(title);
    await expect(card).toHaveCount(1);

    const author = expectedAuthor ?? process.env.WP_ADMIN_USERNAME;
    expect(author).toBeTruthy();

    await this.assertAuthorPossiblyTruncated(
      card.getByTestId(this.workUpdateAuthorTestId),
      `By ${author}`,
    );
  }

  async assertBlogAuthor(
    title: string,
    expectedAuthor?: string,
  ): Promise<void> {
    const card = this.blogCardByTitle(title);
    await expect(card).toHaveCount(1);

    const author = expectedAuthor ?? process.env.WP_ADMIN_USERNAME;
    expect(author).toBeTruthy();

    await this.assertAuthorPossiblyTruncated(
      card.getByTestId(this.blogAuthorTestId),
      `By ${author}`,
    );
  }

  private async assertAuthorPossiblyTruncated(
    authorEl: Locator,
    expectedFullText: string,
  ): Promise<void> {
    await expect(authorEl).toBeVisible();

    const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

    const actual = normalize((await authorEl.textContent()) ?? "");
    const expected = normalize(expectedFullText);

    if (actual === expected) return;

    if (actual.endsWith("...") || actual.endsWith("…")) {
      const visiblePart = actual.replace(/(\.\.\.|…)\s*$/, "").trim();
      expect(expected.startsWith(visiblePart)).toBe(true);
      return;
    }

    expect(actual).toBe(expected);
  }

  private blogCardByTitle(title: string): Locator {
    return this.cardByStableTitle(this.blogCard, this.blogLinkTestId, title);
  }

  private getLinkByTitlePrefix(
    cards: Locator,
    linkTestId: string,
    title: string,
    prefixLen = 25,
  ): Locator {
    const prefix = title.trim().slice(0, prefixLen);
    return cards.getByTestId(linkTestId).filter({ hasText: prefix }).first();
  }

  private cardByStableTitle(
    cards: Locator,
    linkTestId: string,
    title: string,
  ): Locator {
    const runId = (process.env.PW_RUN_ID || "").trim();

    const stableTitle =
      runId && title.endsWith(runId)
        ? title.slice(0, title.length - runId.length).trim()
        : title.trim();

    return cards.filter({
      has: this.page.getByTestId(linkTestId).filter({ hasText: stableTitle }),
    });
  }

  private blogLinkByTitle(title: string): Locator {
    const cards = this.page
      .getByTestId("blogs-column")
      .getByTestId("blogs-card");
    return this.getLinkByTitlePrefix(cards, this.blogLinkTestId, title);
  }

  async assertBlogsOnHomepage(post: Post): Promise<void> {
    await expect(this.blogsSection).toBeVisible();

    const card = this.blogCard.first();
    await expect(card).toBeVisible();

    const link = card.getByTestId(this.blogLinkTestId);

    const actual = ((await link.textContent()) ?? "").replace(/\s+/g, " ").trim();
    const visiblePart = getVisibleTruncatedText(actual);
    await this.page.pause()
    expect(post.title.startsWith(visiblePart)).toBe(true);

    await expect(
      card.getByTestId(this.blogAvatarTestId).locator("img"),
    ).toHaveAttribute("src", /.+/);

    await expect(card.getByTestId(this.blogAuthorTestId)).toHaveText(
      `By ${process.env.WP_ADMIN_USERNAME}`,
    );

    await expect(card.getByTestId(this.blogDateTestId)).toHaveText(
      dayjs(post.createdAt).format("Do MMMM YYYY"),
    );
  }

  async selectBlogLink(post: Post): Promise<void> {
    const link = this.blogLinkByTitle(post.title);
    await expect(link).toHaveCount(1);
    await link.click();
  }

  async assertBlogCharLimits(post: Post): Promise<void> {
    await expect(this.blogsSection).toBeVisible();

    const link = this.blogCard.first().getByTestId(this.blogLinkTestId);

    const uiTitle = (await link.innerText()).trim();

    expect(uiTitle).not.toBe(post.title);

    const visiblePart = getVisibleTruncatedText(uiTitle);
    expect(post.title.startsWith(visiblePart)).toBe(true);
  }

  async hasTruncatedChars(locator: Locator, maxChars: number): Promise<void> {
    const text = ((await locator.innerText()) ?? "").trim();
    expect(text.length).toBe(maxChars);
  }

  async assertNavigationMenu(
    menu: { parent: string; children: string[] }[],
  ): Promise<void> {
    await expect(this.primaryNavigation).toBeVisible();

    for (const section of menu) {
      const parentLink = await this.hoverParentLink(section.parent);

      const subMenuLinks = parentLink
        .locator("..")
        .locator(this.primaryNavigationSubMenuSelector);

      await expect(subMenuLinks).toHaveCount(section.children.length);

      for (
        let childIndex = 0;
        childIndex < section.children.length;
        childIndex++
      ) {
        await expect(subMenuLinks.nth(childIndex)).toHaveText(
          section.children[childIndex],
        );
      }
    }
  }

  async selectSubNavigationItem(parent: string, child: string): Promise<void> {
    const parentLink = await this.hoverParentLink(parent);

    const subMenuLink = parentLink
      .locator("..")
      .locator(this.primaryNavigationSubMenuSelector)
      .filter({ hasText: child })
      .first();

    await expect(subMenuLink).toBeVisible();
    await subMenuLink.click();
  }

  async hoverParentLink(parent: string): Promise<Locator> {
    const parentLink = this.primaryNavigationParentLinks
      .filter({
        hasText: parent,
      })
      .first();

    await expect(parentLink).toContainText(parent);
    await parentLink.hover();

    return parentLink;
  }
}
