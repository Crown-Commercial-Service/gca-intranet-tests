import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import User from "../../src/models/User";

test.describe("Blog component", () => {
  let post: Post;
  let postId: number;
  let label = "CCS live";

  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");

    post = Post.aPost()
      .withType("blogs")
      .withCreatedAt(new Date())
      .withFixedTitle("Commercial Strategy Blog")
      .withParagraphMaxChars(180)
      .withStatus("publish")
      .withFeaturedImage("featured.jpg");

    postId = await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

  test(
    "should display blog details",
    { tag: "@regression" },
    async ({ blog }) => {
      await blog.gotoEdit(postId);
      await blog.selectLabel(label);
      await blog.addAuthorImage("author-image.jpg");
      await blog.update();

      await blog.gotoById(postId);
      await blog.assertTitle(post.title);
      await blog.assertContent(post.content);
      await blog.assertBlogLabel(label);
      await blog.assertAuthor(process.env.WP_ADMIN_USERNAME!);
      await blog.assertFeaturedImageVisible();
      await blog.assertPublishedDate(post.createdAt);
    },
  );

  test(
    "can navigate using breadcrumb",
    { tag: "@regression" },
    async ({ blog, homepage, blogList }) => {
      await blog.gotoById(postId);
      await blog.selectBreadcrumbLink("Home");
      await homepage.expectUrlToContain("/");
      await blog.gotoById(postId);
      await blog.selectBreadcrumbLink("Blogs");
      await expect(blogList.main).toBeVisible();
    },
  );

  test(
    "should display blog details on the blog list page",
    { tag: "@regression" },
    async ({ blogList }) => {
      await blogList.gotoBlogList();
      await blogList.assertPostVisible(post.title);
      await blogList.assertAuthor(process.env.WP_ADMIN_USERNAME!);
      await blogList.assertPostHasDate(post.title, post.createdAt);
      await blogList.assertPostHasContent(post.title, post.content);
      await blogList.assertPostHasFeaturedImage(post.title);
    },
  );

  test(
    "should display 10 blogs and show pagination when there are more than 10",
    { tag: "@regression" },
    async ({ wp, blogList }) => {
      const posts = Post.manyBlogs(11);

      await wp.posts.createMany(posts);
      await blogList.gotoBlogList();
      await blogList.assertPostCount(10);
      await blogList.assertPaginationVisible();
    },
  );

  test.skip("should not display pagination when there are fewer than 10 blogs", async ({
    wp,
    blogList,
  }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
    const posts = Post.manyBlogs(9);

    await wp.posts.createMany(posts);
    await blogList.gotoBlogList();
    await blogList.assertPostCount(9);
    await blogList.assertPaginationNotVisible();
  });

  test(
    "should show next button but not previous button on the first pagination page",
    { tag: "@regression" },
    async ({ wp, blogList }) => {
      const posts = Post.manyBlogs(11);

      await wp.posts.createMany(posts);
      await blogList.gotoBlogList();
      await blogList.assertPaginationVisible();
      await blogList.assertNextPaginationVisible();
      await blogList.assertPreviousPaginationNotVisible();
    },
  );

  test(
    "should hide next button on the last pagination page",
    { tag: "@regression" },
    async ({ wp, blogList }) => {
      const posts = Post.manyBlogs(11);

      await wp.posts.createMany(posts);
      await blogList.gotoBlogList();
      await blogList.goToLastPaginationPage();
      await blogList.assertNextPaginationNotVisible();
    },
  );

  test(
    "should show correct author after updating a blog article",
    { tag: "@regression" },
    async ({ wp, blog }) => {
      const username = `e2e_author_${Date.now()}`;
      const newUser = User.anAdmin()
        .withUsername(username)
        .withEmail(`${username}@example.com`);

      await wp.users.upsert(newUser);
      await blog.gotoEdit(postId);
      await blog.selectAuthor(newUser.username);
      await blog.update();
      await blog.gotoById(postId);
      await blog.assertAuthor(newUser.username);
    },
  );
});

test.describe("Blog filtering", () => {
  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

  const aBlog = (title: string) =>
    Post.aPost()
      .withType("blogs")
      .withFixedTitle(title)
      .withParagraphMaxChars(120)
      .withStatus("publish")
      .build();

  test(
    "filters blogs by a single article type",
    { tag: "@regression" },
    async ({ wp, blog, blogList, runId }) => {
      const businessPost = aBlog(`Business Blog ${runId}`);
      const rewardPost = aBlog(`Reward Blog ${runId}`);

      const businessId = await wp.posts.create(businessPost);
      const rewardId = await wp.posts.create(rewardPost);

      await blog.gotoEdit(businessId);
      await blog.selectLabel("Business update");
      await blog.update();

      await blog.gotoEdit(rewardId);
      await blog.selectLabel("Reward");
      await blog.update();

      await blogList.gotoBlogList();
      await blogList.assertPostVisible(businessPost.title);
      await blogList.assertPostVisible(rewardPost.title);

      await blogList.applyLabelFilter("business-update");

      await blogList.assertPostVisible(businessPost.title);
      await blogList.assertPostNotVisible(rewardPost.title);
    },
  );

  test(
    "filters blogs by multiple article types selected together",
    { tag: "@regression" },
    async ({ wp, blog, blogList, runId }) => {
      const businessPost = aBlog(`Business Blog ${runId}`);
      const rewardPost = aBlog(`Reward Blog ${runId}`);
      const recognitionPost = aBlog(`Recognition Blog ${runId}`);

      const businessId = await wp.posts.create(businessPost);
      const rewardId = await wp.posts.create(rewardPost);
      const recognitionId = await wp.posts.create(recognitionPost);

      await blog.gotoEdit(businessId);
      await blog.selectLabel("Business update");
      await blog.update();

      await blog.gotoEdit(rewardId);
      await blog.selectLabel("Reward");
      await blog.update();

      await blog.gotoEdit(recognitionId);
      await blog.selectLabel("Recognition");
      await blog.update();

      await blogList.gotoBlogList();
      await blogList.applyLabelFilter("business-update");
      await blogList.applyLabelFilter("reward");

      await blogList.assertPostVisible(businessPost.title);
      await blogList.assertPostVisible(rewardPost.title);
      await blogList.assertPostNotVisible(recognitionPost.title);
    },
  );

  test(
    "shows an article type in the filter list when at least one blog uses it",
    { tag: "@regression" },
    async ({ wp, blog, blogList, runId }) => {
      const post = aBlog(`Filter Visibility ${runId}`);
      const postId = await wp.posts.create(post);

      await blog.gotoEdit(postId);
      await blog.selectLabel("Business update");
      await blog.update();

      await blogList.gotoBlogList();
      await blogList.assertLabelFilterAvailable(
        "business-update",
        "Business update",
      );
    },
  );

  test(
    "sorts blogs by newest first by default and reverses when oldest first is selected",
    { tag: "@regression" },
    async ({ wp, blog, blogList, runId }) => {
      const now = Date.now();
      const olderPost = Post.aPost()
        .withType("blogs")
        .withFixedTitle(`Older Blog ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCreatedAt(new Date(now - 10 * 60 * 1000))
        .build();

      const newerPost = Post.aPost()
        .withType("blogs")
        .withFixedTitle(`Newer Blog ${runId}`)
        .withParagraphMaxChars(120)
        .withStatus("publish")
        .withCreatedAt(new Date(now - 1 * 60 * 1000))
        .build();

      const olderId = await wp.posts.create(olderPost);
      const newerId = await wp.posts.create(newerPost);

      await blog.gotoEdit(olderId);
      await blog.selectLabel("Reward");
      await blog.update();

      await blog.gotoEdit(newerId);
      await blog.selectLabel("Reward");
      await blog.update();

      await blogList.gotoBlogList();
      await blogList.applyLabelFilter("reward");

      await blogList.assertPostBefore(newerPost.title, olderPost.title);

      await blogList.selectSortOrder("oldest");
      await blogList.assertPostBefore(olderPost.title, newerPost.title);
    },
  );
});

test.describe("Blog component", { tag: "@regression" }, () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("blogs");
  });

  test("can create a Two column template", async ({
    wp,
    wordpressLoginPage,
    blog,
    runId,
  }) => {
    const templatePage = Post.aPost()
      .withType("blogs")
      .withFixedTitle(`Two Column Template ${runId}`)
      .withParagraphMaxChars(180)
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    const pageId = await wp.posts.create(templatePage);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await blog.gotoEdit(pageId);
    await blog.selectLabel("CCS live");
    await blog.addAuthorImage("author-image.jpg");
    await blog.selectColumnTemplate("Layout - 2 column");
    await blog.update();
    await blog.gotoById(pageId);
    await blog.assertTwoColumnTemplateIsApplied();
  });

  test("can create a One column template", async ({
    wp,
    wordpressLoginPage,
    blog,
    runId,
  }) => {
    const templatePage = Post.aPost()
      .withType("blogs")
      .withFixedTitle(`One Column Template ${runId}`)
      .withParagraphMaxChars(180)
      .withFeaturedImage("featured.jpg")
      .withStatus("publish");

    const pageId = await wp.posts.create(templatePage);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await blog.gotoEdit(pageId);
    await blog.selectLabel("CCS live");
    await blog.selectColumnTemplate("Layout - 1 column");
    await blog.addAuthorImage("author-image.jpg");
    await blog.update();
    await blog.gotoById(pageId);
    await blog.assertOneColumnTemplateIsApplied();
  });
});
