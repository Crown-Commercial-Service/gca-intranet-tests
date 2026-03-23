import { test, expect } from "../../src/wp.fixtures";
import User from "../../src/models/User";

test.describe("user permissions", () => {
  test(
    "subscriber should not see the WordPress admin bar on the homepage",
    { tag: "@regression" },
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

  test.describe("user permissions", () => {
    test(
      "subscriber should be redirected from /wp-admin to homepage",
      { tag: "@regression" },
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
      { tag: "@regression" },
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
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage, runId }) => {
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

        await homepage.titleInput.fill(`Publisher Admin News ${runId}`);
        await homepage.contentInput.fill(`Publisher admin content ${runId}`);
        await homepage.update();

        await expect(homepage.publishMessage).toBeVisible();
        await expect(homepage.publishMessage).toContainText("Post published");
      },
    );

    test(
      "publisher admin can manage categories",
      { tag: "@regression" },
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
        await expect(homepage.page.locator("#col-left")).toBeVisible();
        await expect(homepage.page.locator("#col-right")).toBeVisible();
        await expect(
          homepage.page.getByRole("heading", { name: "Categories" }),
        ).toBeVisible();
      },
    );

    test(
      "publisher_intranet_it can publish content",
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage, runId }) => {
        const username = `e2e_publisher_intranet_${Date.now()}`;
        const password = "Password123!";
        const publisher = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("publisher_intranet_it");

        await wp.users.upsert(publisher);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);

        await homepage.gotoPath("/wp-admin/post-new.php?post_type=news");

        await homepage.titleInput.fill(`Publisher Intranet News ${runId}`);
        await homepage.contentInput.fill(`Publisher intranet content ${runId}`);
        await homepage.update();

        await expect(homepage.publishMessage).toBeVisible();
      },
    );

    test(
      "publisher admin can't manage categories",
      { tag: "@regression" },
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

        await homepage.expectUrlToContain("/");
        await homepage.assertAdminBarNotVisible();
      },
    );

    test(
      "publisher_hr can publish content",
      { tag: "@regression" },
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

        await homepage.titleInput.fill(`Publisher HR News ${runId}`);
        await homepage.contentInput.fill(`Publisher HR content ${runId}`);
        await homepage.update();

        await expect(homepage.publishMessage).toBeVisible();
      },
    );

    test(
      "publisher admin can only manage HR categories",
      { tag: "@regression" },
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
      { tag: "@regression" },
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
      { tag: "@regression" },
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
});
