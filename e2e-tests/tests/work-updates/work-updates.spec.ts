import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import User from "../../src/models/User";
import { formatDateNew } from "../../src/utils/formatters";

test.describe("Work update component", () => {
  let post: Post;
  let postId: number;
  let label = "CCS live";
  let team = "Finance";

  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
    await wp.posts.clearByType("work_updates");

    post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Procurement Transformation Update")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    postId = await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByType("work_updates");
  });

  test(
    "should display work update details",
    { tag: "@regression" },
    async ({ workUpdate }) => {
      await workUpdate.gotoEdit(postId);
      await workUpdate.selectLabel(label);
      await workUpdate.selectTeam(team);
      await workUpdate.addAuthorImage("author-image.jpg");
      await workUpdate.update();

      await workUpdate.gotoById(postId);
      await workUpdate.assertTitle(post.title);
      await workUpdate.assertContent(post.content);
      await workUpdate.assertWorkUpdateLabel(label);
      await workUpdate.assertAuthorImageVisible();
      await workUpdate.assertWorkUpdateTeam(team);
      await workUpdate.assertAuthor(process.env.WP_ADMIN_USERNAME!);
      await workUpdate.assertPublishedDate(formatDateNew(post.createdAt));
    },
  );

  test(
    "can navigate using breadcrumb",
    { tag: "@regression" },
    async ({ workUpdate, homepage, workUpdateList }) => {
      await workUpdate.gotoById(postId);

      await workUpdate.selectBreadcrumbLink("Home");
      await homepage.expectUrlToContain("/");

      await workUpdate.gotoById(postId);

      await workUpdate.selectBreadcrumbLink("Work Updates");
      await expect(workUpdateList.main).toBeVisible();
    },
  );

  test(
    "should display work update details on the work update list page",
    { tag: "@regression" },
    async ({ workUpdate, workUpdateList }) => {
      await workUpdate.gotoEdit(postId);
      await workUpdate.selectLabel(label);
      await workUpdate.selectTeam(team);
      await workUpdate.addAuthorImage("author-image.jpg");
      await workUpdate.update();

      await workUpdateList.gotoWorkUpdateList();
      await workUpdateList.assertPostVisible(post.title);
      await workUpdateList.assertPostHasLabel(post.title, label);
      await workUpdateList.assertPostHasTeam(post.title, team);
      await workUpdateList.assertPostHasDate(post.title, post.createdAt);
      await workUpdateList.assertPostHasContent(post.title, post.content);
      await workUpdateList.assertPostHasAuthorImage(post.title);
    },
  );

  test(
    "should display 10 work updates and show pagination when there are more than 10",
    { tag: "@regression" },
    async ({ wp, workUpdateList }) => {
      const posts = Post.manyWorkUpdates(11);

      await wp.posts.createMany(posts);
      await workUpdateList.gotoWorkUpdateList();

      await workUpdateList.assertPostCount(10);
      await workUpdateList.assertPaginationVisible();
    },
  );

  test.skip("should not display pagination when there are fewer than 10 work updates", async ({
    wp,
    workUpdateList,
  }) => {
    await wp.posts.clearByTypeAndAuthor("work_updates");
    const posts = Post.manyWorkUpdates(9);

    await wp.posts.createMany(posts);
    await workUpdateList.gotoWorkUpdateList();

    await workUpdateList.assertPostCount(9);
    await workUpdateList.assertPaginationNotVisible();
  });

  test(
    "should show next button but not previous button on the first pagination page",
    { tag: "@regression" },
    async ({ wp, workUpdateList }) => {
      const posts = Post.manyWorkUpdates(11);

      await wp.posts.createMany(posts);
      await workUpdateList.gotoWorkUpdateList();

      await workUpdateList.assertPaginationVisible();
      await workUpdateList.assertNextPaginationVisible();
      await workUpdateList.assertPreviousPaginationNotVisible();
    },
  );

  test(
    "should hide next button on the last pagination page",
    { tag: "@regression" },
    async ({ wp, workUpdateList }) => {
      const posts = Post.manyWorkUpdates(11);

      await wp.posts.createMany(posts);
      await workUpdateList.gotoWorkUpdateList();

      await workUpdateList.goToLastPaginationPage();
      await workUpdateList.assertNextPaginationNotVisible();
    },
  );

  test(
    "should show correct author after updating a work update",
    { tag: "@regression" },
    async ({ wp, workUpdate }) => {
      const username = `e2e_author_${Date.now()}`;
      const newUser = User.anAdmin()
        .withUsername(username)
        .withEmail(`${username}@example.com`);

      await wp.users.upsert(newUser);
      await workUpdate.gotoEdit(postId);
      await workUpdate.selectAuthor(newUser.username);
      await workUpdate.update();
      await workUpdate.gotoById(postId);
      await workUpdate.assertAuthor(newUser.username);
    },
  );
});

test.describe("Work update component", { tag: "@regression" }, () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("work_updates");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("work_updates");
  });
  test("can create a Two column template", async ({
    wp,
    wordpressLoginPage,
    workUpdate,
    runId,
  }) => {
    const templatePage = Post.aPost()
      .withType("work_updates")
      .withFixedTitle(`Two Column Template ${runId}`)
      .withParagraphMaxChars(180)
      .withStatus("publish");

    const postId = await wp.posts.create(templatePage);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await workUpdate.gotoEdit(postId);
    await workUpdate.selectLabel("CCS live");
    await workUpdate.selectTeam("Finance");
    await workUpdate.addAuthorImage("author-image.jpg");
    await workUpdate.selectColumnTemplate("Layout – 2 column");
    await workUpdate.update();
    await workUpdate.gotoById(postId);
    await workUpdate.assertTwoColumnTemplateIsApplied();
  });

  test("can create a One column template", async ({
    wp,
    wordpressLoginPage,
    workUpdate,
    runId,
  }) => {
    const templatePage = Post.aPost()
      .withType("work_updates")
      .withFixedTitle(`One Column Template ${runId}`)
      .withParagraphMaxChars(180)
      .withStatus("publish");

    const postId = await wp.posts.create(templatePage);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await workUpdate.gotoEdit(postId);
    await workUpdate.selectLabel("CCS live");
    await workUpdate.selectTeam("Finance");
    await workUpdate.addAuthorImage("author-image.jpg");
    await workUpdate.selectColumnTemplate("Layout – 1 column");
    await workUpdate.update();
    await workUpdate.gotoById(postId);
    await workUpdate.assertOneColumnTemplateIsApplied();
  });
});
