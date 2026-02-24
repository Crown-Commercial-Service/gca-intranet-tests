import { test, expect } from "../src/wp.fixtures";
import Post from "../src/models/Post";
import User from "../src/models/User";

test.describe("work updates", () => {
  test("should display a single work update", async ({ wp, homepage }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("E2E Work Update")
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
    await homepage.assertWorkUpdateCharLimits(post, 10);
  });

  test("should display work updates in order (latest first and oldest last)", async ({
    wp,
    homepage,
  }) => {
    const post1 = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Work Update 1")
      .withStatus("publish");

    const post2 = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Work Update 2")
      .withStatus("publish");

    const post3 = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Work Update 3")
      .withStatus("publish");

    const post4 = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Work Update 4")
      .withStatus("publish");

    // create older posts first
    await wp.posts.create(post1);
    await wp.posts.create(post2);
    await wp.posts.create(post3);
    // latest post last
    await wp.posts.create(post4);
    await homepage.goto();
    await homepage.assertWorkUpdatesOrder([post4, post3]);
  });

  test("should open work update page", async ({ wp, homepage, workUpdate }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("E2E Work Update Navigation")
      .withStatus("publish");

    await wp.posts.create(post);
    await homepage.goto();
    await homepage.selectWorkItemLink(post);

    await workUpdate.expectUrlToMatch(/e2e-work-update-navigation/);
    await workUpdate.assertBreadcrumbs(post);
  });

  test("should open work update list page", async ({
    wp,
    homepage,
    workUpdate,
  }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("E2E Work Update List Page Navigation")
      .withStatus("publish");

    await wp.posts.create(post);
    await homepage.goto();
    await homepage.workUpdateSeeMoreLink.click();

    await workUpdate.expectUrlToMatch(/work_update/);
  });

  test("can edit author details of a work update post", async ({
    wp,
    homepage,
    runId,
  }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("E2E Work Update Author Change")
      .withStatus("publish");

    const postId = await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertWorkUpdateAuthor(post.title);

    const newUser = User.anAdmin()
      .withUsername(`e2e_author_${runId}`)
      .withEmail(`e2e_author_${runId}@example.com`)
      .withPassword("Password123!");

    await wp.users.upsert(newUser);

    await wp.posts.updatePostAuthor(postId, "work_updates", newUser.username);

    await homepage.goto();
    await homepage.assertWorkUpdateAuthor(post.title, newUser.username);
  });
});
