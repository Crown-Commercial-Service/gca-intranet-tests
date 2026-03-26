import { test, expect } from "../../src/wp.fixtures";
import User from "../../src/models/User";
import Post from "../../src/models/Post";
import { formatDateNew } from "../../src/utils/formatters";

test.describe("user permissions", { tag: "@regression" }, () => {
  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByType("work_updates");
  });

  test("subscriber should not see the WordPress admin bar on the homepage", async ({
    wp,
    wordpressLoginPage,
    homepage,
  }) => {
    const username = `e2e_subscriber_${Date.now()}`;
    const password = "Password123!";
    const subscriber = User.aUser()
      .withUsername(username)
      .withEmail(`${username}@example.com`)
      .withPassword(password)
      .withRole("subscriber");

    await wp.users.upsert(subscriber);
    await wordpressLoginPage.goto();
    await wordpressLoginPage.login(username, password);
    await homepage.goto();
    await homepage.assertAdminBarNotVisible();
  });

  test("subscriber should be redirected from /wp-admin to homepage", async ({
    wp,
    wordpressLoginPage,
    homepage,
  }) => {
    const username = `e2e_subscriber_${Date.now()}`;
    const password = "Password123!";
    const subscriber = User.aUser()
      .withUsername(username)
      .withEmail(`${username}@example.com`)
      .withPassword(password)
      .withRole("subscriber");

    await wp.users.upsert(subscriber);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.login(username, password);
    await homepage.gotoPath("/wp-admin/");
    await homepage.expectUrlToContain("/");
  });

  test("subscriber should be redirected from /wp-admin/profile.php to homepage", async ({
    wp,
    wordpressLoginPage,
    homepage,
  }) => {
    const username = `e2e_subscriber_${Date.now()}`;
    const password = "Password123!";
    const subscriber = User.aUser()
      .withUsername(username)
      .withEmail(`${username}@example.com`)
      .withPassword(password)
      .withRole("subscriber");

    await wp.users.upsert(subscriber);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.login(username, password);
    await homepage.gotoPath("/wp-admin/profile.php");
    await homepage.expectUrlToContain("/");
  });

  test("Administrator publisher can create and publish content", async ({
    wp,
    wordpressLoginPage,
    workUpdate,
  }) => {
    const username = `e2e_admin_publisher${Date.now()}`;
    const password = "Password123!";
    const adminPublisher = User.aUser()
      .withUsername(username)
      .withEmail(`${username}@example.com`)
      .withPassword(password)
      .withRole("administrator_publisher");

    await wp.users.upsert(adminPublisher);

    const post = Post.aPost()
      .withType("work_updates")
      .withFixedTitle("Procurement Transformation Update")
      .withParagraphMaxChars(180)
      .withStatus("publish");

    const postId = await wp.posts.create(post);
    const label = "CCS live";
    const team = "Finance";

    await wordpressLoginPage.goto();
    await wordpressLoginPage.login(username, password);

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
  });
});
