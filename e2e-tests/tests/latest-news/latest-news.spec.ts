import dayjs from "dayjs";
import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Latest news component", () => {
  let post: Post;
  let postId: number;

  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
    await wp.posts.clearByTypeAndAuthor("news");
    post = Post.aPost()
      .withType("news")
      .withFixedTitle("E2E Latest Article")
      .withParagraphMaxChars(120)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    postId = await wp.posts.create(post);
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
  });

  test("should display news details", async ({ latestNews }) => {
    await latestNews.gotoById(postId);
    await latestNews.assertTitle(post.title);
    await latestNews.assertContent(post.content);
    await latestNews.assertAuthor(process.env.WP_ADMIN_USERNAME!);
    await latestNews.assertFeaturedImageVisible();
    await expect(latestNews.details).toContainText(
      dayjs(post.createdAt).format("Do MMMM YYYY"),
    );
  });

  test("can navigate using breadcrumb", async ({
    latestNews,
    homepage,
    latestNewsList,
  }) => {
    await latestNews.gotoById(postId);

    await latestNews.selectBreadcrumbLink("Home");
    await expect(homepage.page).toHaveURL("/");

    await latestNews.gotoById(postId);

    await latestNews.selectBreadcrumbLink("News");
    await expect(latestNewsList.main).toBeVisible();
  });

  test("should display news details on the latest news list page", async ({
    latestNewsList,
  }) => {
    await latestNewsList.gotoNewsList();
    await latestNewsList.assertPostVisible(post.title);
    await expect(latestNewsList.postByTitle(post.title)).toContainText(
      dayjs(post.createdAt).format("Do MMMM YYYY"),
    );
    await expect(latestNewsList.postByTitle(post.title)).toContainText(
      post.content,
    );
    await expect(
      latestNewsList.postByTitle(post.title).locator("img"),
    ).toBeVisible();
  });

  test("should display pagination when there are more than 10 news posts", async ({
    wp,
    latestNewsList,
  }) => {
    const posts = Post.manyNews(11);

    await wp.posts.createMany(posts);
    await latestNewsList.gotoNewsList();

    await latestNewsList.assertPaginationVisible();
  });

  test("should show next button but not previous button on the first pagination page", async ({
    wp,
    latestNewsList,
  }) => {
    const posts = Post.manyNews(11);

    await wp.posts.createMany(posts);
    await latestNewsList.gotoNewsList();

    await latestNewsList.assertPaginationVisible();
    await latestNewsList.assertNextPaginationVisible();
    await latestNewsList.assertPreviousPaginationNotVisible();
  });

  test("should show previous button and hide next button on the second pagination page", async ({
    wp,
    latestNewsList,
  }) => {
    const posts = Post.manyNews(11);

    await wp.posts.createMany(posts);
    await latestNewsList.gotoNewsList();

    await latestNewsList.selectPaginationLink("Next page");
    await latestNewsList.assertOnPageTwo();
    await latestNewsList.assertPreviousPaginationVisible();
    await latestNewsList.assertNextPaginationNotVisible();
  });
});
