import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import User from "../../src/models/User";
import Chance from "chance";

const chance = new Chance();

test.describe("blogs", { tag: "@regression" }, () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

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
    await homepage.assertBlogCharLimits(post);
  });

  test("should open blog page", async ({ wp, homepage, blog }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog Navigation")
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.selectBlogLink(post);

    await blog.expectUrlToContain("e2e-blog-navigation/");
    await blog.assertBreadcrumbs(post);
  });

  test("should open blog list page", async ({ wp, homepage, blogList }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog List Page Navigation")
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.blogSeeMoreLink.click();

    expect(await blogList.expectUrlToContain("blog/"));
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
    await homepage.wait(1000);
    await wp.posts.create(latest);
    await homepage.wait(1000);

    await homepage.goto();
    await homepage.assertBlogsOnHomepage(latest);
  });

  test("can edit author details of a blog post", async ({ wp, homepage }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("E2E Blog Author Change")
      .withStatus("publish");

    const postId = await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertBlogAuthor(post.title);

    const username = chance.word({ length: 6 });

    const newUser = User.anAdmin()
      .withUsername(username)
      .withEmail(`${username}@example.com`)
      .withPassword("Password123!");

    await wp.users.upsert(newUser);

    await wp.posts.updatePostAuthor(postId, "blogs", newUser.username);

    await homepage.goto();
    await homepage.assertBlogAuthor(post.title, newUser.username);
  });

  test("should truncate blog author when it is too long", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withFixedTitle("Digital Procurement Insights")
      .withStatus("publish");

    const postId = await wp.posts.create(post);

    const newUser = User.anAdmin()
      .withUsername("verylongblogauthorname111111111111")
      .withEmail("verylongblogauthorname111111111111@example.com")
      .withPassword("Password123!");

    await wp.users.upsert(newUser);
    await wp.posts.updatePostAuthor(postId, "blogs", newUser.username);

    await homepage.goto();
    await homepage.assertBlogAuthorIsTruncated(newUser.username);
  });

  test("should truncate blog title when it is too long", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withType("blogs")
      .withTitleOver100Chars()
      .withStatus("publish");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertBlogTitleIsTruncated(post);
  });
});
