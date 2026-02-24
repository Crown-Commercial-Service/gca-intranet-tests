import { test } from "../src/wp.fixtures";
import Post from "../src/models/Post";

test.describe("homepage - blogs", () => {
  test("should display a single blog", async ({ wp, homepage }) => {
    const post = Post.aPost()
      .withType("blog")
      .withFixedTitle("E2E Blog")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();

    // TODO: add homepage.assertBlogOnHomepage(post) once the locator + assertion exists
  });
});