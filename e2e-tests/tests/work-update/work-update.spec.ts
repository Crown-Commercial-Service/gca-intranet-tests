import dayjs from "dayjs";
import { test, expect } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";

test.describe("Work update component", () => {
  let post: Post;
  let postId: number;
  let label = "CCS live";
  let team = "Finance";

  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
    await wp.posts.clearByTypeAndAuthor("work_updates");

    post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Procurement Transformation Update")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    postId = await wp.posts.create(post);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
  });

  test("should display work update details", async ({ workUpdate }) => {
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
    await workUpdate.assertPublishedDate(
      dayjs(post.createdAt).format("Do MMMM YYYY"),
    );
  });

  test("can navigate using breadcrumb", async ({
    workUpdate,
    homepage,
    workUpdateList,
  }) => {
    await workUpdate.gotoById(postId);

    await workUpdate.selectBreadcrumbLink("Home");
    await expect(homepage.page).toHaveURL("/");

    await workUpdate.gotoById(postId);

    await workUpdate.selectBreadcrumbLink("Work Updates");
    await expect(workUpdateList.main).toBeVisible();
  });

  test("should display work update details on the work update list page", async ({
    workUpdate,
    workUpdateList,
  }) => {
    await workUpdate.gotoEdit(postId);
    await workUpdate.selectLabel(label);
    await workUpdate.selectTeam(team);
    await workUpdate.addAuthorImage("author-image.jpg");
    await workUpdate.update();

    await workUpdateList.gotoWorkUpdateList();
    await workUpdateList.assertPostVisible(post.title);
    await workUpdateList.assertPostHasLabel(post.title, label);
    await workUpdateList.assertPostHasTeam(post.title, team);
    await workUpdateList.assertPostHasDate(
      post.title,
      dayjs(post.createdAt).format("Do MMMM YYYY"),
    );
    await workUpdateList.assertPostHasContent(post.title, post.content);
    await workUpdateList.assertPostHasAuthorImage(post.title);
  });

  test("should display 10 work updates and show pagination when there are more than 10", async ({
    wp,
    workUpdateList,
  }) => {
    const posts = Post.manyWorkUpdates(11);

    await wp.posts.createMany(posts);
    await workUpdateList.gotoWorkUpdateList();

    await workUpdateList.assertPostCount(10);
    await workUpdateList.assertPaginationVisible();
  });

  test("should not display pagination when there are fewer than 10 work updates", async ({
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
});
