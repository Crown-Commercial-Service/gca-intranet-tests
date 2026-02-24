import { test, expect } from "../src/wp.fixtures";
import Post from "../src/models/Post";

test.describe("blogs", () => {
  test("should display a single blog", async ({ wp, homepage }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog Post")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertBlogsOnHomepage(post);
  });

  test("should enforce character limits for blog on homepage", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withTitleOver100Chars()
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertBlogCharLimits(post, 10);
  });

  test("should open blog page", async ({ wp, homepage, blog }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog Navigation")
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.selectBlogLink(post);

    await expect(blog.page).toHaveURL(/e2e-blog-navigation/);
  });

  test("should open blog list page", async ({ wp, homepage, blogList }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog List Page Navigation")
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.blogSeeMoreLink.click();

    await expect(blogList.page).toHaveURL(/blog/);
  });

  test("should show the latest blog on the homepage", async ({
    wp,
    homepage,
  }) => {
    const older = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog Older")
      .withStatus("publish");

    const latest = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog Latest")
      .withStatus("publish");

    await wp.posts.create(older);
    await wp.posts.create(latest);

    await homepage.goto();
    await homepage.assertBlogsOnHomepage(latest);
  });
});
