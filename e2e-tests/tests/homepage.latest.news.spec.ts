import { test, expect } from "../src/wp.fixtures";
import Post from "../src/models/Post";

test.describe("homepage - latest news", () => {
  test("should display article in single column", async ({ wp, homepage }) => {
    const post = Post.aPost()
      .withFixedTitle("E2E Latest Article")
      .withParagraphMaxChars(120)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.assertLatestNewsLayout([post]);
  });

  test("should display articles in two columns and in order (latest first and oldest last)", async ({
    wp,
    homepage,
  }) => {
    const post1 = Post.aPost()
      .withFixedTitle("Post 1")
      .withFeaturedImage("img-1.jpg")
      .withStatus("publish");

    const post2 = Post.aPost()
      .withFixedTitle("Post 2")
      .withFeaturedImage("img-2.jpg")
      .withStatus("publish");

    const post3 = Post.aPost()
      .withFixedTitle("Post 3")
      .withFeaturedImage("img-3.jpg")
      .withStatus("publish");

    const post4 = Post.aPost()
      .withFixedTitle("Post 4")
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    // create older posts first
    await wp.posts.create(post1);
    await wp.posts.create(post2);
    await wp.posts.create(post3);
    // latest post last
    await wp.posts.create(post4);

    await homepage.goto();

    // latest card and oldest are present
    await homepage.assertLatestNewsLayout([post4, post3, post2, post1]);
  });

  test("should enforce title and paragraph character limits in single column", async ({
    wp,
    homepage,
  }) => {
    const post = Post.aPost()
      .withFixedTitle("E2E Latest Article")
      .withParagraphMaxChars(120)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(post);

    await homepage.goto();

    await homepage.assertLatestNewsCharLimits([post], {
      titleMax: 40,
      paragraphMax: 120,
    });
  });

  test("should enforce title and paragraph character limits in two columns", async ({
    wp,
    homepage,
  }) => {
    const post1 = Post.aPost()
      .withTitleMaxChars(40)
      .withParagraphMaxChars(120)
      .withFeaturedImage("img-1.jpg")
      .withStatus("publish");

    const post2 = Post.aPost()
      .withTitleMaxChars(40)
      .withParagraphMaxChars(120)
      .withFeaturedImage("img-2.jpg")
      .withStatus("publish");

    const post3 = Post.aPost()
      .withTitleMaxChars(40)
      .withParagraphMaxChars(120)
      .withFeaturedImage("img-3.jpg")
      .withStatus("publish");

    const post4 = Post.aPost()
      .withTitleMaxChars(40)
      .withParagraphMaxChars(120)
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    await wp.posts.create(post1);
    await wp.posts.create(post2);
    await wp.posts.create(post3);
    await wp.posts.create(post4);

    await homepage.goto();

    await homepage.assertLatestNewsCharLimits([post4, post3, post2, post1], {
      titleMax: 40,
      paragraphMax: 120,
    });
  });

  test("should open news details page", async ({
    wp,
    homepage,
    latestNews,
  }) => {
    const post = Post.aPost()
      .withFixedTitle("E2E Latest Article")
      .withParagraphMaxChars(120)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    await wp.posts.create(post);

    await homepage.goto();
    await homepage.openLatestArticle(post.title);

    await latestNews.expectUrlToMatch(/e2e-latest-article/);
    await latestNews.assertBreadcrumbs(post);
  });
});
