import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Accessibility smoke", () => {
  test("work updates section has no serious or critical violations", async ({
    homepage,
    wp,
  }) => {
    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("E2E Work Update A11y")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    await wp.posts.create(post);
    await homepage.goto();
    await homepage.checkAccessibilityFor(
      homepage.workUpdatesSectionSelector,
      "Work Updates Section",
    );
  });
});
