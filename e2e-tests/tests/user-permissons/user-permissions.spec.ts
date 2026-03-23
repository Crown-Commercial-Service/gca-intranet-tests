import { test } from "../../src/wp.fixtures";
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
      async ({ wp, wordpressLoginPage, homepage }) => {
        const username = `e2e_publisher_admin_${Date.now()}`;
        const password = "Password123!";
        const subscriber = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("publisher_admin");

        await wp.users.upsert(subscriber);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);
        await homepage.gotoPath("/wp-admin/profile.php");
        await homepage.expectUrlToContain("/");
      },
    );

    test(
      "publisher admin can manage categories",
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage }) => {
        const username = `e2e_publisher_admin_${Date.now()}`;
        const password = "Password123!";
        const subscriber = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("publisher_admin");

        await wp.users.upsert(subscriber);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);
        await homepage.gotoPath("/wp-admin/profile.php");
        await homepage.expectUrlToContain("/");
      },
    );

    test(
      "publisher_intranet_it can publish content",
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage }) => {
        const username = `e2e_publisher_intranet_${Date.now()}`;
        const password = "Password123!";
        const subscriber = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("publisher_intranet_it");

        await wp.users.upsert(subscriber);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);
        await homepage.gotoPath("/wp-admin/profile.php");
        await homepage.expectUrlToContain("/");
      },
    );

    test(
      "publisher admin can't manage categories",
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage }) => {
        const username = `e2e_publisher_admin_${Date.now()}`;
        const password = "Password123!";
        const subscriber = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("publisher_admin");

        await wp.users.upsert(subscriber);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);
        await homepage.gotoPath("/wp-admin/profile.php");
        await homepage.expectUrlToContain("/");
      },
    );

    test(
      "publisher_hr can publish content",
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage }) => {
        const username = `e2e_publisher_hr_${Date.now()}`;
        const password = "Password123!";
        const subscriber = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("publisher_hr");

        await wp.users.upsert(subscriber);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);
        await homepage.gotoPath("/wp-admin/profile.php");
        await homepage.expectUrlToContain("/");
      },
    );

    test(
      "publisher admin can only manage HR categories",
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage }) => {
        const username = `e2e_publisher_admin_${Date.now()}`;
        const password = "Password123!";
        const subscriber = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("publisher_admin");

        await wp.users.upsert(subscriber);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);
        await homepage.gotoPath("/wp-admin/profile.php");
        await homepage.expectUrlToContain("/");
      },
    );

    test(
      "contributor_intranet can create drafts and upload files",
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage }) => {
        const username = `e2e_contributor_intranet_${Date.now()}`;
        const password = "Password123!";
        const subscriber = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("contributor_intranet");

        await wp.users.upsert(subscriber);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);
        await homepage.gotoPath("/wp-admin/profile.php");
        await homepage.expectUrlToContain("/");
      },
    );

    test(
      "contributor_intranet cant publish",
      { tag: "@regression" },
      async ({ wp, wordpressLoginPage, homepage }) => {
        const username = `e2e_contributor_intranet_${Date.now()}`;
        const password = "Password123!";
        const subscriber = User.aUser()
          .withUsername(username)
          .withEmail(`${username}@example.com`)
          .withPassword(password)
          .withRole("contributor_intranet");

        await wp.users.upsert(subscriber);

        await wordpressLoginPage.goto();
        await wordpressLoginPage.login(username, password);
        await homepage.gotoPath("/wp-admin/profile.php");
        await homepage.expectUrlToContain("/");
      },
    );
  });
});
