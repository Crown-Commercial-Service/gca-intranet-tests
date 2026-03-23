import { test, expect } from "../../src/wp.fixtures";
import User from "../../src/models/User";

test.describe("user permissions", () => {
  test(
    "subscriber should not see the WordPress admin bar on the homepage",

    async ({ wp, wordpressLoginPage, homepage }) => {
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
    },
  );

  test(
    "subscriber should be redirected from /wp-admin to homepage",

    async ({ wp, wordpressLoginPage, homepage }) => {
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
    },
  );

  test(
    "subscriber should be redirected from /wp-admin/profile.php to homepage",

    async ({ wp, wordpressLoginPage, homepage }) => {
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
    },
  );

  test(
    "publisher admin can publish content",

    async ({ wp, wordpressLoginPage, homepage }) => {
      const username = `e2e_publisher_admin_${Date.now()}`;
      const password = "Password123!";
      const publisherAdmin = User.aUser()
        .withUsername(username)
        .withEmail(`${username}@example.com`)
        .withPassword(password)
        .withRole("publisher_admin");

      await wp.users.upsert(publisherAdmin);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(username, password);
      await homepage.gotoPath("/wp-admin/post-new.php?post_type=news");
      await expect(homepage.publishButton).toBeVisible();
    },
  );

  test(
    "publisher admin can manage categories",

    async ({ wp, wordpressLoginPage, homepage }) => {
      const username = `e2e_publisher_admin_${Date.now()}`;
      const password = "Password123!";
      const publisherAdmin = User.aUser()
        .withUsername(username)
        .withEmail(`${username}@example.com`)
        .withPassword(password)
        .withRole("publisher_admin");

      await wp.users.upsert(publisherAdmin);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(username, password);

      await homepage.gotoPath("/wp-admin/edit-tags.php?taxonomy=category");
      await homepage.expectUrlToContain(
        "/wp-admin/edit-tags.php?taxonomy=category",
      );
      //   all these below should be in a funciton in the homepage
      await expect(homepage.page.locator("#col-left")).toBeVisible();
      await expect(homepage.page.locator("#col-right")).toBeVisible();
      await expect(
        homepage.page.getByRole("heading", { name: "Categories" }),
      ).toBeVisible();
    },
  );

  test(
    "publisher can publish content",

    async ({ wp, wordpressLoginPage, homepage, runId }) => {
      const username = `e2e_publisher_${Date.now()}`;
      const password = "Password123!";
      const publisher = User.aUser()
        .withUsername(username)
        .withEmail(`${username}@example.com`)
        .withPassword(password)
        .withRole("publisher");

      await wp.users.upsert(publisher);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(username, password);

      await homepage.gotoPath("/wp-admin/post-new.php?post_type=news");
      await homepage.gotoPath("/wp-admin/post-new.php?post_type=news");
      await expect(homepage.publishButton).toBeVisible();
    },
  );

  test(
    "publisher hr can't manage categories",

    async ({ wp, wordpressLoginPage, homepage }) => {
      const username = `e2e_publisher_hr_${Date.now()}`;
      const password = "Password123!";
      const publisherAdmin = User.aUser()
        .withUsername(username)
        .withEmail(`${username}@example.com`)
        .withPassword(password)
        .withRole("publisher_hr");

      await wp.users.upsert(publisherAdmin);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(username, password);

      await homepage.gotoPath("/wp-admin/edit-tags.php?taxonomy=category");
        await homepage.pause()
      await homepage.expectUrlToContain("/");
      await homepage.assertAdminBarNotVisible();
    },
  );

  test(
    "publisher_hr can publish content",

    async ({ wp, wordpressLoginPage, homepage, runId }) => {
      const username = `e2e_publisher_hr_${Date.now()}`;
      const password = "Password123!";
      const publisherHr = User.aUser()
        .withUsername(username)
        .withEmail(`${username}@example.com`)
        .withPassword(password)
        .withRole("publisher_hr");

      await wp.users.upsert(publisherHr);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(username, password);
      await homepage.gotoPath("/wp-admin/post-new.php?post_type=news");
      await expect(homepage.publishButton).toBeVisible();
    },
  );

  test(
    "publisher admin can only manage HR categories",

    async ({ wp, wordpressLoginPage, homepage }) => {
      const username = `e2e_publisher_admin_${Date.now()}`;
      const password = "Password123!";
      const publisherAdmin = User.aUser()
        .withUsername(username)
        .withEmail(`${username}@example.com`)
        .withPassword(password)
        .withRole("publisher_admin");

      await wp.users.upsert(publisherAdmin);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(username, password);

      await homepage.gotoPath("/wp-admin/edit-tags.php?taxonomy=category");
    await homepage.pause()
      await expect(homepage.categoriesBox).toBeVisible();
      await expect(homepage.categoriesBox).toContainText("HR");
      await expect(homepage.categoriesBox).not.toContainText("Finance");
      await expect(homepage.categoriesBox).not.toContainText(
        "Digital and data",
      );
    },
  );

  test(
    "contributor_intranet can create drafts and upload files",

    async ({ wp, wordpressLoginPage, homepage, runId }) => {
      const username = `e2e_contributor_intranet_${Date.now()}`;
      const password = "Password123!";
      const contributor = User.aUser()
        .withUsername(username)
        .withEmail(`${username}@example.com`)
        .withPassword(password)
        .withRole("contributor_intranet");

      await wp.users.upsert(contributor);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(username, password);

      await homepage.gotoPath("/wp-admin/post-new.php?post_type=news");
      await homepage.titleInput.fill(`Contributor Draft ${runId}`);
      await homepage.contentInput.fill(`Contributor draft content ${runId}`);

      await expect(homepage.publishButton).toBeVisible();
      await expect(homepage.publishButton).toContainText("Submit for Review");

      await homepage.gotoPath("/wp-admin/media-new.php");
      await homepage.expectUrlToContain("/wp-admin/media-new.php");
    },
  );

  test(
    "contributor_intranet cant publish",

    async ({ wp, wordpressLoginPage, homepage, runId }) => {
      const username = `e2e_contributor_intranet_${Date.now()}`;
      const password = "Password123!";
      const contributor = User.aUser()
        .withUsername(username)
        .withEmail(`${username}@example.com`)
        .withPassword(password)
        .withRole("contributor_intranet");

      await wp.users.upsert(contributor);

      await wordpressLoginPage.goto();
      await wordpressLoginPage.login(username, password);

      await homepage.gotoPath("/wp-admin/post-new.php?post_type=news");
      await homepage.titleInput.fill(`Contributor Draft ${runId}`);
      await homepage.contentInput.fill(`Contributor draft content ${runId}`);

      await expect(homepage.publishButton).toBeVisible();
      await expect(homepage.publishButton).toContainText("Submit for Review");
      await expect(homepage.publishButton).not.toContainText("Publish");
    },
  );
});
