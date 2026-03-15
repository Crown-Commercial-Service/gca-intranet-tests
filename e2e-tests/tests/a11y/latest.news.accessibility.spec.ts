import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Accessibility - Latest news component", () => {
  let post: Post;
  let postId: number;

  test.beforeEach(async ({ wp, wordpressLoginPage, latestNews }) => {
    await wp.posts.clearByTypeAndAuthor("news");

    post = Post.aPost()
      .withType("news")
      .withFixedTitle("E2E Latest Article")
      .withParagraphMaxChars(120)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg")
      .withCategory("Information security");

    postId = await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await latestNews.gotoEdit(postId);
    await latestNews.selectLabel("CCS live");
    await latestNews.update();
  });

  test("latest news page should have no serious or critical accessibility violations", async ({
    latestNews,
  }) => {
    await latestNews.gotoById(postId);
    await latestNews.checkAccessibilityFor([latestNews.latestNewsSection]);
  });

  test("latest news list page should have no serious or critical accessibility violations", async ({
    wp,
    latestNewsList,
  }) => {
    await wp.posts.clearByTypeAndAuthor("news");

    const posts = Post.manyNews(11);

    await wp.posts.createMany(posts);
    await latestNewsList.gotoNewsList();
    await latestNewsList.checkAccessibilityFor([
      latestNewsList.latestNewsListSection,
    ]);
  });
});
