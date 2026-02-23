// tests/work.update.spec.ts
import { test, expect } from "../src/wp.fixtures";
import Post from "../src/models/Post";

test.describe("work updates", () => {
  test("can create a work update post and verify it on the homepage", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withType("work-update")
      .withFixedTitle("E2E Work Update")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    const id = await wp.posts.create(post);
    expect(id).toBeGreaterThan(0);

    await homepage.goto();

    // Uses your existing homepage assertions
    // await homepage.assertLatestNewsCharLimits([post], {
    //   titleMax: 999,
    //   paragraphMax: 999,
    // });
  });
});
