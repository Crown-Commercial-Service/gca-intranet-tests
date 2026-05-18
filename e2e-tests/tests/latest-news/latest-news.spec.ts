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
  // test is skipped as this need a data wipe of all news on qa thus affecting other people testing
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
    "should dispayed the author that last update an article instead of author that created it",
    { tag: "@regression" },
    async ({ wp, wordpressLoginPage, latestNews }) => {
      const username = `e2e_author_${Date.now()}`;
      const newUser = User.anAdmin()
        .withUsername(username)
        .withEmail(`${username}@example.com`);

      await wp.users.upsert(newUser);

      await wordpressLoginPage.logout();
      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(newUser.username, newUser.password);

      await latestNews.gotoEdit(postId);
      await latestNews.update();

      await latestNews.gotoById(postId);
      await latestNews.assertAuthor(newUser.username);
    },
  );
});

test.describe("Latest news filtering", () => {
  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
    await wp.posts.clearByTypeAndAuthor("news");
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("news");
  });

  test(
    "filters news posts by a single category",
    { tag: "@regression" },
    async ({ wp, latestNewsList, runId }) => {
      const hrPost = Post.aPost()
        .withType("news")
        .withFixedTitle(`HR News ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCategory("HR")
        .build();

      const securityPost = Post.aPost()
        .withType("news")
        .withFixedTitle(`Security News ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCategory("Information security")
        .build();

      await wp.posts.create(hrPost);
      await wp.posts.create(securityPost);

      await latestNewsList.gotoNewsList();
      await latestNewsList.assertPostVisible(hrPost.title);
      await latestNewsList.assertPostVisible(securityPost.title);

      await latestNewsList.applyCategoryFilter("hr");

      await latestNewsList.assertPostVisible(hrPost.title);
      await latestNewsList.assertPostNotVisible(securityPost.title);
    },
  );

  test(
    "filters news posts by multiple categories selected together",
    { tag: "@regression" },
    async ({ wp, latestNewsList, runId }) => {
      const hrPost = Post.aPost()
        .withType("news")
        .withFixedTitle(`HR News ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCategory("HR")
        .build();

      const securityPost = Post.aPost()
        .withType("news")
        .withFixedTitle(`Security News ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCategory("Information security")
        .build();

      const workdayPost = Post.aPost()
        .withType("news")
        .withFixedTitle(`Workday News ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCategory("Workday")
        .build();

      await wp.posts.create(hrPost);
      await wp.posts.create(securityPost);
      await wp.posts.create(workdayPost);

      await latestNewsList.gotoNewsList();
      await latestNewsList.applyCategoryFilter("hr");
      await latestNewsList.applyCategoryFilter("information-security");

      await latestNewsList.assertPostVisible(hrPost.title);
      await latestNewsList.assertPostVisible(securityPost.title);
      await latestNewsList.assertPostNotVisible(workdayPost.title);
    },
  );

  test(
    "shows a category in the filter list when at least one post uses it",
    { tag: "@regression" },
    async ({ wp, latestNewsList, runId }) => {
      const hrPost = Post.aPost()
        .withType("news")
        .withFixedTitle(`HR News ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCategory("HR")
        .build();

      await wp.posts.create(hrPost);

      await latestNewsList.gotoNewsList();
      await latestNewsList.assertCategoryFilterAvailable("hr", "HR");
    },
  );

  test(
    "sorts news by newest first by default and reverses when oldest first is selected",
    { tag: "@regression" },
    async ({ wp, latestNewsList, runId }) => {
      const now = Date.now();
      const olderPost = Post.aPost()
        .withType("news")
        .withFixedTitle(`Older News ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCategory("Workday")
        .withCreatedAt(new Date(now - 10 * 60 * 1000))
        .build();

      const newerPost = Post.aPost()
        .withType("news")
        .withFixedTitle(`Newer News ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCategory("Workday")
        .withCreatedAt(new Date(now - 1 * 60 * 1000))
        .build();

      await wp.posts.create(olderPost);
      await wp.posts.create(newerPost);

      await latestNewsList.gotoNewsList();
      await latestNewsList.applyCategoryFilter("workday");

      await latestNewsList.assertPostBefore(newerPost.title, olderPost.title);

      await latestNewsList.selectSortOrder("oldest");
      await latestNewsList.assertPostBefore(olderPost.title, newerPost.title);
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
    await latestNews.selectColumnTemplate("Layout - 2 column");
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
    await latestNews.selectColumnTemplate("Layout - 1 column");
    await latestNews.update();
    await latestNews.gotoById(pageId);
    await latestNews.assertOneColumnTemplateIsApplied();
  });
});
