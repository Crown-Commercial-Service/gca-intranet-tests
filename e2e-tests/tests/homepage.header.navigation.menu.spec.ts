import { test, expect } from "../src/wp.fixtures";
import MenuPages from "../src/models/MenuPages";

test.describe("Header Navigation Menu", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test("Can create a GCA Header navigation menu and navigate it", async ({
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

    await expect(homepage.page).toHaveURL("child-nav-link-1/");
  });
});
