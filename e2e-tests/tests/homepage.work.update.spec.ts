import { test } from "../src/wp.fixtures";
import Post from "../src/models/Post";
import User from "../src/models/User";

test.describe("work updates", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByType("work_updates");
  });

  test("should display a single work update", async ({ wp, homepage }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Procurement Transformation Update")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertWorkUpdateOnHomepage(post);
  });

  test("should enforce character limits for work update on homepage", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withTitleOver100Chars()
      .withParagraphMaxChars(180)
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertWorkUpdateCharLimits(post);
  });

  test("should display work updates in order (latest first and oldest last)", async ({
    wp,
    homepage,
  }) => {
    const post1 = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Commercial Systems Rollout")
      .withStatus("publish");

    const post2 = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Recruitment Campaign Progress")
      .withStatus("publish");

    const post3 = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Digital Delivery Milestones")
      .withStatus("publish");

    const post4 = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Procurement Policy Refresh")
      .withStatus("publish");

    await wp.posts.create(post1);
    await homepage.page.waitForTimeout(500);

    await wp.posts.create(post2);
    await homepage.page.waitForTimeout(500);

    await wp.posts.create(post3);
    await homepage.page.waitForTimeout(500);

    await wp.posts.create(post4);

    await homepage.goto();
    await homepage.assertWorkUpdatesOrder([post4, post3]);
  });

  test("should open work update page", async ({ wp, homepage, workUpdate }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Supplier Onboarding Improvements")
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.selectWorkItemLink(post);

    await workUpdate.expectUrlToMatch(/supplier-onboarding-improvements/);
    await workUpdate.assertBreadcrumbs(post);
  });

  test("should open work update list page", async ({
    wp,
    homepage,
    workUpdate,
  }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Quarterly Delivery Update")
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.workUpdateSeeMoreLink.click();

    await workUpdate.expectUrlToMatch(/work_update/);
  });

  test("can edit author details of a work update post", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Contract Management Update")
      .withStatus("publish");

    const postId = await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertWorkUpdateAuthor(post.title);

    const newUser = User.anAdmin()
      .withUsername("editor1")
      .withEmail("editor1@example.com")
      .withPassword("Password123!");

    await wp.users.upsert(newUser);

    await wp.posts.updatePostAuthor(postId, "work_updates", newUser.username);

    await homepage.goto();
    await homepage.assertWorkUpdateAuthor(post.title, newUser.username);
  });

  test("should truncate work update author when it is too long", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Contract Delivery Update")
      .withStatus("publish");

    const postId = await wp.posts.create(post);

    const newUser = User.anAdmin()
      .withUsername("verylongworkupdateauthorname")
      .withEmail("verylongworkupdateauthorname@example.com")
      .withPassword("Password123!");

    await wp.users.upsert(newUser);
    await wp.posts.updatePostAuthor(postId, "work_updates", newUser.username);

    await homepage.goto();
    await homepage.assertWorkUpdateAuthorIsTruncated(newUser.username);
  });

  test("should truncate work update title when it is too long", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withTitleOver100Chars()
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertWorkUpdateTitleIsTruncated(post);
  });
});
