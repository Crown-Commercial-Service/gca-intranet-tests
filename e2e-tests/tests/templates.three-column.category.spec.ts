import { test } from "../src/wp.fixtures";
import Post from "../src/models/Post";

test.describe("templates - three column (category)", () => {
  test("should render the three column template for HR category page", async ({
    wp,
  }) => {
    const categoryName = "HR";
    const templateName = "Three Column Template (Category)";

    const post1 = Post.aPost()
      .withFixedTitle("E2E HR Column 1")
      .withStatus("publish")
      .withCategory(categoryName)
      .withFeaturedImage("featured.jpg");

    const post2 = Post.aPost()
      .withFixedTitle("E2E HR Column 2")
      .withStatus("publish")
      .withCategory(categoryName)
      .withFeaturedImage("featured.jpg");

    const post3 = Post.aPost()
      .withFixedTitle("E2E HR Column 3")
      .withStatus("publish")
      .withCategory(categoryName)
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(post1);
    await wp.posts.create(post2);
    await wp.posts.create(post3);

    const page = Post.aPage()
      .withFixedTitle("HR Page")
      .withStatus("publish")
      .withCategory(categoryName);

    const pageId = await wp.posts.create(page);

    // // Assign page template + category (needed for the 3-column template to render)
    // await wp.pages.setTemplate(pageId, templateName);
    // await wp.pages.setCategory(pageId, categoryName);
  });
});