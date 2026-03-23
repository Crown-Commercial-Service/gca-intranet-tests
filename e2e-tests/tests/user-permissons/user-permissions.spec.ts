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
        await homepage.gotoPath("/wp-admin");
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
  });
});
