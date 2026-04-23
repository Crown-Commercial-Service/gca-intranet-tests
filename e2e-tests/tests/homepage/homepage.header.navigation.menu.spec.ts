import { test, expect } from "../../src/wp.fixtures";
import MenuPages from "../../src/models/MenuPages";

test.describe("Header Navigation Menu", { tag: "@regression" }, () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  // test is skipped as this need a data wipe of all pages on qa thus affecting other people testing
  test.skip("Can create a GCA Header navigation menu and navigate it", async ({
    wp,
    wordpressLoginPage,
    customizerPage,
    homepage,
  }) => {
    await wp.posts.createPages(MenuPages.all());

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.buildMenu(MenuPages.menu());
    await customizerPage.publish();

    await homepage.goto();
    await homepage.assertNavigationMenu(MenuPages.menu());

    await homepage.hoverParentLink("Parent Nav Link 1");

    await homepage.selectSubNavigationItem(
      "Parent Nav Link 1",
      "Child nav link 1",
    );

    await homepage.expectUrlToContain("child-nav-link-1/");
  });
});
