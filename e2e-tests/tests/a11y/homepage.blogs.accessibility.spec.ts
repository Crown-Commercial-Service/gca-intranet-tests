import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Accessibility smoke", () => {
  test("blogs column has no serious or critical violations", async ({
    homepage,
    wp,
  }) => {
    const blog = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog A11y")
      .withStatus("publish");

    await wp.posts.create(blog);
    await homepage.goto();
    await homepage.checkAccessibilityFor(
      homepage.blogsSectionSelector,
      "homepage.blogs",
    );
  });
});
