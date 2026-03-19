import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import User from "../../src/models/User";

test.describe("Latest news component", () => {
  let post: Post;
  let postId: number;
  let label = "CCS live";

  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
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
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("news");
  });

  test(
    "should display news details",
    { tag: "@regression" },
    async ({ latestNews }) => {
      await latestNews.gotoEdit(postId);
      await latestNews.selectLabel(label);
      await latestNews.update();

      await latestNews.gotoById(postId);
      await latestNews.assertTitle(post.title);
      await latestNews.assertContent(post.content);
      await latestNews.assertAuthor(process.env.WP_ADMIN_USERNAME!);
      await latestNews.assertFeaturedImageVisible();
      await latestNews.assertCategory(post.category!);
      await latestNews.assertLabel(label);
      await latestNews.assertLatestNewsDate(post);
    },
  );

  test(
    "can navigate using breadcrumb",
    { tag: "@regression" },
    async ({ latestNews, homepage, latestNewsList }) => {
      await latestNews.gotoById(postId);

      await latestNews.selectBreadcrumbLink("Home");
      await homepage.expectUrlToContain("/");

      await latestNews.gotoById(postId);

      await latestNews.selectBreadcrumbLink("News");
      await expect(latestNewsList.main).toBeVisible();
    },
  );

  test(
    "should display news details on the latest news list page",
    { tag: "@regression" },
    async ({ latestNewsList, latestNews }) => {
      await latestNews.gotoEdit(postId);
      await latestNews.selectLabel(label);
      await latestNews.update();

      await latestNewsList.gotoNewsList();
      await latestNewsList.assertPostVisible(post.title);
      await latestNewsList.assertPostHasCategory(post.title, post.category!);
      await latestNewsList.assertPostHasLabel(post.title, label);
      await latestNewsList.assertLatestNewsDate(post);
      await expect(latestNewsList.postByTitle(post.title)).toContainText(
        post.content,
      );
      await expect(
        latestNewsList.postByTitle(post.title).locator("img"),
      ).toBeVisible();
    },
  );

  test(
    "should display 10 news posts and show pagination when there are more than 10 news posts",
    { tag: "@regression" },
    async ({ wp, latestNewsList }) => {
      const posts = Post.manyNews(11);

      await wp.posts.createMany(posts);
      await latestNewsList.gotoNewsList();

      await latestNewsList.assertPostCount(10);
      await latestNewsList.assertPaginationVisible();
    },
  );

  test.skip("should not display pagination when there are fewer than 10 news posts", async ({
    wp,
    latestNewsList,
  }) => {
    await wp.posts.clearByTypeAndAuthor("news"); // call this so to delete what got create in beforeEach
    const posts = Post.manyNews(3);

    await wp.posts.createMany(posts);
    await latestNewsList.gotoNewsList();

    await latestNewsList.assertPostCount(9);
    await latestNewsList.assertPaginationNotVisible();
  });

  test(
    "should show next button but not previous button on the first pagination page",
    { tag: "@regression" },
    async ({ wp, latestNewsList }) => {
      const posts = Post.manyNews(11);

      await wp.posts.createMany(posts);
      await latestNewsList.gotoNewsList();

      await latestNewsList.assertPaginationVisible();
      await latestNewsList.assertNextPaginationVisible();
      await latestNewsList.assertPreviousPaginationNotVisible();
    },
  );

  test(
    "should hide next button on the last pagination page",
    { tag: "@regression" },
    async ({ wp, latestNewsList }) => {
      const posts = Post.manyNews(11);

      await wp.posts.createMany(posts);
      await latestNewsList.gotoNewsList();

      await latestNewsList.goToLastPaginationPage();
      await latestNewsList.assertNextPaginationNotVisible();
    },
  );

  test(
    "should show correct author after updating a new article",
    { tag: "@regression" },
    async ({ wp, latestNews }) => {
      const username = `e2e_author_${Date.now()}`;
      const newUser = User.anAdmin()
        .withUsername(username)
        .withEmail(`${username}@example.com`);

      await wp.users.upsert(newUser);
      await latestNews.gotoEdit(postId);
      await latestNews.selectAuthor(newUser.username);
      await latestNews.update();
      await latestNews.gotoById(postId);
      await latestNews.assertAuthor(newUser.username);
    },
  );
});

test.describe("Latest news component", { tag: "@regression" }, () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("news");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("news");
  });
  test("can create a Two column template", async ({
    wp,
    wordpressLoginPage,
    latestNews,
    runId,
  }) => {
    const templatePage = Post.aPost()
      .withType("news")
      .withFixedTitle(`Two Column Template ${runId}`)
      .withParagraphMaxChars(180)
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    const pageId = await wp.posts.create(templatePage);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await latestNews.gotoEdit(pageId);
    await latestNews.fillSlug(`two-column-template-${runId}`);
    await latestNews.selectCategory("Digital and data");
    await latestNews.selectLabel("CCS live");
    await latestNews.fillExcerpt(templatePage);
    await latestNews.selectColumnTemplate("Layout – 2 column");
    await latestNews.update();
    await latestNews.gotoById(pageId);
    await latestNews.assertTwoColumnTemplateIsApplied();
  });

  test("can create a One column template", async ({
    wp,
    wordpressLoginPage,
    latestNews,
    runId,
  }) => {
    const templatePage = Post.aPost()
      .withType("news")
      .withFixedTitle(`One Column Template ${runId}`)
      .withParagraphMaxChars(180)
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    const pageId = await wp.posts.create(templatePage);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await latestNews.gotoEdit(pageId);
    await latestNews.fillSlug(`one-column-template-${runId}`);
    await latestNews.selectCategory("Digital and data");
    await latestNews.selectLabel("CCS live");
    await latestNews.fillExcerpt(templatePage);
    await latestNews.selectColumnTemplate("Layout – 1 column");
    await latestNews.update();
    await latestNews.gotoById(pageId);
    await latestNews.assertOneColumnTemplateIsApplied();
  });
});
