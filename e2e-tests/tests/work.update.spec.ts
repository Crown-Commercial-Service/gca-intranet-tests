import { test } from "../src/wp.fixtures";
import Post from "../src/models/Post";

test.describe("work updates", () => {
  test("should display a single work update", async ({ wp, homepage }) => {
    const post = Post.aPost()
      .withType("work_update")
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
      .withType("work_update")
      .withFixedTitle("E2E Work Update Char Limit")
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
      .withType("work_update")
      .withFixedTitle("Work Update 1")
      .withStatus("publish");

    const post2 = Post.aPost()
      .withType("work_update")
      .withFixedTitle("Work Update 2")
      .withStatus("publish");

    const post3 = Post.aPost()
      .withType("work_update")
      .withFixedTitle("Work Update 3")
      .withStatus("publish");

    const post4 = Post.aPost()
      .withType("work_update")
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
});
